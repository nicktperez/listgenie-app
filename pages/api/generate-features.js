export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { propertyType, address, price, bedrooms, bathrooms, sqft, features, generationType } = req.body;

    console.log('🚀 generate-features called with:', { generationType, propertyType, address });

    // If this is an AI image generation request
    if (generationType === 'midjourney-image') {
      return await generateMidjourneyImage(req, res);
    }

    // Use OpenRouter to generate unique features with fallback
    let parsedFeatures;
    
    try {
      console.log('🔄 Attempting to generate features with OpenRouter...');
      
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

      if (openRouterResponse.ok) {
        const openRouterData = await openRouterResponse.json();
        const aiResponse = openRouterData.choices[0]?.message?.content;

        console.log('✅ OpenRouter response received:', aiResponse);

        // Parse the AI response to extract features
        try {
          // Try to extract JSON from the response
          const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsedFeatures = JSON.parse(jsonMatch[0]);
            console.log('✅ Features parsed successfully:', parsedFeatures);
          } else {
            throw new Error('No JSON found in response');
          }
        } catch (parseError) {
          console.error('❌ Error parsing AI response:', parseError);
          throw new Error('Failed to parse AI response');
        }
      } else {
        const errorText = await openRouterResponse.text();
        console.error('❌ OpenRouter API error:', openRouterResponse.status, errorText);
        throw new Error(`OpenRouter API error: ${openRouterResponse.status}`);
      }
    } catch (openRouterError) {
      console.error('❌ OpenRouter failed, using fallback features:', openRouterError);
      // Use fallback features if OpenRouter fails
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
      console.error('❌ Invalid feature count:', parsedFeatures);
      throw new Error('Invalid feature count from AI');
    }

    console.log('✅ Returning features successfully');
    return res.status(200).json({
      success: true,
      features: parsedFeatures.features
    });

  } catch (error) {
    console.error('❌ Error in generate-features:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}

// AI Image Generation (OpenRouter compatible)
async function generateMidjourneyImage(req, res) {
  try {
    const { propertyType, address, price, bedrooms, bathrooms, sqft, features, style, flyerType } = req.body;

    // Create a detailed prompt for AI image generation
    const imagePrompt = `Create a professional real estate marketing flyer for a ${propertyType} property. 

The flyer should feature:
- Professional real estate marketing design
- Modern, clean layout with excellent typography
- Property details prominently displayed: ${bedrooms} bedrooms, ${bathrooms} bathrooms, ${sqft} sq ft
- Address: ${address}
- Price: ${price}
- Style: ${style}
- Type: ${flyerType === 'openhouse' ? 'Open House' : 'For Sale'}
- Professional color scheme appropriate for luxury real estate
- Space for agent contact information
- High-quality, marketing professional appearance
- Suitable for both digital and print use
- Visual elements representing luxury real estate
- Professional layout with clear hierarchy

The design should look like it was created by a professional marketing agency specializing in luxury real estate. Make it visually appealing, professional, and ready for marketing use.`;

    console.log('🎨 Attempting AI image generation with prompt:', imagePrompt);

    // Try to generate image using OpenRouter's image generation
    try {
      const openRouterResponse = await fetch('https://openrouter.ai/api/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'ListGenie AI Flyer Generator'
        },
        body: JSON.stringify({
          model: 'openai/dall-e-3',
          prompt: imagePrompt,
          n: 1,
          size: '1024x1024',
          quality: 'hd',
          style: 'natural'
        })
      });

      if (openRouterResponse.ok) {
        const aiData = await openRouterResponse.json();
        console.log('🎨 OpenRouter response:', aiData);
        
        if (aiData.data && aiData.data[0] && aiData.data[0].url) {
          console.log('✅ AI image generation successful');
          return res.status(200).json({
            success: true,
            imageUrl: aiData.data[0].url,
            prompt: imagePrompt,
            model: 'openai/dall-e-3'
          });
        } else {
          console.error('❌ No image data in response:', aiData);
          throw new Error('No image data received from AI service');
        }
      } else {
        const errorText = await openRouterResponse.text();
        console.error('❌ OpenRouter API error:', openRouterResponse.status, errorText);
        throw new Error(`AI service error: ${openRouterResponse.status}`);
      }
    } catch (aiError) {
      console.error('❌ AI image generation failed:', aiError);
      
      // Instead of failing completely, return a success response with fallback info
      return res.status(200).json({
        success: true,
        fallback: true,
        message: 'AI image generation unavailable. Using programmatic engine instead.',
        prompt: imagePrompt,
        recommendation: 'programmatic'
      });
    }

  } catch (error) {
    console.error('❌ Error in AI image generation:', error);
    
    // Return a graceful fallback response
    return res.status(200).json({
      success: true,
      fallback: true,
      message: 'AI image generation failed. Using programmatic engine instead.',
      error: error.message,
      recommendation: 'programmatic'
    });
  }
}
