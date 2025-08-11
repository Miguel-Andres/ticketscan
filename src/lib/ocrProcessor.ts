// src/lib/ocrProcessor.ts
// Funciones para procesar imágenes con OCR usando Tesseract.js

import { createWorker } from 'tesseract.js';
import { imageStore, ImageData } from './imageStore';

export interface OCRResult {
  id: string;
  fileName: string;
  client: string;
  saleId: string;
  tracking: string;
  deliveryDate: string;
  postalCode: string;
  locality: string;
  address: string;
  recipient: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
}

class OCRProcessor {
  private worker: any;
  
  constructor() {
    this.initWorker();
  }
  
  // Inicializar el worker de Tesseract
  private async initWorker() {
    this.worker = await createWorker({
      logger: (m) => console.log(m),
    });
    await this.worker.load();
    await this.worker.loadLanguage('eng');
    await this.worker.initialize('eng');
  }
  
  // Procesar una imagen con OCR
  async processImage(imageData: ImageData): Promise<OCRResult> {
    try {
      // Marcar como procesando
      const result: OCRResult = {
        id: imageData.id,
        fileName: imageData.file.name,
        client: '',
        saleId: '',
        tracking: '',
        deliveryDate: '',
        postalCode: '',
        locality: '',
        address: '',
        recipient: '',
        status: 'processing'
      };
      
      // Ejecutar OCR
      const { data: { text } } = await this.worker.recognize(imageData.previewUrl);
      
      // Extraer datos de la etiqueta
      const extractedData = this.extractDataFromText(text);
      
      // Actualizar resultado
      result.client = extractedData.client;
      result.saleId = extractedData.saleId;
      result.tracking = extractedData.tracking;
      result.deliveryDate = extractedData.deliveryDate;
      result.postalCode = extractedData.postalCode;
      result.locality = extractedData.locality;
      result.address = extractedData.address;
      result.recipient = extractedData.recipient;
      result.status = 'completed';
      
      // Marcar imagen como procesada en el store
      imageStore.markAsProcessed(imageData.id, result);
      
      return result;
    } catch (error) {
      console.error('Error procesando imagen:', error);
      
      // Devolver resultado con error
      return {
        id: imageData.id,
        fileName: imageData.file.name,
        client: '',
        saleId: '',
        tracking: '',
        deliveryDate: '',
        postalCode: '',
        locality: '',
        address: '',
        recipient: '',
        status: 'error',
        error: error.message || 'Error desconocido'
      };
    }
  }
  
  // Extraer datos específicos del texto OCR
  private extractDataFromText(text: string): Partial<OCRResult> {
    const data: Partial<OCRResult> = {
      client: '',
      saleId: '',
      tracking: '',
      deliveryDate: '',
      postalCode: '',
      locality: '',
      address: '',
      recipient: ''
    };
    
    // Expresiones regulares para extraer datos basados en la etiqueta real
    const clientRegex = /([^\n]+)\s*#\d+\s*\n/i;  // Captura "Vera Thilina"
    const saleRegex = /Venta:\s*(\d+)/i;  // Captura "2000012020004908"
    const trackingRegex = /Envío:\s*(\d+)/i;  // Captura "45047046810"
    const deliveryDateRegex = /Entrega:\s*([\d\w-\.]+)/i;  // Captura "21-Jun"
    const postalCodeRegex = /CP:\s*(\d+)/i;  // Captura "1894"
    const localityRegex = /CP:\s*\d+\s*\n([^\n]+)/i;  // Captura "LA PLATA NORTE VILLA ELISA"
    const addressRegex = /Direccion:\s*([^\n]+)/i;  // Captura "Calle 8 entre 51 y 52 1830"
    const recipientRegex = /Destinatario:\s*([^\n]+)/i;  // Captura "Nadia Ayelen Lopez (LOPEZAYELEN14)"
    
    // Extraer datos usando regex
    const clientMatch = text.match(clientRegex);
    if (clientMatch) {
      data.client = clientMatch[1].trim();
    }
    
    const saleMatch = text.match(saleRegex);
    if (saleMatch) {
      data.saleId = saleMatch[1].trim();
    }
    
    const trackingMatch = text.match(trackingRegex);
    if (trackingMatch) {
      data.tracking = trackingMatch[1].trim();
    }
    
    const deliveryDateMatch = text.match(deliveryDateRegex);
    if (deliveryDateMatch) {
      data.deliveryDate = deliveryDateMatch[1].trim();
    }
    
    const postalCodeMatch = text.match(postalCodeRegex);
    if (postalCodeMatch) {
      data.postalCode = postalCodeMatch[1].trim();
    }
    
    const localityMatch = text.match(localityRegex);
    if (localityMatch) {
      data.locality = localityMatch[1].trim();
    }
    
    const addressMatch = text.match(addressRegex);
    if (addressMatch) {
      data.address = addressMatch[1].trim();
    }
    
    const recipientMatch = text.match(recipientRegex);
    if (recipientMatch) {
      data.recipient = recipientMatch[1].trim();
    }
    
    return data;
  }
  
  // Procesar múltiples imágenes con OCR
  async processImages(images: ImageData[]): Promise<OCRResult[]> {
    const results: OCRResult[] = [];
    
    // Procesar cada imagen secuencialmente
    for (const imageData of images) {
      const result = await this.processImage(imageData);
      results.push(result);
    }
    
    return results;
  }
  
  // Generar PDF con los resultados OCR
  async generatePDF(results: OCRResult[]): Promise<void> {
    // Aquí se implementará la lógica para generar el PDF
    console.log('Generando PDF con resultados:', results);
  }
}

// Exportar una instancia única del procesador OCR
export const ocrProcessor = new OCRProcessor();
