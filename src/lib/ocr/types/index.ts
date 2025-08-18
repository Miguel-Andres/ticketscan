/**
 * Tipos para el servicio OCR
 */

export interface OCRResult {
  filename: string;
  text: string;
  confidence: number;
  processingTimeMs: number;
}

export interface ProcessedFile {
  filepath: string;
  originalFilename: string;
  mimetype: string;
  size: number;
}

export interface OCRProcessingResult {
  results: OCRResult[];
  errors: { filename: string; error: string }[];
  totalProcessingTimeMs: number;
}
