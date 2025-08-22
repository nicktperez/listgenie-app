// AI-Powered Flyer Generator using DALL-E 3
// Creates professional, complete flyers with AI-generated design and content

class AIFlyerGenerator {
  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.flyerStyles = this.getFlyerStyles();
  }

  // Professional flyer styles for AI generation
  getFlyerStyles() {
    return {
      'modern-luxury': {
        name: 'Modern Luxury Real Estate Flyer',
        description: 'Contemporary, high-end design with luxury aesthetics, clean lines, and premium typography',
        visualStyle: 'modern luxury real estate marketing, clean design, premium typography, professional layout',
        colorScheme: 'sophisticated color palette with gold accents, dark blues, and whites'
      },
      'classic-elegant': {
        name: 'Classic Elegant Real Estate Flyer',
        description: 'Traditional, timeless design with elegant fonts and sophisticated layout',
        visualStyle: 'classic elegant real estate design, traditional layout, sophisticated typography, timeless appeal',
        colorScheme: 'traditional colors with warm tones, deep blues, and cream backgrounds'
      },
      'contemporary-minimal': {
        name: 'Contemporary Minimal Real Estate Flyer',
        description: 'Clean, minimalist design focusing on content and modern aesthetics',
        visualStyle: 'contemporary minimal real estate flyer, clean lines, minimal design, focus on content',
        colorScheme: 'minimal color palette with whites, grays, and accent colors'
      },
      'premium-luxury': {
        name: 'Premium Luxury Real Estate Flyer',
        description: 'Ultra-premium design with luxury branding and sophisticated visual elements',
        visualStyle: 'premium luxury real estate marketing, high-end design, sophisticated layout, luxury branding',
        colorScheme: 'luxury color palette with gold, silver, deep blacks, and premium accents'
      }
    };
  }

  // Main method to generate AI-powered flyer
  async generateAIFlyer(data) {
    try {
      console.log('🎨 Starting AI-powered flyer generation:', data);
      
      // Select style
      const style = this.selectStyle(data.style);
      
      // Create comprehensive AI prompt
      const aiPrompt = this.createAIPrompt(data, style);
      
      // Generate flyer with DALL-E 3
      const flyerImage = await this.generateWithDALLE3(aiPrompt, style);
      
      return {
        success: true,
        type: 'ai-generated-flyer',
        flyer: {
          imageUrl: flyerImage.url,
          prompt: aiPrompt,
          style: style.name,
          filename: `ai-flyer-${data.style}-${Date.now()}.png`
        },
        metadata: {
          style: style.name,
          description: style.description,
          agent: data.agentInfo.name,
          agency: data.agentInfo.agency
        }
      };

    } catch (error) {
      console.error('❌ AI flyer generation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Select the best style
  selectStyle(style) {
    if (style && this.flyerStyles[style]) {
      return this.flyerStyles[style];
    }
    return this.flyerStyles['classic-elegant'];
  }

  // Create comprehensive AI prompt for DALL-E 3
  createAIPrompt(data, style) {
    const { propertyInfo, agentInfo, photos, listing } = data;
    
    // Extract key property details
    const propertyDetails = this.extractPropertyDetails(propertyInfo, listing);
    
    // Create the main prompt
    let prompt = `Create a professional real estate marketing flyer with the following specifications:

STYLE: ${style.description}
VISUAL STYLE: ${style.visualStyle}
COLOR SCHEME: ${style.colorScheme}

FLYER CONTENT:
- Main Title: "EXCLUSIVE PROPERTY"
- Property Address: "${propertyDetails.address}"
- Property Type: ${propertyDetails.type}
- Bedrooms: ${propertyDetails.bedrooms}
- Bathrooms: ${propertyDetails.bathrooms}
- Square Feet: ${propertyDetails.sqft}
- Price: ${propertyDetails.price}
- Key Features: ${propertyDetails.features.join(', ')}

AGENT INFORMATION:
- Agent Name: ${agentInfo.name}
- Agency: ${agentInfo.agency}
- Contact: ${agentInfo.phone || 'Contact for details'}

DESIGN REQUIREMENTS:
- Professional real estate marketing layout
- Clean, readable typography
- Professional color scheme
- Include placeholder areas for property photos
- Modern, attractive design that would appeal to buyers
- 8.5" x 11" flyer format, portrait orientation
- High-quality, print-ready design
- Include decorative elements and professional styling
- Make it look like it was created by a professional marketing agency

The flyer should be visually appealing, professional, and immediately convey the quality and value of the property.`;

    return prompt;
  }

  // Extract property information from listing and user input
  extractPropertyDetails(propertyInfo, listing) {
    // Start with user-provided property info
    let details = {
      address: propertyInfo.address || 'Beautiful Property Available',
      type: propertyInfo.type || 'Residential Property',
      bedrooms: propertyInfo.bedrooms || '3',
      bathrooms: propertyInfo.bathrooms || '2',
      sqft: propertyInfo.sqft || '2,000',
      price: propertyInfo.price || '$500,000',
      features: propertyInfo.features || ['Modern Kitchen', 'Garage', 'Backyard']
    };

    // If we have listing text, try to extract additional details
    if (listing) {
      const extracted = this.parseListingText(listing);
      
      // Merge extracted info with user input
      details = {
        ...details,
        ...extracted
      };
    }

    return details;
  }

  // Parse listing text to extract property details
  parseListingText(listingText) {
    if (!listingText) return {};
    
    const lines = listingText.split('\n');
    let extracted = {};
    
    lines.forEach(line => {
      const lowerLine = line.toLowerCase();
      
      // Extract price
      if (lowerLine.includes('$') || lowerLine.includes('price')) {
        const priceMatch = line.match(/\$[\d,]+/);
        if (priceMatch) extracted.price = priceMatch[0];
      }
      
      // Extract bedrooms
      if (lowerLine.includes('bedroom')) {
        const match = line.match(/(\d+)\s*bedroom/i);
        if (match) extracted.bedrooms = match[1];
      }
      
      // Extract bathrooms
      if (lowerLine.includes('bathroom')) {
        const match = line.match(/(\d+)\s*bathroom/i);
        if (match) extracted.bathrooms = match[1];
      }
      
      // Extract square footage
      if (lowerLine.includes('sq ft') || lowerLine.includes('square feet')) {
        const match = line.match(/(\d+[\d,]*)\s*(sq ft|square feet)/i);
        if (match) extracted.sqft = match[1];
      }
      
      // Determine property type
      if (lowerLine.includes('condo') || lowerLine.includes('apartment')) {
        extracted.type = 'Condo/Apartment';
      } else if (lowerLine.includes('house') || lowerLine.includes('home')) {
        extracted.type = 'Single Family Home';
      } else if (lowerLine.includes('townhouse') || lowerLine.includes('townhome')) {
        extracted.type = 'Townhouse';
      }
      
      // Extract first line as potential address/title
      if (lines.indexOf(line) === 0 && line.length > 10 && !line.includes(':')) {
        extracted.address = line.trim();
      }
    });
    
    return extracted;
  }

  // Generate flyer using DALL-E 3
  async generateWithDALLE3(prompt, style) {
    try {
      if (!this.openaiApiKey) {
        throw new Error('OpenAI API key not configured');
      }

      console.log('🎨 Calling DALL-E 3 with prompt:', prompt.substring(0, 200) + '...');

      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: prompt,
          n: 1,
          size: '1024x1024',
          quality: 'hd',
          style: 'natural'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`DALL-E 3 API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ DALL-E 3 generation successful:', data);

      return {
        url: data.data[0].url,
        revisedPrompt: data.data[0].revised_prompt
      };

    } catch (error) {
      console.error('❌ DALL-E 3 generation failed:', error);
      throw error;
    }
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
      photos: ['photo1.jpg', 'photo2.jpg', 'photo3.jpg'],
      listing: 'Beautiful 4-bedroom home with modern kitchen and pool.'
    };

    return await this.generateAIFlyer(sampleData);
  }

  // Check if AI generation is available
  async checkAvailability() {
    try {
      return {
        available: !!this.openaiApiKey,
        service: 'DALL-E 3 AI Flyer Generation',
        tier: 'Professional',
        features: [
          'AI-generated professional flyer designs',
          'Custom content integration',
          'Multiple style options',
          'High-quality output',
          'Professional real estate marketing aesthetics'
        ],
        limitations: [
          'Requires OpenAI API key',
          'Generation time: 10-30 seconds',
          'API usage costs apply'
        ]
      };
    } catch (error) {
      return {
        available: false,
        service: 'DALL-E 3 AI Flyer Generation',
        error: error.message
      };
    }
  }
}

// Export for use in other files
export default AIFlyerGenerator;

// Also export individual functions for flexibility
export const aiFlyerGenerator = new AIFlyerGenerator();
