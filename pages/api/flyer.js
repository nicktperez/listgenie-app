// Professional Flyer Generation API
// Generates marketing professional quality flyers using our custom engine

import ProfessionalFlyerEngine from '../../lib/professionalFlyerEngine.js';

export default async function handler(req, res) {
  try {
    console.log('🎨 Professional flyer generation request received:', req.body);

    const {
      agentInfo,
      style,
      photos,
      listing,
      propertyInfo
    } = req.body;

    // Validate required fields
    if (!agentInfo || !agentInfo.name || !agentInfo.agency) {
      return res.status(400).json({
        error: 'Agent information is required'
      });
    }

    if (!style) {
      return res.status(400).json({
        error: 'Flyer style is required'
      });
    }

    // Prepare data for professional flyer generation
    const flyerData = {
      agentInfo,
      style,
      photos: photos || [],
      listing,
      propertyInfo: propertyInfo || {}
    };

    console.log('🎨 Processing professional flyer data:', flyerData);

    // Generate the professional flyer
    const flyerResult = await generateProfessionalFlyer(flyerData);

    if (flyerResult.success) {
      console.log('✅ Professional flyer generated successfully');

      return res.status(200).json({
        success: true,
        type: 'professional-flyer',
        flyer: {
          html: flyerResult.flyer.html,
          css: flyerResult.flyer.css,
          animations: flyerResult.flyer.animations,
          metadata: flyerResult.flyer.metadata
        },
        designSystem: flyerResult.designSystem,
        quality: flyerResult.quality,
        message: 'Professional marketing flyer created successfully!'
      });
    } else {
      throw new Error(flyerResult.error || 'Failed to generate professional flyer');
    }

  } catch (error) {
    console.error('❌ Professional flyer generation error:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
}

// Generate professional flyer using our custom engine
async function generateProfessionalFlyer(flyerData) {
  try {
    console.log('🎨 Starting professional flyer generation with data:', flyerData);

    // Create professional flyer generator instance
    const generator = new ProfessionalFlyerEngine();

    // Generate the flyer using our professional engine
    const result = await generator.generateProfessionalFlyer(flyerData);

    console.log('🎨 Professional flyer generation result:', {
      success: result.success,
      type: result.type,
      designSystem: result.designSystem,
      quality: result.quality
    });

    return result;

  } catch (error) {
    console.error('❌ Professional flyer generation failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

