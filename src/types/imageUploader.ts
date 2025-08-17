// Estados posibles para cada imagen
export type ImageStatus = 'pending' | 'processing' | 'completed' | 'error';

// Interfaz para cada imagen cargada
export interface UploadedImage {
  id: string;
  file: File;
  preview?: string;
  status: ImageStatus;
  progress: number;
  result?: {
    text: string;
    confidence: number;
    processingTimeMs: number;
  };
  error?: string;
}

// Interfaz para respuesta del servidor
export interface OCRResult {
  filename: string;
  text: string;
  confidence: number;
  processingTimeMs: number;
}

export interface OCRError {
  filename: string;
  error: string;
}

export interface OCRResponse {
  results: OCRResult[];
  errors: OCRError[];
  totalProcessingTimeMs: number;
}
