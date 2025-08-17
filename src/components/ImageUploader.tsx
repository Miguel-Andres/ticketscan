import React, { useRef } from 'react';
import DropZone from './ImageUploader/DropZone';
import ActionButtons from './ImageUploader/ActionButtons';
import ImageList from './ImageUploader/ImageList';
import useImageUpload from './ImageUploader/hooks/useImageUpload';
import useOcrProcessing from './ImageUploader/hooks/useOcrProcessing';

const ImageUploader: React.FC = () => {
  const {
    images,
    isDragOver,
    isProcessing,
    setIsDragOver,
    setIsProcessing,
    handleDrop,
    handleFileSelect,
    removeImage,
    clearAll,
    setImages
  } = useImageUpload();

  const { processImages, hasPendingImages } = useOcrProcessing({
    images,
    setImages,
    setIsProcessing
  });

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Columna izquierda: Uploader y acciones */}
        <div className="space-y-6">
          {/* Área de drag & drop */}
          <DropZone
            isDragOver={isDragOver}
            setIsDragOver={setIsDragOver}
            handleDrop={handleDrop}
            handleFileSelect={handleFileSelect}
          />

          {/* Acciones rápidas */}
          <ActionButtons
            imagesCount={images.length}
            isProcessing={isProcessing}
            hasPendingImages={hasPendingImages}
            processImages={processImages}
            clearAll={clearAll}
          />
        </div>

        {/* Columna derecha: Lista de imágenes y resultados */}
        <ImageList
          images={images}
          removeImage={removeImage}
        />
      </div>
    </div>
  );
};

export default ImageUploader;
