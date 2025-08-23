import { useState } from 'react';
import type { UploadedImage, OCRImageResult } from '../../../types/imageUploader';
import type { OCRRetryParams } from '../../../lib/ocr/types';
import { generateShippingLabelROIs } from '../../../lib/ocr/utils/imageProcessor';

/**
 * Hook para manejar el reintento de OCR con configuraciones avanzadas
 */
export const useOcrRetry = (
  images: UploadedImage[],
  setImages: React.Dispatch<React.SetStateAction<UploadedImage[]>>
) => {
  const [retryingImages, setRetryingImages] = useState<Set<string>>(new Set());

  /**
   * Reintentar OCR para una imagen específica
   */
  const retryOCR = async (imageId: string, mode: 'basic' | 'advanced' = 'basic') => {
    const image = images.find(img => img.id === imageId);
    if (!image || retryingImages.has(imageId)) {
      return;
    }

    // Marcar imagen como en proceso de reintento
    setRetryingImages(prev => new Set(prev).add(imageId));
    setImages(prev => prev.map(img => 
      img.id === imageId 
        ? { ...img, status: 'retrying', progress: 0 }
        : img
    ));

    try {
      // Configurar parámetros según el modo
      const retryParams: OCRRetryParams = getRetryParams(mode, image);

      // Crear FormData para enviar al endpoint
      const formData = new FormData();
      formData.append('image', image.file);
      formData.append('params', JSON.stringify(retryParams));

      // Simular progreso
      const progressInterval = setInterval(() => {
        setImages(prev => prev.map(img => 
          img.id === imageId 
            ? { ...img, progress: Math.min(img.progress + 10, 90) }
            : img
        ));
      }, 200);

      // Llamar al endpoint de reintento
      const response = await fetch('/api/ocr/retry', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      // Procesar resultado del reintento
      const retryResult: OCRImageResult = {
        text: result.text,
        confidence: result.confidence,
        processingTimeMs: result.processingTimeMs,
        fieldResults: result.fieldResults,
        sources: result.sources,
        confidenceImprovement: result.confidenceImprovement
      };

      // Actualizar imagen con resultado del reintento
      setImages(prev => prev.map(img => {
        if (img.id === imageId) {
          // Si hay mejora en la confianza, usar el resultado del reintento
          const useRetryResult = !img.result || 
            retryResult.confidence > img.result.confidence ||
            (retryResult.confidenceImprovement && retryResult.confidenceImprovement > 0);

          return {
            ...img,
            status: 'completed',
            progress: 100,
            result: useRetryResult ? retryResult : img.result,
            retryResult: retryResult,
            isRetryMode: true
          };
        }
        return img;
      }));

    } catch (error) {
      console.error('Error al reintentar OCR:', error);
      
      // Marcar como error
      setImages(prev => prev.map(img => 
        img.id === imageId 
          ? { 
              ...img, 
              status: 'error', 
              progress: 0,
              error: error instanceof Error ? error.message : 'Error desconocido al reintentar OCR'
            }
          : img
      ));
    } finally {
      // Remover de la lista de imágenes en reintento
      setRetryingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(imageId);
        return newSet;
      });
    }
  };

  return {
    retryOCR,
    retryingImages
  };
};

/**
 * Obtiene los parámetros de reintento según el modo seleccionado
 */
function getRetryParams(mode: 'basic' | 'advanced', image: UploadedImage): OCRRetryParams {
  if (mode === 'basic') {
    // Configuración básica: solo preprocesamiento mejorado
    return {
      preprocessing: {
        deskew: true,
        adaptiveThreshold: true,
        upscale: 1.5,
        normalizeContrast: true
      },
      tesseractParams: {
        psm: 6, // Bloque uniforme de texto (configuración balanceada)
        oem: 1  // LSTM only
      }
    };
  } else {
    // Configuración avanzada: preprocesamiento completo + ROIs
    const params: OCRRetryParams = {
      preprocessing: {
        deskew: true,
        adaptiveThreshold: true,
        upscale: 2.0,
        despeckle: true,
        sharpen: true,
        normalizeContrast: true
      },
      tesseractParams: {
        psm: 6, // Bloque uniforme de texto
        oem: 1  // LSTM only
      }
    };

    // Si podemos determinar las dimensiones de la imagen, agregar ROIs
    if (image.preview) {
      // Para el modo avanzado, intentamos usar ROIs predefinidas
      // En una implementación real, obtendríamos las dimensiones de la imagen
      // Por ahora, usamos dimensiones típicas de etiquetas de envío
      try {
        const regions = generateShippingLabelROIs(800, 600); // Dimensiones típicas
        params.regions = regions;
      } catch (error) {
        console.warn('No se pudieron generar ROIs automáticamente:', error);
      }
    }

    return params;
  }
}
