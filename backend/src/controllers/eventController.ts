import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { eq, and, desc, gte, lte, asc } from 'drizzle-orm';
import { getDb } from '../models/db';
import { events, photos, locations, persons, eventPersons } from '../models/schema';
import { AppError } from '../middleware/errorHandler';

export async function getEvents(req: Request, res: Response): Promise<void> {
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError('Unauthorized', 401);
  }

  const { page = '1', limit = '20', startDate, endDate } = req.query;

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const offset = (pageNum - 1) * limitNum;

  const db = getDb();

  const conditions = [eq(events.userId, userId)];

  if (startDate) {
    conditions.push(gte(events.startTime, new Date(startDate as string)));
  }

  if (endDate) {
    conditions.push(lte(events.endTime, new Date(endDate as string)));
  }

  const results = await db
    .select()
    .from(events)
    .where(and(...conditions))
    .orderBy(desc(events.startTime))
    .limit(limitNum)
    .offset(offset);

  const totalQuery = await db
    .select()
    .from(events)
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

export async function getEvent(req: Request, res: Response): Promise<void> {
  const userId = req.user?.userId;
  const { id } = req.params;

  if (!userId) {
    throw new AppError('Unauthorized', 401);
  }

  const db = getDb();

  const [event] = await db
    .select()
    .from(events)
    .where(and(eq(events.id, id), eq(events.userId, userId)))
    .limit(1);

  if (!event) {
    throw new AppError('Event not found', 404);
  }

  // Get photos for this event
  const eventPhotos = await db
    .select()
    .from(photos)
    .where(eq(photos.eventId, id))
    .orderBy(asc(photos.takenAt));

  // Get location if exists
  let location = null;
  if (event.locationId) {
    const [loc] = await db
      .select()
      .from(locations)
      .where(eq(locations.id, event.locationId))
      .limit(1);
    location = loc;
  }

  // Get cover photo if exists
  let coverPhoto = null;
  if (event.coverPhotoId) {
    const [photo] = await db
      .select()
      .from(photos)
      .where(eq(photos.id, event.coverPhotoId))
      .limit(1);
    coverPhoto = photo;
  }

  // Get persons for this event
  const eventPersonsList = await db
    .select()
    .from(eventPersons)
    .where(eq(eventPersons.eventId, id));

  const personIds = eventPersonsList.map((ep) => ep.personId);
  let eventPersonsData: Array<typeof persons.$inferSelect> = [];

  if (personIds.length > 0) {
    for (const personId of personIds) {
      const [person] = await db
        .select()
        .from(persons)
        .where(eq(persons.id, personId))
        .limit(1);
      if (person) {
        eventPersonsData.push(person);
      }
    }
  }

  res.json({
    ...event,
    photos: eventPhotos,
    location,
    coverPhoto,
    persons: eventPersonsData,
  });
}

export async function getEventsByMonth(req: Request, res: Response): Promise<void> {
  const userId = req.user?.userId;
  const { year, month } = req.params;

  if (!userId) {
    throw new AppError('Unauthorized', 401);
  }

  const yearNum = parseInt(year, 10);
  const monthNum = parseInt(month, 10);

  const startDate = new Date(yearNum, monthNum - 1, 1);
  const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59);

  const db = getDb();

  const results = await db
    .select()
    .from(events)
    .where(
      and(
        eq(events.userId, userId),
        gte(events.startTime, startDate),
        lte(events.startTime, endDate)
      )
    )
    .orderBy(asc(events.startTime));

  res.json(results);
}

export async function updateEvent(req: Request, res: Response): Promise<void> {
  const userId = req.user?.userId;
  const { id } = req.params;
  const updates = req.body;

  if (!userId) {
    throw new AppError('Unauthorized', 401);
  }

  const db = getDb();

  // Check if event exists and belongs to user
  const [existingEvent] = await db
    .select()
    .from(events)
    .where(and(eq(events.id, id), eq(events.userId, userId)))
    .limit(1);

  if (!existingEvent) {
    throw new AppError('Event not found', 404);
  }

  // Update event
  await db
    .update(events)
    .set({
      title: updates.title ?? existingEvent.title,
      description: updates.description ?? existingEvent.description,
      eventType: updates.eventType ?? existingEvent.eventType,
    })
    .where(eq(events.id, id));

  const [updatedEvent] = await db
    .select()
    .from(events)
    .where(eq(events.id, id))
    .limit(1);

  res.json(updatedEvent);
}

export async function deleteEvent(req: Request, res: Response): Promise<void> {
  const userId = req.user?.userId;
  const { id } = req.params;

  if (!userId) {
    throw new AppError('Unauthorized', 401);
  }

  const db = getDb();

  // Check if event exists and belongs to user
  const [existingEvent] = await db
    .select()
    .from(events)
    .where(and(eq(events.id, id), eq(events.userId, userId)))
    .limit(1);

  if (!existingEvent) {
    throw new AppError('Event not found', 404);
  }

  // Remove event ID from photos
  await db
    .update(photos)
    .set({ eventId: null })
    .where(eq(photos.eventId, id));

  // Delete event persons
  await db.delete(eventPersons).where(eq(eventPersons.eventId, id));

  // Delete event
  await db.delete(events).where(eq(events.id, id));

  res.json({ message: 'Event deleted successfully' });
}

