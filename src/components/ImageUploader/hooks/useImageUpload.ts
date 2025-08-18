import { useState, useCallback } from 'react';
import type { UploadedImage, ImageStatus } from '../../../types/imageUploader';
import { MAX_FILE_SIZE, MAX_FILES, ALLOWED_MIME_TYPES } from '../../../utils/constants';

export const useImageUpload = () => {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Generar ID único para cada imagen
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Validar archivo con verificación más detallada
  const validateFile = (file: File): string | null => {
    // Verificar extensión del archivo además del MIME type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'tiff', 'tif'];
    
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return `Tipo de archivo no permitido: ${file.type}. Tipos válidos: jpg, jpeg, png, webp, tiff`;
    }
    
    if (!fileExtension || !validExtensions.includes(fileExtension)) {
      return `Extensión de archivo no permitida: .${fileExtension}. Extensiones válidas: ${validExtensions.join(', ')}`;
    }
    
    // Advertencia por tamaño
    if (file.size > MAX_FILE_SIZE) {
      return `Archivo demasiado grande: ${(file.size / 1024 / 1024).toFixed(2)}MB. Máximo permitido: 10MB`;
    }
    
    // Advertencia por archivos muy pequeños (posiblemente corruptos o vacíos)
    if (file.size < 1024) { // Menos de 1KB
      return `Archivo demasiado pequeño: ${file.size} bytes. Podría estar corrupto o vacío.`;
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

  // Agregar archivos con validación mejorada
  const addFiles = useCallback(async (fileList: FileList) => {
    const newImages: UploadedImage[] = [];
    let warningMessages: string[] = [];
    
    // Usar setImages con función para obtener el estado actual
    setImages(currentImages => {
      // Limitar el número de archivos a procesar
      const totalFilesToProcess = Math.min(fileList.length, MAX_FILES);
      const currentImagesCount = currentImages.length;
      
      // Verificar si excedemos el límite total
      if (currentImagesCount + totalFilesToProcess > MAX_FILES) {
        warningMessages.push(`Solo se pueden cargar hasta ${MAX_FILES} imágenes en total. Se procesarán las primeras ${MAX_FILES - currentImagesCount} de su selección.`);
      }
      
      // Verificar si hay archivos muy grandes (>5MB) para advertir sobre posible lentitud
      const largeFiles = Array.from(fileList).filter(file => file.size > 5 * 1024 * 1024).length;
      if (largeFiles > 0) {
        warningMessages.push(`Se han detectado ${largeFiles} archivos grandes (>5MB). El procesamiento OCR podría ser más lento.`);
      }
      
      // Procesar solo hasta el límite permitido
      const filesToProcess = Math.min(totalFilesToProcess, MAX_FILES - currentImagesCount);
      
      // Verificar tipos de archivos no permitidos
      const invalidFiles = Array.from(fileList).slice(0, filesToProcess).filter(file => {
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'tiff', 'tif'];
        return !validExtensions.includes(fileExtension || '');
      }).length;
      
      if (invalidFiles > 0) {
        warningMessages.push(`Se han detectado ${invalidFiles} archivos con formato no soportado. Solo se procesarán imágenes jpg, jpeg, png, webp y tiff.`);
      }
      
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
    
    // Mostrar advertencias acumuladas después de procesar
    if (warningMessages.length > 0) {
      setTimeout(() => {
        alert(warningMessages.join('\n\n'));
      }, 100);
    }

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
      // Convertir FileList a array y procesarlo directamente
      addFiles(files);
      
      // Registrar en consola para depuración
      console.log(`Archivos seleccionados: ${files.length}`);
      for (let i = 0; i < files.length; i++) {
        console.log(`- ${files[i].name} (${files[i].type}, ${files[i].size} bytes)`);
      }
    }
    
    // Limpiar input para permitir seleccionar los mismos archivos nuevamente
    setTimeout(() => {
      e.target.value = '';
    }, 100);
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
