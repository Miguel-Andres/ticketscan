/**
 * Script para QA y métricas de rendimiento OCR
 * Procesa todas las imágenes en test-images/ y genera un reporte de métricas
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
const projectRoot = path.resolve(__dirname, '..');
const testImagesDir = path.join(projectRoot, 'test-images');
const resultsDir = path.join(projectRoot, 'qa-results');

// Configuraciones de Tesseract para pruebas
const tesseractConfigs = {
  default: {
    lang: 'spa',
    oem: 1, // LSTM only
    psm: 3, // Texto totalmente segmentado
  },
  optimized: {
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
  }
};

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

// Función para extraer campos específicos de etiquetas
function extractShippingFields(text) {
  const fields = {
    numeroEnvio: null,
    numeroPaquete: null,
    destinatario: null,
    direccion: null,
    codigoPostal: null,
    localidad: null,
    fechaEntrega: null,
    tipoEnvio: null,
    referencias: null
  };
  
  // Número de envío (formato XXXXXXX-XXXX)
  const envioMatch = text.match(/(?:(?:envio|envío|numero|número)(?:\s+de)?(?:\s+envio|envío)?:?\s*)(\d{7}-\d{4})/i);
  if (envioMatch) fields.numeroEnvio = envioMatch[1];
  
  // Número de paquete (formato 20000XXXXXXXXXXX)
  const paqueteMatch = text.match(/(?:(?:paquete|numero|número)(?:\s+de)?(?:\s+paquete)?:?\s*)(20000\d{13})/i);
  if (paqueteMatch) fields.numeroPaquete = paqueteMatch[1];
  
  // Código postal (formato CP: XXXX)
  const cpMatch = text.match(/(?:(?:cp|c\.p\.|codigo postal|código postal):?\s*)(\d{4})/i);
  if (cpMatch) fields.codigoPostal = cpMatch[1];
  
  // Fecha de entrega (formato DD-Mes)
  const fechaMatch = text.match(/(?:(?:fecha|fecha de entrega):?\s*)(\d{1,2}[-\s]+(?:ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic))/i);
  if (fechaMatch) fields.fechaEntrega = fechaMatch[1];
  
  // Tipo de envío (RESIDENCIAL/COMERCIAL)
  const tipoMatch = text.match(/(?:(?:tipo|tipo de envio|tipo de envío):?\s*)(residencial|comercial)/i);
  if (tipoMatch) fields.tipoEnvio = tipoMatch[1].toUpperCase();
  
  return fields;
}

// Función para procesar una imagen con diferentes configuraciones
async function processImage(imagePath, configs) {
  const results = {};
  const filename = path.basename(imagePath);
  
  console.log(`\nProcesando imagen: ${filename}`);
  
  for (const [configName, config] of Object.entries(configs)) {
    console.log(`- Configuración: ${configName}`);
    
    const worker = await createWorker('spa');
    await worker.setParameters(config);
    
    const startTime = Date.now();
    const { data } = await worker.recognize(imagePath);
    const processingTime = Date.now() - startTime;
    
    // Aplicar post-procesamiento
    const processedText = processOCRText(data.text);
    
    // Extraer campos estructurados
    const fields = extractShippingFields(processedText);
    
    // Contar campos extraídos correctamente
    const extractedFieldsCount = Object.values(fields).filter(Boolean).length;
    
    results[configName] = {
      rawText: data.text,
      processedText,
      confidence: data.confidence,
      processingTimeMs: processingTime,
      extractedFields: fields,
      extractedFieldsCount,
      originalLines: data.text.split('\n').length,
      processedLines: processedText.split('\n').length
    };
    
    await worker.terminate();
  }
  
  return results;
}

// Función para guardar resultados
async function saveResults(results, filename) {
  try {
    await fs.mkdir(resultsDir, { recursive: true });
    await fs.writeFile(
      path.join(resultsDir, `${filename}.json`),
      JSON.stringify(results, null, 2)
    );
  } catch (error) {
    console.error(`Error al guardar resultados para ${filename}:`, error);
  }
}

// Función principal
async function main() {
  console.log('=== QA Y MÉTRICAS DE RENDIMIENTO OCR ===');
  console.log(`Directorio de imágenes: ${testImagesDir}`);
  console.log(`Directorio de resultados: ${resultsDir}`);
  
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
    
    console.log(`\nEncontradas ${imageFiles.length} imágenes para pruebas`);
    
    // Resultados globales
    const globalResults = {
      totalImages: imageFiles.length,
      configurations: Object.keys(tesseractConfigs),
      metrics: {},
      startTime: new Date().toISOString(),
      endTime: null,
      totalDurationMs: 0,
      results: {}
    };
    
    // Inicializar métricas por configuración
    for (const config of Object.keys(tesseractConfigs)) {
      globalResults.metrics[config] = {
        avgConfidence: 0,
        avgProcessingTimeMs: 0,
        avgExtractedFields: 0,
        totalExtractedFields: 0,
        avgLineReduction: 0
      };
    }
    
    const startTime = Date.now();
    
    // Procesar cada imagen
    for (const imageFile of imageFiles) {
      const imagePath = path.join(testImagesDir, imageFile);
      const results = await processImage(imagePath, tesseractConfigs);
      
      // Guardar resultados individuales
      await saveResults(results, imageFile.replace(/\.[^/.]+$/, ''));
      
      // Actualizar resultados globales
      globalResults.results[imageFile] = results;
      
      // Actualizar métricas
      for (const [config, result] of Object.entries(results)) {
        globalResults.metrics[config].avgConfidence += result.confidence;
        globalResults.metrics[config].avgProcessingTimeMs += result.processingTimeMs;
        globalResults.metrics[config].totalExtractedFields += result.extractedFieldsCount;
        globalResults.metrics[config].avgExtractedFields += result.extractedFieldsCount;
        globalResults.metrics[config].avgLineReduction += (result.originalLines - result.processedLines);
      }
    }
    
    // Calcular promedios
    for (const config of Object.keys(tesseractConfigs)) {
      const metrics = globalResults.metrics[config];
      metrics.avgConfidence /= imageFiles.length;
      metrics.avgProcessingTimeMs /= imageFiles.length;
      metrics.avgExtractedFields /= imageFiles.length;
      metrics.avgLineReduction /= imageFiles.length;
    }
    
    // Finalizar resultados globales
    globalResults.endTime = new Date().toISOString();
    globalResults.totalDurationMs = Date.now() - startTime;
    
    // Guardar resultados globales
    await saveResults(globalResults, 'global-metrics');
    
    // Mostrar resumen
    console.log('\n=== RESUMEN DE MÉTRICAS ===');
    console.log(`Total de imágenes procesadas: ${imageFiles.length}`);
    console.log(`Tiempo total de procesamiento: ${globalResults.totalDurationMs}ms`);
    
    for (const [config, metrics] of Object.entries(globalResults.metrics)) {
      console.log(`\nConfiguración: ${config}`);
      console.log(`- Confianza promedio: ${metrics.avgConfidence.toFixed(1)}%`);
      console.log(`- Tiempo promedio: ${metrics.avgProcessingTimeMs.toFixed(0)}ms`);
      console.log(`- Campos extraídos: ${metrics.totalExtractedFields} (promedio: ${metrics.avgExtractedFields.toFixed(1)})`);
      console.log(`- Reducción de líneas promedio: ${metrics.avgLineReduction.toFixed(1)}`);
    }
    
    console.log('\nResultados guardados en:', resultsDir);
    console.log('\nPrueba completada ✓');
  } catch (error) {
    console.error('Error durante la prueba:', error);
  }
}

// Ejecutar la prueba
main().catch(console.error);
