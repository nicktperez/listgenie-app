// pages/api/flyer.js
// TEMPORARY SIMPLE VERSION FOR TESTING

export default async function handler(req, res) {
  console.log('🎨 API endpoint hit:', { method: req.method, url: req.url });
  
  if (req.method !== 'POST') {
    console.log('🎨 Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { listing } = req.body;
    console.log('🎨 Received listing:', listing ? listing.substring(0, 100) : 'NO LISTING');

    if (!listing) {
      return res.status(400).json({ error: 'Listing content is required' });
    }

    // For now, just return a test response
    console.log('🎨 Returning test response');
    res.status(200).json({
      success: true,
      flyer: {
        imageUrl: 'https://picsum.photos/1024/1792?random=1',
        propertyDetails: { address: 'Test Property' },
        listing: listing,
        generatedAt: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('🎨 API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

