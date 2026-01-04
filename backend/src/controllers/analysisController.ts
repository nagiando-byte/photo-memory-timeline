import { Request, Response } from 'express';
import { eq, and, inArray } from 'drizzle-orm';
import fs from 'fs';
import { getDb } from '../models/db';
import { photos, events } from '../models/schema';
import { AppError } from '../middleware/errorHandler';
import {
  analyzePhotoContent,
  detectFaces,
  generateEventSummary,
  PhotoAnalysis,
} from '../services/aiService';

/**
 * Batch analyze multiple photos
 */
export async function batchAnalyze(req: Request, res: Response): Promise<void> {
  const userId = req.user?.userId;
  const { photoIds, limit = 10 } = req.body;

  if (!userId) {
    throw new AppError('Unauthorized', 401);
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new AppError('OpenAI API key is not configured', 503);
  }

  const db = getDb();

  // Get photos to analyze
  let photosToAnalyze;

  if (photoIds && Array.isArray(photoIds)) {
    // Analyze specific photos
    photosToAnalyze = await db
      .select()
      .from(photos)
      .where(and(eq(photos.userId, userId), inArray(photos.id, photoIds)))
      .limit(limit);
  } else {
    // Analyze unanalyzed photos
    photosToAnalyze = await db
      .select()
      .from(photos)
      .where(and(eq(photos.userId, userId), eq(photos.analyzed, false)))
      .limit(limit);
  }

  if (photosToAnalyze.length === 0) {
    res.json({
      analyzed: 0,
      message: 'No photos to analyze',
    });
    return;
  }

  const results = [];
  let successCount = 0;
  let failCount = 0;

  for (const photo of photosToAnalyze) {
    try {
      if (!fs.existsSync(photo.filePath)) {
        failCount++;
        results.push({
          id: photo.id,
          success: false,
          error: 'File not found',
        });
        continue;
      }

      const analysis = await analyzePhotoContent(photo.filePath);

      await db
        .update(photos)
        .set({
          analyzed: true,
          analysisResult: JSON.stringify(analysis),
        })
        .where(eq(photos.id, photo.id));

      successCount++;
      results.push({
        id: photo.id,
        success: true,
        analysis,
      });
    } catch (error) {
      failCount++;
      results.push({
        id: photo.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  res.json({
    analyzed: successCount,
    failed: failCount,
    total: photosToAnalyze.length,
    results,
  });
}

/**
 * Detect faces in photos
 */
export async function batchDetectFaces(req: Request, res: Response): Promise<void> {
  const userId = req.user?.userId;
  const { photoIds, limit = 10 } = req.body;

  if (!userId) {
    throw new AppError('Unauthorized', 401);
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new AppError('OpenAI API key is not configured', 503);
  }

  const db = getDb();

  let photosToProcess;

  if (photoIds && Array.isArray(photoIds)) {
    photosToProcess = await db
      .select()
      .from(photos)
      .where(and(eq(photos.userId, userId), inArray(photos.id, photoIds)))
      .limit(limit);
  } else {
    photosToProcess = await db
      .select()
      .from(photos)
      .where(eq(photos.userId, userId))
      .limit(limit);
  }

  const results = [];

  for (const photo of photosToProcess) {
    try {
      if (!fs.existsSync(photo.filePath)) {
        results.push({
          id: photo.id,
          success: false,
          error: 'File not found',
        });
        continue;
      }

      const faceAnalysis = await detectFaces(photo.filePath);

      results.push({
        id: photo.id,
        success: true,
        faces: faceAnalysis.faces,
        faceCount: faceAnalysis.faces.length,
      });
    } catch (error) {
      results.push({
        id: photo.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  res.json({
    processed: results.filter((r) => r.success).length,
    results,
  });
}

/**
 * Generate summary for an event
 */
export async function getEventSummary(req: Request, res: Response): Promise<void> {
  const userId = req.user?.userId;
  const { id } = req.params;

  if (!userId) {
    throw new AppError('Unauthorized', 401);
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new AppError('OpenAI API key is not configured', 503);
  }

  const db = getDb();

  // Get event
  const [event] = await db
    .select()
    .from(events)
    .where(and(eq(events.id, id), eq(events.userId, userId)))
    .limit(1);

  if (!event) {
    throw new AppError('Event not found', 404);
  }

  // Get event photos with analysis
  const eventPhotos = await db
    .select()
    .from(photos)
    .where(and(eq(photos.eventId, id), eq(photos.analyzed, true)));

  if (eventPhotos.length === 0) {
    throw new AppError('No analyzed photos found for this event', 400);
  }

  // Parse analysis results
  const analyses: PhotoAnalysis[] = [];
  for (const photo of eventPhotos) {
    if (photo.analysisResult) {
      try {
        analyses.push(JSON.parse(photo.analysisResult) as PhotoAnalysis);
      } catch {
        // Skip invalid analysis
      }
    }
  }

  if (analyses.length === 0) {
    throw new AppError('No valid analysis results found', 400);
  }

  // Get location name if available
  let locationName: string | undefined;
  if (event.locationId) {
    const { getLocation, formatLocation } = await import('../services/locationService');
    const location = await getLocation(event.locationId);
    if (location) {
      locationName = formatLocation(location);
    }
  }

  // Generate date string
  const dateStr = event.startTime.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Generate summary
  const summary = await generateEventSummary(analyses, locationName, dateStr);

  // Update event with generated summary
  await db
    .update(events)
    .set({
      title: summary.title,
      description: summary.description,
    })
    .where(eq(events.id, id));

  res.json({
    eventId: id,
    summary,
    photoCount: eventPhotos.length,
    analyzedCount: analyses.length,
  });
}

/**
 * Get analysis status for photos
 */
export async function getAnalysisStatus(req: Request, res: Response): Promise<void> {
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError('Unauthorized', 401);
  }

  const db = getDb();

  const allPhotos = await db
    .select()
    .from(photos)
    .where(eq(photos.userId, userId));

  const analyzed = allPhotos.filter((p) => p.analyzed).length;
  const unanalyzed = allPhotos.length - analyzed;

  res.json({
    total: allPhotos.length,
    analyzed,
    unanalyzed,
    percentage: allPhotos.length > 0 ? Math.round((analyzed / allPhotos.length) * 100) : 0,
    hasApiKey: !!process.env.OPENAI_API_KEY,
  });
}
