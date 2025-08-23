/**
 * Tipos para el servicio OCR
 */

export interface OCRResult {
  filename: string;
  text: string;
  /** Texto original sin post-procesamiento */
  rawText?: string;
  confidence: number;
  processingTimeMs: number;
  fieldResults?: FieldOCRResult[];
}

export interface FieldOCRResult {
  fieldName: string;
  text: string;
  /** Texto original sin post-procesamiento */
  rawText?: string;
  confidence: number;
  boundingBox?: BoundingBox;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
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

/**
 * Tipos para el reintento OCR con parámetros avanzados
 */

export interface OCRRetryParams {
  // Parámetros generales
  preprocessing?: PreprocessingOptions;
  tesseractParams?: TesseractParams;
  regions?: RegionOfInterest[];
}

/**
 * Opciones de preprocesamiento de imagen para OCR
 */
export interface PreprocessingOptions {
  /** Corregir inclinación de la imagen */
  deskew?: boolean;
  /** Factor de escalado para aumentar resolución */
  upscale?: number;
  /** Aplicar umbral adaptativo para binarización */
  adaptiveThreshold?: boolean;
  /** Aplicar filtro de reducción de ruido */
  despeckle?: boolean;
  /** Aplicar filtro de nitidez */
  sharpen?: boolean;
  /** Normalizar contraste */
  normalizeContrast?: boolean;
  /** Aplicar dilatación para unir caracteres fragmentados */
  dilate?: boolean;
  /** Convertir a escala de grises */
  grayscale?: boolean;
  /** Aplicar mejoras de contraste */
  contrast?: boolean;
}

export interface TesseractParams {
  psm?: number; // Page segmentation mode (3, 4, 6, 7, 11, etc.)
  oem?: number; // OCR Engine mode (1 = LSTM, 2 = Legacy, 3 = Both)
  whitelist?: string;
  blacklist?: string;
  preserveInterwordSpaces?: boolean;
  numericMode?: boolean;
}

export interface RegionOfInterest {
  name: string; // Nombre del campo ("shipmentId", "packId", "postalCode", "address", etc.)
  boundingBox: BoundingBox;
  tesseractParams?: TesseractParams; // Parámetros específicos para esta región
}

