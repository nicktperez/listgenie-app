// Professional Flyer Generation API
// Generates marketing professional quality flyers using Google AI

import { GoogleFlyerEngine } from '../../lib/googleFlyerEngine.js';
import { getAuth } from '@clerk/nextjs/server';

export default async function handler(req, res) {
  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const flyerData = req.body;

    if (!flyerData) {
      return res.status(400).json({ error: 'No request body provided' });
    }

    const flyerResult = await generateProfessionalFlyer(flyerData);

    if (flyerResult.success) {
      return res.status(200).json({
        success: true,
        type: 'google-ai-flyer',
        flyer: flyerResult.flyer,
        message: 'Professional marketing flyer created successfully with Google AI!'
      });
    } else {
      throw new Error(flyerResult.error || 'Failed to generate professional flyer');
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

async function generateProfessionalFlyer(flyerData) {
  try {
    const generator = new GoogleFlyerEngine();
    return await generator.generateFlyer(flyerData);
  } catch (error) {
    console.error('Generation Error:', error);
    return { success: false, error: error.message || 'Failed to generate flyer' };
  }
}

