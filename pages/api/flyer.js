// API endpoint for professional AI-powered flyer generation
// Integrates with Canva AI for real estate marketing materials

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { agentInfo, style, photos, listing, aiPhotos } = req.body;

    // Validate required data
    if (!agentInfo || !agentInfo.name || !agentInfo.agency || !listing) {
      return res.status(400).json({ 
        error: 'Missing required information: agent name, agency, and listing are required' 
      });
    }

    console.log('🎨 Starting AI-powered flyer generation:', {
      agent: agentInfo.name,
      agency: agentInfo.agency,
      style,
      hasPhotos: photos?.length > 0,
      hasAiPhotos: aiPhotos?.length > 0
    });

    // Extract property information for AI prompt
    const propertyInfo = extractPropertyInfo(listing);
    
    // Generate professional flyer using AI service
    const flyerResult = await generateAIFlyer({
      agentInfo,
      propertyInfo,
      style,
      photos: photos || [],
      aiPhotos: aiPhotos || []
    });

    if (flyerResult.success) {
      return res.status(200).json({
        success: true,
        message: 'Professional flyer generated successfully',
        flyerUrl: flyerResult.flyerUrl,
        metadata: {
          style,
          agent: agentInfo.name,
          agency: agentInfo.agency,
          propertyType: propertyInfo.type || 'Residential',
          generatedAt: new Date().toISOString()
        }
      });
    } else {
      throw new Error(flyerResult.error || 'Failed to generate flyer');
    }

  } catch (error) {
    console.error('❌ Flyer generation error:', error);
    return res.status(500).json({
      error: 'Failed to generate professional flyer',
      details: error.message
    });
  }
}

// Extract property information from listing text
function extractPropertyInfo(listingText) {
  if (!listingText) return {};
  
  const lines = listingText.split('\n');
  let address = 'Beautiful Property';
  let bedrooms = '';
  let bathrooms = '';
  let sqft = '';
  let type = 'Residential';
  let features = [];
  let price = '';

  lines.forEach(line => {
    const lowerLine = line.toLowerCase();
    
    // Extract price
    if (lowerLine.includes('$') || lowerLine.includes('price')) {
      const priceMatch = line.match(/\$[\d,]+/);
      if (priceMatch) price = priceMatch[0];
    }
    
    // Extract bedrooms
    if (lowerLine.includes('bedroom')) {
      const match = line.match(/(\d+)\s*bedroom/i);
      if (match) bedrooms = match[1];
    }
    
    // Extract bathrooms
    if (lowerLine.includes('bathroom')) {
      const match = line.match(/(\d+)\s*bathroom/i);
      if (match) bathrooms = match[1];
    }
    
    // Extract square footage
    if (lowerLine.includes('sq ft') || lowerLine.includes('square feet')) {
      const match = line.match(/(\d+[\d,]*)\s*(sq ft|square feet)/i);
      if (match) sqft = match[1];
    }
    
    // Determine property type
    if (lowerLine.includes('condo') || lowerLine.includes('apartment')) {
      type = 'Condo/Apartment';
    } else if (lowerLine.includes('house') || lowerLine.includes('home')) {
      type = 'Single Family Home';
    } else if (lowerLine.includes('townhouse') || lowerLine.includes('townhome')) {
      type = 'Townhouse';
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

  return { address, bedrooms, bathrooms, sqft, type, features, price };
}

// Generate professional flyer using Canva Hybrid Integration
async function generateAIFlyer(data) {
  try {
    console.log('🎨 Canva Hybrid Flyer Generation Request:', {
      property: data.propertyInfo.address,
      style: data.style,
      agent: data.agentInfo.name,
      photos: data.photos.length + data.aiPhotos.length
    });

    // For now, return a hardcoded Canva Hybrid response to test the flow
    console.log('🎨 Returning hardcoded Canva Hybrid response for testing');
    
    return {
      success: true,
      message: 'Canva project created successfully',
      type: 'canva-hybrid',
      canvaProject: {
        url: 'https://canva.com/design/test-project',
        projectId: 'test_project_123',
        status: 'ready',
        accessType: 'edit',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      },
      instructions: {
        title: 'Create Your Modern Luxury Real Estate Flyer',
        steps: [
          {
            step: 1,
            title: 'Open Your Project',
            description: 'Click the link below to open your pre-configured Modern Luxury Real Estate Flyer in Canva',
            action: 'Click the "Open in Canva" button above'
          }
        ],
        tips: ['Use Canva\'s AI tools to enhance your photos', 'Try different color combinations within the suggested palette'],
        support: {
          canvaHelp: 'https://help.canva.com',
          realEstateTemplates: 'https://canva.com/templates/real-estate'
        }
      },
      template: 'Modern Luxury Real Estate Flyer',
      metadata: {
        style: 'contemporary',
        colors: ['#1e293b', '#f59e0b', '#ffffff'],
        features: ['Hero image', 'Property details', 'Agent section', 'Professional typography'],
        agent: data.agentInfo.name,
        agency: data.agentInfo.agency
      }
    };

  } catch (error) {
    console.error('❌ Canva Hybrid generation failed:', error);
    
    return {
      success: false,
      error: error.message,
      note: 'Canva Hybrid generation failed. Please try again later.'
    };
  }
}

// TODO: Implement actual AI service integrations

// Example Canva AI integration (when API is available)
async function callCanvaAI(data) {
  // This would integrate with Canva's AI design API
  // const response = await fetch('https://api.canva.com/v1/ai/designs', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${process.env.CANVA_API_KEY}`,
  //     'Content-Type': 'application/json'
  //   },
  //   body: JSON.stringify({
  //     template: 'real-estate-flyer',
  //     style: data.style,
  //     content: {
  //       agentName: data.agentInfo.name,
  //       agencyName: data.agentInfo.agency,
  //       propertyAddress: data.propertyInfo.address,
  //       bedrooms: data.propertyInfo.bedrooms,
  //       bathrooms: data.propertyInfo.bathrooms,
  //       squareFeet: data.propertyInfo.sqft,
  //       features: data.propertyInfo.features,
  //       price: data.propertyInfo.price
  //     },
  //     photos: [...data.photos, ...data.aiPhotos]
  //   })
  // });
  
  // return await response.json();
}

// Example Adobe Express AI integration (when API is available)
async function callAdobeExpressAI(data) {
  // This would integrate with Adobe Express AI design API
  // Similar structure to Canva but with Adobe's specific API
}

