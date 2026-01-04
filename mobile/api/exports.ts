import apiClient from './client';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

interface EventExportData {
  exportVersion: string;
  exportedAt: string;
  event: {
    id: string;
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    eventType?: string;
  };
  location?: {
    address?: string;
    city?: string;
    country?: string;
    placeName?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  photos: {
    id: string;
    filename: string;
    takenAt: string;
    width: number;
    height: number;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
    aiAnalysis?: unknown;
  }[];
  persons: {
    id: string;
    name?: string;
  }[];
  metadata: {
    photoCount: number;
    personCount: number;
  };
}

interface AllUserDataExport {
  exportVersion: string;
  exportedAt: string;
  summary: {
    eventCount: number;
    photoCount: number;
    personCount: number;
    faceCount: number;
  };
  events: {
    id: string;
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    eventType?: string;
  }[];
  photos: {
    id: string;
    eventId?: string;
    takenAt: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
    analyzed: boolean;
  }[];
  persons: {
    id: string;
    name?: string;
    faceCount: number;
  }[];
}

export const exportsApi = {
  /**
   * Export event as JSON
   */
  exportEventAsJson: async (eventId: string): Promise<EventExportData> => {
    const response = await apiClient.get<EventExportData>(
      `/exports/events/${eventId}/json`
    );
    return response.data;
  },

  /**
   * Export event as ZIP and share
   */
  exportEventAsZip: async (
    eventId: string,
    options?: { includeOriginals?: boolean }
  ): Promise<string> => {
    const baseUrl = apiClient.defaults.baseURL || '';
    const token = apiClient.defaults.headers.common['Authorization'];

    const url = `${baseUrl}/exports/events/${eventId}/zip${
      options?.includeOriginals ? '?includeOriginals=true' : ''
    }`;

    // Download the ZIP file
    const downloadPath = `${FileSystem.cacheDirectory}event-${eventId}.zip`;

    const downloadResult = await FileSystem.downloadAsync(url, downloadPath, {
      headers: {
        Authorization: token as string,
      },
    });

    if (downloadResult.status !== 200) {
      throw new Error('Failed to download export');
    }

    // Share the file
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(downloadResult.uri, {
        mimeType: 'application/zip',
        dialogTitle: 'Export Event',
      });
    }

    return downloadResult.uri;
  },

  /**
   * Export all user data as JSON
   */
  exportAllUserData: async (): Promise<AllUserDataExport> => {
    const response = await apiClient.get<AllUserDataExport>('/exports/all');
    return response.data;
  },

  /**
   * Export all user data and save to file
   */
  exportAllUserDataToFile: async (): Promise<string> => {
    const data = await exportsApi.exportAllUserData();

    const filePath = `${FileSystem.documentDirectory}photo-memory-export-${
      new Date().toISOString().split('T')[0]
    }.json`;

    await FileSystem.writeAsStringAsync(filePath, JSON.stringify(data, null, 2));

    // Share the file
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'application/json',
        dialogTitle: 'Export All Data',
      });
    }

    return filePath;
  },
};