export async function detectEvents(req: Request, res: Response): Promise<void> {
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError('Unauthorized', 401);
  }

  const db = getDb();

  // Get all user photos ordered by taken time
  const userPhotos = await db
    .select()
    .from(photos)
    .where(and(eq(photos.userId, userId), eq(photos.eventId, null as unknown as string)))
    .orderBy(asc(photos.takenAt));

  if (userPhotos.length === 0) {
    res.json({ count: 0, message: 'No unassigned photos found' });
    return;
  }

  // Group photos into events (2 hour gap threshold)
  const eventGroups: Array<typeof userPhotos> = [];
  let currentGroup: typeof userPhotos = [];
  let lastPhotoTime: Date | null = null;

  for (const photo of userPhotos) {
    if (!lastPhotoTime) {
      currentGroup.push(photo);
      lastPhotoTime = photo.takenAt;
      continue;
    }

    const timeDiff = photo.takenAt.getTime() - lastPhotoTime.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    if (hoursDiff > 2) {
      if (currentGroup.length > 0) {
        eventGroups.push([...currentGroup]);
      }
      currentGroup = [photo];
    } else {
      currentGroup.push(photo);
    }

    lastPhotoTime = photo.takenAt;
  }

  // Add the last group
  if (currentGroup.length > 0) {
    eventGroups.push(currentGroup);
  }

  // Import services dynamically to avoid issues when not configured
  let analyzePhotoContent: typeof import('../services/aiService').analyzePhotoContent | null = null;
  let generateEventTitle: typeof import('../services/aiService').generateEventTitle | null = null;
  let getOrCreateLocation: typeof import('../services/locationService').getOrCreateLocation | null = null;

  if (process.env.OPENAI_API_KEY) {
    const aiService = await import('../services/aiService');
    analyzePhotoContent = aiService.analyzePhotoContent;
    generateEventTitle = aiService.generateEventTitle;
  }

  try {
    const locationService = await import('../services/locationService');
    getOrCreateLocation = locationService.getOrCreateLocation;
  } catch {
    // Location service not available
  }

  // Create events from groups
  const createdEvents = [];

  for (const group of eventGroups) {
    const eventId = uuidv4();
    const startTime = group[0].takenAt;
    const endTime = group[group.length - 1].takenAt;
    const coverPhotoId = group[0].id;
    const coverPhoto = group[0];

    // Get or create location if GPS data available
    let locationId: string | undefined;
    let locationName: string | undefined;

    if (coverPhoto.latitude && coverPhoto.longitude && getOrCreateLocation) {
      try {
        const location = await getOrCreateLocation(
          parseFloat(coverPhoto.latitude),
          parseFloat(coverPhoto.longitude)
        );
        locationId = location.id;
        locationName = location.placeName || location.city || undefined;
      } catch (error) {
        console.error('Failed to get location:', error);
      }
    }

    // Generate title
    let title: string;
    let eventType: string | undefined;
    let description: string | undefined;

    const dateStr = startTime.toLocaleDateString('ja-JP', {
      month: 'long',
      day: 'numeric',
    });

    // Try AI analysis for the cover photo
    if (analyzePhotoContent && generateEventTitle) {
      try {
        const analysis = await analyzePhotoContent(coverPhoto.filePath);

        // Save analysis to the cover photo
        await db
          .update(photos)
          .set({
            analyzed: true,
            analysisResult: JSON.stringify(analysis),
          })
          .where(eq(photos.id, coverPhoto.id));

        // Generate title using AI
        title = await generateEventTitle(analysis, locationName, dateStr);
        eventType = analysis.scene;
        description = analysis.description;
      } catch (error) {
        console.error('AI analysis failed:', error);
        title = locationName ? `${dateStr} ${locationName}` : `${dateStr}のイベント`;
      }
    } else {
      // Fallback to simple title
      title = locationName ? `${dateStr} ${locationName}` : `${dateStr}のイベント`;
    }

    // Create event
    const eventData: Record<string, unknown> = {
      id: eventId,
      userId,
      title,
      startTime,
      endTime,
      coverPhotoId,
    };

    if (locationId) {
      eventData.locationId = locationId;
    }
    if (eventType) {
      eventData.eventType = eventType;
    }
    if (description) {
      eventData.description = description;
    }

    await db.insert(events).values(eventData as typeof events.$inferInsert);

    // Update photos with event ID
    for (const photo of group) {
      await db
        .update(photos)
        .set({ eventId })
        .where(eq(photos.id, photo.id));
    }

    createdEvents.push({
      id: eventId,
      title,
      photoCount: group.length,
      locationName,
    });
  }

  res.json({
    count: eventGroups.length,
    message: `Created ${eventGroups.length} events from ${userPhotos.length} photos`,
    events: createdEvents,
  });
}
