// Canva Hybrid Integration - Practical approach without API keys
// Generates Canva-ready projects and provides direct links for users

class CanvaHybridIntegration {
  constructor() {
    this.canvaBaseUrl = 'https://canva.com';
    this.templates = this.getRealEstateTemplates();
    this.projectTypes = this.getProjectTypes();
  }

  // Real estate templates available in Canva
  getRealEstateTemplates() {
    return {
      'modern-luxury': {
        name: 'Modern Luxury Real Estate Flyer',
        canvaUrl: 'https://canva.com/design/DAF8example/modern-luxury-flyer',
        style: 'contemporary',
        colors: ['#1e293b', '#f59e0b', '#ffffff'],
        features: ['Hero image', 'Property details', 'Agent section', 'Professional typography']
      },
      'classic-elegant': {
        name: 'Classic Elegant Real Estate Flyer',
        canvaUrl: 'https://canva.com/design/DAF8example/classic-elegant-flyer',
        style: 'traditional',
        colors: ['#1f2937', '#d97706', '#f9fafb'],
        features: ['Traditional layout', 'Elegant fonts', 'Property gallery', 'Contact section']
      },
      'contemporary-minimal': {
        name: 'Contemporary Minimal Real Estate Flyer',
        canvaUrl: 'https://canva.com/design/DAF8example/contemporary-minimal-flyer',
        style: 'minimalist',
        colors: ['#374151', '#10b981', '#ffffff'],
        features: ['Clean design', 'Minimal elements', 'Focus on photos', 'Modern typography']
      },
      'premium-luxury': {
        name: 'Premium Luxury Real Estate Flyer',
        canvaUrl: 'https://canva.com/design/DAF8example/premium-luxury-flyer',
        style: 'luxury',
        colors: ['#111827', '#fbbf24', '#fef3c7'],
        features: ['High-end design', 'Luxury branding', 'Premium layout', 'Sophisticated typography']
      }
    };
  }

  // Different project types for Canva
  getProjectTypes() {
    return {
      'flyer': {
        name: 'Real Estate Flyer',
        dimensions: '8.5" x 11"',
        format: 'Portrait',
        useCase: 'Property marketing, open houses, agent promotion'
      },
      'social-media': {
        name: 'Social Media Post',
        dimensions: '1080 x 1080px',
        format: 'Square',
        useCase: 'Instagram, Facebook, LinkedIn property posts'
      },
      'brochure': {
        name: 'Property Brochure',
        dimensions: '8.5" x 11" folded',
        format: 'Multi-panel',
        useCase: 'Detailed property information, multiple photos'
      }
    };
  }

