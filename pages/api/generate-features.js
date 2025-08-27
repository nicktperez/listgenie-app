export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { propertyType, address, price, bedrooms, bathrooms, sqft, features } = req.body;

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
    console.error('Error generating features:', error);
    
    // Return fallback features if AI generation fails
    return res.status(200).json({
      success: true,
      features: [
        {
          title: 'Premium Location',
          description: 'Situated in a highly desirable neighborhood with excellent amenities and accessibility.'
        },
        {
          title: 'Modern Design',
          description: 'Contemporary architecture with premium finishes and thoughtful design elements throughout.'
        },
        {
          title: 'Family Friendly',
          description: 'Perfect for families with spacious rooms, outdoor areas, and a safe neighborhood environment.'
        },
        {
          title: 'Investment Value',
          description: 'Strong potential for appreciation in this rapidly developing area with excellent market fundamentals.'
        }
      ]
    });
  }
}
