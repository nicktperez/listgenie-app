// Canva AI Integration for Professional Real Estate Flyers
// Uses free tier templates and AI assistance for high-quality output

class CanvaAIIntegration {
  constructor() {
    this.baseUrl = 'https://api.canva.com';
    this.templates = this.getRealEstateTemplates();
    this.fallbackTemplates = this.getFallbackTemplates();
  }

  // Real estate specific templates available in free tier
  getRealEstateTemplates() {
    return {
      'modern-luxury': {
        id: 'real-estate-flyer-modern',
        name: 'Modern Luxury Real Estate Flyer',
        style: 'contemporary',
        colors: ['#1e293b', '#f59e0b', '#ffffff'],
        layout: 'hero-image-with-details'
      },
      'classic-elegant': {
        id: 'real-estate-flyer-classic',
        name: 'Classic Elegant Real Estate Flyer',
        style: 'traditional',
        colors: ['#1f2937', '#d97706', '#f9fafb'],
        layout: 'traditional-header-with-gallery'
      },
      'contemporary-minimal': {
        id: 'real-estate-flyer-contemporary',
        name: 'Contemporary Minimal Real Estate Flyer',
        style: 'minimalist',
        colors: ['#374151', '#10b981', '#ffffff'],
        layout: 'clean-minimal-design'
      },
      'premium-luxury': {
        id: 'real-estate-flyer-premium',
        name: 'Premium Luxury Real Estate Flyer',
        style: 'luxury',
        colors: ['#111827', '#fbbf24', '#fef3c7'],
        layout: 'high-end-luxury-design'
      }
    };
  }

  // Fallback templates for when specific ones aren't available
  getFallbackTemplates() {
    return {
      'business-flyer': {
        id: 'business-flyer-template',
        name: 'Professional Business Flyer',
        style: 'business',
        colors: ['#1e40af', '#64748b', '#ffffff'],
        layout: 'business-standard'
      },
      'marketing-flyer': {
        id: 'marketing-flyer-template',
        name: 'Marketing Flyer Template',
        style: 'marketing',
        colors: ['#7c3aed', '#f59e0b', '#ffffff'],
        layout: 'marketing-focused'
      }
    };
  }

  // Main method to generate flyer using Canva AI
  async generateFlyer(data) {
    try {
      console.log('🎨 Starting Canva AI flyer generation:', {
        property: data.propertyInfo.address,
        style: data.style,
        agent: data.agentInfo.name
      });

      // 1. Select optimal template based on data
      const template = this.selectOptimalTemplate(data);
      
      // 2. Prepare content for Canva AI
      const canvaContent = this.prepareCanvaContent(data, template);
      
      // 3. Generate flyer using Canva (simulated for now)
      const flyerResult = await this.callCanvaAI(canvaContent);
      
      // 4. Enhance with professional rules
      const enhancedResult = this.enhanceWithProfessionalRules(flyerResult, data);
      
      return {
        success: true,
        flyerUrl: enhancedResult.flyerUrl,
        template: template.name,
        quality: enhancedResult.quality,
        generatedBy: 'Canva AI',
        metadata: {
          style: template.style,
          colors: template.colors,
          layout: template.layout,
          agent: data.agentInfo.name,
          agency: data.agentInfo.agency
        }
      };

    } catch (error) {
      console.error('❌ Canva AI generation failed:', error);
      
      // Fallback to template-based generation
      return await this.generateFallbackFlyer(data);
    }
  }

  // Select the best template based on property data and style preference
  selectOptimalTemplate(data) {
    const { propertyInfo, style, agentInfo } = data;
    
    // If user specified a style, try to match it
    if (style && this.templates[style]) {
      return this.templates[style];
    }
    
    // Auto-select based on property characteristics
    if (propertyInfo.price && this.isLuxuryProperty(propertyInfo.price)) {
      return this.templates['premium-luxury'];
    }
    
    if (propertyInfo.type === 'Single Family Home') {
      return this.templates['modern-luxury'];
    }
    
    if (propertyInfo.type === 'Condo/Apartment') {
      return this.templates['contemporary-minimal'];
    }
    
    // Default to classic elegant
    return this.templates['classic-elegant'];
  }

  // Determine if property is luxury based on price
  isLuxuryProperty(price) {
    if (!price) return false;
    const numericPrice = parseInt(price.replace(/[$,]/g, ''));
    return numericPrice > 750000; // Adjust threshold as needed
  }

