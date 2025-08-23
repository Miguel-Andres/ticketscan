import * as fs from 'fs/promises';
import type { OCRResult, ProcessedFile, OCRProcessingResult, OCRRetryParams, TesseractParams, RegionOfInterest } from '../types';
import { WorkerPool } from './WorkerPool';
import { preprocessImage, extractROI } from '../utils/imageProcessor';
import { getTesseractRuntimeParams, getTesseractInitParams } from '../config/tesseract';
import { CONFIG } from '../config/constants';
import { processOCRText } from '../utils/textProcessor';
import { validateField } from '../utils/fieldValidator';

/**
 * Servicio principal para procesamiento OCR
 */
export class OCRProcessor {
  private workerPool: WorkerPool;
  
  constructor() {
    this.workerPool = new WorkerPool();
  }
  
  /**
   * Procesa una imagen individual con OCR
   */
  async processImage(file: ProcessedFile): Promise<OCRResult> {
    const startTime = Date.now();
    let worker: any = null;
    
    try {
      let imageBuffer = await fs.readFile(file.filepath);
      // Aplicar preprocesamiento mejorado por defecto
      imageBuffer = await preprocessImage(imageBuffer, {
        grayscale: true,
        contrast: true,
        upscale: 1.5
      });
      
      worker = await this.workerPool.getWorker();
      
      const { data } = await worker.recognize(imageBuffer);
      
      // Aplicar post-procesamiento de texto
      const processedText = processOCRText(data.text);
      
      return {
        filename: file.originalFilename || 'unknown',
        text: processedText,
        rawText: data.text, // Guardar texto original para comparación
        confidence: data.confidence / 100,
        processingTimeMs: Date.now() - startTime
      };
    } catch (error) {
      throw new Error(`Error procesando ${file.originalFilename}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      if (worker) {
        await this.workerPool.releaseWorker(worker);
      }
    }
  }

  /**
   * Procesa una imagen con parámetros personalizados para reintento OCR
   * @param file Archivo a procesar
   * @param params Parámetros de reintento OCR
   */
  async processRetry(file: ProcessedFile, params: OCRRetryParams): Promise<OCRResult> {
    const startTime = Date.now();
    let worker: any = null;
    
    try {
      // Leer imagen original
      let imageBuffer = await fs.readFile(file.filepath);
      
      // Aplicar preprocesamiento avanzado si se especifica
      if (params.preprocessing) {
        imageBuffer = await preprocessImage(imageBuffer, params.preprocessing);
      } else {
        // Aplicar preprocesamiento mejorado por defecto
        imageBuffer = await preprocessImage(imageBuffer, {
          grayscale: true,
          contrast: true,
          upscale: 1.5
        });
      }
      
      // Deshabilitar procesamiento por regiones para evitar duplicación
      // El OCR avanzado ahora solo procesa la imagen completa
      // if (params.regions && params.regions.length > 0) {
      //   return await this.processImageWithROIs(file, imageBuffer, params);
      // }
      
      // Procesar imagen completa con parámetros personalizados
      worker = await this.workerPool.getWorker();
      
      // Configurar parámetros de Tesseract
      const tesseractParams = {
        ...getTesseractRuntimeParams(),
        ...params.tesseractParams
      };
      
      // El idioma español ya está configurado por defecto en el worker
      // Configurar modo LSTM si se solicita
      if (params.tesseractParams?.oem === 1) {
        (tesseractParams as any).tessedit_ocr_engine_mode = '1'; // LSTM only
      }
      
      // Eliminado setParameters para evitar errores de configuración
      
      // Reconocer texto
      const { data } = await worker.recognize(imageBuffer);
      
      // Aplicar post-procesamiento de texto
      const processedText = processOCRText(data.text);
      
      return {
        filename: file.originalFilename || 'unknown',
        text: processedText,
        rawText: data.text, // Guardar texto original para comparación
        confidence: data.confidence / 100,
        processingTimeMs: Date.now() - startTime
      };
    } catch (error) {
      throw new Error(`Error en reintento OCR para ${file.originalFilename}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      if (worker) {
        await this.workerPool.releaseWorker(worker);
      }
    }
  }
  
  /**
   * Procesa una imagen por regiones de interés (ROIs)
   * @param file Archivo a procesar
   * @param imageBuffer Buffer de la imagen
   * @param params Parámetros de reintento OCR
   */
  private async processImageWithROIs(file: ProcessedFile, imageBuffer: Buffer, params: OCRRetryParams): Promise<OCRResult> {
    const startTime = Date.now();
    const fieldResults = [];
    let totalConfidence = 0;
    
    // Procesar cada región por separado
    for (const region of params.regions || []) {
      let worker: any = null;
      try {
        // Extraer ROI individual
        const roiBuffer = await extractROI(imageBuffer, region.boundingBox);
        
        worker = await this.workerPool.getWorker();
        
        // Configurar parámetros específicos para esta región
        const tesseractParams = {
          ...getTesseractRuntimeParams(),
          ...params.tesseractParams,
          ...region.tesseractParams
        };
        
        // Aplicar configuraciones específicas según el tipo de campo
        this.applyFieldSpecificParams(region.name, tesseractParams as Record<string, any>);
        
        // El idioma español ya está configurado por defecto en el worker
        // Configurar modo LSTM si se solicita
        if ((params.tesseractParams?.oem === 1) || (region.tesseractParams?.oem === 1)) {
          (tesseractParams as any).tessedit_ocr_engine_mode = '1'; // LSTM only
        }
        
        // Eliminado setParameters para evitar errores de configuración
        
        // Reconocer texto en esta región
        const { data } = await worker.recognize(roiBuffer);
        
        // Aplicar post-procesamiento y validación específica para el tipo de campo
        let processedText = data.text.trim();
        let fieldConfidence = data.confidence / 100;
        
        // Validar y corregir el campo si es posible
        const validationResult = validateField(processedText, region.name);
        if (validationResult.isValid) {
          processedText = validationResult.corrected;
          // Ajustar confianza basado en la validación
          fieldConfidence = (fieldConfidence + validationResult.confidence) / 2;
        }
        
        // Guardar resultado de esta región
        fieldResults.push({
          fieldName: region.name,
          text: processedText,
          rawText: data.text.trim(), // Guardar texto original
          confidence: fieldConfidence,
          boundingBox: region.boundingBox
        });
        
        totalConfidence += fieldConfidence;
      } finally {
        if (worker) {
          await this.workerPool.releaseWorker(worker);
        }
      }
    }
    
    // Calcular confianza promedio
    const avgConfidence = fieldResults.length > 0 ? totalConfidence / fieldResults.length : 0;
    
    // Combinar texto de todas las regiones y aplicar post-procesamiento
    let combinedText = fieldResults
      .map(field => `${field.fieldName}: ${field.text}`)
      .join('\n');
    
    // Aplicar post-procesamiento final al texto combinado
    combinedText = processOCRText(combinedText);
    
    return {
      filename: file.originalFilename || 'unknown',
      text: combinedText,
      rawText: fieldResults.map(field => `${field.fieldName}: ${field.rawText}`).join('\n'), // Texto original
      confidence: avgConfidence,
      processingTimeMs: Date.now() - startTime,
      fieldResults
    };
  }
  
  /**
   * Aplica parámetros específicos según el tipo de campo
   * @param fieldName Nombre del campo
   * @param params Parámetros de Tesseract a modificar
   */
  private applyFieldSpecificParams(fieldName: string, params: Record<string, any>): void {
    const fieldNameLower = fieldName.toLowerCase();
    
    // Configuración para IDs y códigos postales
    if (fieldNameLower.includes('id') || 
        fieldNameLower.includes('code') || 
        fieldNameLower.includes('postal') || 
        fieldNameLower.includes('cp')) {
      // PSM 7: Línea de texto como una sola palabra
      params.tessedit_pageseg_mode = '7';
      // Modo numérico para mejor reconocimiento de dígitos
      params.classify_bln_numeric_mode = '1';
      // Whitelist específico para códigos (alfanuméricos y guiones)
      params.tessedit_char_whitelist = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-';
    }
    // Configuración para direcciones
    else if (fieldNameLower.includes('address') || 
             fieldNameLower.includes('direccion') || 
             fieldNameLower.includes('dirección')) {
      // PSM 6: Bloque uniforme de texto
      params.tessedit_pageseg_mode = '6';
      // Whitelist para direcciones (incluye caracteres especiales)
      params.tessedit_char_whitelist = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,;:-_#\/()[]{}@&%$\'\"ñ ';
    }
    // Configuración para texto disperso o general
    else {
      // PSM 3: Texto totalmente segmentado
      params.tessedit_pageseg_mode = '3';
    }
  }
  
  /**
   * Procesa un lote de imágenes con OCR
   * @param files Archivos a procesar
   */
  async processBatch(files: ProcessedFile[]): Promise<OCRProcessingResult> {
    const startTime = Date.now();
    const results: OCRResult[] = [];
    const errors: { filename: string; error: string }[] = [];
    
    // Procesar imágenes en paralelo con un límite de concurrencia
    const concurrencyLimit = CONFIG.MAX_CONCURRENT_PROCESSES;
    const batches = [];
    
    // Dividir archivos en lotes según límite de concurrencia
    for (let i = 0; i < files.length; i += concurrencyLimit) {
      batches.push(files.slice(i, i + concurrencyLimit));
    }
    
    // Procesar cada lote en secuencia, pero las imágenes dentro de cada lote en paralelo
    for (const batch of batches) {
      const batchPromises = batch.map(file => 
        this.processImage(file)
          .then(result => {
            // Asegurarse de que el post-procesamiento se ha aplicado
            if (!result.rawText) {
              result.rawText = result.text;
              result.text = processOCRText(result.text);
            }
            results.push(result);
          })
          .catch(error => {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            errors.push({
              filename: file.originalFilename || 'unknown',
              error: errorMessage
            });
          })
      );
      
      // Esperar a que se complete el lote actual antes de continuar con el siguiente
      await Promise.all(batchPromises);
    }
    
    return {
      results,
      errors,
      totalProcessingTimeMs: Date.now() - startTime
    };
  }
  
  /**
   * Limpia recursos del pool de workers
   */
  async cleanup() {
    await this.workerPool.cleanup();
  }
}
