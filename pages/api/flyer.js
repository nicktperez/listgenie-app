// pages/api/flyer.js
// Generates beautiful, professional AI-powered flyers using OpenAI DALL-E 3

import OpenAI from 'openai';

export default async function handler(req, res) {
  console.log('🎨 API endpoint hit:', { method: req.method, url: req.url });
  
  if (req.method !== 'POST') {
    console.log('🎨 Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.error('🎨 Missing OPENAI_API_KEY environment variable');
      return res.status(500).json({ 
        error: 'OpenAI API key not configured',
        details: 'OPENAI_API_KEY environment variable is missing'
      });
    }

    console.log('🎨 OpenAI API key found:', process.env.OPENAI_API_KEY ? 'YES' : 'NO');

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const { listing } = req.body;
    console.log('🎨 Received listing:', listing ? listing.substring(0, 100) : 'NO LISTING');

    if (!listing) {
      return res.status(400).json({ error: 'Listing content is required' });
    }

    console.log('🎨 Generating AI flyer for listing...');

    // Extract key details from the listing for the image prompt
    const extractPropertyInfo = (listingText) => {
      const lines = listingText.split('\n');
      let address = 'Beautiful Property';
      let bedrooms = '';
      let bathrooms = '';
      let sqft = '';
      let features = [];

      lines.forEach(line => {
        if (line.toLowerCase().includes('bedroom')) {
          const match = line.match(/(\d+)\s*bedroom/i);
          if (match) bedrooms = match[1];
        }
        if (line.toLowerCase().includes('bathroom')) {
          const match = line.match(/(\d+)\s*bathroom/i);
          if (match) bathrooms = match[1];
        }
        if (line.toLowerCase().includes('sq ft') || line.toLowerCase().includes('square feet')) {
          const match = line.match(/(\d+[\d,]*)\s*(sq ft|square feet)/i);
          if (match) sqft = match[1];
        }
        // Extract first line as potential address/title
        if (lines.indexOf(line) === 0 && line.length > 10) {
          address = line.trim();
        }
      });

      return { address, bedrooms, bathrooms, sqft, features };
    };

    const propertyInfo = extractPropertyInfo(listing);
    console.log('🎨 Extracted property info:', propertyInfo);

    // Create a detailed prompt for DALL-E 3 to generate a professional real estate flyer image
    const imagePrompt = `Create a professional, modern real estate flyer design with elegant typography and premium layout. 

IMPORTANT: This is a real estate flyer for an actual property. The design should be clean and professional, with clear areas for text content, but DO NOT generate any text content yourself. Focus on creating a beautiful layout with placeholder areas for the property information.

Property details to incorporate in the design layout:
- Property: ${propertyInfo.address}
- ${propertyInfo.bedrooms ? `${propertyInfo.bedrooms} Bedrooms` : ''}
- ${propertyInfo.bathrooms ? `${propertyInfo.bathrooms} Bathrooms` : ''}
- ${propertyInfo.sqft ? `${propertyInfo.sqft} Sq Ft` : ''}

Design requirements:
- High-end, professional real estate marketing style
- Clean, modern layout with elegant design elements
- Sophisticated color scheme (deep blues, golds, or classic black/white)
- Include a prominent property photo placeholder area at the top
- Add "FOR SALE" or "AVAILABLE" prominently in the design
- Create clear, well-defined text areas for property details
- Space for contact information at bottom
- Premium branding feel with subtle gradients or textures
- Layout suitable for both digital sharing and printing
- Professional real estate agency aesthetic
- Focus on visual design and layout, NOT text generation

Style: Ultra-modern, luxury real estate marketing material, photorealistic quality, clean design, sophisticated layout with clear text placement areas.`;

    console.log('🎯 Generating flyer image with DALL-E 3...');
    console.log('🎯 Image prompt:', imagePrompt.substring(0, 200) + '...');

    // Generate the flyer image using DALL-E 3
    console.log('🎯 Calling OpenAI API...');
    const imageResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: imagePrompt,
      size: "1024x1792", // Portrait orientation, good for flyers
      quality: "hd",
      n: 1,
    });

    console.log('🎯 OpenAI API response received:', imageResponse);

    const imageUrl = imageResponse.data[0].url;
    console.log('✅ Flyer generated successfully!');
    console.log('🎨 Image URL:', imageUrl);

    // Return the generated flyer information
    res.status(200).json({
      success: true,
      flyer: {
        imageUrl: imageUrl,
        propertyDetails: propertyInfo,
        listing: listing,
        generatedAt: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('🎨 Error generating flyer:', error);
    console.error('🎨 Error stack:', error.stack);
    console.error('🎨 Error name:', error.name);
    console.error('🎨 Error message:', error.message);
    
    let errorMessage = 'Failed to generate flyer';
    if (error.message.includes('billing')) {
      errorMessage = 'OpenAI billing issue - please check your account';
    } else if (error.message.includes('rate limit')) {
      errorMessage = 'Rate limit exceeded - please try again in a moment';
    } else if (error.message.includes('content policy')) {
      errorMessage = 'Content policy violation - please check your listing content';
    } else if (error.message.includes('api key')) {
      errorMessage = 'OpenAI API key issue - please check configuration';
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('fetch')) {
      errorMessage = 'Network error - please check your connection';
    }

    res.status(500).json({ 
      error: errorMessage,
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

