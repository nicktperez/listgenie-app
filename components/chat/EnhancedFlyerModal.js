import { useState, useRef, useEffect } from 'react';
import { PROFESSIONAL_FLYER_STYLES } from '../../lib/professionalFlyerStyles';

// Custom SVG Icons
const Icons = {
  Generate: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),

  Camera: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 3H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 17C14.2091 17 16 15.2091 16 13C16 10.7909 14.2091 9 12 9C9.79086 9 8 10.7909 8 13C8 15.2091 9.79086 17 12 17Z" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  Modern: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
      <line x1="9" y1="9" x2="15" y2="9" stroke="currentColor" strokeWidth="2" />
      <line x1="9" y1="12" x2="15" y2="12" stroke="currentColor" strokeWidth="2" />
      <line x1="9" y1="15" x2="15" y2="15" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  Classic: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Premium: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L15.09 8.26L22 9L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Contemporary: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path d="M8 14L12 10L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Close: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
};

export default function EnhancedFlyerModal({
  isOpen,
  onClose,
  onGenerate,
  listing,
  parsedListing, // Receive the parsed data
  loading = false,
  onPreview
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [agentInfo, setAgentInfo] = useState({
    name: '',
    agency: '',
    phone: '',
    email: '',
    website: ''
  });
  const [style, setStyle] = useState('modern');
  const [propertyInfo, setPropertyInfo] = useState({
    address: '',
    type: '',
    bedrooms: '',
    bathrooms: '',
    sqft: '',
    price: '',
    features: []
  });

  // Auto-fill form from parsed listing data
  useEffect(() => {
    if (parsedListing) {
      console.log('📝 EnhancedFlyerModal: Auto-filling form with parsed data:', parsedListing);
      setPropertyInfo(prev => ({
        ...prev,
        address: parsedListing.address || prev.address,
        bedrooms: parsedListing.bedrooms || prev.bedrooms,
        bathrooms: parsedListing.bathrooms || prev.bathrooms,
        sqft: parsedListing.sqft || prev.sqft,
        price: parsedListing.price || prev.price,
        // If features is a string, split it, otherwise use as array
        features: Array.isArray(parsedListing.features)
          ? parsedListing.features
          : (parsedListing.features || '').split(',').map(f => f.trim()).filter(Boolean)
      }));
    }
  }, [parsedListing]);
  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const [photoFiles, setPhotoFiles] = useState([]);

  const fileInputRef = useRef(null);

  // Get flyer styles from our configuration
  const flyerStyles = Object.values(PROFESSIONAL_FLYER_STYLES);


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



  const handleSubmit = async () => {
    console.log('📝 EnhancedFlyerModal: handleSubmit called');
    console.log('📝 EnhancedFlyerModal: Current step:', currentStep);
    console.log('📝 EnhancedFlyerModal: All form data:', {
      agentInfo,
      propertyInfo,
      photos: photoFiles,
      style: style
    });

    if (currentStep < 4) {
      console.log('📝 EnhancedFlyerModal: Not on final step, moving to next step');
      setCurrentStep(currentStep + 1);
      return;
    }

    console.log('📝 EnhancedFlyerModal: On final step, preparing flyer data...');

    // Validate required fields
    if (!agentInfo.name || !agentInfo.agency) {
      console.log('❌ EnhancedFlyerModal: Missing agent info');
      alert('Please fill in agent name and agency');
      return;
    }

    if (!style) {
      console.log('❌ EnhancedFlyerModal: Missing style selection');
      alert('Please select a flyer style');
      return;
    }

    console.log('📝 EnhancedFlyerModal: Validation passed, creating flyer data object...');

    const flyerData = {
      agentInfo,
      propertyInfo,
      photos: photoFiles,
      style: style
    };

    console.log('📝 EnhancedFlyerModal: Flyer data object created:', flyerData);
    console.log('📝 EnhancedFlyerModal: Calling onGenerate with flyer data...');

    try {
      await onGenerate(flyerData);
      console.log('✅ EnhancedFlyerModal: onGenerate completed successfully');
    } catch (error) {
      console.error('❌ EnhancedFlyerModal: onGenerate failed:', error);
      console.error('❌ EnhancedFlyerModal: Error stack:', error.stack);
      alert(`Error generating flyer: ${error.message}`);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setAgentInfo({
      name: '',
      agency: '',
      phone: '',
      email: '',
      website: ''
    });
    setPropertyInfo({
      address: '',
      type: '',
      bedrooms: '',
      bathrooms: '',
      sqft: '',
      price: '',
      features: []
    });
    setStyle('modern');
    setUploadedPhotos([]);
    setPhotoFiles([]);
  };

  // Don't render anything if modal is not open
  if (!isOpen) return null;

  console.log('🎨 EnhancedFlyerModal rendering:', { isOpen, currentStep, agentInfo, style });

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
          maxWidth: '600px',
          maxHeight: '80vh',
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
            padding: '20px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #475569'
          }}
        >
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Icons.Generate />
            Generate Flyer
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
        <div style={{ padding: '24px', maxHeight: '70vh', overflowY: 'auto' }}>
          {/* Service Status Indicator */}


          {currentStep === 1 && (
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 600, color: '#f8fafc' }}>
                Step 1: Agent Information
              </h3>
              <p style={{ margin: '0 0 16px 0', color: '#cbd5e1', fontSize: '14px' }}>
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
                onClick={() => setCurrentStep(2)}
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
                Next: Property Info
              </button>
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 600, color: '#f8fafc' }}>
                Step 2: Property Information
              </h3>
              <p style={{ margin: '0 0 16px 0', color: '#cbd5e1', fontSize: '14px' }}>
                Provide property details to help AI create a personalized flyer
              </p>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#e2e8f0', fontSize: '14px' }}>
                  Property Address
                </label>
                <input
                  type="text"
                  value={propertyInfo.address}
                  onChange={(e) => setPropertyInfo(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="e.g., 123 Luxury Lane, Beverly Hills, CA"
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#e2e8f0', fontSize: '14px' }}>
                    Bedrooms
                  </label>
                  <input
                    type="text"
                    value={propertyInfo.bedrooms}
                    onChange={(e) => setPropertyInfo(prev => ({ ...prev, bedrooms: e.target.value }))}
                    placeholder="e.g., 4"
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
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#e2e8f0', fontSize: '14px' }}>
                    Bathrooms
                  </label>
                  <input
                    type="text"
                    value={propertyInfo.bathrooms}
                    onChange={(e) => setPropertyInfo(prev => ({ ...prev, bathrooms: e.target.value }))}
                    placeholder="e.g., 3"
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
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#e2e8f0', fontSize: '14px' }}>
                  Square Feet
                </label>
                <input
                  type="text"
                  value={propertyInfo.sqft}
                  onChange={(e) => setPropertyInfo(prev => ({ ...prev, sqft: e.target.value }))}
                  placeholder="e.g., 2,500"
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
                  Price
                </label>
                <input
                  type="text"
                  value={propertyInfo.price}
                  onChange={(e) => setPropertyInfo(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="e.g., $850,000"
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
                  Property Type
                </label>
                <select
                  value={propertyInfo.type}
                  onChange={(e) => setPropertyInfo(prev => ({ ...prev, type: e.target.value }))}
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
                >
                  <option value="">Select property type</option>
                  <option value="Single Family Home">Single Family Home</option>
                  <option value="Condo/Apartment">Condo/Apartment</option>
                  <option value="Townhouse">Townhouse</option>
                  <option value="Luxury Estate">Luxury Estate</option>
                  <option value="Investment Property">Investment Property</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
                <button
                  onClick={() => setCurrentStep(1)}
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
                  onClick={() => setCurrentStep(3)}
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
                  Next: Choose Style
                </button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 600, color: '#f8fafc' }}>
                Step 3: Property Photos
              </h3>
              <p style={{ margin: '0 0 16px 0', color: '#cbd5e1', fontSize: '14px' }}>
                Upload photos of the property to include in your flyer
              </p>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '16px',
                marginBottom: '24px'
              }}>
                {flyerStyles.map((style) => {
                  return (
                    <div
                      key={style.id}
                      onClick={() => setStyle(style.id)}
                      style={{
                        border: `2px solid ${style === style.id ? '#3b82f6' : '#475569'}`,
                        borderRadius: '12px',
                        padding: '20px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        backgroundColor: style === style.id ? 'rgba(59, 130, 246, 0.1)' : 'rgba(71, 85, 105, 0.1)',
                        borderColor: style === style.id ? '#3b82f6' : '#475569'
                      }}
                      onMouseEnter={(e) => {
                        if (style !== style.id) {
                          e.target.style.borderColor = '#64748b';
                          e.target.style.backgroundColor = 'rgba(100, 116, 139, 0.1)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (style !== style.id) {
                          e.target.style.borderColor = '#475569';
                          e.target.style.backgroundColor = 'rgba(71, 85, 105, 0.1)';
                        }
                      }}
                    >
                      <div style={{
                        fontSize: '32px',
                        marginBottom: '12px',
                        color: style === style.id ? '#3b82f6' : '#94a3b8',
                        display: 'flex',
                        justifyContent: 'center'
                      }}>
                        {style.icon}
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
                  onClick={() => setCurrentStep(1)}
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
                  onClick={() => setCurrentStep(3)}
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
                  Next: Upload Photos
                </button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 600, color: '#f8fafc' }}>
                Step 3: Property Photos
              </h3>
              <p style={{ margin: '0 0 16px 0', color: '#cbd5e1', fontSize: '14px' }}>
                Upload photos of the property to include in your flyer
              </p>

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
                  onClick={() => setCurrentStep(2)}
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
                  onClick={() => setCurrentStep(4)}
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
                  Next: Choose Style
                </button>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 600, color: '#f8fafc' }}>
                Step 4: Flyer Style
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
                  return (
                    <div
                      key={style.id}
                      onClick={() => setStyle(style.id)}
                      style={{
                        border: `2px solid ${style === style.id ? '#3b82f6' : '#475569'}`,
                        borderRadius: '12px',
                        padding: '20px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        backgroundColor: style === style.id ? 'rgba(59, 130, 246, 0.1)' : 'rgba(71, 85, 105, 0.1)',
                        borderColor: style === style.id ? '#3b82f6' : '#475569'
                      }}
                      onMouseEnter={(e) => {
                        if (style !== style.id) {
                          e.target.style.borderColor = '#64748b';
                          e.target.style.backgroundColor = 'rgba(100, 116, 139, 0.1)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (style !== style.id) {
                          e.target.style.borderColor = '#475569';
                          e.target.style.backgroundColor = 'rgba(71, 85, 105, 0.1)';
                        }
                      }}
                    >
                      <div style={{
                        fontSize: '32px',
                        marginBottom: '12px',
                        color: style === style.id ? '#3b82f6' : '#94a3b8',
                        display: 'flex',
                        justifyContent: 'center'
                      }}>
                        {style.icon}
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
                  onClick={() => setCurrentStep(3)}
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
                  onClick={() => onPreview && onPreview({
                    agentInfo,
                    style: style,
                    photos: photoFiles,
                    listing,
                    propertyInfo
                  })}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    flex: 1,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'translateY(-1px)'}
                  onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  Preview Flyer
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
                      Generating Professional Flyer...
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
