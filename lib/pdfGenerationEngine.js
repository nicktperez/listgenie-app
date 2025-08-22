// Professional PDF Generation Engine
// Converts professional HTML/CSS flyers into high-quality PDFs

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

class PDFGenerationEngine {
  constructor() {
    this.pdfSettings = {
      format: 'a4',
      orientation: 'portrait',
      unit: 'mm',
      quality: 'high'
    };
    
    this.canvasSettings = {
      scale: 2, // High DPI for crisp output
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    };
  }

  // Generate high-quality PDF from professional flyer
  async generateProfessionalPDF(flyerData) {
    try {
      console.log('📄 Starting professional PDF generation:', flyerData);

      // Create temporary DOM element with the flyer
      const flyerElement = this.createFlyerElement(flyerData);
      
      // Convert to high-quality canvas
      const canvas = await this.convertToCanvas(flyerElement);
      
      // Generate PDF from canvas
      const pdf = await this.generatePDFFromCanvas(canvas, flyerData);
      
      // Clean up
      this.cleanup(flyerElement);
      
      return {
        success: true,
        type: 'professional-pdf',
        pdf: pdf,
        quality: 'marketing-professional',
        filename: this.generateFilename(flyerData)
      };

    } catch (error) {
      console.error('❌ PDF generation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Create temporary DOM element with the flyer
  createFlyerElement(flyerData) {
    // Create container
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '210mm'; // A4 width
    container.style.height = '297mm'; // A4 height
    container.style.background = '#ffffff';
    container.style.overflow = 'hidden';
    container.style.fontSize = '12px';
    
    // Add the flyer HTML
    container.innerHTML = flyerData.html;
    
    // Add the flyer CSS
    const style = document.createElement('style');
    style.textContent = flyerData.css;
    container.appendChild(style);
    
    // Add to DOM temporarily
    document.body.appendChild(container);
    
    return container;
  }

  // Convert flyer element to high-quality canvas
  async convertToCanvas(flyerElement) {
    try {
      console.log('🎨 Converting flyer to canvas...');
      
      const canvas = await html2canvas(flyerElement, {
        ...this.canvasSettings,
        width: 210 * 2.83465, // A4 width in pixels (72 DPI)
        height: 297 * 2.83465, // A4 height in pixels (72 DPI)
        scrollX: 0,
        scrollY: 0
      });
      
      console.log('✅ Canvas conversion successful');
      return canvas;
      
    } catch (error) {
      console.error('❌ Canvas conversion failed:', error);
      throw new Error(`Canvas conversion failed: ${error.message}`);
    }
  }

  // Generate PDF from canvas
  async generatePDFFromCanvas(canvas, flyerData) {
    try {
      console.log('📄 Generating PDF from canvas...');
      
      // Create PDF document
      const pdf = new jsPDF({
        format: this.pdfSettings.format,
        orientation: this.pdfSettings.orientation,
        unit: this.pdfSettings.unit
      });
      
      // Get canvas dimensions
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Add image to PDF
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
      
      // Add metadata
      this.addPDFMetadata(pdf, flyerData);
      
      console.log('✅ PDF generation successful');
      return pdf;
      
    } catch (error) {
      console.error('❌ PDF generation failed:', error);
      throw new Error(`PDF generation failed: ${error.message}`);
    }
  }

  // Add professional metadata to PDF
  addPDFMetadata(pdf, flyerData) {
    try {
      // Set document properties
      pdf.setProperties({
        title: `Real Estate Flyer - ${flyerData.propertyInfo?.address || 'Property'}`,
        subject: 'Professional Real Estate Marketing Flyer',
        author: flyerData.agentInfo?.name || 'ListGenie',
        creator: 'ListGenie Professional Flyer Engine',
        producer: 'ListGenie SaaS Platform',
        keywords: 'real estate, property, flyer, marketing, professional',
        creationDate: new Date()
      });
      
      // Add professional footer
      this.addProfessionalFooter(pdf, flyerData);
      
    } catch (error) {
      console.warn('⚠️ Metadata addition failed:', error);
    }
  }

  // Add professional footer to PDF
  addProfessionalFooter(pdf, flyerData) {
    try {
      const pageCount = pdf.internal.getNumberOfPages();
      
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        
        // Footer text
        pdf.setFontSize(8);
        pdf.setTextColor(128, 128, 128);
        pdf.text(
          `Generated by ListGenie Professional Flyer Engine | ${flyerData.agentInfo?.agency || 'Real Estate Agency'} | Page ${i} of ${pageCount}`,
          105, // Center horizontally
          290, // Bottom margin
          { align: 'center' }
        );
      }
      
    } catch (error) {
      console.warn('⚠️ Footer addition failed:', error);
    }
  }

  // Generate professional filename
  generateFilename(flyerData) {
    const timestamp = new Date().toISOString().slice(0, 10);
    const address = flyerData.propertyInfo?.address?.replace(/[^a-zA-Z0-9]/g, '-') || 'property';
    const style = flyerData.style || 'professional';
    
    return `professional-flyer-${address}-${style}-${timestamp}.pdf`;
  }

  // Clean up temporary elements
  cleanup(flyerElement) {
    try {
      if (flyerElement && flyerElement.parentNode) {
        flyerElement.parentNode.removeChild(flyerElement);
      }
    } catch (error) {
      console.warn('⚠️ Cleanup failed:', error);
    }
  }

  // Generate PDF blob for download
  async generatePDFBlob(flyerData) {
    try {
      const result = await this.generateProfessionalPDF(flyerData);
      
      if (result.success) {
        const pdfBlob = result.pdf.output('blob');
        return {
          success: true,
          blob: pdfBlob,
          filename: result.filename,
          size: pdfBlob.size
        };
      } else {
        throw new Error(result.error);
      }
      
    } catch (error) {
      console.error('❌ PDF blob generation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Download PDF directly
  async downloadPDF(flyerData) {
    try {
      const result = await this.generatePDFBlob(flyerData);
      
      if (result.success) {
        // Create download link
        const url = URL.createObjectURL(result.blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = result.filename;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up URL
        URL.revokeObjectURL(url);
        
        return {
          success: true,
          filename: result.filename,
          size: result.size
        };
      } else {
        throw new Error(result.error);
      }
      
    } catch (error) {
      console.error('❌ PDF download failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Check if PDF generation is available
  async checkAvailability() {
    try {
      // Check if required libraries are available
      const hasJsPDF = typeof jsPDF !== 'undefined';
      const hasHtml2Canvas = typeof html2canvas !== 'undefined';
      
      return {
        available: hasJsPDF && hasHtml2Canvas,
        service: 'Professional PDF Generation',
        tier: 'Marketing Professional',
        features: [
          'High-quality PDF output',
          'Professional formatting',
          'Metadata inclusion',
          'Professional footers',
          'Print-ready output',
          'Direct download'
        ],
        quality: 'Marketing professional standard',
        libraries: {
          jsPDF: hasJsPDF,
          html2canvas: hasHtml2Canvas
        }
      };
    } catch (error) {
      return {
        available: false,
        service: 'Professional PDF Generation',
        error: error.message
      };
    }
  }
}

// Export for use in other files
export default PDFGenerationEngine;

// Also export individual functions for flexibility
export const pdfGenerationEngine = new PDFGenerationEngine();
