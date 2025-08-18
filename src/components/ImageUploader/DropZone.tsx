import React, { useRef } from 'react';
import { ALLOWED_MIME_TYPES } from '../../utils/constants';

interface DropZoneProps {
  isDragOver: boolean;
  setIsDragOver: (isDragOver: boolean) => void;
  handleDrop: (e: React.DragEvent) => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const DropZone: React.FC<DropZoneProps> = ({
  isDragOver,
  setIsDragOver,
  handleDrop,
  handleFileSelect
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
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
        <p className="text-sm font-medium text-primary-600 mb-4">
          Puedes seleccionar hasta 50 imágenes a la vez
        </p>
        <button
          type="button"
          onClick={() => {
            // Asegurar que el input está limpio antes de abrirlo
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
              fileInputRef.current.click();
            }
          }}
          className="btn btn-primary"
        >
          Seleccionar múltiples archivos (hasta 50)
        </button>
        <p className="text-xs text-gray-400 mt-2">
          💡 Mantén presionado Ctrl (Windows) o Cmd (Mac) para seleccionar múltiples archivos
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp,image/tiff,.jpg,.jpeg,.png,.webp,.tiff"
          onChange={handleFileSelect}
          onClick={(e) => {
            // Asegurar que el evento click se propaga correctamente
            e.stopPropagation();
          }}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default DropZone;
