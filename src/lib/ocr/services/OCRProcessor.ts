import * as fs from 'fs/promises';
import type { OCRResult, ProcessedFile, OCRProcessingResult } from '../types';
import { WorkerPool } from './WorkerPool';
import { preprocessImage } from '../utils/imageProcessing';
import { getTesseractRuntimeParams } from '../config/tesseract';
import { CONFIG } from '../config/constants';

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
      imageBuffer = await preprocessImage(imageBuffer);
      
      worker = await this.workerPool.getWorker();
      await worker.setParameters(getTesseractRuntimeParams());
      
      const { data } = await worker.recognize(imageBuffer);
      
      return {
        filename: file.originalFilename || 'unknown',
        text: data.text,
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
   * Procesa múltiples imágenes con concurrencia limitada
   */
  async processImagesBatch(files: ProcessedFile[]): Promise<OCRProcessingResult> {
    const startTime = Date.now();
    const results: OCRResult[] = [];
    const errors: { filename: string; error: string }[] = [];
    
    // Procesar archivos en lotes con concurrencia limitada
    const processFile = async (file: ProcessedFile) => {
      try {
        const result = await this.processImage(file);
        results.push(result);
      } catch (error) {
        errors.push({
          filename: file.originalFilename,
          error: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    };

    // Crear lotes para procesamiento concurrente
    const batches = [];
    for (let i = 0; i < files.length; i += CONFIG.MAX_CONCURRENT_PROCESSES) {
      const batch = files.slice(i, i + CONFIG.MAX_CONCURRENT_PROCESSES);
      batches.push(Promise.all(batch.map(processFile)));
    }
    
    await Promise.all(batches);
    
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
