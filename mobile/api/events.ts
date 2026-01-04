import apiClient from './client';
import type { Event } from '../types';

interface GetEventsParams {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  year?: number;
  month?: number;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export const eventsApi = {
  getEvents: async (params?: GetEventsParams): Promise<PaginatedResponse<Event>> => {
    const response = await apiClient.get<PaginatedResponse<Event>>('/events', { params });
    return response.data;
  },

  getEvent: async (id: string): Promise<Event> => {
    const response = await apiClient.get<Event>(`/events/${id}`);
    return response.data;
  },

  updateEvent: async (id: string, data: Partial<Event>): Promise<Event> => {
    const response = await apiClient.patch<Event>(`/events/${id}`, data);
    return response.data;
  },

  deleteEvent: async (id: string): Promise<void> => {
    await apiClient.delete(`/events/${id}`);
  },

  detectEvents: async (): Promise<{ count: number }> => {
    const response = await apiClient.post<{ count: number }>('/events/detect');
    return response.data;
  },

  getEventsByMonth: async (year: number, month: number): Promise<Event[]> => {
    const response = await apiClient.get<Event[]>(`/events/month/${year}/${month}`);
    return response.data;
  },
};
