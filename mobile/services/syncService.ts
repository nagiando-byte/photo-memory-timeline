import { getAllLocalPhotos } from './photoService';
import { photosApi } from '../api/photos';
import type { LocalPhoto, Photo } from '../types';

interface SyncResult {
  uploaded: number;
  failed: number;
  skipped: number;
  errors: string[];
}

export async function syncPhotos(
  onProgress?: (current: number, total: number, status: string) => void
): Promise<SyncResult> {
  const result: SyncResult = {
    uploaded: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  try {
    // Get local photos
    onProgress?.(0, 0, 'ローカル写真を取得中...');
    const localPhotos = await getAllLocalPhotos((loaded, total) => {
      onProgress?.(loaded, total, 'ローカル写真を取得中...');
    });

    // Get already synced photos
    onProgress?.(0, localPhotos.length, '同期済み写真を確認中...');
    const syncedPhotos = await photosApi.getPhotos({ limit: 10000 });
    const syncedIds = new Set(syncedPhotos.data.map((p) => p.id));

    // Filter photos that need to be synced
    const photosToSync = localPhotos.filter((p) => !syncedIds.has(p.id));
    result.skipped = localPhotos.length - photosToSync.length;

    // Upload photos
    for (let i = 0; i < photosToSync.length; i++) {
      const photo = photosToSync[i];
      onProgress?.(i + 1, photosToSync.length, `写真をアップロード中 (${i + 1}/${photosToSync.length})`);

      try {
        await uploadPhoto(photo);
        result.uploaded++;
      } catch (error) {
        result.failed++;
        result.errors.push(`${photo.filename}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return result;
  } catch (error) {
    throw new Error(`同期中にエラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function uploadPhoto(localPhoto: LocalPhoto): Promise<Photo> {
  return photosApi.uploadPhoto({
    uri: localPhoto.uri,
    takenAt: new Date(localPhoto.creationTime).toISOString(),
    latitude: localPhoto.location?.latitude,
    longitude: localPhoto.location?.longitude,
    width: localPhoto.width,
    height: localPhoto.height,
  });
}

export async function syncNewPhotos(
  lastSyncDate: Date,
  onProgress?: (current: number, total: number) => void
): Promise<SyncResult> {
  const result: SyncResult = {
    uploaded: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  try {
    const localPhotos = await getAllLocalPhotos();
    const newPhotos = localPhotos.filter(
      (p) => new Date(p.creationTime) > lastSyncDate
    );

    for (let i = 0; i < newPhotos.length; i++) {
      const photo = newPhotos[i];
      onProgress?.(i + 1, newPhotos.length);

      try {
        await uploadPhoto(photo);
        result.uploaded++;
      } catch (error) {
        result.failed++;
        result.errors.push(
          `${photo.filename}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    return result;
  } catch (error) {
    throw new Error(
      `同期中にエラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
