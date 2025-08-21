// pages/api/flyer.js
// Generates beautiful, professional HTML flyers with agency branding, photos, and QR codes

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { address, bedrooms, bathrooms, sqft, style, features } = req.body;

  // ... existing code ...
}

