// Professional Flyer Generator - Creates actual PDF flyers
// One-click solution for users

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

class FlyerGenerator {
  constructor() {
    this.templates = this.getFlyerTemplates();
  }

  // Professional flyer templates
  getFlyerTemplates() {
    return {
      'modern-luxury': {
        name: 'Modern Luxury Real Estate Flyer',
        primaryColor: '#1e293b',
        accentColor: '#f59e0b',
        backgroundColor: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        layout: 'modern'
      },
      'classic-elegant': {
        name: 'Classic Elegant Real Estate Flyer',
        primaryColor: '#1f2937',
        accentColor: '#d97706',
        backgroundColor: '#f9fafb',
        fontFamily: 'Georgia, serif',
        layout: 'classic'
      },
      'contemporary-minimal': {
        name: 'Contemporary Minimal Real Estate Flyer',
        primaryColor: '#374151',
        accentColor: '#10b981',
        backgroundColor: '#ffffff',
        fontFamily: 'Helvetica, sans-serif',
        layout: 'minimal'
      },
      'premium-luxury': {
        name: 'Premium Luxury Real Estate Flyer',
        primaryColor: '#111827',
        accentColor: '#fbbf24',
        backgroundColor: '#fef3c7',
        fontFamily: 'Times New Roman, serif',
        layout: 'luxury'
      }
    };
  }

