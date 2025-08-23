/**
 * Configuración optimizada de Tesseract para etiquetas de envío
 */

/**
 * Parámetros básicos de Tesseract sin configuraciones problemáticas
 * Simplificado para evitar errores de inicialización
 */
export const getTesseractInitParams = () => ({
  // Solo parámetros básicos que no causan conflictos
});

/**
 * Parámetros básicos de runtime para Tesseract
 * Configuración mínima para evitar errores
 */
export const getTesseractRuntimeParams = () => ({
  // Solo parámetros básicos y seguros
  tessedit_pageseg_mode: '3'
});
