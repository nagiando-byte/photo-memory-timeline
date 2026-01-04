import { Request, Response } from 'express';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { getDb } from '../models/db';
import { events, photos, persons, faces, locations, eventPersons } from '../models/schema';
import { AppError } from '../middleware/errorHandler';
import fs from 'fs/promises';
import path from 'path';
import archiver from 'archiver';

/**
 * Export event as JSON
 */
export async function exportEventAsJson(req: Request, res: Response): Promise<void> {
  const userId = req.user?.userId;
  const { eventId } = req.params;

  if (!userId) {
    throw new AppError('Unauthorized', 401);
  }

  const db = getDb();

  // Get event
  const [event] = await db
    .select()
    .from(events)
    .where(and(eq(events.id, eventId), eq(events.userId, userId)))
    .limit(1);

  if (!event) {
    throw new AppError('Event not found', 404);
  }

  // Get photos
  const eventPhotos = await db
    .select()
    .from(photos)
    .where(eq(photos.eventId, eventId));

  // Get location
  let location = null;
  if (event.locationId) {
    const [loc] = await db
      .select()
      .from(locations)
      .where(eq(locations.id, event.locationId))
      .limit(1);
    location = loc;
  }

  // Get persons in this event
  const eventPersonRecords = await db
    .select()
    .from(eventPersons)
    .where(eq(eventPersons.eventId, eventId));

  const personIds = eventPersonRecords.map((ep) => ep.personId);
  const eventPersonsList = personIds.length > 0
    ? await db
        .select()
        .from(persons)
        .where(inArray(persons.id, personIds))
    : [];

  // Build export data
  const exportData = {
    exportVersion: '1.0',
    exportedAt: new Date().toISOString(),
    event: {
      id: event.id,
      title: event.title,
      description: event.description,
      startTime: event.startTime,
      endTime: event.endTime,
      eventType: event.eventType,
    },
    location: location
      ? {
          address: location.address,
          city: location.city,
          country: location.country,
          placeName: location.placeName,
          coordinates: {
            latitude: location.latitude,
            longitude: location.longitude,
          },
        }
      : null,
    photos: eventPhotos.map((photo) => ({
      id: photo.id,
      filename: photo.filePath.split('/').pop(),
      takenAt: photo.takenAt,
      width: photo.width,
      height: photo.height,
      coordinates: photo.latitude && photo.longitude
        ? { latitude: photo.latitude, longitude: photo.longitude }
        : null,
      aiAnalysis: photo.analysisResult ? JSON.parse(photo.analysisResult) : null,
    })),
    persons: eventPersonsList.map((person) => ({
      id: person.id,
      name: person.name,
    })),
    metadata: {
      photoCount: eventPhotos.length,
      personCount: eventPersonsList.length,
    },
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="event-${event.id}.json"`
  );
  res.json(exportData);
}

/**
 * Export event as ZIP (includes photos)
 */
export async function exportEventAsZip(req: Request, res: Response): Promise<void> {
  const userId = req.user?.userId;
  const { eventId } = req.params;
  const { includeOriginals = false } = req.query;

  if (!userId) {
    throw new AppError('Unauthorized', 401);
  }

  const db = getDb();

  // Get event
  const [event] = await db
    .select()
    .from(events)
    .where(and(eq(events.id, eventId), eq(events.userId, userId)))
    .limit(1);

  if (!event) {
    throw new AppError('Event not found', 404);
  }

  // Get photos
  const eventPhotos = await db
    .select()
    .from(photos)
    .where(eq(photos.eventId, eventId));

  // Get location
  let location = null;
  if (event.locationId) {
    const [loc] = await db
      .select()
      .from(locations)
      .where(eq(locations.id, event.locationId))
      .limit(1);
    location = loc;
  }

  // Set up ZIP response
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="event-${event.id}.zip"`
  );

  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.pipe(res);

  // Add metadata JSON
  const metadata = {
    exportVersion: '1.0',
    exportedAt: new Date().toISOString(),
    event: {
      id: event.id,
      title: event.title,
      description: event.description,
      startTime: event.startTime,
      endTime: event.endTime,
    },
    location: location
      ? {
          address: location.address,
          city: location.city,
          country: location.country,
          placeName: location.placeName,
        }
      : null,
    photos: eventPhotos.map((photo) => ({
      id: photo.id,
      filename: photo.filePath.split('/').pop(),
      takenAt: photo.takenAt,
    })),
  };

  archive.append(JSON.stringify(metadata, null, 2), { name: 'metadata.json' });

  // Add photos
  const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
  for (const photo of eventPhotos) {
    const photoPath = includeOriginals
      ? path.resolve(UPLOAD_DIR, photo.filePath)
      : photo.thumbnailPath
        ? path.resolve(UPLOAD_DIR, photo.thumbnailPath)
        : path.resolve(UPLOAD_DIR, photo.filePath);

    try {
      await fs.access(photoPath);
      const filename = photo.filePath.split('/').pop() || photo.id;
      archive.file(photoPath, { name: `photos/${filename}` });
    } catch {
      // Skip missing files
      console.warn(`Photo file not found: ${photoPath}`);
    }
  }

  await archive.finalize();
}

/**
 * Export all user data
 */
export async function exportAllUserData(req: Request, res: Response): Promise<void> {
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError('Unauthorized', 401);
  }

  const db = getDb();

  // Get all user events
  const userEvents = await db
    .select()
    .from(events)
    .where(eq(events.userId, userId))
    .orderBy(desc(events.startTime));

  // Get all user photos
  const userPhotos = await db
    .select()
    .from(photos)
    .where(eq(photos.userId, userId));

  // Get all user persons
  const userPersons = await db
    .select()
    .from(persons)
    .where(eq(persons.userId, userId));

  // Get all faces for user's photos
  const photoIds = userPhotos.map((p) => p.id);
  const userFaces = photoIds.length > 0
    ? await db
        .select()
        .from(faces)
        .where(inArray(faces.photoId, photoIds))
    : [];

  // Build export
  const exportData = {
    exportVersion: '1.0',
    exportedAt: new Date().toISOString(),
    summary: {
      eventCount: userEvents.length,
      photoCount: userPhotos.length,
      personCount: userPersons.length,
      faceCount: userFaces.length,
    },
    events: userEvents.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      startTime: event.startTime,
      endTime: event.endTime,
      eventType: event.eventType,
    })),
    photos: userPhotos.map((photo) => ({
      id: photo.id,
      eventId: photo.eventId,
      takenAt: photo.takenAt,
      coordinates: photo.latitude && photo.longitude
        ? { latitude: photo.latitude, longitude: photo.longitude }
        : null,
      analyzed: photo.analyzed,
    })),
    persons: userPersons.map((person) => ({
      id: person.id,
      name: person.name,
      faceCount: userFaces.filter((f) => f.personId === person.id).length,
    })),
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="photo-memory-export-${new Date().toISOString().split('T')[0]}.json"`
  );
  res.json(exportData);
}
