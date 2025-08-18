import { createWorker } from 'tesseract.js';
import { CONFIG } from '../config/constants';
import { getTesseractInitParams } from '../config/tesseract';

/**
 * Administra un pool de workers de Tesseract para optimizar recursos
 */
export class WorkerPool {
  private pool: any[] = [];
  private readonly maxSize = 2;

  /**
   * Obtiene un worker del pool o crea uno nuevo
   */
  async getWorker() {
    if (this.pool.length > 0) {
      return this.pool.pop();
    }
    
    // Crear worker con configuración optimizada para Tesseract.js v5
    // @ts-ignore - Ignoramos errores de tipado ya que la documentación y los tipos no coinciden completamente
    const worker = await createWorker(CONFIG.TESSERACT_LANGUAGE);
    
    // Aplicar parámetros de inicialización optimizados
    await worker.setParameters(getTesseractInitParams());
    
    return worker;
  }

  /**
   * Devuelve un worker al pool o lo termina si el pool está lleno
   */
  async releaseWorker(worker: any) {
    if (this.pool.length < this.maxSize) {
      this.pool.push(worker);
    } else {
      await worker.terminate();
    }
  }

  /**
   * Limpia todos los workers del pool
   */
  async cleanup() {
    await Promise.allSettled(this.pool.map(worker => worker.terminate()));
    this.pool = [];
  }
}
