import { useCallback } from 'react';
import type { UploadedImage, ImageStatus, OCRResponse } from '../../../types/imageUploader';

interface UseOcrProcessingProps {
  images: UploadedImage[];
  setImages: React.Dispatch<React.SetStateAction<UploadedImage[]>>;
  setIsProcessing: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useOcrProcessing = ({ 
  images, 
  setImages, 
  setIsProcessing 
}: UseOcrProcessingProps) => {
  
  // Procesar imágenes con OCR
  const processImages = useCallback(async () => {
    const pendingImages = images.filter(img => img.status === 'pending');
    if (pendingImages.length === 0) return;

    setIsProcessing(true);

    // Marcar imágenes como procesando
    setImages(prev => prev.map(img => 
      img.status === 'pending' ? { ...img, status: 'processing' as ImageStatus, progress: 10 } : img
    ));

    try {
      // Construir FormData
      const formData = new FormData();
      pendingImages.forEach(img => {
        formData.append('images', img.file);
      });

      // Simular progreso durante la petición
      const progressInterval = setInterval(() => {
        setImages(prev => prev.map(img => 
          img.status === 'processing' && img.progress < 90 
            ? { ...img, progress: Math.min(img.progress + 10, 90) }
            : img
        ));
      }, 500);

      // Hacer petición al backend
      const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
      }

      const data: OCRResponse = await response.json();

      // Mapear resultados a imágenes
      setImages(prev => prev.map(img => {
        if (img.status !== 'processing') return img;

        // Buscar resultado por nombre de archivo
        const result = data.results.find(r => r.filename === img.file.name);
        const error = data.errors.find(e => e.filename === img.file.name);

        if (result) {
          return {
            ...img,
            status: 'completed' as ImageStatus,
            progress: 100,
            result: {
              text: result.text,
              confidence: result.confidence,
              processingTimeMs: result.processingTimeMs
            }
          };
        } else if (error) {
          return {
            ...img,
            status: 'error' as ImageStatus,
            progress: 0,
            error: error.error
          };
        } else {
          return {
            ...img,
            status: 'error' as ImageStatus,
            progress: 0,
            error: 'No se encontró resultado para este archivo'
          };
        }
      }));

    } catch (error) {
      // Marcar todas las imágenes en procesamiento como error
      setImages(prev => prev.map(img => 
        img.status === 'processing' 
          ? { ...img, status: 'error' as ImageStatus, progress: 0, error: (error as Error).message }
          : img
      ));
    } finally {
      setIsProcessing(false);
    }
  }, [images, setImages, setIsProcessing]);

  // Verificar si hay imágenes pendientes
  const hasPendingImages = images.some(img => img.status === 'pending');

  return {
    processImages,
    hasPendingImages
  };
};

export default useOcrProcessing;
