// pages/api/flyer.js
// Generates beautiful, professional AI-powered flyers using hybrid approach:
// 1. DALL-E 3 creates clean background design (no text)
// 2. Property details are overlaid programmatically

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

    console.log('🎨 Generating AI flyer background...');

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

    // Create a prompt for DALL-E 3 to generate ONLY a background design (no text)
    const backgroundPrompt = `Create a professional, modern real estate flyer BACKGROUND DESIGN with NO TEXT WHATSOEVER. 

Design requirements:
- High-end, professional real estate marketing style
- Clean, modern layout with elegant design elements
- Sophisticated color scheme (deep blues, golds, or classic black/white)
- Include a prominent property photo placeholder area at the top
- Create clear, well-defined empty text areas for property details
- Space for contact information at bottom
- Premium branding feel with subtle gradients or textures
- Layout suitable for both digital sharing and printing
- Professional real estate agency aesthetic
- ABSOLUTELY NO TEXT - only visual design elements

Style: Ultra-modern, luxury real estate marketing material, photorealistic quality, clean design, sophisticated layout with clear empty text placement areas.`;

    console.log('🎯 Generating background design with DALL-E 3...');
    console.log('🎯 Background prompt:', backgroundPrompt.substring(0, 200) + '...');

    // Generate the background design using DALL-E 3
    console.log('🎯 Calling OpenAI API for background...');
    const imageResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: backgroundPrompt,
      size: "1024x1792", // Portrait orientation, good for flyers
      quality: "hd",
      n: 1,
    });

    console.log('🎯 OpenAI API response received:', imageResponse);

    const backgroundImageUrl = imageResponse.data[0].url;
    console.log('✅ Background design generated successfully!');
    console.log('🎨 Background image URL:', backgroundImageUrl);

    // For now, return the background image
    // In a full implementation, we would:
    // 1. Download the background image
    // 2. Use a library like Canvas or Sharp to overlay text
    // 3. Create the final flyer with real property details
    // 4. Return the completed flyer

    // Return the generated flyer information
    res.status(200).json({
      success: true,
      flyer: {
        imageUrl: backgroundImageUrl,
        propertyDetails: propertyInfo,
        listing: listing,
        generatedAt: new Date().toISOString(),
        note: "Background design generated. Text overlay coming in next iteration."
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

