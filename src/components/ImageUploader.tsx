import React, { useRef } from 'react';
import DropZone from './ImageUploader/DropZone';
import ActionButtons from './ImageUploader/ActionButtons';
import ImageList from './ImageUploader/ImageList';
import { ImageModal } from './ImageUploader/ImageModal';
import { ImageModalProvider, useImageModal } from './ImageUploader/ImageModalContext';
import useImageUpload from './ImageUploader/hooks/useImageUpload';
import useOcrProcessing from './ImageUploader/hooks/useOcrProcessing';
import { useOcrRetry } from './ImageUploader/hooks/useOcrRetry';

// Componente interno que usa el contexto del modal
const ImageUploaderContent: React.FC = () => {
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

  const { retryOCR } = useOcrRetry(images, setImages);

  const { isOpen, currentImage, closeModal, goToPrevious, goToNext, hasPrevious, hasNext } = useImageModal();

  return (
    <>
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
            retryOCR={retryOCR}
          />
        </div>
      </div>

      {/* Modal de imagen */}
      <ImageModal
        isOpen={isOpen}
        imageUrl={currentImage?.url || ''}
        imageName={currentImage?.name || ''}
        onClose={closeModal}
        onPrevious={goToPrevious}
        onNext={goToNext}
        hasPrevious={hasPrevious}
        hasNext={hasNext}
      />
    </>
  );
};

// Componente principal con Provider
const ImageUploader: React.FC = () => {
  return (
    <ImageModalProvider>
      <ImageUploaderContent />
    </ImageModalProvider>
  );
};

export default ImageUploader;
