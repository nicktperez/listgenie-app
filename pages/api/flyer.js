// pages/api/flyer.js
// Enhanced Professional Flyer Generator using Template System
// Generates high-quality, professional real estate flyers with user customization

export default async function handler(req, res) {
  console.log('🎨 Enhanced Flyer API endpoint hit:', { method: req.method, url: req.url });
  
  if (req.method !== 'POST') {
    console.log('🎨 Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { agentInfo, style, photos, listing } = req.body;
    console.log('🎨 Received flyer request:', { 
      hasAgentInfo: !!agentInfo, 
      style, 
      photoCount: photos?.length || 0,
      listingLength: listing?.length || 0
    });

    if (!listing) {
      return res.status(400).json({ error: 'Listing content is required' });
    }

    if (!agentInfo || !agentInfo.name || !agentInfo.agency) {
      return res.status(400).json({ error: 'Agent information (name and agency) is required' });
    }

    console.log('🎨 Generating professional flyer with template system...');

    // Extract property information from the listing
    const propertyInfo = extractPropertyInfo(listing);
    console.log('🎨 Extracted property info:', propertyInfo);

    // For now, we'll return a success response with instructions
    // In the full implementation, this would generate the actual flyer image
    // using the client-side template system
    
    res.status(200).json({
      success: true,
      flyer: {
        type: 'template-generated',
        style: style || 'modern',
        agentInfo,
        propertyInfo,
        photoCount: photos?.length || 0,
        listing: listing.substring(0, 200) + '...',
        generatedAt: new Date().toISOString(),
        note: "Template system ready. Client-side generation will create the actual flyer image.",
        nextStep: "The client will now generate the flyer using our professional template system."
      }
    });

  } catch (error) {
    console.error('🎨 Error in enhanced flyer generation:', error);
    console.error('🎨 Error stack:', error.stack);
    
    let errorMessage = 'Failed to generate flyer';
    if (error.message.includes('validation')) {
      errorMessage = 'Invalid input data - please check your information';
    } else if (error.message.includes('template')) {
      errorMessage = 'Template system error - please try again';
    }

    res.status(500).json({ 
      error: errorMessage,
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// Utility function to extract property information from listing text
function extractPropertyInfo(listingText) {
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
        lowerLine.includes('garden') || lowerLine.includes('fireplace') ||
        lowerLine.includes('deck') || lowerLine.includes('patio')) {
      features.push(line.trim());
    }
    
    // Extract first line as potential address/title
    if (lines.indexOf(line) === 0 && line.length > 10 && !line.includes(':')) {
      address = line.trim();
    }
  });

  return { address, bedrooms, bathrooms, sqft, features };
}

