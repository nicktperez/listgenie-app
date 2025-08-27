import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '@clerk/nextjs';
import useUserPlan from '../hooks/useUserPlan';
import EnhancedFlyerModal from '../components/chat/EnhancedFlyerModal';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
    style: 'luxury-real-estate', // Default style
    generationMethod: 'programmatic' // Default to programmatic engine
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

  // Generate dynamic features using OpenRouter AI
  const generateDynamicFeatures = async (listingData) => {
    try {
      const response = await fetch('/api/generate-features', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyType: listingData.propertyType,
          address: listingData.address,
          price: listingData.price,
          bedrooms: listingData.bedrooms,
          bathrooms: listingData.bathrooms,
          sqft: listingData.sqft,
          features: listingData.features
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.features;
      }
    } catch (error) {
      console.error('Error generating features:', error);
    }
    
    // Fallback to default features if AI generation fails
    return [
      { title: 'Premium Location', description: 'Situated in a highly desirable neighborhood with excellent amenities and accessibility.' },
      { title: 'Modern Design', description: 'Contemporary architecture with premium finishes and thoughtful design elements throughout.' },
      { title: 'Family Friendly', description: 'Perfect for families with spacious rooms, outdoor areas, and a safe neighborhood environment.' },
      { title: 'Investment Value', description: 'Strong potential for appreciation in this rapidly developing area with excellent market fundamentals.' }
    ];
  };

  // Download flyer as PDF
  const downloadFlyerAsPDF = async (flyerContent) => {
    try {
      // Create a temporary container for the flyer
      const tempContainer = document.createElement('div');
      tempContainer.innerHTML = flyerContent;
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '1200px'; // Fixed width for consistent PDF
      tempContainer.style.backgroundColor = 'white';
      document.body.appendChild(tempContainer);

      // Convert to canvas
      const canvas = await html2canvas(tempContainer, {
        width: 1200,
        height: tempContainer.scrollHeight,
        scale: 2, // Higher quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      // Remove temporary container
      document.body.removeChild(tempContainer);

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Download PDF
      const fileName = `flyer-${flyerData.address.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  // Save agent info to localStorage when it changes
  const saveAgentInfo = (field, value) => {
    localStorage.setItem(field, value);
  };

  const handleFlyerGeneration = async () => {
    try {
      setFlyerGenerating(true);
      console.log('🎨 Generating comprehensive flyer with user data:', flyerData);
      
      // Check which generation method to use
      if (flyerData.generationMethod === 'ai') {
        console.log('🌍 Using Gemini AI for image generation...');
        await handleGeminiFlyerGeneration();
      } else {
        console.log('🌍 Using programmatic flyer engine...');
        await handleProgrammaticFlyerGeneration();
      }
      
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
          flyerType: currentFlyerType
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
          console.log('🔄 AI generation unavailable, but not switching to programmatic engine...');
          console.log('🔍 Fallback details:', result);
          alert('AI image generation is currently unavailable. Please check the console for details. We are focusing on getting Gemini AI working.');
          return;
        }
        
        // Create a download link for the AI-generated image
        const link = document.createElement('a');
        link.href = result.imageUrl;
        link.download = `${currentFlyerType}-flyer-${Date.now()}.png`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log(`✅ ${currentFlyerType} AI flyer generated and downloaded!`);
      } else {
        // If AI fails completely, show detailed error instead of falling back
        console.log('❌ AI generation failed completely:', result);
        alert(`AI generation failed: ${result.error || 'Unknown error'}. Please check the console for details. We are focusing on getting Gemini AI working.`);
        return;
      }
    } catch (error) {
      console.error('❌ Error in Gemini flyer generation:', error);
      throw error;
    }
  };

  // Handle programmatic flyer generation
  const handleProgrammaticFlyerGeneration = async () => {
    try {
      console.log('🎨 Using programmatic flyer engine...');
      
      // Generate dynamic features for this listing
      const dynamicFeatures = await generateDynamicFeatures(flyerData);
      console.log('🎨 Generated dynamic features:', dynamicFeatures);
      
      // Handle both flyer types if selected
      const flyerTypes = flyerType === 'both' ? ['listing', 'openhouse'] : [flyerType];
      
      for (const currentFlyerType of flyerTypes) {
        console.log(`🎨 Generating ${currentFlyerType} flyer...`);
        
        // Prepare the data for the flyer engine
        const flyerRequestData = {
          style: flyerData.style,
          flyerType: currentFlyerType,
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
          photos: flyerData.photos || [],
          dynamicFeatures: dynamicFeatures
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
          // Create and download the flyer as PDF
          const flyerHTML = result.flyer.html;
          const flyerCSS = result.flyer.css;
          
          // Create a complete HTML document
          const fullHTML = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>${currentFlyerType === 'openhouse' ? 'Open House' : 'Property Listing'} Flyer - ${flyerData.address}</title>
              <style>${flyerCSS}</style>
            </head>
            <body>
              ${flyerHTML}
            </body>
            </html>
          `;
          
          // Download as PDF
          await downloadFlyerAsPDF(fullHTML);
          
          console.log(`✅ ${currentFlyerType} flyer generated and downloaded as PDF!`);
        } else {
          throw new Error(result.error || `Failed to generate ${currentFlyerType} flyer`);
        }
      }
      
      alert(`${flyerType === 'both' ? 'Both flyers' : flyerType === 'listing' ? 'Property listing' : 'Open house'} generated successfully! Downloading now...`);
      
    } catch (error) {
      console.error('❌ Error in programmatic flyer generation:', error);
      throw error;
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
          <button 
            className="copy-listing-btn" 
            onClick={handleCopyListing}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
            }}
          >
            <img src="/copy-icon.svg" alt="Copy" style={{ width: '20px', height: '20px', verticalAlign: 'middle' }} />
            Copy Listing
          </button>
          
          {isPro && (
            <button 
              className="flyer-generation-btn" 
              onClick={handleGenerateFlyer}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
              }}
            >
              <img src="/flyer-icon.svg" alt="Flyer" style={{ width: '20px', height: '20px', verticalAlign: 'middle' }} />
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
            background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
            color: 'white',
            padding: '40px',
            borderRadius: '20px',
            maxWidth: '900px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            textAlign: 'left',
            border: '2px solid #667eea',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '30px',
              borderBottom: '2px solid #667eea',
              paddingBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img src="/palette-icon.svg" alt="Palette" style={{ width: '28px', height: '28px' }} />
                <h2 style={{ 
                  color: 'white', 
                  margin: 0, 
                  fontSize: '28px',
                  fontWeight: '700'
                }}>
                  Create Professional Real Estate Flyer
                </h2>
              </div>
              <button
                onClick={() => setSimpleFlyerModal(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: 'white',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                ×
              </button>
            </div>

            {/* Flyer Type Selection */}
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ color: 'white', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img src="/copy-icon.svg" alt="Document" style={{ width: '20px', height: '20px' }} />
                What type of flyer do you need?
              </h3>
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setFlyerType('listing')}
                  style={{
                    background: flyerType === 'listing' ? '#667eea' : 'rgba(255, 255, 255, 0.1)',
                    color: flyerType === 'listing' ? 'white' : 'white',
                    border: `2px solid ${flyerType === 'listing' ? '#667eea' : 'rgba(255, 255, 255, 0.3)'}`,
                    padding: '15px 25px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '600',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <img src="/house-icon.svg" alt="House" style={{ width: '20px', height: '20px' }} />
                  Property Listing Flyer
                </button>
                <button
                  onClick={() => setFlyerType('openhouse')}
                  style={{
                    background: flyerType === 'openhouse' ? '#667eea' : 'rgba(255, 255, 255, 0.1)',
                    color: flyerType === 'openhouse' ? 'white' : 'white',
                    border: `2px solid ${flyerType === 'openhouse' ? '#667eea' : 'rgba(255, 255, 255, 0.3)'}`,
                    padding: '15px 25px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '600',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <img src="/calendar-icon.svg" alt="Calendar" style={{ width: '20px', height: '20px' }} />
                  Open House Flyer
                </button>
                <button
                  onClick={() => setFlyerType('both')}
                  style={{
                    background: flyerType === 'both' ? '#10b981' : 'rgba(255, 255, 255, 0.1)',
                    color: flyerType === 'both' ? 'white' : 'white',
                    border: `2px solid ${flyerType === 'both' ? '#10b981' : 'rgba(255, 255, 255, 0.3)'}`,
                    padding: '15px 25px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '600',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <img src="/star-icon.svg" alt="Star" style={{ width: '20px', height: '20px' }} />
                  Both Flyers
                </button>
              </div>
            </div>

            {/* Flyer Generation Method Selection */}
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ 
                color: 'white', 
                marginBottom: '20px', 
                fontSize: '18px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <img src="/palette-icon.svg" alt="Method" style={{ width: '20px', height: '20px' }} />
                Flyer Generation Method
              </h3>
              <div style={{ 
                display: 'flex', 
                gap: '15px',
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={() => setFlyerData({...flyerData, generationMethod: 'programmatic'})}
                  style={{
                    background: flyerData.generationMethod === 'programmatic' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    border: `2px solid ${flyerData.generationMethod === 'programmatic' ? '#667eea' : 'rgba(255, 255, 255, 0.3)'}`,
                    padding: '15px 20px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <img src="/flyer-icon.svg" alt="Programmatic" style={{ width: '18px', height: '18px' }} />
                  Programmatic Engine
                  <small style={{ display: 'block', fontSize: '12px', opacity: '0.8' }}>Custom Design System</small>
                </button>
                <button
                  onClick={() => setFlyerData({...flyerData, generationMethod: 'ai'})}
                  style={{
                    background: flyerData.generationMethod === 'ai' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    border: `2px solid ${flyerData.generationMethod === 'ai' ? '#667eea' : 'rgba(255, 255, 255, 0.3)'}`,
                    padding: '15px 20px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <img src="/star-icon.svg" alt="AI" style={{ width: '18px', height: '18px' }} />
                  AI Image Generation
                  <small style={{ display: 'block', fontSize: '12px', opacity: '0.8' }}>Premium AI-Generated Images</small>
                </button>
              </div>
            </div>

            {/* Property Details Form */}
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ color: 'white', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img src="/house-icon.svg" alt="House" style={{ width: '20px', height: '20px' }} />
                Property Details
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
                    <option value="single-family">Single Family Home</option>
                    <option value="townhouse">Townhouse</option>
                    <option value="condo">Condo</option>
                    <option value="multi-family">Multi-Family</option>
                    <option value="land">Land</option>
                    <option value="commercial">Commercial</option>
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
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'white' }}>Square Feet</label>
                  <input
                    type="number"
                    placeholder="2,000"
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
            </div>

            {/* Property Features */}
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ color: 'white', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img src="/star-icon.svg" alt="Star" style={{ width: '20px', height: '20px' }} />
                Property Features
              </h3>
              <textarea
                placeholder="Enter key features like: Granite countertops, Hardwood floors, Updated kitchen, Large backyard, Garage, etc."
                value={flyerData.features || listing?.features || ''}
                onChange={(e) => setFlyerData({...flyerData, features: e.target.value})}
                style={{
                  width: '100%',
                  padding: '15px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  fontSize: '16px',
                  minHeight: '100px',
                  resize: 'vertical',
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

            {/* Open House Specific Fields */}
            {(flyerType === 'openhouse' || flyerType === 'both') && (
              <div style={{ marginBottom: '30px' }}>
                <h3 style={{ color: 'white', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img src="/calendar-icon.svg" alt="Calendar" style={{ width: '20px', height: '20px' }} />
                  Open House Details
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'white' }}>Date</label>
                    <input
                      type="date"
                      value={flyerData.openHouseDate || ''}
                      onChange={(e) => setFlyerData({...flyerData, openHouseDate: e.target.value})}
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
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'white' }}>Time</label>
                    <input
                      type="time"
                      value={flyerData.openHouseTime || ''}
                      onChange={(e) => setFlyerData({...flyerData, openHouseTime: e.target.value})}
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
            )}

            {/* Agent Information */}
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ color: 'white', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img src="/copy-icon.svg" alt="Agent" style={{ width: '20px', height: '20px' }} />
                Agent Information
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'white' }}>Agent Name</label>
                  <input
                    type="text"
                    placeholder="John Smith"
                    value={flyerData.agentName || ''}
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
                    placeholder="Smith Real Estate"
                    value={flyerData.agency || ''}
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
                    value={flyerData.agentPhone || ''}
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
                    placeholder="john@smithrealestate.com"
                    value={flyerData.agentEmail || ''}
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

            {/* Photo Upload */}
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ color: 'white', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img src="/star-icon.svg" alt="Photos" style={{ width: '20px', height: '20px' }} />
                Property Photos
              </h3>
              <div style={{
                border: '2px dashed rgba(255, 255, 255, 0.3)',
                borderRadius: '12px',
                padding: '30px',
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.05)',
                transition: 'all 0.3s ease'
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.style.border = '2px dashed #667eea';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
              onDragLeave={(e) => {
                e.currentTarget.style.border = '2px dashed rgba(255, 255, 255, 0.3)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              }}
              onDrop={(e) => {
                e.preventDefault();
                const files = Array.from(e.dataTransfer.files);
                setFlyerData({...flyerData, photos: files});
                e.currentTarget.style.border = '2px dashed rgba(255, 255, 255, 0.3)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              }}>
                <img src="/house-icon.svg" alt="Photos" style={{ width: '48px', height: '48px', marginBottom: '15px', opacity: '0.7' }} />
                <p style={{ margin: '0 0 15px 0', color: 'white' }}>
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
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '600',
                    display: 'inline-block',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
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
                    background: flyerData.style === 'luxury-real-estate' ? '#667eea' : 'rgba(255, 255, 255, 0.1)',
                    color: flyerData.style === 'luxury-real-estate' ? 'white' : 'white',
                    border: `2px solid ${flyerData.style === 'luxury-real-estate' ? '#667eea' : 'rgba(255, 255, 255, 0.3)'}`,
                    padding: '20px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '600',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <img src="/crown-icon.svg" alt="Luxury" style={{ width: '24px', height: '24px', marginBottom: '8px' }} />
                  <strong>Luxury</strong><br/>
                  <small>Premium & Sophisticated</small>
                </button>
                <button
                  onClick={() => setFlyerData({...flyerData, style: 'modern-contemporary'})}
                  style={{
                    background: flyerData.style === 'modern-contemporary' ? '#667eea' : 'rgba(255, 255, 255, 0.1)',
                    color: flyerData.style === 'modern-contemporary' ? 'white' : 'white',
                    border: `2px solid ${flyerData.style === 'modern-contemporary' ? '#667eea' : 'rgba(255, 255, 255, 0.3)'}`,
                    padding: '20px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '600',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <img src="/sparkle-icon.svg" alt="Modern" style={{ width: '24px', height: '24px', marginBottom: '8px' }} />
                  <strong>Modern</strong><br/>
                  <small>Clean & Contemporary</small>
                </button>
                <button
                  onClick={() => setFlyerData({...flyerData, style: 'classic-elegant'})}
                  style={{
                    background: flyerData.style === 'classic-elegant' ? '#667eea' : 'rgba(255, 255, 255, 0.1)',
                    color: flyerData.style === 'classic-elegant' ? 'white' : 'white',
                    border: `2px solid ${flyerData.style === 'classic-elegant' ? '#667eea' : 'rgba(255, 255, 255, 0.3)'}`,
                    padding: '20px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '600',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <img src="/classic-icon.svg" alt="Classic" style={{ width: '24px', height: '24px', marginBottom: '8px' }} />
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
                  background: (!flyerData.style || !flyerData.address) ? 'rgba(255, 255, 255, 0.2)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '18px 40px',
                  borderRadius: '12px',
                  fontSize: '18px',
                  fontWeight: '700',
                  cursor: (!flyerData.style || !flyerData.address) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: (!flyerData.style || !flyerData.address) ? 'none' : '0 8px 25px rgba(102, 126, 234, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  margin: '0 auto'
                }}
                onMouseEnter={(e) => {
                  if (flyerData.style && flyerData.address) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 12px 30px rgba(102, 126, 234, 0.5)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (flyerData.style && flyerData.address) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.4)';
                  }
                }}
              >
                {flyerGenerating ? (
                  <>
                    <img src="/palette-icon.svg" alt="Palette" style={{ width: '24px', height: '24px' }} />
                    Generating Flyer...
                  </>
                ) : (
                  <>
                    <img src="/flyer-icon.svg" alt="Flyer" style={{ width: '24px', height: '24px' }} />
                    Generate {flyerType === 'both' ? 'Both Flyers' : flyerType === 'listing' ? 'Property Listing' : 'Open House'} with {flyerData.generationMethod === 'ai' ? 'Gemini AI' : 'Programmatic Engine'}
                  </>
                )}
              </button>
              
              {/* Download Format Indicator */}
              <div style={{ 
                marginTop: '16px',
                background: 'rgba(251, 191, 36, 0.1)', 
                padding: '8px 16px', 
                borderRadius: '20px',
                fontSize: '14px',
                color: '#fbbf24',
                border: '1px solid rgba(251, 191, 36, 0.3)',
                display: 'inline-block'
              }}>
                {flyerData.generationMethod === 'ai' ? '🎨 Downloads as AI-Generated Image' : '📄 Downloads as High-Quality PDF'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Debug Section - Remove in production */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: 'rgba(0, 0, 0, 0.8)',
        padding: '20px',
        borderRadius: '12px',
        color: 'white',
        fontSize: '14px',
        zIndex: 1000
      }}>
        <h4 style={{ margin: '0 0 16px 0', color: '#667eea' }}>🔧 Debug Tools</h4>
        
        <div style={{ marginBottom: '16px' }}>
          <button
            onClick={async () => {
              try {
                console.log('🧪 Testing OpenRouter connectivity...');
                const response = await fetch('/api/generate-features', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ test: 'openrouter' })
                });
                const result = await response.json();
                console.log('🧪 OpenRouter test result:', result);
                alert(`OpenRouter test: ${result.success ? 'SUCCESS' : 'FAILED'}\nCheck console for details.`);
              } catch (error) {
                console.error('🧪 Test error:', error);
                alert(`Test error: ${error.message}`);
              }
            }}
            style={{
              background: '#667eea',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '12px',
              marginRight: '8px'
            }}
          >
            Test OpenRouter
          </button>
          
          <button
            onClick={async () => {
              try {
                console.log('🧪 Testing Gemini model...');
                const response = await fetch('/api/generate-features', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ test: 'gemini' })
                });
                const result = await response.json();
                console.log('🧪 Gemini test result:', result);
                alert(`Gemini test: ${result.success ? 'SUCCESS' : 'FAILED'}\nCheck console for details.`);
              } catch (error) {
                console.error('🧪 Test error:', error);
                alert(`Test error: ${error.message}`);
              }
            }}
            style={{
              background: '#10b981',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Test Gemini
          </button>
        </div>
        
        <div style={{ fontSize: '12px', opacity: 0.8 }}>
          <div>🔑 API Key: {process.env.NODE_ENV === 'development' ? 'Checking...' : 'Hidden'}</div>
          <div>🌐 App URL: {process.env.NEXT_PUBLIC_APP_URL || 'Not set'}</div>
        </div>
      </div>

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
