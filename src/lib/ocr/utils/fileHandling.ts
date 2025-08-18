import * as fs from 'fs/promises';
import * as path from 'path';
import type { ProcessedFile } from '../types';
import { CONFIG } from '../config/constants';

/**
 * Valida si un archivo cumple con los requisitos (tipo y tamaño)
 */
export function validateFile(file: File): boolean {
  return CONFIG.ALLOWED_MIME_TYPES.includes(file.type) && file.size <= CONFIG.MAX_FILE_SIZE;
}

/**
 * Crea un archivo temporal a partir de un objeto File
 */
export async function createTempFile(file: File): Promise<ProcessedFile> {
  const tmpDir = path.join(process.cwd(), 'tmp');
  await fs.mkdir(tmpDir, { recursive: true });
  
  const fileExtension = path.extname(file.name) || '.jpg';
  const tempFileName = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}${fileExtension}`;
  const tempFilePath = path.join(tmpDir, tempFileName);
  
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
 * Limpia archivos temporales después del procesamiento
 */
export async function cleanupFiles(files: ProcessedFile[]) {
  await Promise.allSettled(
    files.map(file => 
      fs.unlink(file.filepath).catch(() => {})
    )
  );
}
