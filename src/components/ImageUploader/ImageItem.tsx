import React, { useState } from 'react';
import type { UploadedImage } from '../../types/imageUploader';
import { useImageModal } from './ImageModalContext';

interface ImageItemProps {
  image: UploadedImage;
  removeImage: (id: string) => void;
  retryOCR?: (id: string, options?: 'basic' | 'advanced') => void;
  allImages?: UploadedImage[];
}

const ImageItem: React.FC<ImageItemProps> = ({ image, removeImage, retryOCR, allImages = [] }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { openModal } = useImageModal();
  
  // Determinar si el texto es lo suficientemente largo para necesitar expansión
  const isTextLong = image.result?.text && image.result.text.length > 100;
  
  // Manejar click en la miniatura para abrir modal
  const handleImageClick = () => {
    if (image.preview) {
      const imageData = {
        id: image.id,
        url: image.preview,
        name: image.file.name
      };
      
      const allImageData = allImages
        .filter(img => img.preview) // Solo imágenes con preview
        .map(img => ({
          id: img.id,
          url: img.preview!,
          name: img.file.name
        }));
      
      openModal(imageData, allImageData);
    }
  };
  return (
    <div className="card p-4 flex items-start gap-4">
      {/* Vista previa */}
      <div className="flex-shrink-0">
        {image.preview ? (
          <img
            src={image.preview}
            alt={image.file.name}
            className="w-16 h-16 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleImageClick}
            title="Click para ver imagen completa"
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
          {image.status === 'retrying' && (
            <div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 mb-2">
                Reintentando OCR...
              </span>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-orange-600 h-2 rounded-full transition-all duration-300 animate-pulse"
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
            <div className="flex justify-between items-start mb-2">
              <h5 className="font-medium text-green-800">
                Texto extraído (Confianza: {(image.result.confidence * 100).toFixed(1)}%)
                {image.result.confidenceImprovement && image.result.confidenceImprovement > 0 && (
                  <span className="ml-2 text-xs text-blue-600">
                    (+{image.result.confidenceImprovement.toFixed(1)}% mejora)
                  </span>
                )}
              </h5>
              <div className="flex gap-2">
                {retryOCR && image.status === 'completed' && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => retryOCR(image.id, 'basic')}
                      className="text-blue-600 hover:text-blue-800 p-1 flex items-center text-xs"
                      title="Reintentar OCR con configuración básica"
                    >
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                      </svg>
                      Reintentar
                    </button>
                    <button
                      onClick={() => retryOCR(image.id, 'advanced')}
                      className="text-purple-600 hover:text-purple-800 p-1 flex items-center text-xs"
                      title="Reintentar OCR con configuración avanzada"
                    >
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM15 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4z" />
                      </svg>
                      Avanzado
                    </button>
                  </div>
                )}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(image.result?.text || '');
                    alert('Texto copiado al portapapeles');
                  }}
                  className="text-green-700 hover:text-green-900 p-1 flex items-center text-xs"
                  title="Copiar al portapapeles"
                >
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                  </svg>
                  Copiar
                </button>
              </div>
            </div>
            <div className="relative">
              <p className="text-sm text-green-700 whitespace-pre-wrap overflow-hidden transition-all duration-300"
                 style={{ maxHeight: isExpanded ? '1000px' : '80px' }}>
                {image.result.text || 'No se detectó texto en la imagen'}
              </p>
              
              {isTextLong && (
                <button 
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-blue-600 hover:text-blue-800 text-xs font-medium mt-1 flex items-center"
                >
                  {isExpanded ? (
                    <>
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                      </svg>
                      Contraer
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      Expandir
                    </>
                  )}
                </button>
              )}
            </div>
            <p className="text-xs text-green-600 mt-2">
              Procesado en {image.result.processingTimeMs}ms
            </p>
          </div>
        )}

        {/* Error */}
        {image.error && (
          <div className="mt-3 p-3 bg-red-50 rounded border border-red-200">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error al procesar la imagen</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{image.error}</p>
                </div>
                <div className="mt-3">
                  <button
                    onClick={() => removeImage(image.id)}
                    className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Eliminar imagen
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageItem;
