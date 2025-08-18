import type { APIRoute } from 'astro';
import { 
  OCRProcessor, 
  validateFile, 
  createTempFile, 
  cleanupFiles,
  CONFIG
} from '../../lib/ocr';

/**
 * API para procesamiento OCR de imágenes
 */
export const POST: APIRoute = async ({ request }) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT_MS);
  
  try {
    // Validar Content-Type
    const contentType = request.headers.get('Content-Type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return new Response(
        JSON.stringify({ error: 'Content-Type debe ser multipart/form-data' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtener FormData
    const formData = await request.formData();
    const validFiles: File[] = [];
    
    // Filtrar archivos válidos
    for (const [key, value] of formData.entries()) {
      if (key === 'images' && value instanceof File && validateFile(value)) {
        validFiles.push(value);
      }
    }
    
    // Validar que hay archivos
    if (validFiles.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No se encontraron imágenes válidas',
          allowedTypes: CONFIG.ALLOWED_MIME_TYPES
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Limitar número de archivos
    const filesToProcess = validFiles.slice(0, CONFIG.MAX_FILES_PER_REQUEST);
    
    // Crear archivos temporales
    const tempFiles = await Promise.all(filesToProcess.map(createTempFile));
    
    try {
      // Inicializar procesador OCR
      const processor = new OCRProcessor();
      
      // Procesar imágenes
      const result = await processor.processImagesBatch(tempFiles);
      
      return new Response(
        JSON.stringify(result),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } finally {
      // Limpiar archivos temporales
      await cleanupFiles(tempFiles);
    }
    
  } catch (error: any) {
    return new Response(
      JSON.stringify({ 
        error: 'Error al procesar la solicitud', 
        details: error.message 
      }),
      { 
        status: error.name === 'AbortError' ? 408 : 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } finally {
    clearTimeout(timeoutId);
  }
};
