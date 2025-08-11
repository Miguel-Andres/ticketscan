// src/lib/pdfGenerator.ts
// Funciones para generar PDFs con los resultados OCR usando jsPDF

import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { OCRResult } from './ocrProcessor';

interface PDFData {
  date: string;
  totalImages: number;
  processedImages: number;
  results: OCRResult[];
}

class PDFGenerator {
  // Generar PDF con los resultados OCR
  async generatePDF(data: PDFData): Promise<void> {
    try {
      // Crear nuevo documento PDF
      const doc = new jsPDF();
      
      // Añadir título
      doc.setFontSize(20);
      doc.text('Informe de Procesamiento de Etiquetas', 14, 22);
      
      // Añadir información general
      doc.setFontSize(12);
      doc.text(`Fecha: ${data.date}`, 14, 32);
      doc.text(`Total de imágenes: ${data.totalImages}`, 14, 40);
      doc.text(`Imágenes procesadas: ${data.processedImages}`, 14, 48);
      
      // Añadir tabla de resultados si hay datos
      if (data.results && data.results.length > 0) {
        // Preparar datos para la tabla
        const tableData = data.results.map(result => [
          result.fileName,
          result.client || 'N/A',
          result.saleId || 'N/A',
          result.tracking || 'N/A',
          result.deliveryDate || 'N/A',
          result.postalCode || 'N/A',
          result.locality || 'N/A',
          result.address || 'N/A',
          result.recipient || 'N/A',
          result.status === 'completed' ? '✓' : 
          result.status === 'error' ? '✗' : 
          result.status === 'processing' ? '⏳' : '🕒'
        ]);
        
        // Generar tabla
        (doc as any).autoTable({
          head: [['Archivo', 'Cliente', 'Venta', 'Tracking', 'Fecha Entrega', 'CP', 'Localidad', 'Dirección', 'Destinatario', 'Estado']],
          body: tableData,
          startY: 56,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [59, 130, 246] }, // blue-500
          alternateRowStyles: { fillColor: [240, 240, 240] },
          tableLineColor: [200, 200, 200],
          tableLineWidth: 0.1,
        });
      }
      
      // Guardar PDF
      doc.save('informe-etiquetas.pdf');
      
      console.log('PDF generado exitosamente');
    } catch (error) {
      console.error('Error generando PDF:', error);
      throw new Error('No se pudo generar el PDF');
    }
  }
}

// Exportar una instancia única del generador PDF
export const pdfGenerator = new PDFGenerator();
