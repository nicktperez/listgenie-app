// pages/api/generate-property-photos.js
// AI Property Photo Generator using DALL-E 3
// Generates clean, realistic property photos (no text, no flyer elements)

import OpenAI from 'openai';

export default async function handler(req, res) {
  console.log('📸 AI Property Photo API endpoint hit:', { method: req.method, url: req.url });
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.error('📸 Missing OPENAI_API_KEY environment variable');
      return res.status(500).json({ 
        error: 'OpenAI API key not configured',
        details: 'OPENAI_API_KEY environment variable is missing'
      });
    }

    console.log('📸 OpenAI API key found:', process.env.OPENAI_API_KEY ? 'YES' : 'NO');

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const { propertyInfo, style, count = 3 } = req.body;
    console.log('📸 Received photo generation request:', { propertyInfo, style, count });
    
    if (!propertyInfo) {
      return res.status(400).json({ error: 'Property information is required' });
    }

    console.log('📸 Generating AI property photos...');

    // Create smart prompts for property photos (no text, no flyer elements)
    const photoPrompts = [];
    
    // Generate different types of property photos
    const photoTypes = [
      {
        type: 'exterior',
        description: 'beautiful exterior view of the property',
        prompt: `Create a stunning, photorealistic ${propertyInfo.bedrooms || 'modern'}-bedroom ${style || 'contemporary'} home exterior. 
        Style: ${style || 'modern'}, Quality: ultra-realistic, Professional real estate photography.
        NO TEXT, NO SIGNS, NO FLYER ELEMENTS, NO WATERMARKS.
        Just a clean, beautiful property photo suitable for real estate marketing.
        Include: ${propertyInfo.features?.slice(0, 3).join(', ') || 'modern architecture, well-maintained landscaping, professional lighting'}.`
      },
      {
        type: 'interior',
        description: 'elegant interior living space',
        prompt: `Create a beautiful, photorealistic interior of a ${propertyInfo.bedrooms || 'modern'}-bedroom ${style || 'contemporary'} home.
        Style: ${style || 'modern'}, Quality: ultra-realistic, Professional real estate photography.
        NO TEXT, NO SIGNS, NO FLYER ELEMENTS, NO WATERMARKS.
        Just a clean, elegant interior photo suitable for real estate marketing.
        Show: spacious living area, modern finishes, natural light, ${propertyInfo.features?.slice(0, 2).join(', ') || 'quality craftsmanship'}.`
      },
      {
        type: 'feature',
        description: 'highlighted property feature',
        prompt: `Create a stunning, photorealistic photo highlighting a key feature of a ${style || 'modern'} home.
        Style: ${style || 'modern'}, Quality: ultra-realistic, Professional real estate photography.
        NO TEXT, NO SIGNS, NO FLYER ELEMENTS, NO WATERMARKS.
        Just a clean, beautiful feature photo suitable for real estate marketing.
        Feature: ${propertyInfo.features?.[0] || 'modern kitchen'} with ${style || 'contemporary'} design aesthetic.`
      }
    ];

    // Generate photos using DALL-E 3
    const generatedPhotos = [];
    
    for (let i = 0; i < Math.min(count, photoTypes.length); i++) {
      const photoType = photoTypes[i];
      console.log(`📸 Generating ${photoType.type} photo with prompt:`, photoType.prompt.substring(0, 100) + '...');
      
      try {
        const imageResponse = await openai.images.generate({
          model: "dall-e-3",
          prompt: photoType.prompt,
          size: "1024x1024", // Square format, good for various layouts
          quality: "hd",
          n: 1,
        });

        console.log(`✅ ${photoType.type} photo generated successfully!`);
        
        generatedPhotos.push({
          type: photoType.type,
          description: photoType.description,
          url: imageResponse.data[0].url,
          prompt: photoType.prompt
        });
        
      } catch (error) {
        console.error(`❌ Error generating ${photoType.type} photo:`, error);
        // Continue with other photos even if one fails
      }
    }

    if (generatedPhotos.length === 0) {
      throw new Error('Failed to generate any property photos');
    }

    console.log(`✅ Successfully generated ${generatedPhotos.length} property photos`);

    // Return the generated photos
    res.status(200).json({
      success: true,
      photos: generatedPhotos,
      propertyInfo,
      style,
      generatedAt: new Date().toISOString(),
      note: "AI-generated property photos ready for integration with flyer templates"
    });

  } catch (error) {
    console.error('📸 Error generating property photos:', error);
    console.error('📸 Error stack:', error.stack);
    
    let errorMessage = 'Failed to generate property photos';
    if (error.message.includes('billing')) {
      errorMessage = 'OpenAI billing issue - please check your account';
    } else if (error.message.includes('rate limit')) {
      errorMessage = 'Rate limit exceeded - please try again in a moment';
    } else if (error.message.includes('content policy')) {
      errorMessage = 'Content policy violation - please check your property description';
    } else if (error.message.includes('api key')) {
      errorMessage = 'OpenAI API key issue - please check configuration';
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('fetch')) {
      errorMessage = 'Network error - please check your connection';
    }

    res.status(500).json({
      error: errorMessage,
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
