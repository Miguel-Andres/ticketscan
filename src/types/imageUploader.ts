// Estados posibles para cada imagen
export type ImageStatus = 'pending' | 'processing' | 'completed' | 'error' | 'retrying';

// Interfaz para cada imagen cargada
export interface UploadedImage {
  id: string;
  file: File;
  preview?: string;
  status: ImageStatus;
  progress: number;
  result?: OCRImageResult;
  retryResult?: OCRImageResult;
  error?: string;
  isRetryMode?: boolean;
}

// Resultado OCR para una imagen
export interface OCRImageResult {
  text: string;
  confidence: number;
  processingTimeMs: number;
  fieldResults?: Record<string, {
    text: string;
    confidence: number;
    boundingBox?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
  sources?: Record<string, 'original' | 'retry' | 'merged'>;
  confidenceImprovement?: number;
}

// Interfaz para respuesta del servidor
export interface OCRResult {
  filename: string;
  text: string;
  confidence: number;
  processingTimeMs: number;
  fieldResults?: Record<string, {
    text: string;
    confidence: number;
    boundingBox?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
  sources?: Record<string, 'original' | 'retry' | 'merged'>;
  confidenceImprovement?: number;
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
