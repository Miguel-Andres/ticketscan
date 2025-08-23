/**
 * Procesador de imágenes simplificado para OCR
 * Solo usa Tesseract.js sin dependencias externas
 */
import type { BoundingBox, RegionOfInterest, PreprocessingOptions } from '../types';

/**
 * Preprocesa una imagen - versión simplificada
 * Devuelve la imagen original para que Tesseract la procese directamente
 */
export async function preprocessImage(
  imageBuffer: Buffer,
  options: PreprocessingOptions = {}
): Promise<Buffer> {
  // Tesseract.js maneja el preprocesamiento internamente
  return imageBuffer;
}

/**
 * Extrae una región de interés - versión simplificada
 * Devuelve la imagen completa ya que Tesseract puede procesar regiones específicas
 */
export async function extractROI(imageBuffer: Buffer, roi: BoundingBox): Promise<Buffer> {
  // Sin extracción de ROI - Tesseract procesará la imagen completa
  // El problema de duplicación se debe a que todas las regiones devuelven la imagen completa
  // Para solucionarlo necesitamos deshabilitar el procesamiento por regiones
  return imageBuffer;
}

/**
 * Genera regiones de interés predefinidas para etiquetas de envío
 * Versión simplificada de la función original en roiDetector.ts
 */
export function generateShippingLabelROIs(width: number, height: number): RegionOfInterest[] {
  // Calcular proporciones relativas al tamaño de la imagen
  const regions: RegionOfInterest[] = [
    // Región para número de envío (parte superior)
    {
      name: 'shipping_number',
      boundingBox: {
        x: Math.round(width * 0.5),
        y: Math.round(height * 0.1),
        width: Math.round(width * 0.45),
        height: Math.round(height * 0.15)
      }
    },
    // Región para destinatario (nombre)
    {
      name: 'recipient',
      boundingBox: {
        x: Math.round(width * 0.1),
        y: Math.round(height * 0.25),
        width: Math.round(width * 0.8),
        height: Math.round(height * 0.1)
      }
    },
    // Región para dirección
    {
      name: 'address',
      boundingBox: {
        x: Math.round(width * 0.1),
        y: Math.round(height * 0.35),
        width: Math.round(width * 0.8),
        height: Math.round(height * 0.15)
      }
    },
    // Región para código postal
    {
      name: 'postal_code',
      boundingBox: {
        x: Math.round(width * 0.1),
        y: Math.round(height * 0.5),
        width: Math.round(width * 0.3),
        height: Math.round(height * 0.1)
      }
    },
    // Región para localidad
    {
      name: 'locality',
      boundingBox: {
        x: Math.round(width * 0.4),
        y: Math.round(height * 0.5),
        width: Math.round(width * 0.5),
        height: Math.round(height * 0.1)
      }
    },
    // Región para fecha de entrega
    {
      name: 'delivery_date',
      boundingBox: {
        x: Math.round(width * 0.1),
        y: Math.round(height * 0.65),
        width: Math.round(width * 0.4),
        height: Math.round(height * 0.1)
      }
    },
    // Región para tipo de envío
    {
      name: 'shipping_type',
      boundingBox: {
        x: Math.round(width * 0.5),
        y: Math.round(height * 0.65),
        width: Math.round(width * 0.4),
        height: Math.round(height * 0.1)
      }
    }
  ];

  return regions;
}
