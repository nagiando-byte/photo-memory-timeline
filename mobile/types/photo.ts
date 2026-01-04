export interface Photo {
  id: string;
  userId: string;
  eventId?: string;
  uri: string;
  filePath: string;
  thumbnailPath?: string;
  takenAt: string;
  latitude?: number;
  longitude?: number;
  width: number;
  height: number;
  fileSize: number;
  analyzed: boolean;
  analysisResult?: PhotoAnalysis;
  createdAt: string;
}

export interface PhotoAnalysis {
  scene: string;
  objects: string[];
  atmosphere: string;
  description: string;
  faces?: FaceDetection[];
}

export interface FaceDetection {
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  description: string;
}

export interface LocalPhoto {
  id: string;
  uri: string;
  filename: string;
  width: number;
  height: number;
  creationTime: number;
  location?: {
    latitude: number;
    longitude: number;
  };
  exif?: Record<string, unknown>;
}
