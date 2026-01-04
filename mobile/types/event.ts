import type { Photo } from './photo';

export interface Event {
  id: string;
  userId: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  locationId?: string;
  location?: Location;
  eventType?: string;
  coverPhotoId?: string;
  coverPhoto?: Photo;
  photos?: Photo[];
  persons?: Person[];
  createdAt: string;
  updatedAt: string;
}

export interface Location {
  id: string;
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  country?: string;
  placeName?: string;
}

export interface Person {
  id: string;
  userId: string;
  name?: string;
  representativeFaceId?: string;
  faceCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface EventSummary {
  when: string;
  who: string[];
  what: string;
  where: string;
}
