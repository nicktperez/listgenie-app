import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '@clerk/nextjs';
import useUserPlan from '../hooks/useUserPlan';
import EnhancedFlyerModal from '../components/chat/EnhancedFlyerModal';

export default function ListingDisplayPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();
  const { isPro } = useUserPlan();
  const [listing, setListing] = useState(null);
  const [flyerOpen, setFlyerOpen] = useState(false);
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
    style: 'luxury-real-estate' // Default style
  });

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
      return;
    }

    // Get listing from localStorage or sessionStorage
    const savedListing = localStorage.getItem('currentListing') || sessionStorage.getItem('currentListing');
    if (savedListing) {
      try {
        setListing(JSON.parse(savedListing));
      } catch (e) {
        setListing({ content: savedListing, type: 'plain' });
      }
    } else {
      // No listing found, redirect back to chat
      router.push('/chat');
    }
  }, [isLoaded, isSignedIn, router]);

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
        textToCopy = `${listing.mls.headline}\n\n${listing.mls.body}\n\nFeatures:\n${listing.mls.bullets?.map(bullet => `• ${bullet}`).join('\n') || 'No features listed'}`;
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

    // Open the modal to collect flyer data
    setSimpleFlyerModal(true);
  };

  const handleFlyerGeneration = async () => {
    try {
      setFlyerGenerating(true);
      console.log('🎨 Generating comprehensive flyer with user data:', flyerData);
      
      // Prepare the data for the flyer engine
      const flyerRequestData = {
        style: flyerData.style,
        flyerType: flyerType, // 'listing' or 'openhouse'
        propertyInfo: {
          address: flyerData.address,
          propertyType: flyerData.propertyType || 'Residential Property',
          bedrooms: flyerData.bedrooms || 'Contact for details',
          bathrooms: flyerData.bathrooms || 'Contact for details',
          sqft: flyerData.sqft || 'Contact for details',
          price: flyerData.price || 'Contact for pricing',
          features: flyerData.features ? flyerData.features.split('\n').filter(f => f.trim()) : [],
          openHouseDate: flyerData.openHouseDate || '',
          openHouseTime: flyerData.openHouseTime || ''
        },
        agentInfo: {
          name: flyerData.agentName || 'Professional Agent',
          agency: flyerData.agency || 'Premier Real Estate',
          phone: flyerData.agentPhone || 'Contact for details',
          email: flyerData.agentEmail || 'agent@premiere.com'
        },
        photos: flyerData.photos || []
      };

      console.log('🎨 Sending flyer request:', flyerRequestData);
      
      // Call the actual flyer engine
      const response = await fetch('/api/flyer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(flyerRequestData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('🎨 Flyer generation result:', result);
      
      if (result.success) {
        // Create and download the flyer
        const flyerHTML = result.flyer.html;
        const flyerCSS = result.flyer.css;
        
        // Create a complete HTML document
        const fullHTML = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${flyerType === 'openhouse' ? 'Open House' : 'Property Listing'} Flyer - ${flyerData.address}</title>
            <style>${flyerCSS}</style>
          </head>
          <body>
            ${flyerHTML}
          </body>
          </html>
        `;
        
        // Create blob and download
        const blob = new Blob([fullHTML], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const timestamp = new Date().toISOString().split('T')[0];
        const fileName = `${flyerType}-flyer-${flyerData.address.replace(/[^a-zA-Z0-9]/g, '-')}-${timestamp}.html`;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        alert(`${flyerType === 'openhouse' ? 'Open House' : 'Property Listing'} flyer generated successfully! Downloading now...`);
        
        // Close the modal after successful generation
        setSimpleFlyerModal(false);
      } else {
        throw new Error(result.error || 'Failed to generate flyer');
      }
    } catch (error) {
      console.error('❌ Error generating flyer:', error);
      alert(`Error generating flyer: ${error.message}`);
    } finally {
      setFlyerGenerating(false);
    }
  };

  const handleEnhancedFlyerGeneration = async (flyerData) => {
    try {
      setFlyerGenerating(true);
      
      const response = await fetch('/api/flyer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...flyerData,
          listing: listing
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Download the generated PDF
        const link = document.createElement('a');
        link.href = result.pdfUrl;
        link.download = `professional-flyer-${Date.now()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setFlyerOpen(false);
        alert('Flyer generated successfully! Downloading now...');
      } else {
        throw new Error(result.error || 'Failed to generate flyer');
      }
    } catch (error) {
      console.error('Error generating flyer:', error);
      alert(`Error generating flyer: ${error.message}`);
    } finally {
      setFlyerGenerating(false);
    }
  };

  const handleFlyerPreview = (previewData) => {
    // Handle flyer preview if needed
    console.log('Flyer preview:', previewData);
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
              } else if (listing.mls) {
                return (
                  <div className="formatted-listing">
                    <h2 className="listing-headline">{listing.mls.headline}</h2>
                    <p className="listing-body">{listing.mls.body}</p>
                    {listing.mls.bullets && listing.mls.bullets.length > 0 && (
                      <ul className="listing-features">
                        {listing.mls.bullets.map((bullet, index) => (
                          <li key={index} className="listing-feature">{bullet}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              }
            } catch (e) {
              // If not JSON, display as plain text
            }
            
            return (
              <div className="plain-listing">
                <p>{listing.content || listing}</p>
              </div>
            );
          })()}
        </div>

        <div className="listing-actions">
          <button className="copy-listing-btn" onClick={handleCopyListing}>
            📋 Copy Listing
          </button>
          
          {isPro && (
            <button className="flyer-generation-btn" onClick={handleGenerateFlyer}>
              <img src="/flyer-icon.svg" alt="Flyer" style={{ width: '20px', height: '20px', marginRight: '8px', verticalAlign: 'middle' }} />
              Generate Flyer
            </button>
          )}
          

          
          {!isPro && (
            <div className="upgrade-notice">
              <p>Upgrade to Pro to generate professional flyers</p>
              <button className="upgrade-btn" onClick={() => router.push('/upgrade')}>
                Upgrade Now
              </button>
            </div>
          )}
        </div>
      </div>



      {/* COMPREHENSIVE FLYER CREATION WIZARD */}
      {simpleFlyerModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 99999,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            color: 'black',
            padding: '40px',
            borderRadius: '20px',
            maxWidth: '800px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            textAlign: 'left'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '30px',
              borderBottom: '2px solid #667eea',
              paddingBottom: '20px'
            }}>
              <h2 style={{ 
                color: '#667eea', 
                margin: 0, 
                fontSize: '28px',
                fontWeight: '700'
              }}>
                🎨 Create Professional Real Estate Flyer
              </h2>
              <button
                onClick={() => setSimpleFlyerModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666',
                  padding: '5px'
                }}
              >
                ✕
              </button>
            </div>

            {/* Flyer Type Selection */}
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ color: '#333', marginBottom: '15px' }}>📋 What type of flyer do you need?</h3>
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setFlyerType('listing')}
                  style={{
                    background: flyerType === 'listing' ? '#667eea' : '#f8f9fa',
                    color: flyerType === 'listing' ? 'white' : '#333',
                    border: `2px solid ${flyerType === 'listing' ? '#667eea' : '#ddd'}`,
                    padding: '15px 25px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '600',
                    transition: 'all 0.3s ease'
                  }}
                >
                  🏠 Property Listing Flyer
                </button>
                <button
                  onClick={() => setFlyerType('openhouse')}
                  style={{
                    background: flyerType === 'openhouse' ? '#667eea' : '#f8f9fa',
                    color: flyerType === 'openhouse' ? 'white' : '#333',
                    border: `2px solid ${flyerType === 'openhouse' ? '#667eea' : '#ddd'}`,
                    padding: '15px 25px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '600',
                    transition: 'all 0.3s ease'
                  }}
                >
                  🗓️ Open House Flyer
                </button>
              </div>
            </div>

            {/* Property Details Form */}
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ color: '#333', marginBottom: '15px' }}>🏡 Property Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Property Address</label>
                  <input
                    type="text"
                    placeholder="123 Main Street, City, State"
                    value={flyerData.address || ''}
                    onChange={(e) => setFlyerData({...flyerData, address: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '16px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Property Type</label>
                  <select
                    value={flyerData.propertyType || ''}
                    onChange={(e) => setFlyerData({...flyerData, propertyType: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '16px'
                    }}
                  >
                    <option value="">Select Property Type</option>
                    <option value="single-family">Single Family Home</option>
                    <option value="townhouse">Townhouse</option>
                    <option value="condo">Condo</option>
                    <option value="multi-family">Multi-Family</option>
                    <option value="land">Land</option>
                    <option value="commercial">Commercial</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Bedrooms</label>
                  <input
                    type="number"
                    placeholder="3"
                    value={flyerData.bedrooms || ''}
                    onChange={(e) => setFlyerData({...flyerData, bedrooms: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '16px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Bathrooms</label>
                  <input
                    type="number"
                    placeholder="2"
                    value={flyerData.bathrooms || ''}
                    onChange={(e) => setFlyerData({...flyerData, bathrooms: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '16px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Square Feet</label>
                  <input
                    type="number"
                    placeholder="2,000"
                    value={flyerData.sqft || ''}
                    onChange={(e) => setFlyerData({...flyerData, sqft: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '16px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Price</label>
                  <input
                    type="text"
                    placeholder="$500,000"
                    value={flyerData.price || ''}
                    onChange={(e) => setFlyerData({...flyerData, price: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '16px'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Property Features */}
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ color: '#333', marginBottom: '15px' }}>✨ Property Features</h3>
              <textarea
                placeholder="Enter key features like: Granite countertops, Hardwood floors, Updated kitchen, Large backyard, Garage, etc."
                value={flyerData.features || ''}
                onChange={(e) => setFlyerData({...flyerData, features: e.target.value})}
                style={{
                  width: '100%',
                  padding: '15px',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '16px',
                  minHeight: '100px',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Open House Specific Fields */}
            {flyerType === 'openhouse' && (
              <div style={{ marginBottom: '30px' }}>
                <h3 style={{ color: '#333', marginBottom: '15px' }}>🗓️ Open House Details</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Date</label>
                    <input
                      type="date"
                      value={flyerData.openHouseDate || ''}
                      onChange={(e) => setFlyerData({...flyerData, openHouseDate: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '16px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Time</label>
                    <input
                      type="time"
                      value={flyerData.openHouseTime || ''}
                      onChange={(e) => setFlyerData({...flyerData, openHouseTime: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '16px'
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Agent Information */}
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ color: '#333', marginBottom: '15px' }}>👤 Agent Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Agent Name</label>
                  <input
                    type="text"
                    placeholder="John Smith"
                    value={flyerData.agentName || ''}
                    onChange={(e) => setFlyerData({...flyerData, agentName: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '16px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Agency</label>
                  <input
                    type="text"
                    placeholder="Smith Real Estate"
                    value={flyerData.agency || ''}
                    onChange={(e) => setFlyerData({...flyerData, agency: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '16px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Phone</label>
                  <input
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={flyerData.agentPhone || ''}
                    onChange={(e) => setFlyerData({...flyerData, agentPhone: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '16px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Email</label>
                  <input
                    type="email"
                    placeholder="john@smithrealestate.com"
                    value={flyerData.agentEmail || ''}
                    onChange={(e) => setFlyerData({...flyerData, agentEmail: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '16px'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Photo Upload */}
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ color: '#333', marginBottom: '15px' }}>📸 Property Photos</h3>
              <div style={{
                border: '2px dashed #ddd',
                borderRadius: '12px',
                padding: '30px',
                textAlign: 'center',
                backgroundColor: '#f8f9fa'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '15px' }}>📷</div>
                <p style={{ margin: '0 0 15px 0', color: '#666' }}>
                  {flyerData.photos && flyerData.photos.length > 0 
                    ? `${flyerData.photos.length} photo(s) selected`
                    : 'Drag & drop photos here or click to browse'
                  }
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    const files = Array.from(e.target.files);
                    setFlyerData({...flyerData, photos: files});
                  }}
                  style={{ display: 'none' }}
                  id="photo-upload"
                />
                <label
                  htmlFor="photo-upload"
                  style={{
                    background: '#667eea',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '600',
                    display: 'inline-block'
                  }}
                >
                  Choose Photos
                </label>
              </div>
            </div>

            {/* Style Selection */}
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ color: '#333', marginBottom: '15px' }}>🎨 Design Style</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                <button
                  onClick={() => setFlyerData({...flyerData, style: 'luxury-real-estate'})}
                  style={{
                    background: flyerData.style === 'luxury-real-estate' ? '#667eea' : '#f8f9fa',
                    color: flyerData.style === 'luxury-real-estate' ? 'white' : '#333',
                    border: `2px solid ${flyerData.style === 'luxury-real-estate' ? '#667eea' : '#ddd'}`,
                    padding: '20px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '600',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>👑</div>
                  <strong>Luxury</strong><br/>
                  <small>Premium & Sophisticated</small>
                </button>
                <button
                  onClick={() => setFlyerData({...flyerData, style: 'modern-contemporary'})}
                  style={{
                    background: flyerData.style === 'modern-contemporary' ? '#667eea' : '#f8f9fa',
                    color: flyerData.style === 'modern-contemporary' ? 'white' : '#333',
                    border: `2px solid ${flyerData.style === 'modern-contemporary' ? '#667eea' : '#ddd'}`,
                    padding: '20px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '600',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>✨</div>
                  <strong>Modern</strong><br/>
                  <small>Clean & Contemporary</small>
                </button>
                <button
                  onClick={() => setFlyerData({...flyerData, style: 'classic-elegant'})}
                  style={{
                    background: flyerData.style === 'classic-elegant' ? '#667eea' : '#f8f9fa',
                    color: flyerData.style === 'classic-elegant' ? 'white' : '#333',
                    border: `2px solid ${flyerData.style === 'classic-elegant' ? '#667eea' : '#ddd'}`,
                    padding: '20px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '600',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>🏛️</div>
                  <strong>Classic</strong><br/>
                  <small>Timeless & Elegant</small>
                </button>
              </div>
            </div>

            {/* Generate Button */}
            <div style={{ textAlign: 'center', marginTop: '40px' }}>
              <button
                onClick={handleFlyerGeneration}
                disabled={flyerGenerating || !flyerData.style || !flyerData.address}
                style={{
                  background: (!flyerData.style || !flyerData.address) ? '#ccc' : '#667eea',
                  color: 'white',
                  border: 'none',
                  padding: '18px 40px',
                  borderRadius: '12px',
                  fontSize: '18px',
                  fontWeight: '700',
                  cursor: (!flyerData.style || !flyerData.address) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
                }}
              >
                {flyerGenerating ? '🎨 Generating Flyer...' : '🚀 Generate Professional Flyer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Flyer Modal */}
      {flyerOpen && (
        <EnhancedFlyerModal
          onClose={() => setFlyerOpen(false)}
          onGenerate={handleEnhancedFlyerGeneration}
          listing={listing}
          loading={flyerGenerating}
          onPreview={handleFlyerPreview}
        />
      )}
    </div>
  );
}