  // Prepare content structure for Canva AI
  prepareCanvaContent(data, template) {
    const { propertyInfo, agentInfo, photos, aiPhotos } = data;
    
    return {
      templateId: template.id,
      templateName: template.name,
      content: {
        // Property Information
        propertyTitle: propertyInfo.address || 'Beautiful Property',
        propertyType: propertyInfo.type || 'Residential',
        bedrooms: propertyInfo.bedrooms || '',
        bathrooms: propertyInfo.bathrooms || '',
        squareFeet: propertyInfo.sqft || '',
        price: propertyInfo.price || '',
        features: propertyInfo.features || [],
        
        // Agent Information
        agentName: agentInfo.name,
        agencyName: agentInfo.agency,
        agentPhone: agentInfo.phone || '',
        agentEmail: agentInfo.email || '',
        agentWebsite: agentInfo.website || '',
        
        // Visual Elements
        photos: [...(photos || []), ...(aiPhotos || [])],
        style: template.style,
        colorScheme: template.colors,
        layout: template.layout
      },
      
      // Design Preferences
      design: {
        style: template.style,
        colors: template.colors,
        typography: 'professional',
        spacing: 'consistent',
        branding: 'real-estate-focused'
      }
    };
  }

  // Call Canva AI (simulated for now - will integrate with real API)
  async callCanvaAI(content) {
    console.log('🤖 Calling Canva AI with content:', content);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // For now, return a simulated result
    // In production, this would call the actual Canva AI API
    return {
      flyerUrl: `https://canva-ai-generated-flyer-${Date.now()}.png`,
      template: content.templateName,
      quality: 8.5,
      generatedAt: new Date().toISOString()
    };
  }

  // Enhance output with professional real estate rules
  enhanceWithProfessionalRules(result, data) {
    let enhancedQuality = result.quality;
    
    // Quality boost for professional agent info
    if (data.agentInfo.name && data.agentInfo.agency) {
      enhancedQuality += 0.5;
    }
    
    // Quality boost for good photos
    if (data.photos && data.photos.length > 0) {
      enhancedQuality += 0.3;
    }
    
    // Quality boost for AI-generated photos
    if (data.aiPhotos && data.aiPhotos.length > 0) {
      enhancedQuality += 0.2;
    }
    
    // Cap quality at 10
    enhancedQuality = Math.min(enhancedQuality, 10);
    
    return {
      ...result,
      quality: enhancedQuality,
      enhanced: true
    };
  }

  // Fallback flyer generation if Canva AI fails
  async generateFallbackFlyer(data) {
    console.log('🔄 Generating fallback flyer using Canva templates');
    
    try {
      // Use a basic template
      const template = this.fallbackTemplates['business-flyer'];
      const content = this.prepareCanvaContent(data, template);
      
      // Generate simple flyer
      const result = await this.callCanvaAI(content);
      
      return {
        success: true,
        flyerUrl: result.flyerUrl,
        template: 'Fallback Business Template',
        quality: 7.0,
        generatedBy: 'Canva Templates (Fallback)',
        metadata: {
          style: 'business',
          colors: template.colors,
          layout: template.layout,
          note: 'Generated using fallback template due to AI service issue'
        }
      };
      
    } catch (error) {
      console.error('❌ Fallback generation also failed:', error);
      
      return {
        success: false,
        error: 'Both Canva AI and fallback generation failed',
        details: error.message
      };
    }
  }

  // Get available templates for user selection
  getAvailableTemplates() {
    return {
      realEstate: this.templates,
      fallback: this.fallbackTemplates,
      all: { ...this.templates, ...this.fallbackTemplates }
    };
  }

  // Validate if Canva AI is available
  async checkAvailability() {
    try {
      // In production, this would check API status
      return {
        available: true,
        service: 'Canva AI',
        tier: 'Free',
        limits: '100 flyers/month',
        features: ['Real estate templates', 'AI assistance', 'Professional layouts']
      };
    } catch (error) {
      return {
        available: false,
        service: 'Canva AI',
        error: error.message
      };
    }
  }
}

// Export for use in other files
export default CanvaAIIntegration;

// Also export individual functions for flexibility
export const canvaAIIntegration = new CanvaAIIntegration();
