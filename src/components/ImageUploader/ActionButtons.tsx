import React from 'react';

interface ActionButtonsProps {
  imagesCount: number;
  isProcessing: boolean;
  hasPendingImages: boolean;
  processImages: () => void;
  clearAll: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  imagesCount,
  isProcessing,
  hasPendingImages,
  processImages,
  clearAll
}) => {
  return (
    <div className="card flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600">{imagesCount} archivo(s) cargado(s)</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={processImages}
          disabled={isProcessing || !hasPendingImages}
          className="btn btn-primary disabled:opacity-50"
        >
          {isProcessing ? 'Procesando...' : 'Procesar '}
        </button>
        <button
          onClick={clearAll}
          className="btn btn-secondary"
        >
          Limpiar todo
        </button>
      </div>
    </div>
  );
};

export default ActionButtons;
