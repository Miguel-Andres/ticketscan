/**
 * Utilidades para procesamiento de imágenes
 */

/**
 * Preprocesa una imagen para mejorar resultados OCR en etiquetas de envío
 * Aplica múltiples técnicas de mejora de imagen para optimizar el reconocimiento
 */
export async function preprocessImage(imageBuffer: Buffer): Promise<Buffer> {
  try {
    // Importación dinámica para compatibilidad con ESM
    const Canvas = await import('canvas').then(m => m.default || m);
    const img = new Canvas.Image();
    img.src = imageBuffer;
    
    // Crear canvas con dimensiones originales
    const canvas = Canvas.createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    
    // Paso 1: Dibujar imagen original
    ctx.drawImage(img, 0, 0);
    
    // Paso 2: Obtener datos de la imagen
    const imageData = ctx.getImageData(0, 0, img.width, img.height);
    const data = imageData.data;
    const width = img.width;
    const height = img.height;
    
    // Paso 3: Aumentar contraste y convertir a escala de grises
    const grayscaleData = new Uint8ClampedArray(data.length);
    
    // Calcular valores mínimo y máximo para normalizar contraste
    let min = 255;
    let max = 0;
    
    // Primera pasada: convertir a escala de grises y encontrar min/max
    for (let i = 0; i < data.length; i += 4) {
      // Convertir a escala de grises con ponderación de luminosidad
      const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      grayscaleData[i] = grayscaleData[i + 1] = grayscaleData[i + 2] = gray;
      grayscaleData[i + 3] = data[i + 3]; // Mantener canal alfa
      
      if (gray < min) min = gray;
      if (gray > max) max = gray;
    }
    
    // Calcular rango para normalizar
    const range = max - min;
    const threshold = min + (range * 0.5); // Umbral adaptativo basado en el rango
    
    // Segunda pasada: aplicar normalización y umbral adaptativo local
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        // Calcular umbral local basado en píxeles vecinos (5x5)
        let localSum = 0;
        let count = 0;
        
        for (let ny = Math.max(0, y - 2); ny <= Math.min(height - 1, y + 2); ny++) {
          for (let nx = Math.max(0, x - 2); nx <= Math.min(width - 1, x + 2); nx++) {
            const nidx = (ny * width + nx) * 4;
            localSum += grayscaleData[nidx];
            count++;
          }
        }
        
        // Umbral adaptativo local con ajuste para etiquetas de envío
        const localAvg = localSum / count;
        const localThreshold = localAvg * 0.95; // Ajuste para favorecer texto oscuro sobre fondo claro
        
        // Aplicar umbral y aumentar contraste
        const gray = grayscaleData[idx];
        const value = gray < localThreshold ? 0 : 255;
        
        data[idx] = data[idx + 1] = data[idx + 2] = value;
      }
    }
    
    // Paso 4: Aplicar los cambios al canvas
    ctx.putImageData(imageData, 0, 0);
    
    // Paso 5: Devolver la imagen procesada como buffer PNG
    return canvas.toBuffer('image/png');
  } catch (error) {
    console.log('[OCR] Error en preprocesamiento de imagen:', error);
    // Si falla el procesamiento, devolver la imagen original
    return imageBuffer;
  }
}
