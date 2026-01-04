import apiClient from './client';
import type { Event, Photo } from '../types';

interface EventShare {
  id: string;
  eventId: string;
  shareToken: string;
  permission: 'view' | 'download' | 'edit';
  expiresAt?: string;
  viewCount: number;
  createdAt: string;
  shareUrl: string;
  isExpired?: boolean;
}

interface SharedEventResponse {
  event: {
    id: string;
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    coverPhotoUrl?: string;
  };
  photos: {
    id: string;
    thumbnailUrl?: string;
    originalUrl?: string;
    takenAt: string;
    aiDescription?: string;
  }[];
  permission: string;
}

interface DownloadPhotosResponse {
  photos: {
    id: string;
    filename: string;
    originalUrl: string;
  }[];
}

export const sharesApi = {
  /**
   * Create a share link for an event
   */
  createEventShare: async (
    eventId: string,
    options?: { permission?: 'view' | 'download' | 'edit'; expiresInDays?: number }
  ): Promise<EventShare> => {
    const response = await apiClient.post<EventShare>(`/shares/events/${eventId}`, {
      permission: options?.permission || 'view',
      expiresInDays: options?.expiresInDays,
    });
    return response.data;
  },

  /**
   * Get all shares for an event
   */
  getEventShares: async (eventId: string): Promise<EventShare[]> => {
    const response = await apiClient.get<EventShare[]>(`/shares/events/${eventId}`);
    return response.data;
  },

  /**
   * Revoke a share
   */
  revokeEventShare: async (eventId: string, shareId: string): Promise<void> => {
    await apiClient.delete(`/shares/events/${eventId}/${shareId}`);
  },

  /**
   * Get shared event (public - no auth required)
   */
  getSharedEvent: async (shareToken: string): Promise<SharedEventResponse> => {
    const response = await apiClient.get<SharedEventResponse>(
      `/shares/public/${shareToken}`
    );
    return response.data;
  },

  /**
   * Download shared event photos (public - no auth required, if permission allows)
   */
  downloadSharedEventPhotos: async (shareToken: string): Promise<DownloadPhotosResponse> => {
    const response = await apiClient.get<DownloadPhotosResponse>(
      `/shares/public/${shareToken}/download`
    );
    return response.data;
  },

  /**
   * Generate a shareable URL for an event
   */
  generateShareUrl: (shareToken: string, baseUrl?: string): string => {
    const base = baseUrl || 'https://photo-memory-timeline.app';
    return `${base}/shared/${shareToken}`;
  },
};
