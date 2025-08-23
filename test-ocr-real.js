/**
 * Test simple de OCR con imágenes reales
 * Este script procesa imágenes reales de test-images y muestra el texto extraído
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

// Compatibilidad con ESM y CommonJS
const require = createRequire(import.meta.url);
const { createWorker } = require('tesseract.js');

// Obtener el directorio actual en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Función simple de post-procesamiento
function processOCRText(text) {
  if (!text || typeof text !== 'string') return '';
  
  let processed = text;
  
  // 1. Normalizar espacios en blanco
  processed = processed.replace(/\s+/g, ' ').trim();
  
  // 2. Reducir saltos de línea excesivos
  processed = processed.replace(/\n\s*\n\s*\n+/g, '\n\n');
  processed = processed.replace(/\n\s*\n/g, '\n');
  
  // 3. Traducir etiquetas comunes del inglés al español
  const translations = {
    'Shipping Number': 'Número de envío',
    'Package Number': 'Número de paquete',
    'Recipient': 'Destinatario',
    'Address': 'Dirección',
    'Postal Code': 'Código postal',
    'Delivery Date': 'Fecha de entrega',
    'Reference': 'Referencia',
    'RESIDENTIAL': 'RESIDENCIAL',
    'COMMERCIAL': 'COMERCIAL'
  };
  
  for (const [english, spanish] of Object.entries(translations)) {
    const regex = new RegExp(english, 'gi');
    processed = processed.replace(regex, spanish);
  }
  
  return processed;
}

// Configuración de Tesseract optimizada para etiquetas
const tesseractConfig = {
  lang: 'spa',
  oem: 1, // LSTM only
  psm: 3, // Texto totalmente segmentado
  tessedit_char_blacklist: '|~`',
  tessedit_pageseg_mode: '3',
  tessedit_do_invert: '0',
  load_system_dawg: '1',
  load_freq_dawg: '1',
  user_words_suffix: 'user-words',
  user_patterns_suffix: 'user-patterns',
  tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789áéíóúÁÉÍÓÚüÜñÑ.,;:-_#\\/()[]{}@&%$\'"°',
  language_model_penalty_non_dict_word: '0.8', // Reducir penalización para palabras fuera del diccionario
  language_model_penalty_non_freq_dict_word: '0.1'
};

async function processImage(imagePath) {
  console.log(`\nProcesando imagen: ${path.basename(imagePath)}`);
  
  const worker = await createWorker('spa');
  await worker.setParameters(tesseractConfig);
  
  const startTime = Date.now();
  const { data } = await worker.recognize(imagePath);
  const processingTime = Date.now() - startTime;
  
  // Aplicar post-procesamiento
  const processedText = processOCRText(data.text);
  
  console.log('\nTexto original (sin post-procesamiento):');
  console.log('-------------------------------------------');
  console.log(data.text);
  
  console.log('\nTexto post-procesado:');
  console.log('-------------------------------------------');
  console.log(processedText);
  
  console.log('\nEstadísticas:');
  console.log(`- Confianza: ${data.confidence.toFixed(1)}%`);
  console.log(`- Tiempo de procesamiento: ${processingTime}ms`);
  
  // Calcular diferencia en líneas entre original y procesado
  const originalLines = data.text.split('\n').length;
  const processedLines = processedText.split('\n').length;
  console.log(`- Reducción de líneas: ${originalLines} → ${processedLines} (${originalLines - processedLines} menos)`);
  
  await worker.terminate();
  return { original: data.text, processed: processedText };
}

async function main() {
  console.log('=== TEST OCR CON IMÁGENES REALES ===');
  
  // Directorio de imágenes de prueba
  const testImagesDir = path.resolve(__dirname, 'test-images');
  
  try {
    // Verificar que el directorio existe
    await fs.access(testImagesDir);
    
    // Listar archivos de imagen en el directorio
    const files = await fs.readdir(testImagesDir);
    const imageFiles = files.filter(file => 
      ['.jpg', '.jpeg', '.png', '.webp', '.tiff'].some(ext => file.toLowerCase().endsWith(ext))
    );
    
    if (imageFiles.length === 0) {
      console.log('No se encontraron imágenes de prueba en:', testImagesDir);
      return;
    }
    
    console.log(`Encontradas ${imageFiles.length} imágenes para pruebas`);
    
    // Procesar solo la primera imagen para prueba rápida
    const imagePath = path.join(testImagesDir, imageFiles[0]);
    await processImage(imagePath);
    
    console.log('\nPrueba completada ✓');
  } catch (error) {
    console.error('Error durante la prueba:', error);
  }
}

// Ejecutar la prueba
main().catch(console.error);
