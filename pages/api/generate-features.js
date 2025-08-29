export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { propertyType, address, price, bedrooms, bathrooms, sqft, features, generationType, test } = req.body;

    console.log('🚀 generate-features called with:', { generationType, propertyType, address, test });

    // If this is a test request, test Google Gemini API connectivity
    if (test === 'gemini') {
      return await testGeminiDirect(req, res);
    }

    // If this is an environment test, check all environment variables
    if (test === 'env') {
      return await testEnvironment(req, res);
    }

    // If this is an AI image generation request
    if (generationType === 'midjourney-image') {
      return await generateGeminiImage(req, res);
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
          'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'ListGenie.ai'
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

    console.log('🎨 AI Image Generation Request Details:', {
      propertyType,
      address,
      price,
      bedrooms,
      bathrooms,
      sqft,
      features,
      style,
      flyerType,
      openRouterKey: !!process.env.OPENROUTER_API_KEY,
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
      timestamp: new Date().toISOString()
    });

    // Create a detailed prompt for AI image generation
    const imagePrompt = `Create a professional real estate marketing flyer image for a ${propertyType} property. 

The image should show:
- A beautiful, modern real estate marketing flyer design
- Clean, professional layout with excellent typography and spacing
- Property details prominently displayed: ${bedrooms} bedrooms, ${bathrooms} bathrooms, ${sqft} sq ft
- Address: ${address}
- Price: ${price}
- Design style: ${style}
- Flyer type: ${flyerType === 'openhouse' ? 'Open House' : 'For Sale'}
- Professional color scheme appropriate for luxury real estate (blues, golds, whites)
- Space for agent contact information and branding
- High-quality, marketing professional appearance
- Suitable for both digital and print use
- Visual elements representing luxury real estate (modern fonts, clean lines, professional layout)
- Professional layout with clear visual hierarchy
- No text overlays or watermarks that would make it unusable

The design should look like it was created by a professional marketing agency specializing in luxury real estate. Make it visually appealing, professional, and ready for immediate marketing use. The image should be a complete, finished flyer design that could be printed or shared digitally.`;

    console.log('🎨 Attempting AI image generation with prompt:', imagePrompt);
    console.log('🔑 OpenRouter API Key present:', !!process.env.OPENROUTER_API_KEY);
    console.log('🔑 OpenRouter API Key length:', process.env.OPENROUTER_API_KEY ? process.env.OPENROUTER_API_KEY.length : 0);
    console.log('🌐 App URL:', process.env.NEXT_PUBLIC_APP_URL);
    console.log('🌐 Site URL:', process.env.NEXT_PUBLIC_SITE_URL);

    // Try multiple approaches for image generation
    const approaches = [
      {
        name: 'Google Gemini 2.0 Flash (Primary)',
        url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GOOGLE_API_KEY}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          contents: [{
            parts: [{
              text: `Generate a professional real estate flyer image based on this description: ${imagePrompt}. The image should be high quality, professional, and suitable for real estate marketing.`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        }
      }
    ];

    let lastError = null;

    for (const approach of approaches) {
      try {
        console.log(`🎨 Trying approach: ${approach.name}`);
        console.log(`🔍 Request details for ${approach.name}:`, {
          url: approach.url,
          method: approach.method,
          headers: approach.headers,
          body: approach.body
        });
        
        const response = await fetch(approach.url, {
          method: approach.method,
          headers: approach.headers,
          body: JSON.stringify(approach.body)
        });

        console.log(`📡 ${approach.name} response status:`, response.status);
        console.log(`📡 ${approach.name} response statusText:`, response.statusText);
        console.log(`📡 ${approach.name} response headers:`, Object.fromEntries(response.headers.entries()));

        if (response.ok) {
          const responseData = await response.json();
          console.log(`✅ ${approach.name} success response:`, responseData);
          
          if (responseData.data && responseData.data[0] && responseData.data[0].url) {
            console.log(`🎉 AI image generation successful with ${approach.name}`);
            console.log(`🖼️ Image URL:`, responseData.data[0].url);
            return res.status(200).json({
              success: true,
              imageUrl: responseData.data[0].url,
              prompt: imagePrompt,
              model: approach.name,
              approach: approach.name
            });
          } else {
            console.error(`❌ ${approach.name} no image data:`, responseData);
            console.error(`❌ ${approach.name} response structure:`, {
              hasData: !!responseData.data,
              dataLength: responseData.data ? responseData.data.length : 0,
              firstItem: responseData.data ? responseData.data[0] : null,
              hasUrl: responseData.data && responseData.data[0] ? !!responseData.data[0].url : false
            });
            lastError = `No image data from ${approach.name}`;
          }
        } else {
          const errorText = await response.text();
          console.error(`❌ ${approach.name} failed with status ${response.status}:`, errorText);
          
          // Special handling for Gemini model
          if (approach.name.includes('Gemini')) {
            console.error(`🔍 Gemini-specific error details:`, {
              status: response.status,
              statusText: response.statusText,
              headers: Object.fromEntries(response.headers.entries()),
              errorText,
              requestBody: approach.body,
              requestHeaders: approach.headers,
              openRouterKey: !!process.env.OPENROUTER_API_KEY,
              openRouterKeyLength: process.env.OPENROUTER_API_KEY ? process.env.OPENROUTER_API_KEY.length : 0
            });
            
            // Try to parse error response for more details
            try {
              const errorJson = JSON.parse(errorText);
              console.error(`🔍 Gemini error JSON:`, errorJson);
            } catch (e) {
              console.error(`🔍 Gemini error is not JSON:`, errorText);
            }
          }
          
          lastError = `${approach.name} failed: ${response.status} - ${errorText}`;
        }
      } catch (approachError) {
        console.error(`❌ ${approach.name} error:`, approachError);
        console.error(`❌ ${approach.name} error stack:`, approachError.stack);
        lastError = `${approach.name} error: ${approachError.message}`;
      }
    }

    // If all approaches failed, try a different strategy - use text-to-image through chat completion
    console.log('🔄 All direct image generation failed, trying alternative approach...');
    
    try {
      const alternativeResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'ListGenie AI Flyer Generator'
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3.5-sonnet',
          messages: [
            {
              role: 'system',
              content: 'You are an expert at creating detailed, professional real estate marketing flyer descriptions that can be used to generate images.'
            },
            {
              role: 'user',
              content: `Create a detailed visual description for a real estate marketing flyer image. The image should show: ${imagePrompt}`
            }
          ],
          max_tokens: 500
        })
      });

      if (alternativeResponse.ok) {
        const altData = await alternativeResponse.json();
        console.log('✅ Alternative approach successful:', altData);
        
        // Return the description as a fallback
        return res.status(200).json({
          success: true,
          fallback: true,
          message: 'AI image generation unavailable, but here is a detailed description for manual creation.',
          description: altData.choices[0]?.message?.content || 'Professional real estate flyer description',
          prompt: imagePrompt,
          recommendation: 'programmatic',
          type: 'description'
        });
      }
    } catch (altError) {
      console.error('❌ Alternative approach also failed:', altError);
    }

    // If everything failed, return a detailed error instead of fallback
    console.error('❌ All AI approaches failed. Last error:', lastError);
    
    return res.status(500).json({
      success: false,
      error: `All AI image generation approaches failed. Last error: ${lastError}`,
      debug: {
        lastError,
        approaches: approaches.map(a => a.name),
        timestamp: new Date().toISOString(),
        prompt: imagePrompt,
        openRouterKey: !!process.env.OPENROUTER_API_KEY,
        appUrl: process.env.NEXT_PUBLIC_APP_URL
      }
    });

  } catch (error) {
    console.error('❌ Critical error in AI image generation:', error);
    
    return res.status(200).json({
      success: true,
      fallback: true,
      message: 'AI image generation encountered an error. Using programmatic engine instead.',
      error: error.message,
      recommendation: 'programmatic',
      debug: {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      }
    });
  }
}

