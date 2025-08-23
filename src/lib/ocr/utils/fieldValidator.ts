/**
 * Validador de campos consolidado y simplificado
 * Reemplaza fieldValidators.ts y patternMatcher.ts
 */

/**
 * Patrones básicos para validación
 */
const PATTERNS = {
  SHIPMENT_ID: /(\d{7})-?(\d{4})/,
  PACK_ID: /(20000\d{11})/,
  POSTAL_CODE: /(\d{4})/,
  DELIVERY_DATE: /(\d{1,2})[-\s]?(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)/i,
  SHIPPING_TYPE: /(residencial|comercial)/i
};

/**
 * Correcciones básicas de OCR
 */
const OCR_FIXES: Record<string, string> = {
  'O': '0', 'o': '0', 'I': '1', 'l': '1', 'S': '5', 'B': '8', 'g': '9'
};

/**
 * Resultado de validación
 */
export interface ValidationResult {
  isValid: boolean;
  corrected: string;
  confidence: number;
}

/**
 * Aplica correcciones básicas de OCR
 */
function fixOCRErrors(text: string): string {
  let fixed = text.trim();
  for (const [error, fix] of Object.entries(OCR_FIXES)) {
    fixed = fixed.replace(new RegExp(error, 'g'), fix);
  }
  return fixed;
}

/**
 * Valida número de envío
 */
export function validateShipmentId(text: string): ValidationResult {
  const cleaned = fixOCRErrors(text);
  const match = cleaned.match(PATTERNS.SHIPMENT_ID);
  
  if (match) {
    return {
      isValid: true,
      corrected: `${match[1]}-${match[2]}`,
      confidence: 0.9
    };
  }
  
  return { isValid: false, corrected: cleaned, confidence: 0.2 };
}

/**
 * Valida número de paquete
 */
export function validatePackId(text: string): ValidationResult {
  const cleaned = fixOCRErrors(text);
  const match = cleaned.match(PATTERNS.PACK_ID);
  
  if (match) {
    return {
      isValid: true,
      corrected: match[1],
      confidence: 0.9
    };
  }
  
  return { isValid: false, corrected: cleaned, confidence: 0.2 };
}

/**
 * Valida código postal
 */
export function validatePostalCode(text: string): ValidationResult {
  const cleaned = fixOCRErrors(text);
  const digits = cleaned.replace(/\D/g, '');
  
  if (digits.length === 4) {
    return {
      isValid: true,
      corrected: digits,
      confidence: 0.9
    };
  }
  
  return { isValid: false, corrected: cleaned, confidence: 0.2 };
}

/**
 * Valida fecha de entrega
 */
export function validateDeliveryDate(text: string): ValidationResult {
  const cleaned = text.trim().toLowerCase();
  const match = cleaned.match(PATTERNS.DELIVERY_DATE);
  
  if (match) {
    const day = match[1].padStart(2, '0');
    return {
      isValid: true,
      corrected: `${day}-${match[2]}`,
      confidence: 0.8
    };
  }
  
  return { isValid: false, corrected: cleaned, confidence: 0.2 };
}

/**
 * Valida tipo de envío
 */
export function validateShippingType(text: string): ValidationResult {
  const cleaned = text.trim().toUpperCase();
  
  if (cleaned.includes('RESID')) {
    return { isValid: true, corrected: 'RESIDENCIAL', confidence: 0.8 };
  }
  
  if (cleaned.includes('COMER')) {
    return { isValid: true, corrected: 'COMERCIAL', confidence: 0.8 };
  }
  
  return { isValid: false, corrected: cleaned, confidence: 0.2 };
}

/**
 * Valida cualquier campo según su tipo
 */
export function validateField(text: string, fieldType: string): ValidationResult {
  const type = fieldType.toLowerCase();
  
  if (type.includes('shipment') || type.includes('envio')) {
    return validateShipmentId(text);
  }
  
  if (type.includes('pack') || type.includes('paquete')) {
    return validatePackId(text);
  }
  
  if (type.includes('postal') || type.includes('cp')) {
    return validatePostalCode(text);
  }
  
  if (type.includes('date') || type.includes('fecha')) {
    return validateDeliveryDate(text);
  }
  
  if (type.includes('type') || type.includes('tipo')) {
    return validateShippingType(text);
  }
  
  // Campo genérico - solo limpieza básica
  return {
    isValid: true,
    corrected: fixOCRErrors(text),
    confidence: 0.7
  };
}
