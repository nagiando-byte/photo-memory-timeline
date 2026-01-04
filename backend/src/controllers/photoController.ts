import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { getDb } from '../models/db';
import { photos } from '../models/schema';
import { AppError } from '../middleware/errorHandler';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const THUMBNAIL_DIR = path.join(UPLOAD_DIR, 'thumbnails');

// Ensure thumbnail directory exists
if (!fs.existsSync(THUMBNAIL_DIR)) {
  fs.mkdirSync(THUMBNAIL_DIR, { recursive: true });
}

export async function getPhotos(req: Request, res: Response): Promise<void> {
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError('Unauthorized', 401);
  }

  const {
    page = '1',
    limit = '20',
    startDate,
    endDate,
    eventId,
  } = req.query;

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const offset = (pageNum - 1) * limitNum;

  const db = getDb();

  let query = db
    .select()
    .from(photos)
    .where(eq(photos.userId, userId))
    .orderBy(desc(photos.takenAt))
    .limit(limitNum)
    .offset(offset);

  // Apply filters
  const conditions = [eq(photos.userId, userId)];

  if (startDate) {
    conditions.push(gte(photos.takenAt, new Date(startDate as string)));
  }

  if (endDate) {
    conditions.push(lte(photos.takenAt, new Date(endDate as string)));
  }

  if (eventId) {
    conditions.push(eq(photos.eventId, eventId as string));
  }

  const results = await db
    .select()
    .from(photos)
    .where(and(...conditions))
    .orderBy(desc(photos.takenAt))
    .limit(limitNum)
    .offset(offset);

  // Get total count for pagination
  const totalQuery = await db
    .select()
    .from(photos)
    .where(and(...conditions));

  const total = totalQuery.length;

  res.json({
    data: results,
    total,
    page: pageNum,
    limit: limitNum,
    hasMore: offset + results.length < total,
  });
}

export async function getPhoto(req: Request, res: Response): Promise<void> {
  const userId = req.user?.userId;
  const { id } = req.params;

  if (!userId) {
    throw new AppError('Unauthorized', 401);
  }

  const db = getDb();

  const [photo] = await db
    .select()
    .from(photos)
    .where(and(eq(photos.id, id), eq(photos.userId, userId)))
    .limit(1);

  if (!photo) {
    throw new AppError('Photo not found', 404);
  }

  res.json(photo);
}

export async function uploadPhoto(req: Request, res: Response): Promise<void> {
  const userId = req.user?.userId;
  const file = req.file;

  if (!userId) {
    throw new AppError('Unauthorized', 401);
  }

  if (!file) {
    throw new AppError('No file uploaded', 400);
  }

  const { takenAt, latitude, longitude, width, height } = req.body;

  if (!takenAt || !width || !height) {
    throw new AppError('takenAt, width, and height are required', 400);
  }

  const db = getDb();
  const photoId = uuidv4();

  // Generate thumbnail
  const thumbnailFilename = `thumb_${path.basename(file.filename)}`;
  const thumbnailPath = path.join(THUMBNAIL_DIR, userId, thumbnailFilename);

  // Ensure user thumbnail directory exists
  const userThumbDir = path.join(THUMBNAIL_DIR, userId);
  if (!fs.existsSync(userThumbDir)) {
    fs.mkdirSync(userThumbDir, { recursive: true });
  }

  await sharp(file.path)
    .resize(300, 300, { fit: 'cover' })
    .jpeg({ quality: 80 })
    .toFile(thumbnailPath);

  // Insert photo record
  const insertData: Record<string, unknown> = {
    id: photoId,
    userId,
    filePath: file.path,
    thumbnailPath,
    takenAt: new Date(takenAt),
    width: parseInt(width, 10),
    height: parseInt(height, 10),
    fileSize: file.size,
    analyzed: false,
  };

  if (latitude) {
    insertData.latitude = parseFloat(latitude);
  }
  if (longitude) {
    insertData.longitude = parseFloat(longitude);
  }

  await db.insert(photos).values(insertData as typeof photos.$inferInsert);

  // Get the created photo
  const [photo] = await db
    .select()
    .from(photos)
    .where(eq(photos.id, photoId))
    .limit(1);

  res.status(201).json(photo);
}

export async function deletePhoto(req: Request, res: Response): Promise<void> {
  const userId = req.user?.userId;
  const { id } = req.params;

  if (!userId) {
    throw new AppError('Unauthorized', 401);
  }

  const db = getDb();

  // Get photo first
  const [photo] = await db
    .select()
    .from(photos)
    .where(and(eq(photos.id, id), eq(photos.userId, userId)))
    .limit(1);

  if (!photo) {
    throw new AppError('Photo not found', 404);
  }

  // Delete files
  if (fs.existsSync(photo.filePath)) {
    fs.unlinkSync(photo.filePath);
  }
  if (photo.thumbnailPath && fs.existsSync(photo.thumbnailPath)) {
    fs.unlinkSync(photo.thumbnailPath);
  }

  // Delete database record
  await db.delete(photos).where(eq(photos.id, id));

  res.json({ message: 'Photo deleted successfully' });
}

export async function analyzePhoto(req: Request, res: Response): Promise<void> {
  const userId = req.user?.userId;
  const { id } = req.params;

  if (!userId) {
    throw new AppError('Unauthorized', 401);
  }

  const db = getDb();

  // Get photo
  const [photo] = await db
    .select()
    .from(photos)
    .where(and(eq(photos.id, id), eq(photos.userId, userId)))
    .limit(1);

  if (!photo) {
    throw new AppError('Photo not found', 404);
  }

  // Check if file exists
  if (!fs.existsSync(photo.filePath)) {
    throw new AppError('Photo file not found', 404);
  }

  let analysis;

  // Check if OpenAI API key is configured
  if (process.env.OPENAI_API_KEY) {
    // Use AI analysis
    const { analyzePhotoContent } = await import('../services/aiService');
    analysis = await analyzePhotoContent(photo.filePath);
  } else {
    // Fallback to mock analysis
    analysis = {
      scene: 'general',
      sceneJa: '一般',
      objects: [],
      atmosphere: 'neutral',
      atmosphereJa: '普通',
      description: 'AI分析を有効にするにはOPENAI_API_KEYを設定してください',
      people_count: 0,
      suggested_title: 'イベント',
      tags: [],
    };
  }

  await db
    .update(photos)
    .set({
      analyzed: true,
      analysisResult: JSON.stringify(analysis),
    })
    .where(eq(photos.id, id));

  const [updatedPhoto] = await db
    .select()
    .from(photos)
    .where(eq(photos.id, id))
    .limit(1);

  res.json(updatedPhoto);
}
