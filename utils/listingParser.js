/**
 * Parses a raw listing text to extract structured property details.
 * @param {string|object} listingText - The raw text or object from the AI
 * @returns {object} Extracted details (address, price, beds, etc.)
 */
export const parseListingData = (listingText) => {
  if (!listingText) return {};

  const text =
    typeof listingText === 'string' ? listingText : listingText.content || '';

  // Extract property details using regex patterns
  const patterns = {
    address: /(?:address|location|situated at|located at)[:\s]*([^,\n]+)/i,
    bedrooms: /(\d+)\s*(?:bedroom|bed|BR)/i,
    bathrooms: /(\d+)\s*(?:bathroom|bath|BA)/i,
    sqft: /(\d+(?:,\d+)?)\s*(?:sq\s*ft|square\s*feet|SF)/i,
    price: /\$?(\d+(?:,\d+)?(?:,\d+)?)/i,
    propertyType:
      /(?:beautiful|stunning|gorgeous|luxurious)\s+([^,\n]+?)(?:\s+in|\s+at|\s+with|$)/i,
  };

  const extracted = {};

  // Extract each property
  Object.entries(patterns).forEach(([key, pattern]) => {
    const match = text.match(pattern);
    if (match) {
      extracted[key] = match[1]?.trim();
    }
  });

  // Clean up and format the data
  if (extracted.price && !extracted.price.startsWith('$')) {
    extracted.price = `$${extracted.price}`;
  }

  if (extracted.sqft) {
    extracted.sqft =
      typeof extracted.sqft === 'string'
        ? parseInt(extracted.sqft.replace(/,/g, ''), 10)
        : extracted.sqft;
  }

  if (extracted.bedrooms) extracted.bedrooms = parseInt(extracted.bedrooms, 10);
  if (extracted.bathrooms)
    extracted.bathrooms = parseInt(extracted.bathrooms, 10);

  // Extract features (lines that start with bullet points or dashes)
  const featureLines = text
    .split('\n')
    .filter((line) => line.trim().match(/^[•\-\*]\s+/))
    .map((line) => line.replace(/^[•\-\*]\s+/, '').trim())
    .filter((line) => line.length > 0);

  if (featureLines.length > 0) {
    extracted.features = featureLines.join('\n');
  }

  return extracted;
};
