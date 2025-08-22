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
    
    // Filter and process photos
    const validPhotos = photos.filter(photo => {
      // Handle both File objects and AI-generated photo objects
      if (photo instanceof File) {
        return photo.type.startsWith('image/');
      } else if (photo.url) {
        return photo.url && photo.url.length > 0;
      }
      return false;
    });
    
    console.log('📸 Processing photos for flyer:', { 
      totalPhotos: photos.length, 
      validPhotos: validPhotos.length,
      photoTypes: validPhotos.map(p => p instanceof File ? 'File' : 'AI Photo')
    });
    
    // Draw main photo
    if (validPhotos[0]) {
      try {
        await this.drawImage(validPhotos[0], startX, startY, photoWidth, photoHeight);
        console.log('✅ Main photo drawn successfully');
      } catch (error) {
        console.error('❌ Error drawing main photo:', error);
        this.drawPhotoPlaceholder();
      }
    } else {
      this.drawPhotoPlaceholder();
    }
    
    // Draw smaller photos below if available
    if (validPhotos.length > 1) {
      const smallPhotoWidth = 180;
      const smallPhotoHeight = 135;
      const smallStartY = startY + photoHeight + 20;
      
      for (let i = 1; i < Math.min(validPhotos.length, 5); i++) {
        const x = startX + (i - 1) * (smallPhotoWidth + 20);
        try {
          await this.drawImage(validPhotos[i], x, smallStartY, smallPhotoWidth, smallPhotoHeight);
          console.log(`✅ Small photo ${i} drawn successfully`);
        } catch (error) {
          console.error(`❌ Error drawing small photo ${i}:`, error);
          // Draw a placeholder for this photo
          this.drawSmallPhotoPlaceholder(x, smallStartY, smallPhotoWidth, smallPhotoHeight);
        }
      }
    }
  }

  // Draw a single image (handles both File objects and AI photos)
  async drawImage(photo, x, y, width, height) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          // Create a temporary canvas for image processing
          const tempCanvas = document.createElement('canvas');
          const tempCtx = tempCanvas.getContext('2d');
          
          // Set dimensions
          tempCanvas.width = width;
          tempCanvas.height = height;
          
          // Calculate aspect ratio and cropping
          const imgAspect = img.width / img.height;
          const targetAspect = width / height;
          
          let sourceX = 0;
          let sourceY = 0;
          let sourceWidth = img.width;
          let sourceHeight = img.height;
          
          if (imgAspect > targetAspect) {
            // Image is wider than target - crop sides
            sourceWidth = img.height * targetAspect;
            sourceX = (img.width - sourceWidth) / 2;
          } else {
            // Image is taller than target - crop top/bottom
            sourceHeight = img.width / targetAspect;
            sourceY = (img.height - sourceHeight) / 2;
          }
          
          // Draw the cropped image
          tempCtx.drawImage(
            img, 
            sourceX, sourceY, sourceWidth, sourceHeight,
            0, 0, width, height
          );
          
          // Apply subtle enhancement for AI photos
          if (photo.isAiGenerated) {
            this.enhanceAiPhoto(tempCtx, width, height);
          }
          
          // Draw to main canvas
          this.ctx.drawImage(tempCanvas, x, y);
          
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      // Set image source based on photo type
      if (photo instanceof File) {
        // User uploaded photo
        const reader = new FileReader();
        reader.onload = (e) => {
          img.src = e.target.result;
        };
        reader.readAsDataURL(photo);
      } else if (photo.url) {
        // AI-generated photo
        img.src = photo.url;
      } else {
        reject(new Error('Invalid photo format'));
      }
    });
  }

  // Enhance AI-generated photos for better flyer integration
  enhanceAiPhoto(ctx, width, height) {
    try {
      // Apply subtle brightness/contrast adjustment
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        // Slightly increase brightness and contrast
        data[i] = Math.min(255, data[i] * 1.05);     // Red
        data[i + 1] = Math.min(255, data[i + 1] * 1.05); // Green
        data[i + 2] = Math.min(255, data[i + 2] * 1.05); // Blue
      }
      
      ctx.putImageData(imageData, 0, 0);
    } catch (error) {
      console.warn('⚠️ Could not enhance AI photo:', error);
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

  // Draw placeholder for small photos
  drawSmallPhotoPlaceholder(x, y, width, height) {
    const { secondaryColor, textColor } = this.currentStyle;
    
    // Placeholder background
    this.ctx.fillStyle = secondaryColor;
    this.ctx.fillRect(x, y, width, height);
    
    // Placeholder text
    this.ctx.fillStyle = textColor;
    this.ctx.font = '14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Photo', x + width / 2, y + height / 2);
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
    const { textColor, bodyFont } = this.currentStyle;
    
    this.ctx.fillStyle = textColor;
    this.ctx.font = bodyFont;
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Generated by ListGenie.ai', this.width / 2, this.height - 25);
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
