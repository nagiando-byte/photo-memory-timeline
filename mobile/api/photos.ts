import apiClient from './client';
import type { Photo } from '../types';

interface UploadPhotoParams {
  uri: string;
  takenAt: string;
  latitude?: number;
  longitude?: number;
  width: number;
  height: number;
}

interface GetPhotosParams {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  eventId?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export const photosApi = {
  getPhotos: async (params?: GetPhotosParams): Promise<PaginatedResponse<Photo>> => {
    const response = await apiClient.get<PaginatedResponse<Photo>>('/photos', { params });
    return response.data;
  },

  getPhoto: async (id: string): Promise<Photo> => {
    const response = await apiClient.get<Photo>(`/photos/${id}`);
    return response.data;
  },

  uploadPhoto: async (params: UploadPhotoParams): Promise<Photo> => {
    const formData = new FormData();

    // Create file object from URI
    const filename = params.uri.split('/').pop() || 'photo.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('photo', {
      uri: params.uri,
      name: filename,
      type,
    } as unknown as Blob);

    formData.append('takenAt', params.takenAt);
    formData.append('width', String(params.width));
    formData.append('height', String(params.height));

    if (params.latitude) {
      formData.append('latitude', String(params.latitude));
    }
    if (params.longitude) {
      formData.append('longitude', String(params.longitude));
    }

    const response = await apiClient.post<Photo>('/photos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deletePhoto: async (id: string): Promise<void> => {
    await apiClient.delete(`/photos/${id}`);
  },

  analyzePhoto: async (id: string): Promise<Photo> => {
    const response = await apiClient.post<Photo>(`/photos/${id}/analyze`);
    return response.data;
  },
};
