export interface UploadedImage {
  id: string;
  file: File;
  dataUrl: string;
  base64: string;
  mimeType: string;
}

export interface GeneratedResult {
  id: string; // Corresponds to UploadedImage id
  original: UploadedImage;
  generatedUrl: string;
  status: 'pending' | 'success' | 'error';
  error?: string;
}

export interface StyleRecommendation {
  backgroundTheme: string;
  lightingMood: string;
  reasoning: string;
}

export interface MarketingCopy {
  headlines: string[];
  body: string[];
  hashtags: string[];
}
