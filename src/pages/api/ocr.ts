import type { APIRoute } from 'astro';
import * as formidable from 'formidable';
import * as fs from 'fs';
import * as path from 'path';
import { createWorker } from 'tesseract.js';

// Configuración
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/tiff'
];
const TESSERACT_LANGUAGE = 'spa'; // Español por defecto
const MAX_CONCURRENT_PROCESSES = 2; // Limitar concurrencia para evitar sobrecarga

// Interfaz para los resultados
interface OCRResult {
  filename: string;
  text: string;
  confidence: number;
  processingTimeMs: number;
}

interface OCRError {
  filename: string;
  error: string;
}

interface OCRResponse {
  results: OCRResult[];
  errors: OCRError[];
  totalProcessingTimeMs: number;
}

// Pool de workers de Tesseract para reutilización
let workerPool: any[] = [];
const MAX_WORKER_POOL_SIZE = 2; // Tamaño máximo del pool

// Función para obtener un worker del pool o crear uno nuevo
async function getWorker() {
  if (workerPool.length > 0) {
    return workerPool.pop();
  }
  return await createWorker(TESSERACT_LANGUAGE);
}

// Función para devolver un worker al pool
async function releaseWorker(worker: any) {
  if (workerPool.length < MAX_WORKER_POOL_SIZE) {
    workerPool.push(worker);
  } else {
    await worker.terminate();
  }
}

// Función para procesar una imagen con Tesseract
async function processImage(file: formidable.File): Promise<OCRResult> {
  const startTime = Date.now();
  let worker;
  
  try {
    // Obtener un worker del pool o crear uno nuevo
    worker = await getWorker();
    
    // Configurar parámetros para mejorar reconocimiento de etiquetas de envío
    await worker.setParameters({
      // PSM 6: Assume a single uniform block of text (mejora segmentación en etiquetas con líneas alineadas)
      // Referencia: https://tesseract-ocr.github.io/tessdoc/ImproveQuality#page-segmentation-method
      tessedit_pageseg_mode: '6',
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789ÁÉÍÓÚáéíóúÑñ .,:-/',
      preserve_interword_spaces: '1',
      tessedit_do_invert: '0',
      classify_bln_numeric_mode: '0'
    });
    
    // Procesar la imagen
    const { data } = await worker.recognize(file.filepath);
    
    // Eliminar el archivo temporal de forma asíncrona
    await fs.promises.unlink(file.filepath).catch(() => {});
    
    const processingTimeMs = Date.now() - startTime;
    
    // Limpiar y filtrar el texto extraído
    let cleanText = data.text
      .replace(/[^\w\sÁÉÍÓÚáéíóúÑñ.,:-]/g, '') // Remover caracteres especiales excepto los permitidos
      .replace(/\s+/g, ' ') // Normalizar espacios múltiples
      .trim();

    return {
      filename: file.originalFilename || 'unknown',
      text: cleanText,
      confidence: data.confidence / 100, // Normalizar confianza a 0-1
      processingTimeMs
    };
  } catch (error) {
    // Asegurarse de eliminar el archivo temporal incluso en caso de error
    fs.promises.unlink(file.filepath).catch(() => {});
    throw error;
  } finally {
    // Devolver el worker al pool si existe
    if (worker) {
      await releaseWorker(worker);
    }
  }
}

// Función para procesar múltiples imágenes con concurrencia limitada
async function processImagesWithLimitedConcurrency(files: formidable.File[]): Promise<{
  results: OCRResult[];
  errors: OCRError[];
  totalProcessingTimeMs: number;
}> {
  const startTime = Date.now();
  const results: OCRResult[] = [];
  const errors: OCRError[] = [];
  
  // Procesar archivos en lotes para limitar la concurrencia
  for (let i = 0; i < files.length; i += MAX_CONCURRENT_PROCESSES) {
    const batch = files.slice(i, i + MAX_CONCURRENT_PROCESSES);
    const batchPromises = batch.map(file => 
      processImage(file)
        .then(result => results.push(result))
        .catch(error => {
          errors.push({
            filename: file.originalFilename || 'unknown',
            error: error.message || 'Error desconocido durante el procesamiento OCR'
          });
        })
    );
    
    // Esperar a que se complete el lote actual antes de continuar
    await Promise.all(batchPromises);
  }
  
  return {
    results,
    errors,
    totalProcessingTimeMs: Date.now() - startTime
  };
}

export const POST: APIRoute = async ({ request }) => {
  const startTime = Date.now();
  console.log(`[OCR API] Recibida solicitud a las ${new Date().toISOString()}`);
  
  try {
    // Crear directorio temporal si no existe de forma asíncrona
    const tmpDir = path.join(process.cwd(), 'tmp');
    await fs.promises.mkdir(tmpDir, { recursive: true }).catch(() => {});
    
    // Obtener FormData del request
    const formData = await request.formData();
    const imageFiles: formidable.File[] = [];
    
    // Procesar archivos del FormData
    for (const [key, value] of formData.entries()) {
      if (key === 'images' && value instanceof File) {
        // Validar tipo de archivo
        if (!ALLOWED_MIME_TYPES.includes(value.type)) {
          console.log(`[OCR API] Archivo rechazado por tipo MIME: ${value.type}`);
          continue;
        }
        
        // Validar tamaño
        if (value.size > MAX_FILE_SIZE) {
          console.log(`[OCR API] Archivo rechazado por tamaño: ${value.size} bytes`);
          continue;
        }
        
        // Crear archivo temporal
        const fileExtension = path.extname(value.name) || '.jpg';
        const tempFileName = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}${fileExtension}`;
        const tempFilePath = path.join(tmpDir, tempFileName);
        
        // Escribir archivo al disco de forma asíncrona
        const arrayBuffer = await value.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        await fs.promises.writeFile(tempFilePath, buffer);
        
        // Crear objeto File compatible con formidable
        const fileObj: formidable.File = {
          filepath: tempFilePath,
          originalFilename: value.name,
          newFilename: tempFileName,
          mimetype: value.type,
          size: value.size,
          hashAlgorithm: false,
          hash: null
        };
        
        imageFiles.push(fileObj);
      }
    }
    
    // Verificar si se recibieron archivos
    if (!imageFiles || imageFiles.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No se encontraron imágenes válidas en la solicitud',
          allowedTypes: ALLOWED_MIME_TYPES
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    console.log(`[OCR API] Procesando ${imageFiles.length} imágenes`);
    
    // Procesar las imágenes
    const { results, errors, totalProcessingTimeMs } = await processImagesWithLimitedConcurrency(imageFiles);
    
    // Registrar métricas para desarrollo
    console.log(`[OCR API] Procesamiento completado en ${totalProcessingTimeMs}ms`);
    console.log(`[OCR API] Resultados exitosos: ${results.length}, Errores: ${errors.length}`);
    
    // Devolver respuesta
    return new Response(
      JSON.stringify({ results, errors, totalProcessingTimeMs }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error: any) {
    console.error(`[OCR API] Error: ${error.message}`);
    
    // Devolver error
    return new Response(
      JSON.stringify({ error: 'Error al procesar la solicitud', details: error.message }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
