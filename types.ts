export interface ExtractedLocation {
  fileName: string; // Used to map back to the original file
  address: string;
  latitude: number | null;
  longitude: number | null;
  date?: string;
  time?: string;
  error?: string;
}

export interface ProcessedImage extends ExtractedLocation {
  originalFile: File;
  previewUrl: string;
}

export enum ProcessingStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

// Schema for Gemini JSON response
export interface GeminiResponseItem {
  address: string;
  latitude: number;
  longitude: number;
  date: string;
  time: string;
  foundCoordinates: boolean;
}