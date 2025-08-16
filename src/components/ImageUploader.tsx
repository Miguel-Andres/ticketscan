import React, { useState, useRef, useCallback } from 'react';

// Tipos de archivo permitidos (sincronizado con backend)
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp',
  'image/tiff'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Estados posibles para cada imagen
type ImageStatus = 'pending' | 'processing' | 'completed' | 'error';

// Interfaz para cada imagen cargada
interface UploadedImage {
  id: string;
  file: File;
  preview?: string;
  status: ImageStatus;
  progress: number;
  result?: {
    text: string;
    confidence: number;
    processingTimeMs: number;
  };
  error?: string;
}

// Interfaz para respuesta del servidor
interface OCRResult {
  filename: string;
  text: string;
  confidence: number;
  processingTimeMs: number;
}

interface OCRError {
  filename: string;
  error: string;
}

interface OCRResponse {
  results: OCRResult[];
  errors: OCRError[];
  totalProcessingTimeMs: number;
}

const ImageUploader: React.FC = () => {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    
    for (let i = 0; i < fileList.length; i++) {
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
        // Crear vista previa para archivos válidos
        const preview = await createPreview(file);
        newImages.push({
          id: generateId(),
          file,
          preview,
          status: 'pending',
          progress: 0
        });
      }
    }
    
    setImages(prev => [...prev, ...newImages]);
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
  }, [images]);

  // Limpiar todas las imágenes
  const clearAll = useCallback(() => {
    setImages([]);
  }, []);

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Columna izquierda: Uploader y acciones */}
        <div className="space-y-6">
          {/* Área de drag & drop */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              isDragOver 
                ? 'border-primary-500 bg-primary-50' 
                : 'border-gray-300 hover:border-gray-400 bg-white'
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center">
              <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Arrastra imágenes aquí o haz clic para seleccionar
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Formatos soportados: JPG, PNG, WebP, TIFF (máx. 10MB cada una)
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-primary"
              >
                Seleccionar archivos
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ALLOWED_MIME_TYPES.join(',')}
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>

          {/* Acciones rápidas */}
          <div className="card flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{images.length} archivo(s) cargado(s)</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={processImages}
                disabled={isProcessing || images.filter(img => img.status === 'pending').length === 0}
                className="btn btn-primary disabled:opacity-50"
              >
                {isProcessing ? 'Procesando...' : 'Procesar con OCR'}
              </button>
              <button
                onClick={clearAll}
                className="btn btn-secondary"
              >
                Limpiar todo
              </button>
            </div>
          </div>
        </div>

        {/* Columna derecha: Lista de imágenes y resultados */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Imágenes cargadas ({images.length})</h3>
          {images.length === 0 ? (
            <div className="card text-center text-gray-500">
              Aún no has cargado imágenes.
            </div>
          ) : (
            <div className="grid gap-4">
              {images.map((image) => (
                <div key={image.id} className="card p-4 flex items-start gap-4">
                  {/* Vista previa */}
                  <div className="flex-shrink-0">
                    {image.preview ? (
                      <img
                        src={image.preview}
                        alt={image.file.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Información de la imagen */}
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium truncate">{image.file.name}</h4>
                      <button
                        onClick={() => removeImage(image.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>

                    <p className="text-sm text-gray-500 mb-2">
                      {(image.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>

                    {/* Estado y progreso */}
                    <div className="mb-2">
                      {image.status === 'pending' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Pendiente
                        </span>
                      )}
                      {image.status === 'processing' && (
                        <div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-2">
                            Procesando...
                          </span>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${image.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                      {image.status === 'completed' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Completado
                        </span>
                      )}
                      {image.status === 'error' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Error
                        </span>
                      )}
                    </div>

                    {/* Resultado del OCR */}
                    {image.result && (
                      <div className="mt-3 p-3 bg-green-50 rounded border">
                        <h5 className="font-medium text-green-800 mb-2">
                          Texto extraído (Confianza: {(image.result.confidence * 100).toFixed(1)}%)
                        </h5>
                        <p className="text-sm text-green-700 whitespace-pre-wrap">
                          {image.result.text || 'No se detectó texto en la imagen'}
                        </p>
                        <p className="text-xs text-green-600 mt-2">
                          Procesado en {image.result.processingTimeMs}ms
                        </p>
                      </div>
                    )}

                    {/* Error */}
                    {image.error && (
                      <div className="mt-3 p-3 bg-red-50 rounded border">
                        <p className="text-sm text-red-700">{image.error}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageUploader;
