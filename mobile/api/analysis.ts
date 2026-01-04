import apiClient from './client';
import type { Photo } from '../types';

interface AnalysisStatus {
  total: number;
  analyzed: number;
  unanalyzed: number;
  percentage: number;
  hasApiKey: boolean;
}

interface BatchAnalyzeResult {
  analyzed: number;
  failed: number;
  total: number;
  results: Array<{
    id: string;
    success: boolean;
    analysis?: Record<string, unknown>;
    error?: string;
  }>;
}

interface FaceDetectionResult {
  processed: number;
  results: Array<{
    id: string;
    success: boolean;
    faces?: Array<{
      boundingBox: {
        x: number;
        y: number;
        width: number;
        height: number;
      };
      description: string;
    }>;
    faceCount?: number;
    error?: string;
  }>;
}

interface EventSummary {
  title: string;
  description: string;
  when: string;
  who: string;
  what: string;
  where: string;
  mood: string;
}

interface EventSummaryResult {
  eventId: string;
  summary: EventSummary;
  photoCount: number;
  analyzedCount: number;
}

export const analysisApi = {
  /**
   * Get analysis status for user's photos
   */
  getStatus: async (): Promise<AnalysisStatus> => {
    const response = await apiClient.get<AnalysisStatus>('/analysis/status');
    return response.data;
  },

  /**
   * Batch analyze photos
   */
  analyzePhotos: async (options?: {
    photoIds?: string[];
    limit?: number;
  }): Promise<BatchAnalyzeResult> => {
    const response = await apiClient.post<BatchAnalyzeResult>('/analysis/photos', options || {});
    return response.data;
  },

  /**
   * Detect faces in photos
   */
  detectFaces: async (options?: {
    photoIds?: string[];
    limit?: number;
  }): Promise<FaceDetectionResult> => {
    const response = await apiClient.post<FaceDetectionResult>('/analysis/faces', options || {});
    return response.data;
  },

  /**
   * Generate event summary
   */
  generateEventSummary: async (eventId: string): Promise<EventSummaryResult> => {
    const response = await apiClient.post<EventSummaryResult>(
      `/analysis/events/${eventId}/summary`
    );
    return response.data;
  },
};
