/**
 * Script para ejecutar la prueba de post-procesamiento OCR
 */
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener el directorio actual en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Ejecutando prueba de post-procesamiento OCR...');

// Ejecutar el script TypeScript con ts-node-esm (compatible con ES modules)
const testScript = path.join('src', 'lib', 'ocr', 'tests', 'testPostProcessing.ts');
const command = `npx ts-node-esm ${testScript}`;

const child = exec(command);

// Mostrar salida en tiempo real
child.stdout.on('data', (data) => {
  console.log(data.toString());
});

child.stderr.on('data', (data) => {
  console.error(data.toString());
});

child.on('exit', (code) => {
  console.log(`Prueba finalizada con código: ${code}`);
});
