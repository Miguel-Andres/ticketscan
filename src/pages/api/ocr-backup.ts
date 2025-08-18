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
const MAX_FILES_PER_REQUEST = 50; // Límite de archivos por solicitud
const REQUEST_TIMEOUT_MS = 300000; // 5 minutos de timeout para toda la solicitud

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


// Función para preprocesar una imagen antes del OCR
async function preprocessImage(imageBuffer: Buffer): Promise<Buffer> {
  try {
    // Importamos Canvas de forma dinámica para evitar problemas si no está instalado
    // Si no está disponible, simplemente devolvemos el buffer original
    let Canvas;
    try {
      Canvas = require('canvas');
    } catch (e) {
      console.log('[OCR API] Módulo canvas no disponible, omitiendo preprocesamiento de imagen');
      return imageBuffer;
    }
    
    // Crear imagen desde buffer
    const img = new Canvas.Image();
    img.src = imageBuffer;
    
    // Crear canvas con dimensiones de la imagen
    const canvas = Canvas.createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    
    // Dibujar imagen en canvas
    ctx.drawImage(img, 0, 0);
    
    // Obtener datos de imagen
    const imageData = ctx.getImageData(0, 0, img.width, img.height);
    const data = imageData.data;
    
    // Convertir a escala de grises y aumentar contraste
    for (let i = 0; i < data.length; i += 4) {
      // Convertir a escala de grises usando luminosidad percibida
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      
      // Aumentar contraste (umbral adaptativo simple)
      // Valores por encima de 160 se vuelven más blancos, por debajo más negros
      const threshold = 160;
      const contrastValue = gray > threshold ? 255 : 0;
      
      // Aplicar a todos los canales
      data[i] = contrastValue;     // R
      data[i + 1] = contrastValue; // G
      data[i + 2] = contrastValue; // B
      // Mantener canal alfa (transparencia)
    }
    
    // Aplicar datos modificados al canvas
    ctx.putImageData(imageData, 0, 0);
    
    // Convertir canvas a buffer PNG
    const processedBuffer = canvas.toBuffer('image/png');
    
    console.log('[OCR API] Preprocesamiento de imagen completado');
    return processedBuffer;
  } catch (error) {
    console.error('[OCR API] Error en preprocesamiento de imagen:', error);
    // En caso de error, devolver la imagen original
    return imageBuffer;
  }
}

