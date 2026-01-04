import * as MediaLibrary from 'expo-media-library';
import * as Location from 'expo-location';
import type { LocalPhoto } from '../types';

export async function requestPermissions(): Promise<{
  media: boolean;
  location: boolean;
}> {
  const { status: mediaStatus } = await MediaLibrary.requestPermissionsAsync();
  const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();

  return {
    media: mediaStatus === 'granted',
    location: locationStatus === 'granted',
  };
}

export async function checkPermissions(): Promise<{
  media: boolean;
  location: boolean;
}> {
  const { status: mediaStatus } = await MediaLibrary.getPermissionsAsync();
  const { status: locationStatus } = await Location.getForegroundPermissionsAsync();

  return {
    media: mediaStatus === 'granted',
    location: locationStatus === 'granted',
  };
}

export async function getLocalPhotos(
  options: {
    first?: number;
    after?: string;
    sortBy?: MediaLibrary.SortByValue[];
  } = {}
): Promise<{
  photos: LocalPhoto[];
  endCursor: string;
  hasNextPage: boolean;
  totalCount: number;
}> {
  const { first = 100, after, sortBy = [MediaLibrary.SortBy.creationTime] } = options;

  const assets = await MediaLibrary.getAssetsAsync({
    mediaType: 'photo',
    sortBy,
    first,
    after,
  });

  const photos: LocalPhoto[] = [];

  for (const asset of assets.assets) {
    const assetInfo = await MediaLibrary.getAssetInfoAsync(asset);

    photos.push({
      id: asset.id,
      uri: asset.uri,
      filename: asset.filename,
      width: asset.width,
      height: asset.height,
      creationTime: asset.creationTime,
      location: assetInfo.location
        ? {
            latitude: assetInfo.location.latitude,
            longitude: assetInfo.location.longitude,
          }
        : undefined,
      exif: assetInfo.exif,
    });
  }

  return {
    photos,
    endCursor: assets.endCursor,
    hasNextPage: assets.hasNextPage,
    totalCount: assets.totalCount,
  };
}

export async function getAllLocalPhotos(
  onProgress?: (loaded: number, total: number) => void
): Promise<LocalPhoto[]> {
  const allPhotos: LocalPhoto[] = [];
  let hasNextPage = true;
  let cursor: string | undefined;

  // First, get total count
  const initial = await MediaLibrary.getAssetsAsync({
    mediaType: 'photo',
    first: 1,
  });
  const total = initial.totalCount;

  while (hasNextPage) {
    const result = await getLocalPhotos({
      first: 100,
      after: cursor,
    });

    allPhotos.push(...result.photos);
    hasNextPage = result.hasNextPage;
    cursor = result.endCursor;

    if (onProgress) {
      onProgress(allPhotos.length, total);
    }
  }

  return allPhotos;
}

export async function getPhotosByDateRange(
  startDate: Date,
  endDate: Date
): Promise<LocalPhoto[]> {
  const allPhotos = await getAllLocalPhotos();

  return allPhotos.filter((photo) => {
    const photoDate = new Date(photo.creationTime);
    return photoDate >= startDate && photoDate <= endDate;
  });
}

export function groupPhotosByDate(photos: LocalPhoto[]): Map<string, LocalPhoto[]> {
  const grouped = new Map<string, LocalPhoto[]>();

  for (const photo of photos) {
    const date = new Date(photo.creationTime).toISOString().split('T')[0];
    const existing = grouped.get(date) || [];
    existing.push(photo);
    grouped.set(date, existing);
  }

  return grouped;
}

export function groupPhotosByMonth(
  photos: LocalPhoto[]
): Map<string, LocalPhoto[]> {
  const grouped = new Map<string, LocalPhoto[]>();

  for (const photo of photos) {
    const date = new Date(photo.creationTime);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const existing = grouped.get(key) || [];
    existing.push(photo);
    grouped.set(key, existing);
  }

  return grouped;
}
