import { useState, useRef, useEffect } from 'react';

export default function EnhancedFlyerModal({ 
  isOpen, 
  onClose, 
  onGenerate, 
  listing, 
  loading = false 
}) {
  const [step, setStep] = useState(1);
  const [agentInfo, setAgentInfo] = useState({
    name: '',
    agency: '',
    phone: '',
    email: '',
    website: ''
  });
  const [selectedStyle, setSelectedStyle] = useState('modern');
  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [aiPhotos, setAiPhotos] = useState([]);
  const [aiPhotoLoading, setAiPhotoLoading] = useState(false);
  const [useAiPhotos, setUseAiPhotos] = useState(false);
  const fileInputRef = useRef(null);

  const flyerStyles = [
    {
      id: 'modern',
      name: 'Modern Luxury',
      description: 'Clean lines, bold typography, contemporary design',
      preview: '🎨'
    },
    {
      id: 'classic',
      name: 'Classic Professional',
      description: 'Traditional layout, elegant fonts, timeless appeal',
      preview: '🏛️'
    },
    {
      id: 'premium',
      name: 'Premium Elite',
      description: 'High-end design, sophisticated colors, luxury feel',
      preview: '💎'
    },
    {
      id: 'contemporary',
      name: 'Contemporary Bold',
      description: 'Dynamic layouts, vibrant colors, modern edge',
      preview: '✨'
    }
  ];

  // Extract property information from listing for AI photo generation
  const extractPropertyInfo = (listingText) => {
    if (!listingText) return {};
    
    const lines = listingText.split('\n');
    let address = 'Beautiful Property';
    let bedrooms = '';
    let bathrooms = '';
    let sqft = '';
    let features = [];

    lines.forEach(line => {
      const lowerLine = line.toLowerCase();
      
      if (lowerLine.includes('bedroom')) {
        const match = line.match(/(\d+)\s*bedroom/i);
        if (match) bedrooms = match[1];
      }
      
      if (lowerLine.includes('bathroom')) {
        const match = line.match(/(\d+)\s*bathroom/i);
        if (match) bathrooms = match[1];
      }
      
      if (lowerLine.includes('sq ft') || lowerLine.includes('square feet')) {
        const match = line.match(/(\d+[\d,]*)\s*(sq ft|square feet)/i);
        if (match) sqft = match[1];
      }
      
      // Extract features
      if (lowerLine.includes('feature') || lowerLine.includes('amenity') || 
          lowerLine.includes('pool') || lowerLine.includes('garage') ||
          lowerLine.includes('garden') || lowerLine.includes('fireplace') ||
          lowerLine.includes('deck') || lowerLine.includes('patio') ||
          lowerLine.includes('kitchen') || lowerLine.includes('bathroom') ||
          lowerLine.includes('bedroom') || lowerLine.includes('living')) {
        features.push(line.trim());
      }
      
      // Extract first line as potential address/title
      if (lines.indexOf(line) === 0 && line.length > 10 && !line.includes(':')) {
        address = line.trim();
      }
    });

    return { address, bedrooms, bathrooms, sqft, features };
  };

  const handlePhotoUpload = (event) => {
    const files = Array.from(event.target.files);
    const newPhotos = [];
    const newFiles = [];

    files.forEach((file, index) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          newPhotos.push({
            id: Date.now() + index,
            url: e.target.result,
            name: file.name
          });
          setUploadedPhotos(prev => [...prev, ...newPhotos]);
        };
        reader.readAsDataURL(file);
        newFiles.push(file);
      }
    });

    setPhotoFiles(prev => [...prev, ...newFiles]);
  };

  const removePhoto = (photoId) => {
    setUploadedPhotos(prev => prev.filter(p => p.id !== photoId));
    setPhotoFiles(prev => prev.filter((_, index) => 
      uploadedPhotos.find(p => p.id === photoId)?.id !== Date.now() + index
    ));
  };

  const removeAiPhoto = (photoId) => {
    setAiPhotos(prev => prev.filter(p => p.id !== photoId));
  };

  // Generate AI property photos
  const generateAiPhotos = async () => {
    if (!listing) {
      alert('Please generate a listing first');
      return;
    }

    setAiPhotoLoading(true);
    try {
      const propertyInfo = extractPropertyInfo(listing);
      
      const response = await fetch('/api/generate-property-photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          propertyInfo, 
          style: selectedStyle, 
          count: 3 
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.photos) {
        const photosWithIds = data.photos.map((photo, index) => ({
          ...photo,
          id: `ai-${Date.now()}-${index}`,
          isAiGenerated: true
        }));
        setAiPhotos(photosWithIds);
        setUseAiPhotos(true);
        alert(`✅ Generated ${data.photos.length} AI property photos!`);
      } else {
        throw new Error('No photos received from AI generation');
      }
    } catch (error) {
      console.error('AI photo generation error:', error);
      alert(`❌ Error generating AI photos: ${error.message}`);
    } finally {
      setAiPhotoLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!agentInfo.name || !agentInfo.agency) {
      alert('Please fill in at least your name and agency');
      return;
    }

    // Combine user photos and AI photos if both are available
    const finalPhotos = useAiPhotos ? [...aiPhotos, ...photoFiles] : photoFiles;

    onGenerate({
      agentInfo,
      style: selectedStyle,
      photos: finalPhotos,
      listing,
      aiPhotos: useAiPhotos ? aiPhotos : []
    });
  };

  const resetForm = () => {
    setStep(1);
    setAgentInfo({
      name: '',
      agency: '',
      phone: '',
      email: '',
      website: ''
    });
    setSelectedStyle('modern');
    setUploadedPhotos([]);
    setPhotoFiles([]);
    setAiPhotos([]);
    setUseAiPhotos(false);
  };

  // Don't render anything if modal is not open
  if (!isOpen) return null;

  console.log('🎨 EnhancedFlyerModal rendering:', { isOpen, step, agentInfo, selectedStyle });

  // Render modal directly in the DOM
  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        backdropFilter: 'blur(8px)',
        width: '100vw',
        height: '100vh'
      }}
    >
      <div 
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          width: '90%',
          maxWidth: '700px',
          maxHeight: '90vh',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          position: 'relative',
          zIndex: 1000000
        }}
      >
        {/* Modal Header */}
        <div 
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '24px 32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>
            🎨 Generate Professional Flyer
          </h2>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '28px',
              cursor: 'pointer',
              padding: 0,
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            ×
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ padding: '32px', maxHeight: '60vh', overflowY: 'auto' }}>
          {step === 1 && (
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 600, color: '#1f2937' }}>
                Step 1: Agent Information
              </h3>
              <p style={{ margin: '0 0 24px 0', color: '#6b7280', fontSize: '14px' }}>
                Let's personalize your flyer with your branding
              </p>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#374151', fontSize: '14px' }}>
                  Your Name *
                </label>
                <input
                  type="text"
                  value={agentInfo.name}
                  onChange={(e) => setAgentInfo(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., John Smith"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#374151', fontSize: '14px' }}>
                  Agency Name *
                </label>
                <input
                  type="text"
                  value={agentInfo.agency}
                  onChange={(e) => setAgentInfo(prev => ({ ...prev, agency: e.target.value }))}
                  placeholder="e.g., Premier Real Estate"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#374151', fontSize: '14px' }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={agentInfo.phone}
                  onChange={(e) => setAgentInfo(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="e.g., (555) 123-4567"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#374151', fontSize: '14px' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={agentInfo.email}
                  onChange={(e) => setAgentInfo(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="e.g., john@premier.com"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#374151', fontSize: '14px' }}>
                  Website
                </label>
                <input
                  type="url"
                  value={agentInfo.website}
                  onChange={(e) => setAgentInfo(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="e.g., https://premier.com"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <button 
                onClick={() => setStep(2)}
                disabled={!agentInfo.name || !agentInfo.agency}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  width: '100%',
                  marginTop: '16px',
                  opacity: (!agentInfo.name || !agentInfo.agency) ? 0.6 : 1
                }}
              >
                Next: Choose Style
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 600, color: '#1f2937' }}>
                Step 2: Flyer Style
              </h3>
              <p style={{ margin: '0 0 24px 0', color: '#6b7280', fontSize: '14px' }}>
                Choose the design style that matches your brand
              </p>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: '16px', 
                marginBottom: '24px' 
              }}>
                {flyerStyles.map((style) => (
                  <div
                    key={style.id}
                    onClick={() => setSelectedStyle(style.id)}
                    style={{
                      border: `2px solid ${selectedStyle === style.id ? '#667eea' : '#e5e7eb'}`,
                      borderRadius: '12px',
                      padding: '20px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      backgroundColor: selectedStyle === style.id ? 'rgba(102, 126, 234, 0.05)' : 'transparent'
                    }}
                  >
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>{style.preview}</div>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>
                      {style.name}
                    </h4>
                    <p style={{ margin: 0, fontSize: '12px', color: '#6b7280', lineHeight: 1.4 }}>
                      {style.description}
                    </p>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
                <button 
                  onClick={() => setStep(1)}
                  style={{
                    background: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    flex: 1
                  }}
                >
                  Back
                </button>
                <button 
                  onClick={() => setStep(3)}
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    flex: 2
                  }}
                >
                  Next: Property Photos
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 600, color: '#1f2937' }}>
                Step 3: Property Photos
              </h3>
              <p style={{ margin: '0 0 24px 0', color: '#6b7280', fontSize: '14px' }}>
                Choose between AI-generated photos or upload your own
              </p>
              
              {/* AI Photo Generation Section */}
              <div style={{
                background: '#f8fafc',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '24px'
              }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#1e40af' }}>🤖 AI-Generated Property Photos</h4>
                <p style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '13px' }}>
                  Let AI create beautiful, professional property photos based on your listing
                </p>
                
                <button 
                  onClick={generateAiPhotos}
                  disabled={aiPhotoLoading || !listing}
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '14px 28px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    width: '100%',
                    opacity: (aiPhotoLoading || !listing) ? 0.6 : 1
                  }}
                >
                  {aiPhotoLoading ? '🔄 Generating AI Photos...' : '🤖 Generate AI Property Photos'}
                </button>
                
                {aiPhotos.length > 0 && (
                  <div style={{ marginTop: '24px' }}>
                    <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>
                      AI-Generated Photos ({aiPhotos.length})
                    </h4>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', 
                      gap: '12px' 
                    }}>
                      {aiPhotos.map((photo) => (
                        <div key={photo.id} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', aspectRatio: '4/3', border: '2px solid #3b82f6' }}>
                          <img src={photo.url} alt={photo.description} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <div style={{
                            position: 'absolute',
                            top: '4px',
                            left: '4px',
                            background: 'rgba(59, 130, 246, 0.9)',
                            color: 'white',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 500
                          }}>
                            AI Generated
                          </div>
                          <button 
                            onClick={() => removeAiPhoto(photo.id)}
                            style={{
                              position: 'absolute',
                              top: '4px',
                              right: '4px',
                              background: 'rgba(239, 68, 68, 0.9)',
                              color: 'white',
                              border: 'none',
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              cursor: 'pointer',
                              fontSize: '16px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* User Photo Upload Section */}
              <div style={{
                textAlign: 'center',
                marginBottom: '24px',
                padding: '20px',
                border: '2px dashed #d1d5db',
                borderRadius: '12px',
                background: '#f9fafb'
              }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#374151' }}>📸 Upload Your Own Photos</h4>
                <p style={{ margin: '0 0 16px 0', color: '#6b7280', fontSize: '13px' }}>
                  Upload photos of the property (optional)
                </p>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  style={{ display: 'none' }}
                />
                
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '16px 32px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    marginBottom: '16px'
                  }}
                >
                  📸 Upload Photos
                </button>
                
                <p style={{ color: '#6b7280', fontSize: '12px', margin: 0 }}>
                  Recommended: 3-5 high-quality photos. We'll automatically crop and position them perfectly.
                </p>
              </div>

              {uploadedPhotos.length > 0 && (
                <div style={{ marginTop: '24px' }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>
                    Uploaded Photos ({uploadedPhotos.length})
                  </h4>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', 
                    gap: '12px' 
                  }}>
                    {uploadedPhotos.map((photo) => (
                      <div key={photo.id} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', aspectRatio: '4/3', border: '2px solid #e5e7eb' }}>
                        <img src={photo.url} alt={photo.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button 
                          onClick={() => removePhoto(photo.id)}
                          style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            background: 'rgba(239, 68, 68, 0.9)',
                            color: 'white',
                            border: 'none',
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            cursor: 'pointer',
                            fontSize: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
                <button 
                  onClick={() => setStep(2)}
                  style={{
                    background: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    flex: 1
                  }}
                >
                  Back
                </button>
                <button 
                  onClick={handleSubmit}
                  disabled={loading}
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    flex: 2,
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  {loading ? '🎨 Generating Flyer...' : '🎨 Generate Professional Flyer'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '24px 32px',
          borderTop: '1px solid #e5e7eb',
          textAlign: 'center'
        }}>
          <button 
            onClick={() => { resetForm(); onClose(); }}
            style={{
              background: '#f3f4f6',
              color: '#374151',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
