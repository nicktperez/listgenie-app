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

  const handleGenerateFlyer = () => {
    if (!isPro) {
      alert('Please upgrade to Pro to generate flyers');
      return;
    }
    console.log('🎨 Opening simple flyer modal on listing-display page');
    setSimpleFlyerModal(true);
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
              🎨 Generate Flyer
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

      {/* SIMPLE WORKING FLYER MODAL */}
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
          justifyContent: 'center'
        }}>
          <div style={{
            background: 'white',
            color: 'black',
            padding: '40px',
            borderRadius: '15px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            textAlign: 'center'
          }}>
            <h2 style={{ 
              color: '#667eea', 
              marginBottom: '20px',
              fontSize: '28px'
            }}>
              🎨 Generate Professional Flyer
            </h2>
            
            <div style={{ 
              background: '#f8f9fa', 
              padding: '20px', 
              borderRadius: '10px',
              marginBottom: '20px',
              textAlign: 'left'
            }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>Property Listing:</h4>
              <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5' }}>
                {listing?.content?.substring(0, 200) || listing?.substring(0, 200) || 'Listing content...'}...
              </p>
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '15px',
              marginBottom: '20px'
            }}>
              <button
                onClick={() => {
                  console.log('🎨 Generating luxury flyer...');
                  setFlyerGenerating(true);
                  
                  // Simulate flyer generation
                  setTimeout(() => {
                    setFlyerGenerating(false);
                    alert('Luxury flyer generated! (This would download the PDF)');
                  }, 2000);
                }}
                disabled={flyerGenerating}
                style={{
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: 'white',
                  padding: '15px',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600',
                  transition: 'all 0.3s ease'
                }}
              >
                {flyerGenerating ? '🔄 Generating...' : '💎 Luxury Style'}
              </button>
              
              <button
                onClick={() => {
                  console.log('🎨 Generating modern flyer...');
                  setFlyerGenerating(true);
                  
                  // Simulate flyer generation
                  setTimeout(() => {
                    setFlyerGenerating(false);
                    alert('Modern flyer generated! (This would download the PDF)');
                  }, 2000);
                }}
                disabled={flyerGenerating}
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                  padding: '15px',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600',
                  transition: 'all 0.3s ease'
                }}
              >
                {flyerGenerating ? '🔄 Generating...' : '🚀 Modern Style'}
              </button>
              
              <button
                onClick={() => {
                  console.log('🎨 Generating classic flyer...');
                  setFlyerGenerating(true);
                  
                  // Simulate flyer generation
                  setTimeout(() => {
                    setFlyerGenerating(false);
                    alert('Classic flyer generated! (This would download the PDF)');
                  }, 2000);
                }}
                disabled={flyerGenerating}
                style={{
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: 'white',
                  padding: '15px',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600',
                  transition: 'all 0.3s ease'
                }}
              >
                {flyerGenerating ? '🔄 Generating...' : '🏛️ Classic Style'}
              </button>
            </div>
            
            <button
              onClick={() => {
                console.log('🎨 Closing simple flyer modal');
                setSimpleFlyerModal(false);
                setFlyerGenerating(false);
              }}
              style={{
                background: '#6b7280',
                color: 'white',
                padding: '12px 24px',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500',
                marginTop: '10px'
              }}
            >
              Close Modal
            </button>
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
