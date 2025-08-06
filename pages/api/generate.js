
export default async function handler(req, res) {
  const { address, bedrooms, bathrooms, sqft, style, features } = req.body;

  // Placeholder response
  res.status(200).json({
    listing: `This beautiful ${style} home at ${address} offers ${bedrooms} bedrooms and ${bathrooms} bathrooms across ${sqft} sqft. ${features}`,
    email: `Hi there! I wanted to share a stunning ${style} property at ${address} featuring ${bedrooms} beds and ${bathrooms} baths. Let me know if you'd like a tour!`,
    social: `🏡 New Listing Alert! ${bedrooms} Bed / ${bathrooms} Bath ${style} home at ${address}. ${features} #RealEstate #NewListing`,
  });
}
