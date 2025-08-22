// lib/flyerTemplates.js
// Professional real estate flyer template system
// Generates high-quality flyers using HTML5 Canvas

export class FlyerGenerator {
  constructor(canvas, style = 'modern') {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.style = style;
    this.width = 1024;
    this.height = 1792;
    
    // Set canvas dimensions
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    
    // Style configurations
    this.styles = {
      modern: {
        primaryColor: '#1E40AF',
        secondaryColor: '#F59E0B',
        accentColor: '#10B981',
        backgroundColor: '#FFFFFF',
        textColor: '#1F2937',
        fontFamily: 'Arial, sans-serif',
        titleFont: 'bold 48px Arial',
        subtitleFont: 'bold 32px Arial',
        bodyFont: '24px Arial',
        captionFont: '20px Arial'
      },
      classic: {
        primaryColor: '#374151',
        secondaryColor: '#D1D5DB',
        accentColor: '#9CA3AF',
        backgroundColor: '#F9FAFB',
        textColor: '#111827',
        fontFamily: 'Georgia, serif',
        titleFont: 'bold 48px Georgia',
        subtitleFont: 'bold 32px Georgia',
        bodyFont: '24px Georgia',
        captionFont: '20px Georgia'
      },
      premium: {
        primaryColor: '#000000',
        secondaryColor: '#C0A080',
        accentColor: '#8B4513',
        backgroundColor: '#FFFFFF',
        textColor: '#000000',
        fontFamily: 'Times New Roman, serif',
        titleFont: 'bold 48px Times New Roman',
        subtitleFont: 'bold 32px Times New Roman',
        bodyFont: '24px Times New Roman',
        captionFont: '20px Times New Roman'
      },
      contemporary: {
        primaryColor: '#7C3AED',
        secondaryColor: '#F97316',
        accentColor: '#06B6D4',
        backgroundColor: '#FFFFFF',
        textColor: '#1F2937',
        fontFamily: 'Helvetica, Arial, sans-serif',
        titleFont: 'bold 48px Helvetica',
        subtitleFont: 'bold 32px Helvetica',
        bodyFont: '24px Helvetica',
        captionFont: '20px Helvetica'
      }
    };
    
    this.currentStyle = this.styles[style];
  }

  // Generate the complete flyer
  async generateFlyer(data) {
    const { agentInfo, photos, listing, propertyInfo } = data;
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    // Draw background
    this.drawBackground();
    
    // Draw header section
    this.drawHeader(propertyInfo);
    
    // Draw photos
    if (photos && photos.length > 0) {
      await this.drawPhotos(photos);
    } else {
      this.drawPhotoPlaceholder();
    }
    
    // Draw property details
    this.drawPropertyDetails(propertyInfo);
    
    // Draw agent information
    this.drawAgentInfo(agentInfo);
    
    // Draw footer
    this.drawFooter();
    
    return this.canvas.toDataURL('image/png');
  }

  // Draw background with style-specific design
  drawBackground() {
    const { backgroundColor, primaryColor, secondaryColor } = this.currentStyle;
    
    // Fill background
    this.ctx.fillStyle = backgroundColor;
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Add subtle design elements based on style
    if (this.style === 'modern') {
      this.drawModernBackground();
    } else if (this.style === 'classic') {
      this.drawClassicBackground();
    } else if (this.style === 'premium') {
      this.drawPremiumBackground();
    } else if (this.style === 'contemporary') {
      this.drawContemporaryBackground();
    }
  }

  drawModernBackground() {
    const { primaryColor, secondaryColor } = this.currentStyle;
    
    // Top accent bar
    this.ctx.fillStyle = primaryColor;
    this.ctx.fillRect(0, 0, this.width, 80);
    
    // Diagonal accent
    this.ctx.fillStyle = secondaryColor;
    this.ctx.beginPath();
    this.ctx.moveTo(0, 80);
    this.ctx.lineTo(200, 0);
    this.ctx.lineTo(0, 0);
    this.ctx.fill();
    
    // Bottom accent
    this.ctx.fillStyle = primaryColor;
    this.ctx.fillRect(0, this.height - 120, this.width, 120);
  }

  drawClassicBackground() {
    const { primaryColor, secondaryColor } = this.currentStyle;
    
    // Border
    this.ctx.strokeStyle = primaryColor;
    this.ctx.lineWidth = 8;
    this.ctx.strokeRect(20, 20, this.width - 40, this.height - 40);
    
    // Corner accents
    this.ctx.fillStyle = secondaryColor;
    this.ctx.fillRect(0, 0, 60, 60);
    this.ctx.fillRect(this.width - 60, 0, 60, 60);
    this.ctx.fillRect(0, this.height - 60, 60, 60);
    this.ctx.fillRect(this.width - 60, this.height - 60, 60, 60);
  }

