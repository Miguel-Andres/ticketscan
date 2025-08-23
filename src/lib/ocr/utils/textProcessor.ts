/**
 * Procesador de texto simplificado para OCR
 * Consolida post-procesamiento, normalización y fusión de resultados
 */

/**
 * Normaliza texto OCR básico
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  
  return text
    .trim()
    .replace(/\s+/g, ' ')                    // Múltiples espacios → uno
    .replace(/\n{3,}/g, '\n\n')              // Múltiples saltos → dos
    .replace(/([0-9])\n([0-9])/g, '$1$2')    // Unir números separados
    .replace(/([A-Za-z])\n([A-Za-z])/g, '$1 $2'); // Unir palabras separadas
}

/**
 * Corrige términos mal escritos en español (sin acentos)
 */
export function fixSpanishTerms(text: string): string {
  const corrections: Record<string, string> = {
    'envio': 'envío',
    'numero': 'número',
    'direccion': 'dirección',
    'codigo': 'código',
    'telefono': 'teléfono'
  };
  
  let result = text;
  for (const [incorrect, correct] of Object.entries(corrections)) {
    result = result.replace(new RegExp(`\\b${incorrect}\\b`, 'gi'), correct);
  }
  
  return result;
}

/**
 * Mejora formato de campos específicos
 */
export function improveFieldFormat(text: string): string {
  return text
    .replace(/(\d{7})[\s-]*(\d{4})/g, '$1-$2')                    // Número envío
    .replace(/\b(CP|C\.P\.)[\s:-]*(\d{4})/gi, 'CP: $2')          // Código postal
    .replace(/(\d{1,2})[-\s]*(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)/gi, '$1-$2'); // Fecha
}

/**
 * Procesa texto OCR completo
 */
export function processOCRText(text: string): string {
  if (!text) return '';
  
  const normalized = normalizeText(text);
  const corrected = fixSpanishTerms(normalized);
  const formatted = improveFieldFormat(corrected);
  
  return formatted;
}

/**
 * Compara dos resultados OCR y selecciona el mejor
 */
export function selectBestResult(
  result1: { text: string; confidence: number },
  result2: { text: string; confidence: number }
): { text: string; confidence: number; source: 'first' | 'second' } {
  
  // Si uno está vacío, usar el otro
  if (!result1.text.trim()) return { ...result2, source: 'second' };
  if (!result2.text.trim()) return { ...result1, source: 'first' };
  
  // Usar el de mayor confianza
  if (result1.confidence >= result2.confidence) {
    return { ...result1, source: 'first' };
  } else {
    return { ...result2, source: 'second' };
  }
}