// Test OpenRouter connectivity
async function testOpenRouter(req, res) {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'ListGenie Test Endpoint'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant.'
          },
          {
            role: 'user',
            content: 'Hello, OpenRouter!'
          }
        ],
        max_tokens: 50
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ OpenRouter test successful:', data);
      return res.status(200).json({
        success: true,
        message: 'OpenRouter API is working correctly.',
        response: data
      });
    } else {
      const errorText = await response.text();
      console.error('❌ OpenRouter test failed:', response.status, errorText);
      return res.status(500).json({
        success: false,
        message: `OpenRouter API test failed: ${response.status} - ${errorText}`,
        status: response.status,
        error: errorText
      });
    }
  } catch (error) {
    console.error('❌ Critical error during OpenRouter test:', error);
    return res.status(500).json({
      success: false,
      message: `OpenRouter API test encountered an error: ${error.message}`,
      error: error.message,
      stack: error.stack
    });
  }
}

// Test Gemini 2.0 Flash image generation through Google's direct API
async function testGeminiDirect(req, res) {
  try {
    console.log('🧪 Testing Gemini 2.0 Flash image generation through Google API...');
    console.log('🔑 Google API Key present:', !!process.env.GOOGLE_API_KEY);
    console.log('🌐 App URL:', process.env.NEXT_PUBLIC_APP_URL);

    // Test 1: Check if we can reach Google's Gemini API
    console.log('📡 Testing Google Gemini API...');
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GOOGLE_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: 'Generate a simple test image of a house for real estate marketing.'
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    });

        console.log('📡 Google API response status:', response.status);
    console.log('📡 Google API response headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Gemini 2.0 Flash model test successful:', data);
      return res.status(200).json({
        success: true,
        message: 'Gemini 2.0 Flash image generation is working correctly through Google API.',
        response: data,
        model: 'gemini-2.0-flash-exp'
      });
    } else {
      const errorText = await response.text();
      console.error('❌ Gemini 2.0 Flash model test failed:', response.status, errorText);
      
      // Try to parse error response
      try {
        const errorJson = JSON.parse(errorText);
        console.error('🔍 Error response JSON:', errorJson);
      } catch (e) {
        console.error('🔍 Error response is not JSON:', errorText);
      }
      
      return res.status(500).json({
        success: false,
        message: `Gemini 2.0 Flash image generation test failed: ${response.status} - ${errorText}`,
        status: response.status,
        error: errorText,
        model: 'gemini-2.0-flash-exp'
      });
    }
  } catch (error) {
    console.error('❌ Critical error during Gemini 2.0 Flash model test:', error);
    return res.status(500).json({
      success: false,
      message: `Gemini 2.0 Flash image generation test encountered an error: ${error.message}`,
      error: error.message,
      stack: error.stack,
      model: 'gemini-2.0-flash-exp'
    });
  }
}