  drawPremiumBackground() {
    const { primaryColor, secondaryColor } = this.currentStyle;
    
    // Gold border
    this.ctx.strokeStyle = secondaryColor;
    this.ctx.lineWidth = 12;
    this.ctx.strokeRect(30, 30, this.width - 60, this.height - 60);
    
    // Subtle pattern
    for (let i = 0; i < this.width; i += 100) {
      this.ctx.strokeStyle = `rgba(192, 160, 128, 0.1)`;
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(i, 0);
      this.ctx.lineTo(i, this.height);
      this.ctx.stroke();
    }
  }

  drawContemporaryBackground() {
    const { primaryColor, secondaryColor, accentColor } = this.currentStyle;
    
    // Gradient background
    const gradient = this.ctx.createLinearGradient(0, 0, this.width, this.height);
    gradient.addColorStop(0, primaryColor);
    gradient.addColorStop(0.5, secondaryColor);
    gradient.addColorStop(1, accentColor);
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, 100);
    
    // Bottom accent
    this.ctx.fillStyle = primaryColor;
    this.ctx.fillRect(0, this.height - 100, this.width, 100);
  }

  // Draw header section
  drawHeader(propertyInfo) {
    const { titleFont, primaryColor, textColor } = this.currentStyle;
    
    // FOR SALE badge
    this.ctx.fillStyle = primaryColor;
    this.ctx.fillRect(50, 120, 200, 60);
    
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 28px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('FOR SALE', 150, 160);
    
    // Property title
    this.ctx.fillStyle = textColor;
    this.ctx.font = titleFont;
    this.ctx.textAlign = 'left';
    this.ctx.fillText(propertyInfo.address || 'Beautiful Property', 300, 160);
  }

  // Draw photos or placeholder
  async drawPhotos(photos) {
    const photoWidth = 800;
    const photoHeight = 600;
    const startX = (this.width - photoWidth) / 2;
    const startY = 220;
    
    // Draw main photo
    if (photos[0]) {
      await this.drawImage(photos[0], startX, startY, photoWidth, photoHeight);
    }
    
    // Draw smaller photos below if available
    if (photos.length > 1) {
      const smallPhotoWidth = 180;
      const smallPhotoHeight = 135;
      const smallStartY = startY + photoHeight + 20;
      
      for (let i = 1; i < Math.min(photos.length, 5); i++) {
        const x = startX + (i - 1) * (smallPhotoWidth + 20);
        await this.drawImage(photos[i], x, smallStartY, smallPhotoWidth, smallPhotoHeight);
      }
    }
  }

  drawPhotoPlaceholder() {
    const { secondaryColor, textColor } = this.currentStyle;
    const photoWidth = 800;
    const photoHeight = 600;
    const startX = (this.width - photoWidth) / 2;
    const startY = 220;
    
    // Placeholder background
    this.ctx.fillStyle = secondaryColor;
    this.ctx.fillRect(startX, startY, photoWidth, photoHeight);
    
    // Placeholder text
    this.ctx.fillStyle = textColor;
    this.ctx.font = '24px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Property Photos', startX + photoWidth / 2, startY + photoHeight / 2);
    this.ctx.fillText('(AI Generated)', startX + photoWidth / 2, startY + photoHeight / 2 + 30);
  }

  // Draw property details
  drawPropertyDetails(propertyInfo) {
    const { bodyFont, textColor, primaryColor } = this.currentStyle;
    const startY = 900;
    
    this.ctx.fillStyle = textColor;
    this.ctx.font = bodyFont;
    this.ctx.textAlign = 'left';
    
    let y = startY;
    const lineHeight = 40;
    
    // Property highlights
    if (propertyInfo.bedrooms) {
      this.ctx.fillText(`🛏️ ${propertyInfo.bedrooms} Bedrooms`, 100, y);
      y += lineHeight;
    }
    
    if (propertyInfo.bathrooms) {
      this.ctx.fillText(`🚿 ${propertyInfo.bathrooms} Bathrooms`, 100, y);
      y += lineHeight;
    }
    
    if (propertyInfo.sqft) {
      this.ctx.fillText(`📏 ${propertyInfo.sqft} sq ft`, 100, y);
      y += lineHeight;
    }
    
    // Property description
    if (propertyInfo.features && propertyInfo.features.length > 0) {
      y += 20;
      this.ctx.fillText('✨ Features:', 100, y);
      y += lineHeight;
      
      propertyInfo.features.slice(0, 5).forEach(feature => {
        this.ctx.fillText(`• ${feature}`, 120, y);
        y += lineHeight;
      });
    }
  }

  // Draw agent information
  drawAgentInfo(agentInfo) {
    const { subtitleFont, bodyFont, primaryColor, textColor } = this.currentStyle;
    const startY = 1400;
    
    // Agent section background
    this.ctx.fillStyle = primaryColor;
    this.ctx.fillRect(50, startY - 20, this.width - 100, 200);
    
    // Agent name
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = subtitleFont;
    this.ctx.textAlign = 'center';
    this.ctx.fillText(agentInfo.name, this.width / 2, startY + 30);
    
    // Agency name
    this.ctx.font = bodyFont;
    this.ctx.fillText(agentInfo.agency, this.width / 2, startY + 70);
    
    // Contact information
    if (agentInfo.phone) {
      this.ctx.fillText(`📞 ${agentInfo.phone}`, this.width / 2, startY + 110);
    }
    
    if (agentInfo.email) {
      this.ctx.fillText(`✉️ ${agentInfo.email}`, this.width / 2, startY + 140);
    }
    
    if (agentInfo.website) {
      this.ctx.fillText(`🌐 ${agentInfo.website}`, this.width / 2, startY + 170);
    }
  }

  // Draw footer
  drawFooter() {
    const { primaryColor, textColor } = this.currentStyle;
    
    this.ctx.fillStyle = primaryColor;
    this.ctx.fillRect(0, this.height - 60, this.width, 60);
    
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '20px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Generated by ListGenie.ai', this.width / 2, this.height - 25);
  }

  // Helper method to draw images
  async drawImage(file, x, y, width, height) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        // Create a temporary canvas for cropping/resizing
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        tempCanvas.width = width;
        tempCanvas.height = height;
        
        // Calculate aspect ratio and crop
        const imgAspect = img.width / img.height;
        const targetAspect = width / height;
        
        let sourceX = 0, sourceY = 0, sourceWidth = img.width, sourceHeight = img.height;
        
        if (imgAspect > targetAspect) {
          // Image is wider, crop sides
          sourceWidth = img.height * targetAspect;
          sourceX = (img.width - sourceWidth) / 2;
        } else {
          // Image is taller, crop top/bottom
          sourceHeight = img.width / targetAspect;
          sourceY = (img.height - sourceHeight) / 2;
        }
        
        // Draw cropped image
        tempCtx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, width, height);
        
        // Add rounded corners (fallback for older browsers)
        this.ctx.save();
        this.ctx.beginPath();
        if (this.ctx.roundRect) {
          this.ctx.roundRect(x, y, width, height, 15);
        } else {
          // Fallback for older browsers
          this.ctx.moveTo(x + 15, y);
          this.ctx.lineTo(x + width - 15, y);
          this.ctx.quadraticCurveTo(x + width, y, x + width, y + 15);
          this.ctx.lineTo(x + width, y + height - 15);
          this.ctx.quadraticCurveTo(x + width, y + height, x + width - 15, y + height);
          this.ctx.lineTo(x + 15, y + height);
          this.ctx.quadraticCurveTo(x, y + height, x, y + height - 15);
          this.ctx.lineTo(x, y + 15);
          this.ctx.quadraticCurveTo(x, y, x + 15, y);
        }
        this.ctx.clip();
        
        // Draw the processed image
        this.ctx.drawImage(tempCanvas, x, y);
        
        this.ctx.restore();
        resolve();
      };
      
      // Convert file to data URL
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }
}

