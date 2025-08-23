// Professional Flyer Generation API
// Generates marketing professional quality flyers using our custom engine

import ProfessionalFlyerEngine from '../../lib/professionalFlyerEngine.js';

export default async function handler(req, res) {
  console.log('🚀 API /api/flyer: Request received');
  console.log('🚀 API /api/flyer: Method:', req.method);
  console.log('🚀 API /api/flyer: Headers:', req.headers);
  
  try {
    if (req.method !== 'POST') {
      console.log('❌ API /api/flyer: Invalid method, returning 405');
      return res.status(405).json({ error: 'Method not allowed' });
    }

    console.log('🚀 API /api/flyer: Parsing request body...');
    const flyerData = req.body;
    console.log('🚀 API /api/flyer: Request body received:', flyerData);
    console.log('🚀 API /api/flyer: Body type:', typeof flyerData);
    console.log('🚀 API /api/flyer: Body keys:', Object.keys(flyerData || {}));

    if (!flyerData) {
      console.log('❌ API /api/flyer: No request body, returning 400');
      return res.status(400).json({ error: 'No request body provided' });
    }

    console.log('🚀 API /api/flyer: Calling generateProfessionalFlyer...');
    const flyerResult = await generateProfessionalFlyer(flyerData);
    console.log('🚀 API /api/flyer: generateProfessionalFlyer result:', flyerResult);

    if (flyerResult.success) {
      console.log('✅ API /api/flyer: Flyer generation successful, returning response');
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
      console.log('❌ API /api/flyer: Flyer generation failed:', flyerResult.error);
      throw new Error(flyerResult.error || 'Failed to generate professional flyer');
    }
  } catch (error) {
    console.error('❌ API /api/flyer: Error occurred:', error);
    console.error('❌ API /api/flyer: Error stack:', error.stack);
    console.error('❌ API /api/flyer: Error name:', error.name);
    console.error('❌ API /api/flyer: Error message:', error.message);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

async function generateProfessionalFlyer(flyerData) {
  console.log('🔧 generateProfessionalFlyer: Function called with data:', flyerData);
  try {
    console.log('🔧 generateProfessionalFlyer: Creating ProfessionalFlyerEngine instance...');
    const generator = new ProfessionalFlyerEngine();
    console.log('🔧 generateProfessionalFlyer: ProfessionalFlyerEngine instance created successfully');
    
    console.log('🔧 generateProfessionalFlyer: Calling generator.generateProfessionalFlyer...');
    const result = await generator.generateProfessionalFlyer(flyerData);
    console.log('🔧 generateProfessionalFlyer: Result received:', result);
    
    return result;
  } catch (error) {
    console.error('❌ generateProfessionalFlyer: Error occurred:', error);
    console.error('❌ generateProfessionalFlyer: Error stack:', error.stack);
    console.error('❌ generateProfessionalFlyer: Error name:', error.name);
    console.error('❌ generateProfessionalFlyer: Error message:', error.message);
    return { success: false, error: error.message || 'Failed to generate professional flyer' };
  }
}

