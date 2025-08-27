export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { propertyType, address, price, bedrooms, bathrooms, sqft, features, generationType } = req.body;

    // If this is a Gemini image generation request
    if (generationType === 'gemini-image') {
      return await generateGeminiImage(req, res);
    }

    // Use OpenRouter to generate unique features
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'ListGenie Flyer Generator'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          {
            role: 'system',
            content: `You are a professional real estate marketing expert. Generate 4 unique, compelling property features that would appeal to potential buyers. Each feature should be specific to the property details provided and include both a catchy title and a compelling description. Focus on what makes this property special and desirable.`
          },
          {
            role: 'user',
            content: `Generate 4 unique property features for this listing:
            
Property Type: ${propertyType}
Address: ${address}
Price: ${price}
Bedrooms: ${bedrooms}
Bathrooms: ${bathrooms}
Square Feet: ${sqft}
Existing Features: ${features}

Please provide exactly 4 features in this exact JSON format:
{
  "features": [
    {
      "title": "Feature Title",
      "description": "Compelling description of why this feature matters to buyers"
    }
  ]
}`
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!openRouterResponse.ok) {
      throw new Error(`OpenRouter API error: ${openRouterResponse.status}`);
    }

    const openRouterData = await openRouterResponse.json();
    const aiResponse = openRouterData.choices[0]?.message?.content;

    // Parse the AI response to extract features
    let parsedFeatures;
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedFeatures = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      // Fallback to default features
      parsedFeatures = {
        features: [
          {
            title: 'Premium Location',
            description: `This ${propertyType} is strategically located in a highly desirable area with excellent amenities and accessibility.`
          },
          {
            title: 'Modern Design',
            description: `Contemporary architecture with premium finishes and thoughtful design elements throughout this exceptional property.`
          },
          {
            title: 'Family Friendly',
            description: `Perfect for families with ${bedrooms} spacious bedrooms, outdoor areas, and a safe neighborhood environment.`
          },
          {
            title: 'Investment Value',
            description: `Strong potential for appreciation in this rapidly developing area with excellent market fundamentals.`
          }
        ]
      };
    }

    // Ensure we have exactly 4 features
    if (!parsedFeatures.features || parsedFeatures.features.length !== 4) {
      throw new Error('Invalid feature count from AI');
    }

    return res.status(200).json({
      success: true,
      features: parsedFeatures.features
    });

  } catch (error) {
    console.error('Error in generate-features:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}

// Gemini Pro 2.5 Image Generation
async function generateGeminiImage(req, res) {
  try {
    const { propertyType, address, price, bedrooms, bathrooms, sqft, features, style, flyerType } = req.body;

    // Create a detailed prompt for Gemini Pro 2.5
    const imagePrompt = `Create a professional real estate flyer for a ${propertyType} property with the following details:

Property Details:
- Address: ${address}
- Price: ${price}
- Bedrooms: ${bedrooms}
- Bathrooms: ${bathrooms}
- Square Feet: ${sqft}
- Features: ${features}
- Style: ${style}
- Type: ${flyerType === 'openhouse' ? 'Open House' : 'For Sale'}

Design Requirements:
- Professional real estate marketing flyer
- Modern, clean design with excellent typography
- Include all property details prominently
- Use professional color scheme appropriate for ${style} style
- Include space for agent contact information
- High-quality, marketing professional appearance
- Suitable for both digital and print use
- Include visual elements that represent luxury real estate
- Professional layout with clear hierarchy

The flyer should look like it was created by a professional marketing agency specializing in luxury real estate. Make it visually appealing and professional.`;

    // Call Gemini Pro 2.5 through OpenRouter
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'ListGenie Gemini Flyer Generator'
      },
      body: JSON.stringify({
        model: 'google/gemini-pro-2.5',
        prompt: imagePrompt,
        n: 1,
        size: '1024x1024',
        quality: 'hd',
        style: 'natural'
      })
    });

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${openRouterResponse.status} - ${errorText}`);
    }

    const geminiData = await openRouterResponse.json();
    
    if (!geminiData.data || !geminiData.data[0] || !geminiData.data[0].url) {
      throw new Error('No image URL returned from Gemini');
    }

    return res.status(200).json({
      success: true,
      imageUrl: geminiData.data[0].url,
      prompt: imagePrompt,
      model: 'google/gemini-pro-2.5'
    });

  } catch (error) {
    console.error('Error in Gemini image generation:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Gemini image generation failed'
    });
  }
}
