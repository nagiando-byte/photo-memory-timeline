import { v4 as uuidv4 } from 'uuid';
import { eq, and, sql } from 'drizzle-orm';
import { getDb } from '../models/db';
import { locations } from '../models/schema';

interface GeocodingResult {
  placeName?: string;
  address?: string;
  city?: string;
  country?: string;
}

/**
 * Reverse geocode coordinates to get location name
 * Uses OpenStreetMap Nominatim API (free, no API key required)
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<GeocodingResult> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'PhotoMemoryTimeline/1.0',
        'Accept-Language': 'ja',
      },
    });

    if (!response.ok) {
      console.error('Geocoding request failed:', response.status);
      return {};
    }

    const data = await response.json() as {
      address?: {
        tourism?: string;
        amenity?: string;
        shop?: string;
        building?: string;
        leisure?: string;
        city?: string;
        town?: string;
        village?: string;
        municipality?: string;
        county?: string;
        country?: string;
      };
      name?: string;
      display_name?: string;
    };

    const address = data.address || {};

    return {
      placeName:
        address.tourism ||
        address.amenity ||
        address.shop ||
        address.building ||
        address.leisure ||
        data.name ||
        undefined,
      address: data.display_name,
      city:
        address.city ||
        address.town ||
        address.village ||
        address.municipality ||
        address.county,
      country: address.country,
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return {};
  }
}

/**
 * Get or create location record
 */
export async function getOrCreateLocation(
  latitude: number,
  longitude: number
): Promise<typeof locations.$inferSelect> {
  const db = getDb();

  // Check for existing location within ~100 meters
  // Using simple approximation: 0.001 degree ≈ 111 meters
  const threshold = 0.001;

  const existing = await db
    .select()
    .from(locations)
    .where(
      and(
        sql`ABS(${locations.latitude} - ${latitude}) < ${threshold}`,
        sql`ABS(${locations.longitude} - ${longitude}) < ${threshold}`
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  // Create new location with geocoding
  const geocoded = await reverseGeocode(latitude, longitude);

  const locationId = uuidv4();
  await db.insert(locations).values({
    id: locationId,
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    placeName: geocoded.placeName,
    address: geocoded.address,
    city: geocoded.city,
    country: geocoded.country,
  });

  const [newLocation] = await db
    .select()
    .from(locations)
    .where(eq(locations.id, locationId))
    .limit(1);

  return newLocation;
}

/**
 * Get location by ID
 */
export async function getLocation(
  locationId: string
): Promise<typeof locations.$inferSelect | null> {
  const db = getDb();

  const [location] = await db
    .select()
    .from(locations)
    .where(eq(locations.id, locationId))
    .limit(1);

  return location || null;
}

/**
 * Format location for display
 */
export function formatLocation(location: typeof locations.$inferSelect): string {
  if (location.placeName) {
    if (location.city) {
      return `${location.placeName}（${location.city}）`;
    }
    return location.placeName;
  }

  if (location.city) {
    if (location.country && location.country !== '日本') {
      return `${location.city}, ${location.country}`;
    }
    return location.city;
  }

  return location.address || '不明な場所';
}