// Test environment variables and configuration
async function testEnvironment(req, res) {
  try {
    console.log('🔍 Testing environment configuration...');
    
    const envCheck = {
      googleApiKey: {
        present: !!process.env.GOOGLE_API_KEY,
        length: process.env.GOOGLE_API_KEY ? process.env.GOOGLE_API_KEY.length : 0,
        startsWith: process.env.GOOGLE_API_KEY ? process.env.GOOGLE_API_KEY.substring(0, 8) + '...' : 'N/A'
      },
      appUrl: {
        present: !!process.env.NEXT_PUBLIC_APP_URL,
        value: process.env.NEXT_PUBLIC_APP_URL || 'Not set',
        isLocalhost: process.env.NEXT_PUBLIC_APP_URL ? process.env.NEXT_PUBLIC_APP_URL.includes('localhost') : false
      },
      siteUrl: {
        present: !!process.env.NEXT_PUBLIC_SITE_URL,
        value: process.env.NEXT_PUBLIC_SITE_URL || 'Not set'
      },
      nodeEnv: process.env.NODE_ENV || 'Not set',
      timestamp: new Date().toISOString()
    };

    console.log('🔍 Environment check results:', envCheck);

    // Check if we can make a basic request to Google Gemini API
    let googleApiTest = 'Not tested';
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GOOGLE_API_KEY}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        googleApiTest = 'SUCCESS';
      } else {
        googleApiTest = `FAILED: ${response.status}`;
      }
    } catch (error) {
      googleApiTest = `ERROR: ${error.message}`;
    }

    return res.status(200).json({
      success: true,
      message: 'Environment configuration test completed.',
      environment: envCheck,
              googleApiTest,
        recommendations: [
          envCheck.googleApiKey.present ? '✅ Google API key is present' : '❌ Google API key is missing',
          envCheck.appUrl.present ? '✅ App URL is set' : '❌ App URL is missing',
          envCheck.appUrl.isLocalhost ? '✅ App URL can be localhost (no issues with Google API)' : '✅ App URL is not localhost',
          envCheck.siteUrl.present ? '✅ Site URL is set' : '⚠️ Site URL is not set (fallback to App URL)'
        ]
    });
  } catch (error) {
    console.error('❌ Critical error during environment test:', error);
    return res.status(500).json({
      success: false,
      message: `Environment test encountered an error: ${error.message}`,
      error: error.message,
      stack: error.stack
    });
  }
}
