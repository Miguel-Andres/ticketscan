import { useState, useCallback } from 'react';
import type { UploadedImage, ImageStatus } from '../../../types/imageUploader';
import { MAX_FILE_SIZE, MAX_FILES, ALLOWED_MIME_TYPES } from '../../../utils/constants';

export const useImageUpload = () => {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Generar ID único para cada imagen
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Validar archivo
  const validateFile = (file: File): string | null => {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return `Tipo de archivo no permitido: ${file.type}. Tipos válidos: ${ALLOWED_MIME_TYPES.join(', ')}`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `Archivo demasiado grande: ${(file.size / 1024 / 1024).toFixed(2)}MB. Máximo permitido: 10MB`;
    }
    return null;
  };

  // Crear vista previa para imagen
  const createPreview = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
  };

  // Agregar archivos
  const addFiles = useCallback(async (fileList: FileList) => {
    const newImages: UploadedImage[] = [];
    
    // Usar setImages con función para obtener el estado actual
    setImages(currentImages => {
      // Limitar el número de archivos a procesar
      const totalFilesToProcess = Math.min(fileList.length, MAX_FILES);
      const currentImagesCount = currentImages.length;
      
      // Verificar si excedemos el límite total
      if (currentImagesCount + totalFilesToProcess > MAX_FILES) {
        alert(`Solo se pueden cargar hasta ${MAX_FILES} imágenes en total. Se procesarán las primeras ${MAX_FILES - currentImagesCount} de su selección.`);
      }
      
      // Procesar solo hasta el límite permitido
      const filesToProcess = Math.min(totalFilesToProcess, MAX_FILES - currentImagesCount);
      
      // Procesar archivos de forma síncrona para evitar problemas de estado
      for (let i = 0; i < filesToProcess; i++) {
        const file = fileList[i];
        const validationError = validateFile(file);
        
        if (validationError) {
          // Agregar imagen con error de validación
          newImages.push({
            id: generateId(),
            file,
            status: 'error',
            progress: 0,
            error: validationError
          });
        } else {
          // Agregar imagen pendiente (la vista previa se creará después)
          newImages.push({
            id: generateId(),
            file,
            status: 'pending',
            progress: 0
          });
        }
      }
      
      return [...currentImages, ...newImages];
    });

    // Crear vistas previas de forma asíncrona después de agregar las imágenes
    for (let i = 0; i < newImages.length; i++) {
      const imageData = newImages[i];
      if (imageData.status === 'pending') {
        try {
          const preview = await createPreview(imageData.file);
          setImages(prev => prev.map(img => 
            img.id === imageData.id ? { ...img, preview } : img
          ));
        } catch (error) {
          console.error('Error creating preview:', error);
        }
      }
    }
  }, []);

  // Manejar drop de archivos
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      addFiles(files);
    }
  }, [addFiles]);

  // Manejar selección de archivos
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      addFiles(files);
    }
    // Limpiar input para permitir seleccionar los mismos archivos
    e.target.value = '';
  }, [addFiles]);

  // Eliminar imagen
  const removeImage = useCallback((id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  }, []);

  // Limpiar todas las imágenes
  const clearAll = useCallback(() => {
    setImages([]);
  }, []);

  return {
    images,
    isDragOver,
    isProcessing,
    setIsDragOver,
    setIsProcessing,
    addFiles,
    handleDrop,
    handleFileSelect,
    removeImage,
    clearAll,
    setImages
  };
};

export default useImageUpload;
