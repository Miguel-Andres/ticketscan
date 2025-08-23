/**
 * Test simple del post-procesamiento de texto OCR
 */
// Función simple de post-procesamiento (copiada del módulo original)
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

// Texto de ejemplo típico de OCR con problemas
const textoOCRSucio = `
Envio Flex

Numero de envio: 1234567-8901

Destinatario:
Juan
Perez

Direccion:
Av. Corrientes
1234
CABA

CP: 1043

Fecha de entrega: 15-Dic

Tipo: RESIDENCIAL


Referencias: Timbre 2B
`;

console.log('=== TEST SIMPLE POST-PROCESAMIENTO OCR ===\n');

console.log('TEXTO ORIGINAL:');
console.log('-------------------------------------------');
console.log(textoOCRSucio);

console.log('\nTEXTO POST-PROCESADO:');
console.log('-------------------------------------------');
const textoLimpio = processOCRText(textoOCRSucio);
console.log(textoLimpio);

console.log('\n=== COMPARACIÓN ===');
const lineasOriginales = textoOCRSucio.split('\n').length;
const lineasLimpias = textoLimpio.split('\n').length;
console.log(`Líneas reducidas: ${lineasOriginales} → ${lineasLimpias} (${lineasOriginales - lineasLimpias} menos)`);

console.log('\nTest completado ✓');
