import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '@clerk/nextjs';
import useUserPlan from '../hooks/useUserPlan';

export default function ListingDisplayPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();
  const { isPro } = useUserPlan();
  const [listing, setListing] = useState(null);
  const [flyerGenerating, setFlyerGenerating] = useState(false);
  
  // SIMPLE WORKING FLYER MODAL STATE
  const [simpleFlyerModal, setSimpleFlyerModal] = useState(false);
  const [flyerType, setFlyerType] = useState('listing'); // 'listing' or 'openhouse'
  const [flyerData, setFlyerData] = useState({
    address: '',
    propertyType: '',
    bedrooms: '',
    bathrooms: '',
    sqft: '',
    price: '',
    features: '',
    openHouseDate: '',
    openHouseTime: '',
    agentName: '',
    agency: '',
    agentPhone: '',
    agentEmail: '',
    photos: [],
    style: 'luxury-real-estate', // Default style
    generationMethod: 'ai' // Always use Gemini AI
  });

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
      return;
    }

    const savedListing = localStorage.getItem('currentListing') || sessionStorage.getItem('currentListing');
    if (savedListing) {
      try {
        setListing(JSON.parse(savedListing));
      } catch (e) {
        setListing({ content: savedListing, type: 'plain' });
      }
    } else {
      router.push('/chat');
    }
  }, [isLoaded, isSignedIn, router]);

  // Load agent info from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setFlyerData(prev => ({
        ...prev,
        agentName: localStorage.getItem('agentName') || '',
        agency: localStorage.getItem('agency') || '',
        agentPhone: localStorage.getItem('agentPhone') || '',
        agentEmail: localStorage.getItem('agentEmail') || ''
      }));
    }
  }, []);

  // Parse AI-generated listing to extract property details
  const parseListingData = (listingText) => {
    if (!listingText) return {};
    
    const text = typeof listingText === 'string' ? listingText : listingText.content || '';
    
    // Extract property details using regex patterns
    const patterns = {
      address: /(?:address|location|situated at|located at)[:\s]*([^,\n]+)/i,
      bedrooms: /(\d+)\s*(?:bedroom|bed|BR)/i,
      bathrooms: /(\d+)\s*(?:bathroom|bath|BA)/i,
      sqft: /(\d+(?:,\d+)?)\s*(?:sq\s*ft|square\s*feet|SF)/i,
      price: /\$?(\d+(?:,\d+)?(?:,\d+)?)/i,
      propertyType: /(?:beautiful|stunning|gorgeous|luxurious)\s+([^,\n]+?)(?:\s+in|\s+at|\s+with|$)/i
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
      extracted.sqft = extracted.sqft.replace(/,/g, '');
    }
    
    // Extract features (lines that start with bullet points or dashes)
    const featureLines = text.split('\n')
      .filter(line => line.trim().match(/^[•\-\*]\s+/))
      .map(line => line.replace(/^[•\-\*]\s+/, '').trim())
      .filter(line => line.length > 0);
    
    if (featureLines.length > 0) {
      extracted.features = featureLines.join('\n');
    }
    
    console.log('🔍 Parsed listing data:', extracted);
    return extracted;
  };

  const handleCopyListing = () => {
    if (!listing) return;
    
    let textToCopy = listing.content || listing;
    
    try {
      if (typeof listing === 'string') {
        const parsed = JSON.parse(listing);
        if (parsed.type === 'listing' && parsed.mls) {
          textToCopy = `${parsed.mls.headline}\n\n${parsed.mls.body}\n\nFeatures:\n${parsed.mls.bullets?.map(bullet => `• ${bullet}`).join('\n') || 'No features listed'}`;
        }
      } else if (listing.mls) {
        textToCopy = `${listing.mls.headline}\n\n${listing.mls.body}\n\nFeatures:\n${parsed.mls.bullets?.map(bullet => `• ${bullet}`).join('\n') || 'No features listed'}`;
      }
    } catch (e) {
      // If parsing fails, use as-is
      textToCopy = listing.content || listing;
    }
    
    navigator.clipboard.writeText(textToCopy);
    
    // Visual feedback
    const btn = document.querySelector('.copy-listing-btn');
    if (btn) {
      const originalText = btn.textContent;
      btn.textContent = '✅ Copied!';
      btn.style.background = '#10b981';
      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
      }, 2000);
    }
  };

  const handleGenerateFlyer = async () => {
    if (!isPro) {
      alert('Please upgrade to Pro to generate flyers');
      return;
    }

    // Parse the listing data to extract property details
    const parsedData = parseListingData(listing);
    
    // Update flyer data with parsed listing information
    setFlyerData(prev => ({
      ...prev,
      ...parsedData,
      // Ensure agency info is loaded from localStorage
      agentName: localStorage.getItem('agentName') || prev.agentName || '',
      agency: localStorage.getItem('agency') || prev.agency || '',
      agentPhone: localStorage.getItem('agentPhone') || prev.agentPhone || '',
      agentEmail: localStorage.getItem('agentEmail') || prev.agentEmail || ''
    }));

    // Open the modal to collect flyer data
    setSimpleFlyerModal(true);
  };

  // Save agent info to localStorage when it changes
  const saveAgentInfo = (field, value) => {
    localStorage.setItem(field, value);
  };

  const handleFlyerGeneration = async () => {
    try {
      setFlyerGenerating(true);
      console.log('🎨 Generating comprehensive flyer with user data:', flyerData);
      
      // Use Gemini AI for image generation
      console.log('🌍 Using Gemini AI for image generation...');
      await handleGeminiFlyerGeneration();
      
      // Close the modal after successful generation
      setSimpleFlyerModal(false);
    } catch (error) {
      console.error('❌ Error generating flyer:', error);
      alert(`Error generating flyer: ${error.message}`);
    } finally {
      setFlyerGenerating(false);
    }
  };

  // Handle Gemini AI image generation
  const handleGeminiFlyerGeneration = async () => {
    try {
      console.log('🎨 Using Gemini AI for image generation...');
      
      const currentFlyerType = flyerType === 'both' ? 'listing' : flyerType;
      console.log(`🎨 Generating ${currentFlyerType} flyer with Gemini AI...`);

      const response = await fetch('/api/generate-features', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          generationType: 'midjourney-image',
          propertyType: flyerData.propertyType || 'Residential Property',
          address: flyerData.address || '123 Main Street',
          price: flyerData.price || '$500,000',
          bedrooms: flyerData.bedrooms || 3,
          bathrooms: flyerData.bathrooms || 2,
          sqft: flyerData.sqft || 1500,
          features: flyerData.features || 'Modern kitchen, spacious backyard',
          style: flyerData.style || 'Modern',
          flyerType: currentFlyerType,
          // Include agency information for better flyer generation
          agentName: flyerData.agentName || '',
          agency: flyerData.agency || '',
          agentPhone: flyerData.agentPhone || '',
          agentEmail: flyerData.agentEmail || ''
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('🎨 Gemini AI flyer generation result:', result);
      
      if (result.success) {
        // Check if this is a fallback response
        if (result.fallback) {
          console.log('🔄 AI generation returned fallback response');
          console.log('🔍 Fallback details:', result);
          
          // Show the fallback response to the user
          alert(`AI generated a response but couldn't create an image. Response: ${result.message}`);
          return;
        }
        
        // Create a download link for the AI-generated image
        if (result.imageUrl) {
          const link = document.createElement('a');
          link.href = result.imageUrl;
          link.download = `gemini-flyer-${currentFlyerType}-${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          console.log(`✅ ${currentFlyerType} flyer generated and downloaded as image!`);
          alert(`${currentFlyerType === 'openhouse' ? 'Open house' : 'Property listing'} flyer generated successfully! Downloading now...`);
        } else {
          throw new Error('No image URL received from Gemini AI');
        }
      } else {
        throw new Error(result.error || 'Failed to generate flyer with Gemini AI');
      }
    } catch (error) {
      console.error('❌ Error in Gemini AI flyer generation:', error);
      throw error;
    }
  };

  const handleBackToChat = () => {
    router.push('/chat');
  };

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="loading-page">
        <div className="loading-spinner"></div>
        <div className="loading-text">Loading...</div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="loading-page">
        <div className="loading-spinner"></div>
        <div className="loading-text">Loading listing...</div>
      </div>
    );
  }

  return (
    <div className="listing-display-page">
      <div className="listing-header">
        <button className="back-btn" onClick={handleBackToChat}>
          ← Back to Chat
        </button>
        <h1>Generated Listing</h1>
      </div>

      <div className="listing-container">
        <div className="listing-content">
          {(() => {
            try {
              if (typeof listing === 'string') {
                const parsed = JSON.parse(listing);
                if (parsed.type === 'listing' && parsed.mls) {
                  return (
                    <div className="formatted-listing">
                      <h2 className="listing-headline">{parsed.mls.headline}</h2>
                      <p className="listing-body">{parsed.mls.body}</p>
                      {parsed.mls.bullets && parsed.mls.bullets.length > 0 && (
                        <ul className="listing-features">
                          {parsed.mls.bullets.map((bullet, index) => (
                            <li key={index} className="listing-feature">{bullet}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                }
              }
              
              // Default display for plain text
              return (
                <div className="plain-listing">
                  <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                    {typeof listing === 'string' ? listing : listing.content || 'No listing content available'}
                  </pre>
                </div>
              );
            } catch (e) {
              return (
                <div className="plain-listing">
                  <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                    {typeof listing === 'string' ? listing : listing.content || 'No listing content available'}
                  </pre>
                </div>
              );
            }
          })()}
        </div>

        <div className="listing-actions">
          <button className="copy-listing-btn" onClick={handleCopyListing}>
            📋 Copy Listing
          </button>
          <button className="generate-flyer-btn" onClick={handleGenerateFlyer}>
            🎨 Generate Flyer with Gemini AI
          </button>
        </div>
      </div>

      {/* Simple Flyer Modal */}
      {simpleFlyerModal && (
        <div className="flyer-modal-overlay" onClick={() => setSimpleFlyerModal(false)}>
          <div className="flyer-modal" onClick={(e) => e.stopPropagation()}>
            <div className="flyer-modal-header">
              <h2>Generate Professional Flyer</h2>
              <button 
                className="close-btn" 
                onClick={() => setSimpleFlyerModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: 'white'
                }}
              >
                ×
              </button>
            </div>

            <div className="flyer-modal-content">
              {/* Generation Method - Always Gemini AI */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'white', fontSize: '14px', fontWeight: '500' }}>
                  Generation Method
                </label>
                <div style={{ 
                  padding: '12px 20px', 
                  borderRadius: '12px', 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: '2px solid #667eea',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  🎨 Gemini AI Image Generation
                  <small style={{ display: 'block', fontSize: '12px', opacity: '0.8' }}>Premium AI-Generated Flyers</small>
                </div>
              </div>

              {/* Flyer Type Selection */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'white', fontSize: '14px', fontWeight: '500' }}>
                  Flyer Type
                </label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setFlyerType('listing')}
                    style={{
                      padding: '12px 20px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      background: flyerType === 'listing' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      border: `2px solid ${flyerType === 'listing' ? '#667eea' : 'rgba(255, 255, 255, 0.3)'}`,
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Property Listing
                  </button>
                  <button
                    type="button"
                    onClick={() => setFlyerType('openhouse')}
                    style={{
                      padding: '12px 20px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      background: flyerType === 'openhouse' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      border: `2px solid ${flyerType === 'openhouse' ? '#667eea' : 'rgba(255, 255, 255, 0.3)'}`,
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Open House
                  </button>
                  <button
                    type="button"
                    onClick={() => setFlyerType('both')}
                    style={{
                      padding: '12px 20px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      background: flyerType === 'both' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      border: `2px solid ${flyerType === 'both' ? '#667eea' : 'rgba(255, 255, 255, 0.3)'}`,
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Both Flyers
                  </button>
                </div>
              </div>

              {/* Property Details Form */}
              <div style={{ marginBottom: '30px' }}>
                <h3 style={{ color: 'white', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🏠 Property Details
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'white' }}>Property Address</label>
                    <input
                      type="text"
                      placeholder="123 Main Street, City, State"
                      value={flyerData.address || listing?.address || ''}
                      onChange={(e) => setFlyerData({...flyerData, address: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '8px',
                        fontSize: '16px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        transition: 'all 0.3s ease'
                      }}
                      onFocus={(e) => {
                        e.target.style.border = '2px solid #667eea';
                        e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                      }}
                      onBlur={(e) => {
                        e.target.style.border = '2px solid rgba(255, 255, 255, 0.3)';
                        e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'white' }}>Property Type</label>
                    <select
                      value={flyerData.propertyType || listing?.propertyType || ''}
                      onChange={(e) => setFlyerData({...flyerData, propertyType: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '8px',
                        fontSize: '16px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        transition: 'all 0.3s ease'
                      }}
                      onFocus={(e) => {
                        e.target.style.border = '2px solid #667eea';
                        e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                      }}
                      onBlur={(e) => {
                        e.target.style.border = '2px solid rgba(255, 255, 255, 0.3)';
                        e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                      }}
                    >
                      <option value="">Select Property Type</option>
                      <option value="Single Family Home">Single Family Home</option>
                      <option value="Townhouse">Townhouse</option>
                      <option value="Condo">Condo</option>
                      <option value="Multi-Family">Multi-Family</option>
                      <option value="Luxury Home">Luxury Home</option>
                      <option value="Investment Property">Investment Property</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'white' }}>Bedrooms</label>
                    <input
                      type="number"
                      placeholder="3"
                      value={flyerData.bedrooms || listing?.bedrooms || ''}
                      onChange={(e) => setFlyerData({...flyerData, bedrooms: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '8px',
                        fontSize: '16px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        transition: 'all 0.3s ease'
                      }}
                      onFocus={(e) => {
                        e.target.style.border = '2px solid #667eea';
                        e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                      }}
                      onBlur={(e) => {
                        e.target.style.border = '2px solid rgba(255, 255, 255, 0.3)';
                        e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'white' }}>Bathrooms</label>
                    <input
                      type="number"
                      placeholder="2"
                      value={flyerData.bathrooms || listing?.bathrooms || ''}
                      onChange={(e) => setFlyerData({...flyerData, bathrooms: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '8px',
                        fontSize: '16px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        transition: 'all 0.3s ease'
                      }}
                      onFocus={(e) => {
                        e.target.style.border = '2px solid #667eea';
                        e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                      }}
                      onBlur={(e) => {
                        e.target.style.border = '2px solid rgba(255, 255, 255, 0.3)';
                        e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'white' }}>Square Footage</label>
                    <input
                      type="number"
                      placeholder="1500"
                      value={flyerData.sqft || listing?.sqft || ''}
                      onChange={(e) => setFlyerData({...flyerData, sqft: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '8px',
                        fontSize: '16px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        transition: 'all 0.3s ease'
                      }}
                      onFocus={(e) => {
                        e.target.style.border = '2px solid #667eea';
                        e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                      }}
                      onBlur={(e) => {
                        e.target.style.border = '2px solid rgba(255, 255, 255, 0.3)';
                        e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'white' }}>Price</label>
                    <input
                      type="text"
                      placeholder="$500,000"
                      value={flyerData.price || listing?.price || ''}
                      onChange={(e) => setFlyerData({...flyerData, price: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '8px',
                        fontSize: '16px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        transition: 'all 0.3s ease'
                      }}
                      onFocus={(e) => {
                        e.target.style.border = '2px solid #667eea';
                        e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                      }}
                      onBlur={(e) => {
                        e.target.style.border = '2px solid rgba(255, 255, 255, 0.3)';
                        e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                      }}
                    />
                  </div>
                </div>
                <div style={{ marginTop: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'white' }}>Features</label>
                  <textarea
                    placeholder="Enter property features (one per line)"
                    value={flyerData.features || listing?.features || ''}
                    onChange={(e) => setFlyerData({...flyerData, features: e.target.value})}
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '8px',
                      fontSize: '16px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      transition: 'all 0.3s ease',
                      resize: 'vertical'
                    }}
                    onFocus={(e) => {
                      e.target.style.border = '2px solid #667eea';
                      e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                    }}
                    onBlur={(e) => {
                      e.target.style.border = '2px solid rgba(255, 255, 255, 0.3)';
                      e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                    }}
                  />
                </div>
              </div>

              {/* Agent Information */}
              <div style={{ marginBottom: '30px' }}>
                <h3 style={{ color: 'white', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  👤 Agent Information
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'white' }}>Agent Name</label>
                    <input
                      type="text"
                      placeholder="John Smith"
                      value={flyerData.agentName}
                      onChange={(e) => {
                        setFlyerData({...flyerData, agentName: e.target.value});
                        saveAgentInfo('agentName', e.target.value);
                      }}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '8px',
                        fontSize: '16px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        transition: 'all 0.3s ease'
                      }}
                      onFocus={(e) => {
                        e.target.style.border = '2px solid #667eea';
                        e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                      }}
                      onBlur={(e) => {
                        e.target.style.border = '2px solid rgba(255, 255, 255, 0.3)';
                        e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'white' }}>Agency</label>
                    <input
                      type="text"
                      placeholder="Premier Real Estate"
                      value={flyerData.agency}
                      onChange={(e) => {
                        setFlyerData({...flyerData, agency: e.target.value});
                        saveAgentInfo('agency', e.target.value);
                      }}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '8px',
                        fontSize: '16px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        transition: 'all 0.3s ease'
                      }}
                      onFocus={(e) => {
                        e.target.style.border = '2px solid #667eea';
                        e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                      }}
                      onBlur={(e) => {
                        e.target.style.border = '2px solid rgba(255, 255, 255, 0.3)';
                        e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'white' }}>Phone</label>
                    <input
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={flyerData.agentPhone}
                      onChange={(e) => {
                        setFlyerData({...flyerData, agentPhone: e.target.value});
                        saveAgentInfo('agentPhone', e.target.value);
                      }}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '8px',
                        fontSize: '16px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        transition: 'all 0.3s ease'
                      }}
                      onFocus={(e) => {
                        e.target.style.border = '2px solid #667eea';
                        e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                      }}
                      onBlur={(e) => {
                        e.target.style.border = '2px solid rgba(255, 255, 255, 0.3)';
                        e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'white' }}>Email</label>
                    <input
                      type="email"
                      placeholder="john.smith@premiere.com"
                      value={flyerData.agentEmail}
                      onChange={(e) => {
                        setFlyerData({...flyerData, agentEmail: e.target.value});
                        saveAgentInfo('agentEmail', e.target.value);
                      }}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '8px',
                        fontSize: '16px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        transition: 'all 0.3s ease'
                      }}
                      onFocus={(e) => {
                        e.target.style.border = '2px solid #667eea';
                        e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                      }}
                      onBlur={(e) => {
                        e.target.style.border = '2px solid rgba(255, 255, 255, 0.3)';
                        e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <div style={{ textAlign: 'center', marginTop: '30px' }}>
                <button
                  onClick={handleFlyerGeneration}
                  disabled={flyerGenerating}
                  style={{
                    padding: '16px 32px',
                    fontSize: '18px',
                    fontWeight: '600',
                    borderRadius: '12px',
                    background: flyerGenerating 
                      ? 'rgba(255, 255, 255, 0.3)' 
                      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    cursor: flyerGenerating ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    margin: '0 auto'
                  }}
                >
                  {flyerGenerating ? (
                    <>
                      <div className="spinner" style={{
                        width: '20px',
                        height: '20px',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        borderTop: '2px solid white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      Generating with Gemini AI...
                    </>
                  ) : (
                    <>
                      🎨 Generate {flyerType === 'both' ? 'Both Flyers' : flyerType === 'listing' ? 'Property Listing' : 'Open House'} with Gemini AI
                    </>
                  )}
                </button>
                
                {/* Download Format Indicator */}
                <div style={{
                  marginTop: '12px',
                  fontSize: '14px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  display: 'inline-block'
                }}>
                  🎨 Downloads as AI-Generated Image
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .spinner {
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        }
      `}</style>
    </div>
  );
}