// Utility function to extract property information from listing text
export function extractPropertyInfo(listingText) {
  const lines = listingText.split('\n');
  let address = 'Beautiful Property';
  let bedrooms = '';
  let bathrooms = '';
  let sqft = '';
  let features = [];

  lines.forEach(line => {
    const lowerLine = line.toLowerCase();
    
    if (lowerLine.includes('bedroom')) {
      const match = line.match(/(\d+)\s*bedroom/i);
      if (match) bedrooms = match[1];
    }
    
    if (lowerLine.includes('bathroom')) {
      const match = line.match(/(\d+)\s*bathroom/i);
      if (match) bathrooms = match[1];
    }
    
    if (lowerLine.includes('sq ft') || lowerLine.includes('square feet')) {
      const match = line.match(/(\d+[\d,]*)\s*(sq ft|square feet)/i);
      if (match) sqft = match[1];
    }
    
    // Extract features
    if (lowerLine.includes('feature') || lowerLine.includes('amenity') || 
        lowerLine.includes('pool') || lowerLine.includes('garage') ||
        lowerLine.includes('garden') || lowerLine.includes('fireplace')) {
      features.push(line.trim());
    }
    
    // Extract first line as potential address/title
    if (lines.indexOf(line) === 0 && line.length > 10 && !line.includes(':')) {
      address = line.trim();
    }
  });

  return { address, bedrooms, bathrooms, sqft, features };
}
