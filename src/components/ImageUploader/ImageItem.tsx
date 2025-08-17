import React from 'react';
import type { UploadedImage } from '../../types/imageUploader';

interface ImageItemProps {
  image: UploadedImage;
  removeImage: (id: string) => void;
}

const ImageItem: React.FC<ImageItemProps> = ({ image, removeImage }) => {
  return (
    <div className="card p-4 flex items-start gap-4">
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
  );
};

export default ImageItem;
