import { create } from 'zustand';
import type { Photo, LocalPhoto } from '../types';

interface PhotoStore {
  photos: Photo[];
  localPhotos: LocalPhoto[];
  syncedCount: number;
  totalCount: number;
  isSyncing: boolean;
  setPhotos: (photos: Photo[]) => void;
  setLocalPhotos: (photos: LocalPhoto[]) => void;
  setSyncProgress: (synced: number, total: number) => void;
  setSyncing: (isSyncing: boolean) => void;
  addPhoto: (photo: Photo) => void;
  updatePhoto: (id: string, updates: Partial<Photo>) => void;
}

export const usePhotoStore = create<PhotoStore>((set) => ({
  photos: [],
  localPhotos: [],
  syncedCount: 0,
  totalCount: 0,
  isSyncing: false,

  setPhotos: (photos) => set({ photos }),

  setLocalPhotos: (localPhotos) => set({ localPhotos }),

  setSyncProgress: (syncedCount, totalCount) => set({ syncedCount, totalCount }),

  setSyncing: (isSyncing) => set({ isSyncing }),

  addPhoto: (photo) => set((state) => ({ photos: [...state.photos, photo] })),

  updatePhoto: (id, updates) =>
    set((state) => ({
      photos: state.photos.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),
}));
