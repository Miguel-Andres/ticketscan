import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface ImageData {
  id: string;
  url: string;
  name: string;
}

interface ImageModalContextType {
  isOpen: boolean;
  currentImage: ImageData | null;
  images: ImageData[];
  openModal: (image: ImageData, allImages: ImageData[]) => void;
  closeModal: () => void;
  goToPrevious: () => void;
  goToNext: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
}

const ImageModalContext = createContext<ImageModalContextType | undefined>(undefined);

interface ImageModalProviderProps {
  children: ReactNode;
}

export const ImageModalProvider: React.FC<ImageModalProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState<ImageData | null>(null);
  const [images, setImages] = useState<ImageData[]>([]);

  const openModal = (image: ImageData, allImages: ImageData[]) => {
    setCurrentImage(image);
    setImages(allImages);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setCurrentImage(null);
    setImages([]);
  };

  const getCurrentIndex = () => {
    if (!currentImage) return -1;
    return images.findIndex(img => img.id === currentImage.id);
  };

  const goToPrevious = () => {
    const currentIndex = getCurrentIndex();
    if (currentIndex > 0) {
      setCurrentImage(images[currentIndex - 1]);
    }
  };

  const goToNext = () => {
    const currentIndex = getCurrentIndex();
    if (currentIndex < images.length - 1) {
      setCurrentImage(images[currentIndex + 1]);
    }
  };

  const currentIndex = getCurrentIndex();
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < images.length - 1;

  const value: ImageModalContextType = {
    isOpen,
    currentImage,
    images,
    openModal,
    closeModal,
    goToPrevious,
    goToNext,
    hasPrevious,
    hasNext,
  };

  return (
    <ImageModalContext.Provider value={value}>
      {children}
    </ImageModalContext.Provider>
  );
};

export const useImageModal = (): ImageModalContextType => {
  const context = useContext(ImageModalContext);
  if (context === undefined) {
    throw new Error('useImageModal must be used within an ImageModalProvider');
  }
  return context;
};
