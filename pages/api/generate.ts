import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { withErrorHandler, validateRequest, createApiResponse } from '@/lib/api';

const generateRequestSchema = z.object({
  address: z.string().min(1, 'Address is required'),
  bedrooms: z.number().min(0, 'Bedrooms must be 0 or more'),
  bathrooms: z.number().min(0, 'Bathrooms must be 0 or more'),
  sqft: z.number().min(1, 'Square footage must be at least 1'),
  style: z.string().min(1, 'Style is required'),
  features: z.string().optional(),
});

interface GenerateResponse {
  listing: string;
  email: string;
  social: string;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const data = validateRequest(req, generateRequestSchema);
  
  // TODO: Integrate with actual AI service (OpenRouter, OpenAI, etc.)
  const response: GenerateResponse = {
    listing: `This beautiful ${data.style} home at ${data.address} offers ${data.bedrooms} bedrooms and ${data.bathrooms} bathrooms across ${data.sqft} sqft. ${data.features || ''}`,
    email: `Hi there! I wanted to share a stunning ${data.style} property at ${data.address} featuring ${data.bedrooms} beds and ${data.bathrooms} baths. Let me know if you'd like a tour!`,
    social: `🏡 New Listing Alert! ${data.bedrooms} Bed / ${data.bathrooms} Bath ${data.style} home at ${data.address}. ${data.features || ''} #RealEstate #NewListing`,
  };

  return createApiResponse(res, response);
}

export default withErrorHandler(handler);
