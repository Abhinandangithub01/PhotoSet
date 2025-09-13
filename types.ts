// FIX: Define types for the application state and API responses.
export interface UploadedImage {
  id: string;
  file: File;
  dataUrl: string;
  base64: string;
  mimeType: string;
}

export type GeneratedResultStatus = 'pending' | 'success' | 'error';

export interface GeneratedResult {
  id: string;
  original: UploadedImage;
  status: GeneratedResultStatus;
  generatedUrl?: string;
  error?: string;
}

export interface MarketingCopy {
  headlines: string[];
  body: string[];
  hashtags: string[];
}

export interface CustomBackgroundImage {
  id: string;
  name: string;
  dataUrl: string;
  base64: string;
  mimeType: string;
}