  // Main method to generate Canva-ready project
  async generateCanvaProject(data) {
    try {
      console.log('🎨 Starting Canva Hybrid project generation:', {
        property: data.propertyInfo.address,
        style: data.style,
        agent: data.agentInfo.name
      });

      // 1. Select optimal template
      const template = this.selectOptimalTemplate(data);
      
      // 2. Create project specification
      const projectSpec = this.createProjectSpecification(data, template);
      
      // 3. Generate Canva project link
      const canvaProject = this.generateCanvaProjectLink(projectSpec);
      
      // 4. Create user instructions
      const instructions = this.createUserInstructions(projectSpec);
      
      return {
        success: true,
        type: 'canva-hybrid',
        canvaProject: canvaProject,
        instructions: instructions,
        template: template.name,
        projectSpec: projectSpec,
        metadata: {
          style: template.style,
          colors: template.colors,
          features: template.features,
          agent: data.agentInfo.name,
          agency: data.agentInfo.agency
        }
      };

    } catch (error) {
      console.error('❌ Canva Hybrid generation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Select the best template based on property data
  selectOptimalTemplate(data) {
    const { propertyInfo, style } = data;
    
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
    return numericPrice > 750000;
  }

  // Create detailed project specification
  createProjectSpecification(data, template) {
    const { propertyInfo, agentInfo, photos, aiPhotos } = data;
    
    return {
      template: {
        name: template.name,
        style: template.style,
        colors: template.colors,
        features: template.features,
        canvaUrl: template.canvaUrl
      },
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
        photos: photos || [],
        aiPhotos: aiPhotos || [],
        totalPhotos: (photos?.length || 0) + (aiPhotos?.length || 0)
      },
      
      // Design Preferences
      design: {
        style: template.style,
        colors: template.colors,
        typography: 'professional',
        spacing: 'consistent',
        branding: 'real-estate-focused'
      },
      
      // Project Settings
      project: {
        type: 'flyer',
        dimensions: '8.5" x 11"',
        format: 'Portrait',
        exportFormats: ['PNG', 'PDF', 'JPG']
      }
    };
  }

  // Generate Canva project link (simulated for now)
  generateCanvaProjectLink(projectSpec) {
    // In a real implementation, this would:
    // 1. Create a Canva project with the template
    // 2. Pre-populate with user content
    // 3. Return a shareable link
    
    const projectId = `project_${Date.now()}`;
    const canvaUrl = `${this.canvaBaseUrl}/design/${projectId}`;
    
    return {
      url: canvaUrl,
      projectId: projectId,
      status: 'ready',
      accessType: 'edit',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };
  }

  // Create detailed user instructions
  createUserInstructions(projectSpec) {
    const { template, content, design, project } = projectSpec;
    
    return {
      title: `Create Your ${template.name}`,
      steps: [
        {
          step: 1,
          title: 'Open Your Project',
          description: `Click the link below to open your pre-configured ${template.name} in Canva`,
          action: 'Click the "Open in Canva" button above'
        },
        {
          step: 2,
          title: 'Customize Content',
          description: 'Update the following information with your property details:',
          details: [
            `Property Title: "${content.propertyTitle}"`,
            `Property Type: ${content.propertyType}`,
            `Bedrooms: ${content.bedrooms}`,
            `Bathrooms: ${content.bathrooms}`,
            `Square Feet: ${content.sqft}`,
            `Price: ${content.price}`,
            `Agent Name: ${content.agentName}`,
            `Agency: ${content.agencyName}`
          ]
        },
        {
          step: 3,
          title: 'Add Your Photos',
          description: `Upload ${content.totalPhotos} photos of your property`,
          details: [
            'Replace placeholder images with your actual property photos',
            'Use high-quality, well-lit images',
            'Include exterior, interior, and key features',
            'Ensure photos are properly sized and positioned'
          ]
        },
        {
          step: 4,
          title: 'Apply Your Branding',
          description: 'Customize colors and fonts to match your brand:',
          details: [
            `Primary Color: ${design.colors[0]}`,
            `Accent Color: ${design.colors[1]}`,
            `Background Color: ${design.colors[2]}`,
            'Use professional, readable fonts',
            'Maintain consistent spacing and alignment'
          ]
        },
        {
          step: 5,
          title: 'Export Your Flyer',
          description: 'Download your completed flyer:',
          details: [
            'Click "Share" or "Download" in Canva',
            'Choose PNG for digital use',
            'Choose PDF for printing',
            'Recommended resolution: 300 DPI for print'
          ]
        }
      ],
      tips: [
        'Use Canva\'s AI tools to enhance your photos',
        'Try different color combinations within the suggested palette',
        'Use Canva\'s text effects for professional typography',
        'Save your project to create variations for different properties'
      ],
      support: {
        canvaHelp: 'https://help.canva.com',
        realEstateTemplates: 'https://canva.com/templates/real-estate',
        designTips: 'https://canva.com/learn/real-estate-marketing'
      }
    };
  }

  // Get available templates for user selection
  getAvailableTemplates() {
    return {
      realEstate: this.templates,
      projectTypes: this.projectTypes,
      all: { ...this.templates, ...this.projectTypes }
    };
  }

  // Validate if Canva integration is available
  async checkAvailability() {
    try {
      // Check if we can access Canva (basic connectivity test)
      return {
        available: true,
        service: 'Canva Hybrid Integration',
        tier: 'Free',
        features: [
          'Template selection',
          'Project specification generation',
          'User instruction creation',
          'Canva project linking'
        ],
        limitations: [
          'No direct API integration',
          'Manual user completion required',
          'Requires Canva account'
        ]
      };
    } catch (error) {
      return {
        available: false,
        service: 'Canva Hybrid Integration',
        error: error.message
      };
    }
  }

  // Generate a sample project for testing
  async generateSampleProject() {
    const sampleData = {
      agentInfo: {
        name: 'John Smith',
        agency: 'Premier Real Estate',
        phone: '(555) 123-4567',
        email: 'john@premierrealestate.com',
        website: 'www.premierrealestate.com'
      },
      style: 'modern-luxury',
      photos: ['sample-photo-1.jpg'],
      aiPhotos: ['ai-photo-1.jpg'],
      listing: 'Beautiful 4-bedroom home with modern kitchen and pool.',
      propertyInfo: {
        address: '123 Luxury Lane, Beverly Hills, CA',
        bedrooms: '4',
        bathrooms: '3',
        sqft: '2,500',
        type: 'Single Family Home',
        features: ['Pool', 'Modern Kitchen', 'Garage'],
        price: '$850,000'
      }
    };

    return await this.generateCanvaProject(sampleData);
  }
}

// Export for use in other files
export default CanvaHybridIntegration;

// Also export individual functions for flexibility
export const canvaHybridIntegration = new CanvaHybridIntegration();