  // Main method to generate a complete flyer
  async generateFlyer(data) {
    try {
      console.log('🎨 Starting flyer generation:', data);
      
      // Select template
      const template = this.selectTemplate(data.style);
      
      // Create flyer content
      const flyerContent = this.createFlyerContent(data, template);
      
      // Generate PDF
      const pdf = await this.generatePDF(flyerContent, template);
      
      return {
        success: true,
        type: 'pdf-flyer',
        pdf: pdf,
        template: template.name,
        filename: `flyer-${data.style}-${Date.now()}.pdf`
      };

    } catch (error) {
      console.error('❌ Flyer generation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Select the best template
  selectTemplate(style) {
    if (style && this.templates[style]) {
      return this.templates[style];
    }
    return this.templates['classic-elegant'];
  }

  // Create flyer content structure
  createFlyerContent(data, template) {
    const { propertyInfo, agentInfo, photos } = data;
    
    return {
      // Header Section
      header: {
        title: 'EXCLUSIVE PROPERTY',
        subtitle: propertyInfo.address || 'Beautiful Property Available',
        style: template.layout
      },
      
      // Property Details
      property: {
        type: propertyInfo.type || 'Residential Property',
        bedrooms: propertyInfo.bedrooms || '3',
        bathrooms: propertyInfo.bathrooms || '2',
        sqft: propertyInfo.sqft || '2,000',
        price: propertyInfo.price || '$500,000',
        features: propertyInfo.features || ['Modern Kitchen', 'Garage', 'Backyard']
      },
      
      // Agent Information
      agent: {
        name: agentInfo.name || 'Professional Agent',
        agency: agentInfo.agency || 'Premier Real Estate',
        phone: agentInfo.phone || '(555) 123-4567',
        email: agentInfo.email || 'agent@premier.com',
        website: agentInfo.website || 'www.premier.com'
      },
      
      // Visual Elements
      photos: photos || [],
      
      // Design Settings
      design: {
        primaryColor: template.primaryColor,
        accentColor: template.accentColor,
        backgroundColor: template.backgroundColor,
        fontFamily: template.fontFamily
      }
    };
  }

  // Generate PDF using jsPDF
  async generatePDF(content, template) {
    return new Promise((resolve, reject) => {
      try {
        // Create PDF document (8.5" x 11" - standard flyer size)
        const pdf = new jsPDF('p', 'in', 'letter');
        
        // Set initial position
        let yPosition = 0.5;
        const margin = 0.5;
        const pageWidth = 8.5;
        const contentWidth = pageWidth - (2 * margin);
        
        // Set font
        pdf.setFont(template.fontFamily);
        
        // Header Section
        this.drawHeader(pdf, content.header, yPosition, margin, contentWidth);
        yPosition += 1.2;
        
        // Property Details Section
        this.drawPropertyDetails(pdf, content.property, yPosition, margin, contentWidth);
        yPosition += 2.5;
        
        // Photos Section (if available)
        if (content.photos.length > 0) {
          this.drawPhotos(pdf, content.photos, yPosition, margin, contentWidth);
          yPosition += 2.5;
        }
        
        // Agent Section
        this.drawAgentSection(pdf, content.agent, yPosition, margin, contentWidth);
        
        // Footer
        this.drawFooter(pdf, margin, contentWidth);
        
        resolve(pdf);
        
      } catch (error) {
        reject(error);
      }
    });
  }

  // Draw header section
  drawHeader(pdf, header, yPosition, margin, width) {
    const centerX = margin + (width / 2);
    
    // Main title
    pdf.setFontSize(24);
    pdf.setTextColor(0, 0, 0);
    pdf.text(header.title, centerX, yPosition, { align: 'center' });
    
    // Subtitle
    pdf.setFontSize(16);
    pdf.setTextColor(100, 100, 100);
    pdf.text(header.subtitle, centerX, yPosition + 0.3, { align: 'center' });
    
    // Decorative line
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, yPosition + 0.5, margin + width, yPosition + 0.5);
  }

  // Draw property details
  drawPropertyDetails(pdf, property, yPosition, margin, width) {
    const centerX = margin + (width / 2);
    
    // Section title
    pdf.setFontSize(18);
    pdf.setTextColor(0, 0, 0);
    pdf.text('PROPERTY FEATURES', centerX, yPosition, { align: 'center' });
    
    yPosition += 0.4;
    
    // Property specs in a grid
    const specs = [
      { label: 'Type', value: property.type },
      { label: 'Bedrooms', value: property.bedrooms },
      { label: 'Bathrooms', value: property.bathrooms },
      { label: 'Square Feet', value: property.sqft }
    ];
    
    let xPos = margin;
    let colWidth = width / 2;
    
    specs.forEach((spec, index) => {
      const row = Math.floor(index / 2);
      const col = index % 2;
      
      const currentX = xPos + (col * colWidth);
      const currentY = yPosition + (row * 0.3);
      
      // Label
      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.text(spec.label + ':', currentX, currentY);
      
      // Value
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text(spec.value, currentX, currentY + 0.2);
    });
    
    yPosition += 1.2;
    
    // Price (highlighted)
    pdf.setFontSize(20);
    pdf.setTextColor(0, 100, 0);
    pdf.text('PRICE: ' + property.price, centerX, yPosition, { align: 'center' });
    
    yPosition += 0.4;
    
    // Features list
    if (property.features.length > 0) {
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      
      property.features.forEach((feature, index) => {
        pdf.text('• ' + feature, margin + 0.2, yPosition + (index * 0.2));
      });
    }
  }

  // Draw photos section
  drawPhotos(pdf, photos, yPosition, margin, width) {
    // For now, we'll add photo placeholders
    // In a full implementation, you'd process and embed actual images
    
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text('PROPERTY PHOTOS', margin + (width / 2), yPosition, { align: 'center' });
    
    yPosition += 0.3;
    
    // Photo placeholders
    photos.forEach((photo, index) => {
      const photoWidth = 2;
      const photoHeight = 1.5;
      const xPos = margin + (index * (photoWidth + 0.2));
      
      if (xPos + photoWidth <= margin + width) {
        // Draw photo placeholder
        pdf.setDrawColor(200, 200, 200);
        pdf.setFillColor(240, 240, 240);
        pdf.rect(xPos, yPosition, photoWidth, photoHeight, 'FD');
        
        // Photo label
        pdf.setFontSize(10);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`Photo ${index + 1}`, xPos + (photoWidth / 2), yPosition + (photoHeight / 2), { align: 'center' });
      }
    });
  }

  // Draw agent section
  drawAgentSection(pdf, agent, yPosition, margin, width) {
    const centerX = margin + (width / 2);
    
    // Section title
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text('CONTACT YOUR AGENT', centerX, yPosition, { align: 'center' });
    
    yPosition += 0.4;
    
    // Agent info
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text(agent.name, centerX, yPosition, { align: 'center' });
    
    yPosition += 0.3;
    
    pdf.setFontSize(12);
    pdf.setTextColor(100, 100, 100);
    pdf.text(agent.agency, centerX, yPosition, { align: 'center' });
    
    yPosition += 0.3;
    
    // Contact details
    const contactInfo = [
      { label: 'Phone', value: agent.phone },
      { label: 'Email', value: agent.email },
      { label: 'Website', value: agent.website }
    ];
    
    contactInfo.forEach((contact, index) => {
      const currentY = yPosition + (index * 0.2);
      pdf.text(`${contact.label}: ${contact.value}`, centerX, currentY, { align: 'center' });
    });
  }

  // Draw footer
  drawFooter(pdf, margin, width) {
    const centerX = margin + (width / 2);
    const footerY = 10.5;
    
    pdf.setFontSize(10);
    pdf.setTextColor(150, 150, 150);
    pdf.text('Generated by ListGenie - Professional Real Estate Marketing', centerX, footerY, { align: 'center' });
    
    // Decorative line
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, footerY - 0.2, margin + width, footerY - 0.2);
  }

  // Generate sample flyer for testing
  async generateSampleFlyer() {
    const sampleData = {
      style: 'modern-luxury',
      propertyInfo: {
        address: '123 Luxury Lane, Beverly Hills, CA',
        type: 'Single Family Home',
        bedrooms: '4',
        bathrooms: '3',
        sqft: '2,500',
        price: '$850,000',
        features: ['Pool', 'Modern Kitchen', 'Garage', 'Backyard']
      },
      agentInfo: {
        name: 'John Smith',
        agency: 'Premier Real Estate',
        phone: '(555) 123-4567',
        email: 'john@premierrealestate.com',
        website: 'www.premierrealestate.com'
      },
      photos: ['photo1.jpg', 'photo2.jpg', 'photo3.jpg']
    };

    return await this.generateFlyer(sampleData);
  }
}

// Export for use in other files
export default FlyerGenerator;

// Also export individual functions for flexibility
export const flyerGenerator = new FlyerGenerator();
