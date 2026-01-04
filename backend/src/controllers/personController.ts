import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { eq, and, desc } from 'drizzle-orm';
import { getDb } from '../models/db';
import { persons, faces, photos, eventPersons, events } from '../models/schema';
import { AppError } from '../middleware/errorHandler';

/**
 * Get all persons for user
 */
export async function getPersons(req: Request, res: Response): Promise<void> {
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError('Unauthorized', 401);
  }

  const db = getDb();

  const userPersons = await db
    .select()
    .from(persons)
    .where(eq(persons.userId, userId))
    .orderBy(desc(persons.updatedAt));

  // Get face count for each person
  const personsWithFaceCount = await Promise.all(
    userPersons.map(async (person) => {
      const faceList = await db
        .select()
        .from(faces)
        .where(eq(faces.personId, person.id));

      return {
        ...person,
        faceCount: faceList.length,
      };
    })
  );

  res.json(personsWithFaceCount);
}

/**
 * Get person by ID
 */
export async function getPerson(req: Request, res: Response): Promise<void> {
  const userId = req.user?.userId;
  const { id } = req.params;

  if (!userId) {
    throw new AppError('Unauthorized', 401);
  }

  const db = getDb();

  const [person] = await db
    .select()
    .from(persons)
    .where(and(eq(persons.id, id), eq(persons.userId, userId)))
    .limit(1);

  if (!person) {
    throw new AppError('Person not found', 404);
  }

  // Get faces for this person
  const personFaces = await db
    .select()
    .from(faces)
    .where(eq(faces.personId, id));

  // Get photos containing this person
  const photoIds = personFaces.map((f) => f.photoId);
  const personPhotos = photoIds.length > 0
    ? await Promise.all(
        photoIds.map(async (photoId) => {
          const [photo] = await db
            .select()
            .from(photos)
            .where(eq(photos.id, photoId))
            .limit(1);
          return photo;
        })
      ).then((results) => results.filter(Boolean))
    : [];

  // Get events this person appears in
  const personEvents = await db
    .select()
    .from(eventPersons)
    .where(eq(eventPersons.personId, id));

  const eventIds = personEvents.map((ep) => ep.eventId);
  const relatedEvents = eventIds.length > 0
    ? await Promise.all(
        eventIds.map(async (eventId) => {
          const [event] = await db
            .select()
            .from(events)
            .where(eq(events.id, eventId))
            .limit(1);
          return event;
        })
      ).then((results) => results.filter(Boolean))
    : [];

  res.json({
    ...person,
    faces: personFaces,
    faceCount: personFaces.length,
    photos: personPhotos,
    photoCount: personPhotos.length,
    events: relatedEvents,
    eventCount: relatedEvents.length,
  });
}

/**
 * Create a new person
 */
export async function createPerson(req: Request, res: Response): Promise<void> {
  const userId = req.user?.userId;
  const { name } = req.body;

  if (!userId) {
    throw new AppError('Unauthorized', 401);
  }

  const db = getDb();

  const personId = uuidv4();
  await db.insert(persons).values({
    id: personId,
    userId,
    name: name || null,
  });

  const [person] = await db
    .select()
    .from(persons)
    .where(eq(persons.id, personId))
    .limit(1);

  res.status(201).json(person);
}

/**
 * Update person
 */
export async function updatePerson(req: Request, res: Response): Promise<void> {
  const userId = req.user?.userId;
  const { id } = req.params;
  const { name, representativeFaceId } = req.body;

  if (!userId) {
    throw new AppError('Unauthorized', 401);
  }

  const db = getDb();

  // Check if person exists
  const [existingPerson] = await db
    .select()
    .from(persons)
    .where(and(eq(persons.id, id), eq(persons.userId, userId)))
    .limit(1);

  if (!existingPerson) {
    throw new AppError('Person not found', 404);
  }

  // Update person
  const updateData: Record<string, unknown> = {};
  if (name !== undefined) {
    updateData.name = name;
  }
  if (representativeFaceId !== undefined) {
    updateData.representativeFaceId = representativeFaceId;
  }

  if (Object.keys(updateData).length > 0) {
    await db
      .update(persons)
      .set(updateData)
      .where(eq(persons.id, id));
  }

  const [updatedPerson] = await db
    .select()
    .from(persons)
    .where(eq(persons.id, id))
    .limit(1);

  res.json(updatedPerson);
}

/**
 * Delete person
 */
export async function deletePerson(req: Request, res: Response): Promise<void> {
  const userId = req.user?.userId;
  const { id } = req.params;

  if (!userId) {
    throw new AppError('Unauthorized', 401);
  }

  const db = getDb();

  // Check if person exists
  const [existingPerson] = await db
    .select()
    .from(persons)
    .where(and(eq(persons.id, id), eq(persons.userId, userId)))
    .limit(1);

  if (!existingPerson) {
    throw new AppError('Person not found', 404);
  }

  // Remove person from faces
  await db
    .update(faces)
    .set({ personId: null })
    .where(eq(faces.personId, id));

  // Remove from event_persons
  await db.delete(eventPersons).where(eq(eventPersons.personId, id));

  // Delete person
  await db.delete(persons).where(eq(persons.id, id));

  res.json({ message: 'Person deleted successfully' });
}

