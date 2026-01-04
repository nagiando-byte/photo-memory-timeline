import {
  mysqlTable,
  varchar,
  timestamp,
  decimal,
  int,
  bigint,
  boolean,
  text,
  mysqlEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = mysqlTable('users', {
  id: varchar('id', { length: 36 }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

// Photos table
export const photos = mysqlTable('photos', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  eventId: varchar('event_id', { length: 36 }),
  filePath: varchar('file_path', { length: 500 }).notNull(),
  thumbnailPath: varchar('thumbnail_path', { length: 500 }),
  takenAt: timestamp('taken_at').notNull(),
  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),
  width: int('width').notNull(),
  height: int('height').notNull(),
  fileSize: bigint('file_size', { mode: 'number' }).notNull(),
  analyzed: boolean('analyzed').default(false),
  analysisResult: text('analysis_result'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('photos_user_id_idx').on(table.userId),
  index('photos_event_id_idx').on(table.eventId),
  index('photos_taken_at_idx').on(table.takenAt),
  index('photos_user_taken_at_idx').on(table.userId, table.takenAt),
]);

// Events table
export const events = mysqlTable('events', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  locationId: varchar('location_id', { length: 36 }),
  eventType: varchar('event_type', { length: 50 }),
  coverPhotoId: varchar('cover_photo_id', { length: 36 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
}, (table) => [
  index('events_user_id_idx').on(table.userId),
  index('events_start_time_idx').on(table.startTime),
  index('events_user_start_time_idx').on(table.userId, table.startTime),
]);

// Persons table
export const persons = mysqlTable('persons', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  name: varchar('name', { length: 100 }),
  representativeFaceId: varchar('representative_face_id', { length: 36 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

// Faces table
export const faces = mysqlTable('faces', {
  id: varchar('id', { length: 36 }).primaryKey(),
  photoId: varchar('photo_id', { length: 36 }).notNull(),
  personId: varchar('person_id', { length: 36 }),
  faceRectX: decimal('face_rect_x', { precision: 10, scale: 6 }).notNull(),
  faceRectY: decimal('face_rect_y', { precision: 10, scale: 6 }).notNull(),
  faceRectWidth: decimal('face_rect_width', { precision: 10, scale: 6 }).notNull(),
  faceRectHeight: decimal('face_rect_height', { precision: 10, scale: 6 }).notNull(),
  faceEncoding: text('face_encoding'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('faces_photo_id_idx').on(table.photoId),
  index('faces_person_id_idx').on(table.personId),
]);

// Locations table
export const locations = mysqlTable('locations', {
  id: varchar('id', { length: 36 }).primaryKey(),
  latitude: decimal('latitude', { precision: 10, scale: 8 }).notNull(),
  longitude: decimal('longitude', { precision: 11, scale: 8 }).notNull(),
  address: varchar('address', { length: 500 }),
  city: varchar('city', { length: 100 }),
  country: varchar('country', { length: 100 }),
  placeName: varchar('place_name', { length: 200 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Event Shares table
export const eventShares = mysqlTable('event_shares', {
  id: varchar('id', { length: 36 }).primaryKey(),
  eventId: varchar('event_id', { length: 36 }).notNull(),
  sharedByUserId: varchar('shared_by_user_id', { length: 36 }),
  shareToken: varchar('share_token', { length: 100 }).notNull().unique(),
  permission: mysqlEnum('permission', ['view', 'download', 'edit']).notNull(),
  expiresAt: timestamp('expires_at'),
  viewCount: int('view_count').default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Event Photos junction table
export const eventPhotos = mysqlTable('event_photos', {
  eventId: varchar('event_id', { length: 36 }).notNull(),
  photoId: varchar('photo_id', { length: 36 }).notNull(),
});

// Event Persons junction table
export const eventPersons = mysqlTable('event_persons', {
  eventId: varchar('event_id', { length: 36 }).notNull(),
  personId: varchar('person_id', { length: 36 }).notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  photos: many(photos),
  events: many(events),
  persons: many(persons),
}));

export const photosRelations = relations(photos, ({ one, many }) => ({
  user: one(users, {
    fields: [photos.userId],
    references: [users.id],
  }),
  event: one(events, {
    fields: [photos.eventId],
    references: [events.id],
  }),
  faces: many(faces),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  user: one(users, {
    fields: [events.userId],
    references: [users.id],
  }),
  location: one(locations, {
    fields: [events.locationId],
    references: [locations.id],
  }),
  coverPhoto: one(photos, {
    fields: [events.coverPhotoId],
    references: [photos.id],
  }),
  photos: many(photos),
  shares: many(eventShares),
}));

export const personsRelations = relations(persons, ({ one, many }) => ({
  user: one(users, {
    fields: [persons.userId],
    references: [users.id],
  }),
  faces: many(faces),
}));

export const facesRelations = relations(faces, ({ one }) => ({
  photo: one(photos, {
    fields: [faces.photoId],
    references: [photos.id],
  }),
  person: one(persons, {
    fields: [faces.personId],
    references: [persons.id],
  }),
}));

export const eventSharesRelations = relations(eventShares, ({ one }) => ({
  event: one(events, {
    fields: [eventShares.eventId],
    references: [events.id],
  }),
  sharedBy: one(users, {
    fields: [eventShares.sharedByUserId],
    references: [users.id],
  }),
}));
