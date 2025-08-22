import { useState, useRef, useEffect } from 'react';

// Custom SVG Icons
const Icons = {
  Generate: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  AI: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2"/>
      <path d="M12 7V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Camera: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 3H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 17C14.2091 17 16 15.2091 16 13C16 10.7909 14.2091 9 12 9C9.79086 9 8 10.7909 8 13C8 15.2091 9.79086 17 12 17Z" stroke="currentColor" strokeWidth="2"/>
    </svg>
  ),
  Modern: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
      <line x1="9" y1="9" x2="15" y2="9" stroke="currentColor" strokeWidth="2"/>
      <line x1="9" y1="12" x2="15" y2="12" stroke="currentColor" strokeWidth="2"/>
      <line x1="9" y1="15" x2="15" y2="15" stroke="currentColor" strokeWidth="2"/>
    </svg>
  ),
  Classic: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Premium: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L15.09 8.26L22 9L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Contemporary: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
      <path d="M8 14L12 10L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Close: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
};

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
      icon: Icons.Modern
    },
    {
      id: 'classic',
      name: 'Classic Professional',
      description: 'Traditional layout, elegant fonts, timeless appeal',
      icon: Icons.Classic
    },
    {
      id: 'premium',
      name: 'Premium Elite',
      description: 'High-end design, sophisticated colors, luxury feel',
      icon: Icons.Premium
    },
    {
      id: 'contemporary',
      name: 'Contemporary Bold',
      description: 'Dynamic layouts, vibrant colors, modern edge',
      icon: Icons.Contemporary
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
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        backdropFilter: 'blur(12px)',
        width: '100vw',
        height: '100vh'
      }}
    >
      <div 
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          borderRadius: '20px',
          width: '90%',
          maxWidth: '700px',
          maxHeight: '90vh',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          position: 'relative',
          zIndex: 1000000,
          border: '1px solid #475569'
        }}
      >
        {/* Modal Header */}
        <div 
          style={{
            background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
            color: 'white',
            padding: '24px 32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #475569'
          }}
        >
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Icons.Generate />
            Generate Professional Flyer
          </h2>
          <button 
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: 'white',
              padding: '8px',
              cursor: 'pointer',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
            onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
          >
            <Icons.Close />
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ padding: '32px', maxHeight: '60vh', overflowY: 'auto' }}>
          {step === 1 && (
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 600, color: '#f8fafc' }}>
                Step 1: Agent Information
              </h3>
              <p style={{ margin: '0 0 24px 0', color: '#cbd5e1', fontSize: '14px' }}>
                Let's personalize your flyer with your branding
              </p>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#e2e8f0', fontSize: '14px' }}>
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
                    border: '2px solid #475569',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    background: '#334155',
                    color: '#f8fafc',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#475569'}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#e2e8f0', fontSize: '14px' }}>
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
                    border: '2px solid #475569',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    background: '#334155',
                    color: '#f8fafc',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#475569'}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#e2e8f0', fontSize: '14px' }}>
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
                    border: '2px solid #475569',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    background: '#334155',
                    color: '#f8fafc',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#475569'}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#e2e8f0', fontSize: '14px' }}>
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
                    border: '2px solid #475569',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    background: '#334155',
                    color: '#f8fafc',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#475569'}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#e2e8f0', fontSize: '14px' }}>
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
                    border: '2px solid #475569',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    background: '#334155',
                    color: '#f8fafc',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#475569'}
                />
              </div>

              <button 
                onClick={() => setStep(2)}
                disabled={!agentInfo.name || !agentInfo.agency}
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  width: '100%',
                  marginTop: '16px',
                  opacity: (!agentInfo.name || !agentInfo.agency) ? 0.6 : 1,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'translateY(-1px)'}
                onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
              >
                Next: Choose Style
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 600, color: '#f8fafc' }}>
                Step 2: Flyer Style
              </h3>
              <p style={{ margin: '0 0 24px 0', color: '#cbd5e1', fontSize: '14px' }}>
                Choose the design style that matches your brand
              </p>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: '16px', 
                marginBottom: '24px' 
              }}>
                {flyerStyles.map((style) => {
                  const IconComponent = style.icon;
                  return (
                    <div
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      style={{
                        border: `2px solid ${selectedStyle === style.id ? '#3b82f6' : '#475569'}`,
                        borderRadius: '12px',
                        padding: '20px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        backgroundColor: selectedStyle === style.id ? 'rgba(59, 130, 246, 0.1)' : 'rgba(71, 85, 105, 0.1)',
                        borderColor: selectedStyle === style.id ? '#3b82f6' : '#475569'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedStyle !== style.id) {
                          e.target.style.borderColor = '#64748b';
                          e.target.style.backgroundColor = 'rgba(100, 116, 139, 0.1)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedStyle !== style.id) {
                          e.target.style.borderColor = '#475569';
                          e.target.style.backgroundColor = 'rgba(71, 85, 105, 0.1)';
                        }
                      }}
                    >
                      <div style={{ 
                        fontSize: '32px', 
                        marginBottom: '12px', 
                        color: selectedStyle === style.id ? '#3b82f6' : '#94a3b8',
                        display: 'flex',
                        justifyContent: 'center'
                      }}>
                        <IconComponent />
                      </div>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 600, color: '#f8fafc' }}>
                        {style.name}
                      </h4>
                      <p style={{ margin: 0, fontSize: '12px', color: '#cbd5e1', lineHeight: 1.4 }}>
                        {style.description}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
                <button 
                  onClick={() => setStep(1)}
                  style={{
                    background: '#475569',
                    color: '#e2e8f0',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    flex: 1,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#64748b'}
                  onMouseLeave={(e) => e.target.style.background = '#475569'}
                >
                  Back
                </button>
                <button 
                  onClick={() => setStep(3)}
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    flex: 2,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'translateY(-1px)'}
                  onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  Next: Property Photos
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 600, color: '#f8fafc' }}>
                Step 3: Property Photos
              </h3>
              <p style={{ margin: '0 0 24px 0', color: '#cbd5e1', fontSize: '14px' }}>
                Choose between AI-generated photos or upload your own
              </p>
              
              {/* AI Photo Generation Section */}
              <div style={{
                background: 'rgba(30, 58, 138, 0.1)',
                border: '2px solid #1e40af',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '24px'
              }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icons.AI />
                  AI-Generated Property Photos
                </h4>
                <p style={{ margin: '0 0 16px 0', color: '#93c5fd', fontSize: '13px' }}>
                  Let AI create beautiful, professional property photos based on your listing
                </p>
                
                <button 
                  onClick={generateAiPhotos}
                  disabled={aiPhotoLoading || !listing}
                  style={{
                    background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '14px 28px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    width: '100%',
                    opacity: (aiPhotoLoading || !listing) ? 0.6 : 1,
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'translateY(-1px)'}
                  onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  {aiPhotoLoading ? (
                    <>
                      <div style={{ width: '16px', height: '16px', border: '2px solid #ffffff', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                      Generating AI Photos...
                    </>
                  ) : (
                    <>
                      <Icons.AI />
                      Generate AI Property Photos
                    </>
                  )}
                </button>
                
                {aiPhotos.length > 0 && (
                  <div style={{ marginTop: '24px' }}>
                    <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600, color: '#f8fafc' }}>
                      AI-Generated Photos ({aiPhotos.length})
                    </h4>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', 
                      gap: '12px' 
                    }}>
                      {aiPhotos.map((photo) => (
                        <div key={photo.id} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', aspectRatio: '4/3', border: '2px solid #1e40af' }}>
                          <img src={photo.url} alt={photo.description} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <div style={{
                            position: 'absolute',
                            top: '4px',
                            left: '4px',
                            background: 'rgba(30, 64, 175, 0.9)',
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
                border: '2px dashed #64748b',
                borderRadius: '12px',
                background: 'rgba(71, 85, 105, 0.1)'
              }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Icons.Camera />
                  Upload Your Own Photos
                </h4>
                <p style={{ margin: '0 0 16px 0', color: '#cbd5e1', fontSize: '13px' }}>
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
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '16px 32px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    marginBottom: '16px',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    margin: '0 auto 16px auto'
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'translateY(-1px)'}
                  onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  <Icons.Camera />
                  Upload Photos
                </button>
                
                <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>
                  Recommended: 3-5 high-quality photos. We'll automatically crop and position them perfectly.
                </p>
              </div>

              {uploadedPhotos.length > 0 && (
                <div style={{ marginTop: '24px' }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600, color: '#f8fafc' }}>
                    Uploaded Photos ({uploadedPhotos.length})
                  </h4>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', 
                    gap: '12px' 
                  }}>
                    {uploadedPhotos.map((photo) => (
                                             <div key={photo.id} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', aspectRatio: '4/3', border: '2px solid #475569' }}>
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
                    background: '#475569',
                    color: '#e2e8f0',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    flex: 1,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#64748b'}
                  onMouseLeave={(e) => e.target.style.background = '#475569'}
                >
                  Back
                </button>
                <button 
                  onClick={handleSubmit}
                  disabled={loading}
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    flex: 2,
                    opacity: loading ? 0.6 : 1,
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'translateY(-1px)'}
                  onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  {loading ? (
                    <>
                      <div style={{ width: '16px', height: '16px', border: '2px solid #ffffff', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                      Generating Flyer...
                    </>
                  ) : (
                    <>
                      <Icons.Generate />
                      Generate Professional Flyer
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '24px 32px',
          borderTop: '1px solid #475569',
          textAlign: 'center'
        }}>
          <button 
            onClick={() => { resetForm(); onClose(); }}
            style={{
              background: '#475569',
              color: '#e2e8f0',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#64748b'}
            onMouseLeave={(e) => e.target.style.background = '#475569'}
          >
            Cancel
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