/**
 * Assign face to person
 */
export async function assignFaceToPerson(req: Request, res: Response): Promise<void> {
  const userId = req.user?.userId;
  const { faceId, personId } = req.body;

  if (!userId) {
    throw new AppError('Unauthorized', 401);
  }

  if (!faceId) {
    throw new AppError('faceId is required', 400);
  }

  const db = getDb();

  // Get face
  const [face] = await db
    .select()
    .from(faces)
    .where(eq(faces.id, faceId))
    .limit(1);

  if (!face) {
    throw new AppError('Face not found', 404);
  }

  // Verify photo belongs to user
  const [photo] = await db
    .select()
    .from(photos)
    .where(and(eq(photos.id, face.photoId), eq(photos.userId, userId)))
    .limit(1);

  if (!photo) {
    throw new AppError('Face does not belong to user', 403);
  }

  // If personId is provided, verify it belongs to user
  if (personId) {
    const [person] = await db
      .select()
      .from(persons)
      .where(and(eq(persons.id, personId), eq(persons.userId, userId)))
      .limit(1);

    if (!person) {
      throw new AppError('Person not found', 404);
    }
  }

  // Update face
  await db
    .update(faces)
    .set({ personId: personId || null })
    .where(eq(faces.id, faceId));

  const [updatedFace] = await db
    .select()
    .from(faces)
    .where(eq(faces.id, faceId))
    .limit(1);

  res.json(updatedFace);
}

/**
 * Get faces for a photo
 */
export async function getPhotoFaces(req: Request, res: Response): Promise<void> {
  const userId = req.user?.userId;
  const { photoId } = req.params;

  if (!userId) {
    throw new AppError('Unauthorized', 401);
  }

  const db = getDb();

  // Verify photo belongs to user
  const [photo] = await db
    .select()
    .from(photos)
    .where(and(eq(photos.id, photoId), eq(photos.userId, userId)))
    .limit(1);

  if (!photo) {
    throw new AppError('Photo not found', 404);
  }

  // Get faces
  const photoFaces = await db
    .select()
    .from(faces)
    .where(eq(faces.photoId, photoId));

  // Get person info for each face
  const facesWithPersons = await Promise.all(
    photoFaces.map(async (face) => {
      if (face.personId) {
        const [person] = await db
          .select()
          .from(persons)
          .where(eq(persons.id, face.personId))
          .limit(1);
        return { ...face, person };
      }
      return { ...face, person: null };
    })
  );

  res.json(facesWithPersons);
}

/**
 * Merge two persons
 */
export async function mergePersons(req: Request, res: Response): Promise<void> {
  const userId = req.user?.userId;
  const { sourcePersonId, targetPersonId } = req.body;

  if (!userId) {
    throw new AppError('Unauthorized', 401);
  }

  if (!sourcePersonId || !targetPersonId) {
    throw new AppError('sourcePersonId and targetPersonId are required', 400);
  }

  if (sourcePersonId === targetPersonId) {
    throw new AppError('Cannot merge person with itself', 400);
  }

  const db = getDb();

  // Verify both persons belong to user
  const [sourcePerson] = await db
    .select()
    .from(persons)
    .where(and(eq(persons.id, sourcePersonId), eq(persons.userId, userId)))
    .limit(1);

  const [targetPerson] = await db
    .select()
    .from(persons)
    .where(and(eq(persons.id, targetPersonId), eq(persons.userId, userId)))
    .limit(1);

  if (!sourcePerson || !targetPerson) {
    throw new AppError('Person not found', 404);
  }

  // Move all faces from source to target
  await db
    .update(faces)
    .set({ personId: targetPersonId })
    .where(eq(faces.personId, sourcePersonId));

  // Move event associations
  const sourceEventPersons = await db
    .select()
    .from(eventPersons)
    .where(eq(eventPersons.personId, sourcePersonId));

  for (const ep of sourceEventPersons) {
    // Check if target already has this event
    const [existing] = await db
      .select()
      .from(eventPersons)
      .where(
        and(
          eq(eventPersons.eventId, ep.eventId),
          eq(eventPersons.personId, targetPersonId)
        )
      )
      .limit(1);

    if (!existing) {
      await db.insert(eventPersons).values({
        eventId: ep.eventId,
        personId: targetPersonId,
      });
    }
  }

  // Delete source event persons
  await db.delete(eventPersons).where(eq(eventPersons.personId, sourcePersonId));

  // Delete source person
  await db.delete(persons).where(eq(persons.id, sourcePersonId));

  // Get updated target person
  const [updatedPerson] = await db
    .select()
    .from(persons)
    .where(eq(persons.id, targetPersonId))
    .limit(1);

  const faceList = await db
    .select()
    .from(faces)
    .where(eq(faces.personId, targetPersonId));

  res.json({
    ...updatedPerson,
    faceCount: faceList.length,
    merged: true,
  });
}
