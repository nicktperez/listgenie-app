// Professional Flyer Generator for Real Estate
// Creates high-quality, marketing-ready flyers

export class FlyerGenerator {
  constructor(canvas, style = 'modern') {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.style = style;
    this.width = canvas.width;
    this.height = canvas.height;
    
    // Professional color schemes
    this.colors = {
      modern: {
        primary: '#1e40af',
        secondary: '#3b82f6',
        accent: '#f59e0b',
        text: '#1f2937',
        lightText: '#6b7280',
        background: '#ffffff',
        header: '#1e293b'
      },
      classic: {
        primary: '#374151',
        secondary: '#6b7280',
        accent: '#d97706',
        text: '#111827',
        lightText: '#4b5563',
        background: '#ffffff',
        header: '#1f2937'
      },
      premium: {
        primary: '#7c3aed',
        secondary: '#a855f7',
        accent: '#fbbf24',
        text: '#1f2937',
        lightText: '#6b7280',
        background: '#ffffff',
        header: '#1f293b'
      },
      contemporary: {
        primary: '#dc2626',
        secondary: '#ef4444',
        accent: '#10b981',
        text: '#111827',
        lightText: '#4b5563',
        background: '#ffffff',
        header: '#1e293b'
      }
    };
    
    this.currentColors = this.colors[style] || this.colors.modern;
  }

  generateFlyer(flyerData) {
    try {
      // Clear canvas
      this.ctx.clearRect(0, 0, this.width, this.height);
      
      // Draw background
      this.drawBackground();
      
      // Draw header
      this.drawHeader(flyerData);
      
      // Draw photos (main focus)
      this.drawPhotos(flyerData.photos, flyerData.aiPhotos);
      
      // Draw property details
      this.drawPropertyDetails(flyerData.listing);
      
      // Draw agent information
      this.drawAgentInfo(flyerData.agentInfo);
      
      // Draw footer
      this.drawFooter();
      
      return true;
    } catch (error) {
      console.error('Error generating flyer:', error);
      return false;
    }
  }

