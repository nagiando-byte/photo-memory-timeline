import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { eq, and, desc, gte } from 'drizzle-orm';
import { getDb } from '../models/db';
import { eventShares, events, photos } from '../models/schema';
import { AppError } from '../middleware/errorHandler';
import crypto from 'crypto';

/**
 * Generate a unique share token
 */
function generateShareToken(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Create a share link for an event
 */
export async function createEventShare(req: Request, res: Response): Promise<void> {
  const userId = req.user?.userId;
  const { eventId } = req.params;
  const { permission = 'view', expiresInDays } = req.body;

  if (!userId) {
    throw new AppError('Unauthorized', 401);
  }

  const db = getDb();

  // Verify event belongs to user
  const [event] = await db
    .select()
    .from(events)
    .where(and(eq(events.id, eventId), eq(events.userId, userId)))
    .limit(1);

  if (!event) {
    throw new AppError('Event not found', 404);
  }

  // Generate share token
  const shareToken = generateShareToken();
  const shareId = uuidv4();

  // Calculate expiration
  let expiresAt: Date | null = null;
  if (expiresInDays) {
    expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);
  }

  // Create share record
  await db.insert(eventShares).values({
    id: shareId,
    eventId,
    shareToken,
    permission,
    expiresAt,
  });

  const [share] = await db
    .select()
    .from(eventShares)
    .where(eq(eventShares.id, shareId))
    .limit(1);

  res.status(201).json({
    ...share,
    shareUrl: `/shared/${shareToken}`,
  });
}

/**
 * Get all shares for an event
 */
export async function getEventShares(req: Request, res: Response): Promise<void> {
  const userId = req.user?.userId;
  const { eventId } = req.params;

  if (!userId) {
    throw new AppError('Unauthorized', 401);
  }

  const db = getDb();

  // Verify event belongs to user
  const [event] = await db
    .select()
    .from(events)
    .where(and(eq(events.id, eventId), eq(events.userId, userId)))
    .limit(1);

  if (!event) {
    throw new AppError('Event not found', 404);
  }

  const shares = await db
    .select()
    .from(eventShares)
    .where(eq(eventShares.eventId, eventId))
    .orderBy(desc(eventShares.createdAt));

  // Add share URLs
  const sharesWithUrls = shares.map((share) => ({
    ...share,
    shareUrl: `/shared/${share.shareToken}`,
    isExpired: share.expiresAt ? new Date(share.expiresAt) < new Date() : false,
  }));

  res.json(sharesWithUrls);
}

/**
 * Revoke a share
 */
export async function revokeEventShare(req: Request, res: Response): Promise<void> {
  const userId = req.user?.userId;
  const { eventId, shareId } = req.params;

  if (!userId) {
    throw new AppError('Unauthorized', 401);
  }

  const db = getDb();

  // Verify event belongs to user
  const [event] = await db
    .select()
    .from(events)
    .where(and(eq(events.id, eventId), eq(events.userId, userId)))
    .limit(1);

  if (!event) {
    throw new AppError('Event not found', 404);
  }

  // Delete share
  const result = await db
    .delete(eventShares)
    .where(and(eq(eventShares.id, shareId), eq(eventShares.eventId, eventId)));

  res.json({ message: 'Share revoked successfully' });
}

/**
 * Access shared event (public endpoint)
 */
export async function getSharedEvent(req: Request, res: Response): Promise<void> {
  const { shareToken } = req.params;

  const db = getDb();

  // Find share by token
  const [share] = await db
    .select()
    .from(eventShares)
    .where(eq(eventShares.shareToken, shareToken))
    .limit(1);

  if (!share) {
    throw new AppError('Share link not found or expired', 404);
  }

  // Check expiration
  if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
    throw new AppError('Share link has expired', 410);
  }

  // Get event
  const [event] = await db
    .select()
    .from(events)
    .where(eq(events.id, share.eventId))
    .limit(1);

  if (!event) {
    throw new AppError('Event not found', 404);
  }

  // Get photos for this event (linked via photos.eventId)
  const eventPhotosData = await db
    .select()
    .from(photos)
    .where(eq(photos.eventId, event.id));

  // Update view count
  await db
    .update(eventShares)
    .set({ viewCount: (share.viewCount || 0) + 1 })
    .where(eq(eventShares.id, share.id));

  // Get cover photo URL
  let coverPhotoUrl: string | null = null;
  if (event.coverPhotoId) {
    const [coverPhoto] = await db
      .select()
      .from(photos)
      .where(eq(photos.id, event.coverPhotoId))
      .limit(1);
    if (coverPhoto && coverPhoto.thumbnailPath) {
      // Convert internal path to public URL
      coverPhotoUrl = `/uploads/${coverPhoto.thumbnailPath.replace(/^\.?\/?(uploads\/)?/, '')}`;
    }
  }

  // Helper to convert internal paths to public URLs
  const toPublicUrl = (filePath: string | null): string | null => {
    if (!filePath) return null;
    return `/uploads/${filePath.replace(/^\.?\/?(uploads\/)?/, '')}`;
  };

  res.json({
    event: {
      id: event.id,
      title: event.title,
      description: event.description,
      startTime: event.startTime,
      endTime: event.endTime,
      coverPhotoUrl,
    },
    photos: eventPhotosData.map((photo) => ({
      id: photo.id,
      thumbnailUrl: toPublicUrl(photo.thumbnailPath),
      originalUrl: share.permission === 'download' ? toPublicUrl(photo.filePath) : null,
      takenAt: photo.takenAt,
      aiDescription: photo.analysisResult,
    })),
    permission: share.permission,
  });
}

/**
 * Download shared event photos (if permission allows)
 */
export async function downloadSharedEventPhotos(req: Request, res: Response): Promise<void> {
  const { shareToken } = req.params;

  const db = getDb();

  // Find share by token
  const [share] = await db
    .select()
    .from(eventShares)
    .where(eq(eventShares.shareToken, shareToken))
    .limit(1);

  if (!share) {
    throw new AppError('Share link not found', 404);
  }

  // Check permission
  if (share.permission !== 'download') {
    throw new AppError('Download not allowed for this share', 403);
  }

  // Check expiration
  if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
    throw new AppError('Share link has expired', 410);
  }

  // Get event photos
  const eventPhotosData = await db
    .select()
    .from(photos)
    .where(eq(photos.eventId, share.eventId));

  // Helper to convert internal paths to public URLs
  const toPublicUrl = (filePath: string): string => {
    return `/uploads/${filePath.replace(/^\.?\/?(uploads\/)?/, '')}`;
  };

  // Return download URLs (public URLs, not internal paths)
  res.json({
    photos: eventPhotosData.map((photo) => ({
      id: photo.id,
      filename: photo.filePath.split('/').pop() || photo.id,
      downloadUrl: toPublicUrl(photo.filePath),
    })),
  });
}
