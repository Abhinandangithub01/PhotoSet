export interface UploadedImage {
  file: File;
  dataUrl: string;
  base64: string;
  mimeType: string;
}

export interface StyleRecommendation {
  backgroundTheme: string;
  lightingMood: string;
  reasoning: string;
}
