import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '@clerk/nextjs';
import useUserPlan from '../hooks/useUserPlan';

export default function ListingDisplayPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();
  const { isPro } = useUserPlan();
  const [listing, setListing] = useState(null);
  const [flyerOpen, setFlyerOpen] = useState(false);
  const [flyerGenerating, setFlyerGenerating] = useState(false);

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
    setFlyerOpen(true);
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

      {/* Flyer Modal would go here */}
      {flyerOpen && (
        <div className="flyer-modal-overlay">
          <div className="flyer-modal">
            <div className="flyer-modal-header">
              <h3>Generate Professional Flyer</h3>
              <button onClick={() => setFlyerOpen(false)}>✕</button>
            </div>
            <div className="flyer-modal-body">
              <p>Flyer generation modal will be implemented here.</p>
              <p>This is a placeholder for the enhanced flyer modal.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
