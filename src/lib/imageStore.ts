// src/lib/imageStore.ts
// Store para manejar el almacenamiento temporal de imágenes seleccionadas

export interface ImageData {
  id: string;
  file: File;
  previewUrl: string;
  ocrResult?: any;
  processed: boolean;
}

class ImageStore {
  private images: Map<string, ImageData> = new Map();
  
  // Añadir una imagen al store
  addImage(file: File): string {
    const id = this.generateId();
    const previewUrl = URL.createObjectURL(file);
    
    this.images.set(id, {
      id,
      file,
      previewUrl,
      processed: false
    });
    
    return id;
  }
  
  // Eliminar una imagen del store
  removeImage(id: string): boolean {
    const imageData = this.images.get(id);
    if (imageData) {
      URL.revokeObjectURL(imageData.previewUrl);
      return this.images.delete(id);
    }
    return false;
  }
  
  // Obtener todas las imágenes
  getAllImages(): ImageData[] {
    return Array.from(this.images.values());
  }
  
  // Obtener una imagen por ID
  getImage(id: string): ImageData | undefined {
    return this.images.get(id);
  }
  
  // Marcar una imagen como procesada
  markAsProcessed(id: string, ocrResult: any): void {
    const imageData = this.images.get(id);
    if (imageData) {
      imageData.ocrResult = ocrResult;
      imageData.processed = true;
    }
  }
  
  // Limpiar todas las imágenes
  clearAll(): void {
    for (const imageData of this.images.values()) {
      URL.revokeObjectURL(imageData.previewUrl);
    }
    this.images.clear();
  }
  
  // Generar ID único para cada imagen
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }
}

// Exportar una instancia única del store
export const imageStore = new ImageStore();