// Función para procesar una imagen con Tesseract
async function processImage(file: formidable.File): Promise<OCRResult> {
  const startTime = Date.now();
  let worker: any = null;
  let imageBuffer: Buffer | null = null;
  
  try {
    // Leer el archivo en un buffer para evitar bloqueos de archivo
    imageBuffer = await fs.promises.readFile(file.filepath);
    
    // Preprocesar la imagen para mejorar resultados OCR
    imageBuffer = await preprocessImage(imageBuffer);
    
    // Obtener un worker del pool o crear uno nuevo
    worker = await getWorker();
    
    // Configurar parámetros para mejorar reconocimiento de etiquetas de envío
    await worker.setParameters({
      // PSM 3: Asume texto totalmente segmentado (mejor para etiquetas con secciones distintas)
      // Referencia: https://tesseract-ocr.github.io/tessdoc/ImproveQuality#page-segmentation-method
      tessedit_pageseg_mode: '3',
      
      // Mejorar precisión para texto impreso en etiquetas de envío
      // Incluir caracteres especiales comunes en direcciones y referencias
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,;:-_#\/()[]{}@&%$"\'\u00c1\u00c9\u00cd\u00d3\u00da\u00dc\u00d1\u00e1\u00e9\u00ed\u00f3\u00fa\u00fc\u00f1 ',
      
      // Optimizaciones para reconocimiento de texto
      tessjs_create_hocr: '0',       // Desactivar generación HOCR para mejorar rendimiento
      tessjs_create_tsv: '0',        // Desactivar generación TSV para mejorar rendimiento
      
      // Configuraciones para mejorar precisión
      tessedit_do_invert: '0',       // No invertir imagen (asumimos texto oscuro sobre fondo claro)
      textord_heavy_nr: '1',         // Mejorar detección de ruido
      textord_min_linesize: '2.0',   // Reducir tamaño mínimo de línea para detectar texto más pequeño
      
      // Configuraciones para números y caracteres especiales en etiquetas
      classify_bln_numeric_mode: '1', // Mejorar reconocimiento de números
      tessedit_ocr_engine_mode: '3', // Usar LSTM (3) para mejor precisión
      
      // Configuraciones específicas para direcciones y códigos postales
      load_system_dawg: '1',         // Cargar diccionario del sistema
      load_freq_dawg: '1',           // Cargar diccionario de frecuencias
      load_number_dawg: '1',         // Mejorar reconocimiento de números
      
      // Configuraciones adicionales para etiquetas de envío
      tessedit_write_images: '0',    // No escribir imágenes de depuración
      language_model_penalty_non_dict_word: '0.5', // Reducir aún más la penalización para palabras fuera del diccionario
      language_model_penalty_non_freq_dict_word: '0.05', // Reducir penalización para palabras poco frecuentes
      textord_force_make_prop_words: '0', // No forzar palabras proporcionales (mejor para códigos y números)
      tessedit_preserve_min_wd_len: '1', // Preservar palabras muy cortas (CP, ID, etc.)
      
      // Configuraciones específicas para números de envío y venta (IDs largos)
      edges_max_children_per_outline: '50', // Aumentar para manejar caracteres complejos
      edges_children_count_limit: '4', // Reducir límite para mejor detección de caracteres
      edges_min_nonhole: '10', // Reducir para mejorar detección de caracteres con agujeros (6, 8, 9, etc.)
      
      // Configuraciones adicionales para mejorar reconocimiento de texto con problemas
      tessedit_fix_fuzzy_spaces: '1',      // Mejorar detección de espacios borrosos
      tessedit_enable_dict_correction: '1', // Habilitar corrección basada en diccionario
      segment_penalty_dict_nonword: '0.5',  // Reducir penalización para palabras fuera del diccionario
      segment_penalty_garbage: '1.0',       // Aumentar penalización para basura
      stopper_nondict_certainty_base: '-2.5', // Ser más permisivo con palabras fuera del diccionario
      chop_enable: '1',                    // Habilitar fragmentación de caracteres pegados
      use_new_state_cost: '1',             // Usar nuevo costo de estado para mejorar reconocimiento
      segment_segcost_rating: '0.1',       // Reducir costo de segmentación para mejorar reconocimiento
      language_model_ngram_on: '1',        // Habilitar modelo de lenguaje n-gram
      textord_noise_sizelimit: '0.2',      // Reducir límite de tamaño de ruido
    });
    
    // Reconocer texto en la imagen usando el buffer en memoria
    const { data } = await worker.recognize(imageBuffer);
    
    const processingTimeMs = Date.now() - startTime;
    console.log(`[OCR API] Procesamiento completado para ${file.originalFilename} en ${processingTimeMs}ms`);
    
    return {
      filename: file.originalFilename || 'unknown',
      text: data.text,
      confidence: data.confidence / 100, // Normalizar a 0-1
      processingTimeMs
    };
  } catch (error) {
    console.error(`[OCR API] Error al procesar ${file.originalFilename}:`, error);
    throw new Error(`Error al procesar imagen: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  } finally {
    // Liberar recursos del worker
    if (worker) {
      try {
        await releaseWorker(worker);
      } catch (err) {
        console.error(`[OCR API] Error al liberar worker:`, err);
      }
    }
    
    // Liberar buffer de memoria
    if (imageBuffer) {
      imageBuffer = null;
    }
    
    // Forzar recolección de basura si hay muchas imágenes
    if (global.gc && Math.random() < 0.2) { // 20% de probabilidad para no hacerlo en cada imagen
      try {
        global.gc();
      } catch (e) {
        // Ignorar errores de GC
      }
    }
  }
}

// Clase para manejar procesamiento concurrente con límites
class PromisePool {
  private concurrency: number;
  private processor: (item: any) => Promise<any>;
  private queue: any[];
  private activePromises: Promise<any>[];
  private results: any[];

  constructor(processor: (item: any) => Promise<any>, concurrency: number) {
    this.processor = processor;
    this.concurrency = concurrency;
    this.queue = [];
    this.activePromises = [];
    this.results = [];
  }

  async start(items: any[]): Promise<any[]> {
    this.queue = [...items];
    this.results = [];
    this.activePromises = [];

    // Iniciar procesamiento inicial
    while (this.activePromises.length < this.concurrency && this.queue.length > 0) {
      this.processNext();
    }

    // Esperar a que todos los items sean procesados
    await Promise.all(this.activePromises);
    return this.results;
  }

  private processNext(): void {
    if (this.queue.length === 0) return;

    const item = this.queue.shift();
    const promise = this.processor(item)
      .then(result => {
        // Guardar resultado
        if (result !== null && result !== undefined) {
          this.results.push(result);
        }
        // Eliminar de promesas activas
        const index = this.activePromises.indexOf(promise);
        if (index !== -1) this.activePromises.splice(index, 1);
        // Procesar siguiente item
        this.processNext();
      })
      .catch(error => {
        console.error('Error en procesamiento:', error);
        // Eliminar de promesas activas incluso en caso de error
        const index = this.activePromises.indexOf(promise);
        if (index !== -1) this.activePromises.splice(index, 1);
        // Procesar siguiente item
        this.processNext();
      });

    this.activePromises.push(promise);
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
  const tempFiles: string[] = []; // Registrar archivos temporales para limpieza
  
  // Registrar archivos temporales
  files.forEach(file => {
    if (file.filepath) {
      tempFiles.push(file.filepath);
    }
  });
  
  try {
    // Crear un pool de promesas con concurrencia limitada
    const pool = new PromisePool(async (file: formidable.File) => {
      try {
        const result = await processImage(file);
        results.push(result);
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        errors.push({
          filename: file.originalFilename || 'unknown',
          error: errorMessage
        });
        return null;
      }
    }, MAX_CONCURRENT_PROCESSES);
    
    // Procesar todas las imágenes
    await pool.start(files);
    
    return {
      results,
      errors,
      totalProcessingTimeMs: Date.now() - startTime
    };
  } finally {
    // Limpiar archivos temporales
    await Promise.allSettled(tempFiles.map(filepath => {
      return fs.promises.unlink(filepath).catch(err => {
        console.error(`[OCR API] Error al eliminar archivo temporal ${filepath}:`, err);
      });
    }));
    
    console.log(`[OCR API] Limpieza de ${tempFiles.length} archivos temporales completada`);
  }
}

export const POST: APIRoute = async ({ request }) => {
  const startTime = Date.now();
  console.log(`[OCR API] Recibida solicitud a las ${new Date().toISOString()}`);
  
  // Configurar timeout global para la solicitud
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
    console.error(`[OCR API] Timeout global de solicitud después de ${REQUEST_TIMEOUT_MS}ms`);
  }, REQUEST_TIMEOUT_MS);
  
  try {
    // Verificar si la solicitud ya fue abortada
    if (controller.signal.aborted) {
      throw new Error('La solicitud fue abortada por timeout');
    }
    // Verificar si el Content-Type es correcto
    const contentType = request.headers.get('Content-Type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return new Response(
        JSON.stringify({ 
          error: 'Content-Type incorrecto. Debe ser multipart/form-data',
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Crear directorio temporal si no existe de forma asíncrona
    const tmpDir = path.join(process.cwd(), 'tmp');
    await fs.promises.mkdir(tmpDir, { recursive: true }).catch(() => {});
    
    // Obtener FormData del request con timeout
    let formData: FormData;
    try {
      const formDataPromise = request.formData();
      const timeoutPromise = new Promise<FormData>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout al procesar FormData')), 30000); // 30 segundos para parsear el FormData
      });
      
      formData = await Promise.race([formDataPromise, timeoutPromise]);
    } catch (error: any) {
      return new Response(
        JSON.stringify({ 
          error: 'Error al procesar FormData', 
          details: error.message || 'Timeout o formato incorrecto'
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
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
    
    // Limitar número de archivos por solicitud
    if (imageFiles.length > MAX_FILES_PER_REQUEST) {
      // Eliminar archivos excedentes
      for (let i = MAX_FILES_PER_REQUEST; i < imageFiles.length; i++) {
        await fs.promises.unlink(imageFiles[i].filepath).catch(() => {});
      }
      
      // Truncar el array
      imageFiles.length = MAX_FILES_PER_REQUEST;
      
      console.log(`[OCR API] Solicitud truncada a ${MAX_FILES_PER_REQUEST} imágenes`);
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
        status: error.name === 'AbortError' ? 408 : 500, // 408 Request Timeout si fue abortada
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } finally {
    // Limpiar el timeout
    clearTimeout(timeoutId);
    
    // Limpiar pool de workers si la aplicación está terminando
    if (process.env.NODE_ENV === 'development' && Math.random() < 0.1) {
      try {
        // Ocasionalmente limpiar todos los workers para evitar fugas de memoria en desarrollo
        await Promise.allSettled(workerPool.map(worker => worker.terminate()));
        workerPool = [];
        console.log('[OCR API] Pool de workers limpiado');
      } catch (e) {
        console.error('[OCR API] Error al limpiar pool de workers:', e);
      }
    }
  }
};
