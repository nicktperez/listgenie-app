export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { propertyType, address, price, bedrooms, bathrooms, sqft, features, generationType, test, agentName, agency, agentPhone, agentEmail } = req.body;

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

// AI Image Generation (Google Gemini + Fallback)
async function generateGeminiImage(req, res) {
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

PROPERTY DETAILS:
- Property Type: ${propertyType}
- Address: ${address}
- Price: ${price}
- Bedrooms: ${bedrooms}
- Bathrooms: ${bathrooms}
- Square Footage: ${sqft} sq ft
- Design Style: ${style}
- Flyer Type: ${flyerType === 'openhouse' ? 'Open House' : 'For Sale'}

AGENCY INFORMATION:
- Agent Name: ${agentName || 'Professional Agent'}
- Agency: ${agency || 'Premier Real Estate'}
- Phone: ${agentPhone || 'Contact for details'}
- Email: ${agentEmail || 'agent@premiere.com'}

DESIGN REQUIREMENTS:
- A beautiful, modern real estate marketing flyer design
- Clean, professional layout with excellent typography and spacing
- Property details prominently displayed with clear visual hierarchy
- Professional color scheme appropriate for luxury real estate (blues, golds, whites, deep grays)
- Space for agent contact information and branding
- High-quality, marketing professional appearance
- Suitable for both digital and print use
- Visual elements representing luxury real estate (modern fonts, clean lines, professional layout)
- Professional layout with clear visual hierarchy
- No text overlays or watermarks that would make it unusable
- Include premium design elements that convey exclusivity and luxury
- Ensure the agency branding and contact information are prominently displayed

The design should look like it was created by a professional marketing agency specializing in luxury real estate. Make it visually appealing, professional, and ready for immediate marketing use. The image should be a complete, finished flyer design that could be printed or shared digitally.`;

    console.log('🎨 Attempting AI image generation with prompt:', imagePrompt);
    console.log('🔑 OpenRouter API Key present:', !!process.env.OPENROUTER_API_KEY);
    console.log('🔑 OpenRouter API Key length:', process.env.OPENROUTER_API_KEY ? process.env.OPENROUTER_API_KEY.length : 0);
    console.log('🌐 App URL:', process.env.NEXT_PUBLIC_APP_URL);
    console.log('🌐 Site URL:', process.env.NEXT_PUBLIC_SITE_URL);

    // Try multiple approaches for image generation
    const approaches = [
      {
        name: 'Google Gemini 2.5 Flash Image Preview',
        url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': process.env.GOOGLE_API_KEY,
        },
        body: {
          contents: [{
            parts: [{
              text: `You are an expert real estate marketing designer with 20+ years of experience creating luxury property marketing materials for high-end real estate agencies. 

Create a professional, luxury real estate marketing flyer image that showcases this property with expert-level design principles:

PROPERTY DETAILS:
${imagePrompt}

DESIGN REQUIREMENTS:
- Use sophisticated, luxury real estate design principles
- Implement advanced typography hierarchy and spacing
- Apply professional color theory (luxury blues, golds, whites, deep grays)
- Create visual balance and flow that guides the eye naturally
- Include premium visual elements that convey exclusivity
- Use modern, clean layouts that stand out from amateur designs
- Ensure the design looks like it was created by a top-tier marketing agency
- Make it suitable for both digital and high-end print marketing
- Include subtle design elements that suggest premium quality and attention to detail

The final image should look like it was created by a senior creative director at a luxury real estate marketing firm, not by someone using basic online tools.`
            }]
          }],
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        }
      },
      {
        name: 'Google Gemini 2.0 Flash (Text Description)',
        url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GOOGLE_API_KEY}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          contents: [{
            parts: [{
              text: `You are an expert real estate marketing designer. Create a detailed, professional description of a real estate marketing flyer that could be used to generate an image. 

Based on this property: ${imagePrompt}

Provide a detailed visual description that includes:
- Layout structure and positioning
- Color scheme and typography
- Visual elements and graphics
- Professional design elements
- Marketing appeal factors

Make it detailed enough that a designer could create the actual flyer from your description.`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
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
          
          // Handle Google Gemini 2.5 Flash Image Preview response
          if (approach.name.includes('Gemini 2.5 Flash Image Preview')) {
            if (responseData.candidates && responseData.candidates[0] && responseData.candidates[0].content) {
              const content = responseData.candidates[0].content;
              
              // Check if the response contains image data
              if (content.parts && content.parts.some(part => part.inlineData)) {
                const imagePart = content.parts.find(part => part.inlineData);
                if (imagePart.inlineData.mimeType === 'image/png' && imagePart.inlineData.data) {
                  console.log(`🎉 Google Gemini 2.5 Flash Image Preview image generation successful`);
                  console.log(`🖼️ Generated image data present`);
                  
                  // Convert base64 to data URL for immediate use
                  const imageDataUrl = `data:image/png;base64,${imagePart.inlineData.data}`;
                  
                  return res.status(200).json({
                    success: true,
                    imageUrl: imageDataUrl,
                    prompt: imagePrompt,
                    model: approach.name,
                    approach: approach.name,
                    type: 'gemini-image'
                  });
                }
              }
              
              // If no image data, treat as text response
              const generatedText = content.parts[0].text;
              console.log(`🎉 Gemini 2.5 Flash Image Preview text generation successful`);
              console.log(`📝 Generated text:`, generatedText);
              
              return res.status(200).json({
                success: true,
                fallback: true,
                message: 'Gemini 2.5 Flash Image Preview generated a response. Using programmatic engine for the actual flyer.',
                description: generatedText,
                prompt: imagePrompt,
                model: approach.name,
                recommendation: 'programmatic',
                type: 'gemini-description'
              });
            } else {
              console.error(`❌ Gemini 2.5 Flash Image Preview no data:`, responseData);
              lastError = `No data from Gemini 2.5 Flash Image Preview`;
            }
          } else if (approach.name.includes('Gemini')) {
            // Handle Gemini text generation response (fallback)
            if (responseData.candidates && responseData.candidates[0] && responseData.candidates[0].content) {
              const generatedText = responseData.candidates[0].content.parts[0].text;
              console.log(`🎉 Gemini text generation successful (fallback)`);
              console.log(`📝 Generated text:`, generatedText);
              
              // Return the generated text description
              return res.status(200).json({
                success: true,
                fallback: true,
                message: 'Gemini AI generated a detailed flyer description. Using programmatic engine for the actual flyer.',
                description: generatedText,
                prompt: imagePrompt,
                model: approach.name,
                recommendation: 'programmatic',
                type: 'gemini-description'
              });
            } else {
              console.error(`❌ Gemini no text data:`, responseData);
              lastError = `No text data from Gemini`;
            }
          } else if (responseData.data && responseData.data[0] && responseData.data[0].url) {
            // Handle other image generation responses
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
            console.error(`❌ ${approach.name} no valid data:`, responseData);
            lastError = `No valid data from ${approach.name}`;
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
              googleApiKey: !!process.env.GOOGLE_API_KEY,
              googleApiKeyLength: process.env.GOOGLE_API_KEY ? process.env.GOOGLE_API_KEY.length : 0
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

    // If all approaches failed, provide a helpful fallback message
    console.log('🔄 All AI approaches failed, providing fallback...');

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
        googleApiKey: !!process.env.GOOGLE_API_KEY,
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



// Test Google Gemini 2.5 Flash Image Preview through Google's direct API
async function testGeminiDirect(req, res) {
  try {
    console.log('🧪 Testing Google Gemini 2.5 Flash Image Preview through Google API...');
    console.log('🔑 Google API Key present:', !!process.env.GOOGLE_API_KEY);
    console.log('🌐 App URL:', process.env.NEXT_PUBLIC_APP_URL);

    // Test 1: Check if we can reach Google's Gemini 2.5 Flash Image Preview API
    console.log('📡 Testing Google Gemini 2.5 Flash Image Preview API...');
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': process.env.GOOGLE_API_KEY,
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: 'Create a simple test image of a house for real estate marketing.'
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 100,
        }
      })
    });

        console.log('📡 Google API response status:', response.status);
    console.log('📡 Google API response headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Google Imagen model test successful:', data);
      return res.status(200).json({
        success: true,
        message: 'Google Imagen image generation is working correctly through Google API.',
        response: data,
        model: 'imagen-3'
      });
    } else {
      const errorText = await response.text();
      console.error('❌ Google Imagen model test failed:', response.status, errorText);
      
      // Try to parse error response
      try {
        const errorJson = JSON.parse(errorText);
        console.error('🔍 Error response JSON:', errorJson);
      } catch (e) {
        console.error('🔍 Error response is not JSON:', errorText);
      }
      
      return res.status(500).json({
        success: false,
        message: `Google Imagen image generation test failed: ${response.status} - ${errorText}`,
        status: response.status,
        error: errorText,
        model: 'imagen-3'
      });
    }
  } catch (error) {
          console.error('❌ Critical error during Google Imagen model test:', error);
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
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': process.env.GOOGLE_API_KEY
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
