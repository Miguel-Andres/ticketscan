import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { CONFIG } from '../config/constants';
import type { ProcessedFile } from '../types';

/**
 * Valida si un archivo es válido según las restricciones configuradas del backend
 */
export function validateServerFile(file: File): boolean {
  // Validar tipo MIME
  const validType = CONFIG.ALLOWED_MIME_TYPES.some(type => 
    file.type.toLowerCase() === type.toLowerCase()
  );
  
  // Validar tamaño
  const validSize = file.size <= CONFIG.MAX_FILE_SIZE;
  
  return validType && validSize;
}

/**
 * Crea un archivo temporal a partir de un objeto File
 */
export async function createTempFile(file: File): Promise<ProcessedFile> {
  // Crear nombre de archivo temporal único
  const tempDir = os.tmpdir();
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
  const fileExt = file.name.split('.').pop() || 'tmp';
  const tempFilePath = path.join(tempDir, `upload-${uniqueSuffix}.${fileExt}`);
  
  // Convertir File a Buffer y guardar en disco
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  await fs.writeFile(tempFilePath, buffer);
  
  return {
    filepath: tempFilePath,
    originalFilename: file.name,
    mimetype: file.type,
    size: file.size
  };
}

/**
 * Limpia archivos temporales
 */
export async function cleanupFiles(files: ProcessedFile[]): Promise<void> {
  const deletePromises = files.map(file => 
    fs.unlink(file.filepath).catch(err => {
      console.error(`Error eliminando archivo temporal ${file.filepath}:`, err);
    })
  );
  
  await Promise.all(deletePromises);
}