  drawBackground() {
    // Create gradient background
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, this.currentColors.background);
    gradient.addColorStop(1, '#f8fafc');
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Add subtle pattern overlay
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.02)';
    this.ctx.lineWidth = 1;
    
    for (let i = 0; i < this.width; i += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(i, 0);
      this.ctx.lineTo(i, this.height);
      this.ctx.stroke();
    }
  }

  drawHeader(flyerData) {
    // Header background
    this.ctx.fillStyle = this.currentColors.header;
    this.ctx.fillRect(0, 0, this.width, 120);
    
    // FOR SALE badge
    this.ctx.fillStyle = this.currentColors.accent;
    this.ctx.fillRect(40, 30, 120, 40);
    
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 16px Arial, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('FOR SALE', 100, 55);
    
    // Property title
    const title = this.extractPropertyTitle(flyerData.listing);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 32px Arial, sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(title.substring(0, 35), 200, 60);
    
    // Price (if available)
    const price = this.extractPrice(flyerData.listing);
    if (price) {
      this.ctx.fillStyle = this.currentColors.accent;
      this.ctx.font = 'bold 24px Arial, sans-serif';
      this.ctx.textAlign = 'right';
      this.ctx.fillText(price, this.width - 40, 60);
    }
  }

  drawPhotos(photos = [], aiPhotos = []) {
    const allPhotos = [...aiPhotos, ...photos];
    const validPhotos = allPhotos.filter(photo => photo && photo.url);
    
    if (validPhotos.length === 0) {
      // Draw placeholder if no photos
      this.drawPhotoPlaceholder(40, 140, this.width - 80, 300);
      return;
    }
    
    // Main photo (largest)
    const mainPhoto = validPhotos[0];
    if (mainPhoto) {
      this.drawImage(mainPhoto, 40, 140, this.width - 80, 300);
      
      // Add "AI Generated" label if it's an AI photo
      if (mainPhoto.isAiGenerated) {
        this.ctx.fillStyle = 'rgba(30, 64, 175, 0.9)';
        this.ctx.fillRect(50, 150, 100, 25);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 12px Arial, sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('AI Generated', 55, 165);
      }
    }
    
    // Smaller photos below main photo
    const smallPhotoWidth = 120;
    const smallPhotoHeight = 90;
    const spacing = 20;
    const startX = 40;
    const startY = 460;
    
    validPhotos.slice(1, 5).forEach((photo, index) => {
      const x = startX + (index * (smallPhotoWidth + spacing));
      if (x + smallPhotoWidth <= this.width - 40) {
        this.drawImage(photo, x, startY, smallPhotoWidth, smallPhotoHeight);
        
        // Add AI label if needed
        if (photo.isAiGenerated) {
          this.ctx.fillStyle = 'rgba(30, 64, 175, 0.9)';
          this.ctx.fillRect(x + 5, startY + 5, 80, 18);
          
          this.ctx.fillStyle = '#ffffff';
          this.ctx.font = 'bold 10px Arial, sans-serif';
          this.ctx.textAlign = 'left';
          this.ctx.fillText('AI Generated', x + 8, startY + 17);
        }
      }
    });
  }

  drawImage(photo, x, y, width, height) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          // Create a temporary canvas for cropping and resizing
          const tempCanvas = document.createElement('canvas');
          const tempCtx = tempCanvas.getContext('2d');
          tempCanvas.width = width;
          tempCanvas.height = height;
          
          // Calculate aspect ratios
          const imgAspect = img.width / img.height;
          const targetAspect = width / height;
          
          let drawWidth, drawHeight, offsetX, offsetY;
          
          if (imgAspect > targetAspect) {
            // Image is wider than target
            drawHeight = height;
            drawWidth = height * imgAspect;
            offsetX = (width - drawWidth) / 2;
            offsetY = 0;
          } else {
            // Image is taller than target
            drawWidth = width;
            drawHeight = width / imgAspect;
            offsetX = 0;
            offsetY = (height - drawHeight) / 2;
          }
          
          // Draw and crop the image
          tempCtx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
          
          // Apply subtle enhancement for AI photos
          if (photo.isAiGenerated) {
            this.enhanceAiPhoto(tempCtx, width, height);
          }
          
          // Draw to main canvas
          this.ctx.drawImage(tempCanvas, x, y);
          resolve();
        } catch (error) {
          console.error('Error drawing image:', error);
          this.drawPhotoPlaceholder(x, y, width, height);
          resolve();
        }
      };
      
      img.onerror = () => {
        console.error('Error loading image:', photo.url);
        this.drawPhotoPlaceholder(x, y, width, height);
        resolve();
      };
      
      // Handle both URLs and File objects
      if (typeof photo.url === 'string') {
        img.src = photo.url;
      } else if (photo.url instanceof File) {
        const reader = new FileReader();
        reader.onload = (e) => {
          img.src = e.target.result;
        };
        reader.readAsDataURL(photo.url);
      }
    });
  }

  enhanceAiPhoto(ctx, width, height) {
    try {
      // Apply subtle brightness and contrast adjustments
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        // Slight brightness increase
        data[i] = Math.min(255, data[i] * 1.05);     // Red
        data[i + 1] = Math.min(255, data[i + 1] * 1.05); // Green
        data[i + 2] = Math.min(255, data[i + 2] * 1.05); // Blue
        
        // Slight contrast increase
        const factor = 1.1;
        data[i] = Math.min(255, Math.max(0, (data[i] - 128) * factor + 128));
        data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * factor + 128));
        data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * factor + 128));
      }
      
      ctx.putImageData(imageData, 0, 0);
    } catch (error) {
      console.error('Error enhancing AI photo:', error);
    }
  }

  drawPhotoPlaceholder(x, y, width, height) {
    // Draw placeholder background
    this.ctx.fillStyle = '#f3f4f6';
    this.ctx.fillRect(x, y, width, height);
    
    // Draw placeholder border
    this.ctx.strokeStyle = '#d1d5db';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x, y, width, height);
    
    // Draw placeholder text
    this.ctx.fillStyle = '#9ca3af';
    this.ctx.font = '16px Arial, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Property Photos', x + width/2, y + height/2);
    
    if (this.style === 'modern') {
      this.ctx.font = '12px Arial, sans-serif';
      this.ctx.fillText('(AI Generated)', x + width/2, y + height/2 + 20);
    }
  }

  drawPropertyDetails(listing) {
    if (!listing) return;
    
    const details = this.extractPropertyInfo(listing);
    const startY = 580;
    
    // Property details section
    this.ctx.fillStyle = this.currentColors.text;
    this.ctx.font = 'bold 20px Arial, sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Property Details', 40, startY);
    
    // Draw details in a grid
    let currentY = startY + 40;
    let currentX = 40;
    const colWidth = (this.width - 80) / 2;
    
    // Left column
    if (details.bedrooms) {
      this.drawDetailItem('🛏️', `${details.bedrooms} Bedrooms`, currentX, currentY);
      currentY += 30;
    }
    
    if (details.bathrooms) {
      this.drawDetailItem('🚿', `${details.bathrooms} Bathrooms`, currentX, currentY);
      currentY += 30;
    }
    
    // Right column
    currentY = startY + 40;
    currentX = 40 + colWidth;
    
    if (details.sqft) {
      this.drawDetailItem('📏', `${details.sqft} sq ft`, currentX, currentY);
      currentY += 30;
    }
    
    // Features section
    if (details.features && details.features.length > 0) {
      this.ctx.fillStyle = this.currentColors.text;
      this.ctx.font = 'bold 18px Arial, sans-serif';
      this.ctx.textAlign = 'left';
      this.ctx.fillText('Features:', 40, startY + 160);
      
      details.features.slice(0, 6).forEach((feature, index) => {
        this.ctx.fillStyle = this.currentColors.lightText;
        this.ctx.font = '14px Arial, sans-serif';
        this.ctx.fillText(`✨ ${feature}`, 60, startY + 190 + (index * 25));
      });
    }
  }

  drawDetailItem(icon, text, x, y) {
    this.ctx.fillStyle = this.currentColors.accent;
    this.ctx.font = '16px Arial, sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(icon, x, y);
    
    this.ctx.fillStyle = this.currentColors.text;
    this.ctx.font = '14px Arial, sans-serif';
    this.ctx.fillText(text, x + 25, y);
  }

  drawAgentInfo(agentInfo) {
    if (!agentInfo) return;
    
    // Agent section background
    this.ctx.fillStyle = this.currentColors.header;
    this.ctx.fillRect(0, this.height - 200, this.width, 200);
    
    // Agent name and agency
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 24px Arial, sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(agentInfo.name || 'Your Name', 40, this.height - 160);
    
    this.ctx.font = '18px Arial, sans-serif';
    this.ctx.fillStyle = this.currentColors.accent;
    this.ctx.fillText(agentInfo.agency || 'Your Agency', 40, this.height - 135);
    
    // Contact information
    const contactY = this.height - 100;
    let contactX = 40;
    
    if (agentInfo.phone) {
      this.drawContactItem('📞', agentInfo.phone, contactX, contactY);
      contactX += 200;
    }
    
    if (agentInfo.email) {
      this.drawContactItem('✉️', agentInfo.email, contactX, contactY);
      contactX += 200;
    }
    
    if (agentInfo.website) {
      this.drawContactItem('🌐', agentInfo.website, contactX, contactY);
    }
    
    // Generated by ListGenie.ai
    this.ctx.fillStyle = '#64748b';
    this.ctx.font = '12px Arial, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Generated by ListGenie.ai', this.width / 2, this.height - 30);
  }

  drawContactItem(icon, text, x, y) {
    this.ctx.fillStyle = '#94a3b8';
    this.ctx.font = '14px Arial, sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(icon, x, y);
    
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '12px Arial, sans-serif';
    this.ctx.fillText(text, x + 20, y);
  }

  drawFooter() {
    // Add subtle footer line
    this.ctx.strokeStyle = this.currentColors.accent;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(40, this.height - 220);
    this.ctx.lineTo(this.width - 40, this.height - 220);
    this.ctx.stroke();
  }

  // Utility functions
  extractPropertyTitle(listing) {
    if (!listing) return 'Beautiful Property';
    
    const lines = listing.split('\n');
    for (const line of lines) {
      if (line.length > 10 && !line.includes(':') && !line.includes('bedroom') && !line.includes('bathroom')) {
        return line.trim();
      }
    }
    return 'Beautiful Property';
  }

  extractPrice(listing) {
    if (!listing) return null;
    
    const priceMatch = listing.match(/\$[\d,]+/);
    return priceMatch ? priceMatch[0] : null;
  }

  extractPropertyInfo(listing) {
    if (!listing) return {};
    
    const lines = listing.split('\n');
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
          lowerLine.includes('garden') || lowerLine.includes('fireplace') ||
          lowerLine.includes('deck') || lowerLine.includes('patio') ||
          lowerLine.includes('kitchen') || lowerLine.includes('bathroom') ||
          lowerLine.includes('bedroom') || lowerLine.includes('living')) {
        features.push(line.trim());
      }
      
      // Extract first line as potential address/title
      if (lines.indexOf(line) === 0 && line.length > 10 && !line.includes(':')) {
        address = line.trim();
      }
    });

    return { address, bedrooms, bathrooms, sqft, features };
  }
}

// Standalone function for easy use
export function generateFlyer(flyerData, style = 'modern') {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 800;
    
    const generator = new FlyerGenerator(canvas, style);
    const success = generator.generateFlyer(flyerData);
    
    if (success) {
      resolve(canvas.toDataURL('image/png', 0.95));
    } else {
      resolve(null);
    }
  });
}
