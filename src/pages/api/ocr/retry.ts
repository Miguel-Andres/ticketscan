import type { APIRoute } from 'astro';
import { 
  OCRProcessor, 
  validateServerFile, 
  createTempFile, 
  cleanupFiles,
  CONFIG
} from '../../../lib/ocr';
import type { OCRRetryParams } from '../../../lib/ocr/types';

/**
 * API para reintento OCR con parámetros avanzados
 * Acepta una imagen individual y parámetros de procesamiento personalizados
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
    
    // Obtener imagen
    const imageFile = formData.get('image');
    if (!imageFile || !(imageFile instanceof File) || !validateServerFile(imageFile)) {
      return new Response(
        JSON.stringify({ 
          error: 'No se encontró una imagen válida',
          allowedTypes: CONFIG.ALLOWED_MIME_TYPES
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Obtener parámetros de reintento OCR
    let retryParams: OCRRetryParams = {};
    const paramsString = formData.get('params');
    
    if (paramsString && typeof paramsString === 'string') {
      try {
        retryParams = JSON.parse(paramsString);
        
        // Validar parámetros
        if (!validateRetryParams(retryParams)) {
          return new Response(
            JSON.stringify({ error: 'Parámetros de reintento OCR inválidos' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
      } catch (error) {
        return new Response(
          JSON.stringify({ 
            error: 'Error al parsear parámetros de reintento OCR',
            details: error instanceof Error ? error.message : 'Error desconocido'
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // Crear archivo temporal
    const tempFile = await createTempFile(imageFile);
    
    try {
      // Inicializar procesador OCR
      const processor = new OCRProcessor();
      
      // Procesar imagen con parámetros de reintento
      const result = await processor.processRetry(tempFile, retryParams);
      
      return new Response(
        JSON.stringify(result),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } finally {
      // Limpiar archivos temporales
      await cleanupFiles([tempFile]);
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

/**
 * Valida los parámetros de reintento OCR
 */
function validateRetryParams(params: OCRRetryParams): boolean {
  // Validar preprocessing
  if (params.preprocessing) {
    // Validar que los valores sean del tipo correcto
    if (params.preprocessing.upscale !== undefined && 
        (typeof params.preprocessing.upscale !== 'number' || 
         params.preprocessing.upscale < 1 || 
         params.preprocessing.upscale > 3)) {
      return false;
    }
    
    // Validar que los booleanos sean booleanos
    const booleanProps = ['deskew', 'adaptiveThreshold', 'despeckle', 'sharpen', 'normalizeContrast'];
    for (const prop of booleanProps) {
      if (params.preprocessing[prop as keyof typeof params.preprocessing] !== undefined && 
          typeof params.preprocessing[prop as keyof typeof params.preprocessing] !== 'boolean') {
        return false;
      }
    }
  }
  
  // Validar tesseractParams
  if (params.tesseractParams) {
    // Validar PSM (Page Segmentation Mode)
    if (params.tesseractParams.psm !== undefined && 
        (typeof params.tesseractParams.psm !== 'number' || 
         ![1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].includes(params.tesseractParams.psm))) {
      return false;
    }
    
    // Validar OEM (OCR Engine Mode)
    if (params.tesseractParams.oem !== undefined && 
        (typeof params.tesseractParams.oem !== 'number' || 
         ![0, 1, 2, 3].includes(params.tesseractParams.oem))) {
      return false;
    }
    
    // Validar whitelist y blacklist
    if (params.tesseractParams.whitelist !== undefined && 
        typeof params.tesseractParams.whitelist !== 'string') {
      return false;
    }
    
    if (params.tesseractParams.blacklist !== undefined && 
        typeof params.tesseractParams.blacklist !== 'string') {
      return false;
    }
    
    // Validar booleanos
    const booleanProps = ['preserveInterwordSpaces', 'numericMode'];
    for (const prop of booleanProps) {
      if (params.tesseractParams[prop as keyof typeof params.tesseractParams] !== undefined && 
          typeof params.tesseractParams[prop as keyof typeof params.tesseractParams] !== 'boolean') {
        return false;
      }
    }
  }
  
  // Validar regions
  if (params.regions) {
    if (!Array.isArray(params.regions)) {
      return false;
    }
    
    for (const region of params.regions) {
      // Validar nombre
      if (!region.name || typeof region.name !== 'string') {
        return false;
      }
      
      // Validar boundingBox
      if (!region.boundingBox || 
          typeof region.boundingBox.x !== 'number' || 
          typeof region.boundingBox.y !== 'number' || 
          typeof region.boundingBox.width !== 'number' || 
          typeof region.boundingBox.height !== 'number' ||
          region.boundingBox.width <= 0 ||
          region.boundingBox.height <= 0) {
        return false;
      }
      
      // Validar tesseractParams si existe
      if (region.tesseractParams) {
        // Reutilizar la validación de tesseractParams
        const tempParams: OCRRetryParams = {
          tesseractParams: region.tesseractParams
        };
        if (!validateRetryParams(tempParams)) {
          return false;
        }
      }
    }
  }
  
  return true;
}
