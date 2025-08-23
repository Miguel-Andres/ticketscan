import React from 'react';
import type { UploadedImage } from '../../types/imageUploader';
import ImageItem from './ImageItem';
import { MAX_FILES } from '../../utils/constants';

interface ImageListProps {
  images: UploadedImage[];
  removeImage: (id: string) => void;
  retryOCR?: (id: string, options?: 'basic' | 'advanced') => void;
}

const ImageList: React.FC<ImageListProps> = ({ images, removeImage, retryOCR }) => {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Imágenes cargadas ({images.length}/{MAX_FILES})</h3>
      {images.length === 0 ? (
        <div className="card text-center text-gray-500">
          Aún no has cargado imágenes.
        </div>
      ) : (
        <div className="grid gap-4">
          {images.map((image) => (
            <ImageItem 
              key={image.id} 
              image={image} 
              removeImage={removeImage}
              retryOCR={retryOCR}
              allImages={images}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageList;
