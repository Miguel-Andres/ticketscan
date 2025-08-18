/**
 * Configuración global para el servicio OCR
 */
export const CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/tiff'],
  TESSERACT_LANGUAGE: 'spa',
  MAX_CONCURRENT_PROCESSES: 2,
  MAX_FILES_PER_REQUEST: 50,
  REQUEST_TIMEOUT_MS: 300000
};
