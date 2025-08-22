import { useState, useRef } from 'react';

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

  if (!isOpen) return null;

  console.log('🎨 EnhancedFlyerModal rendering:', { isOpen, step, agentInfo, selectedStyle });

  return (
    <div className="enhanced-flyer-modal-overlay">
      <div className="enhanced-flyer-modal">
        <div className="modal-header">
          <h2>🎨 Generate Professional Flyer</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          {step === 1 && (
            <div className="step-content">
              <h3>Step 1: Agent Information</h3>
              <p>Let's personalize your flyer with your branding</p>
              
              <div className="form-group">
                <label>Your Name *</label>
                <input
                  type="text"
                  value={agentInfo.name}
                  onChange={(e) => setAgentInfo(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., John Smith"
                  required
                />
              </div>

              <div className="form-group">
                <label>Agency Name *</label>
                <input
                  type="text"
                  value={agentInfo.agency}
                  onChange={(e) => setAgentInfo(prev => ({ ...prev, agency: e.target.value }))}
                  placeholder="e.g., Premier Real Estate"
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={agentInfo.phone}
                  onChange={(e) => setAgentInfo(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="e.g., (555) 123-4567"
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={agentInfo.email}
                  onChange={(e) => setAgentInfo(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="e.g., john@premier.com"
                />
              </div>

              <div className="form-group">
                <label>Website</label>
                <input
                  type="url"
                  value={agentInfo.website}
                  onChange={(e) => setAgentInfo(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="e.g., https://premier.com"
                />
              </div>

              <button 
                className="next-btn"
                onClick={() => setStep(2)}
                disabled={!agentInfo.name || !agentInfo.agency}
              >
                Next: Choose Style
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="step-content">
              <h3>Step 2: Flyer Style</h3>
              <p>Choose the design style that matches your brand</p>
              
              <div className="style-grid">
                {flyerStyles.map((style) => (
                  <div
                    key={style.id}
                    className={`style-option ${selectedStyle === style.id ? 'selected' : ''}`}
                    onClick={() => setSelectedStyle(style.id)}
                  >
                    <div className="style-preview">{style.preview}</div>
                    <h4>{style.name}</h4>
                    <p>{style.description}</p>
                  </div>
                ))}
              </div>

              <div className="step-navigation">
                <button className="back-btn" onClick={() => setStep(1)}>
                  Back
                </button>
                <button 
                  className="next-btn"
                  onClick={() => setStep(3)}
                >
                  Next: Property Photos
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="step-content">
              <h3>Step 3: Property Photos</h3>
              <p>Choose between AI-generated photos or upload your own</p>
              
              {/* AI Photo Generation Section */}
              <div className="ai-photo-section">
                <h4>🤖 AI-Generated Property Photos</h4>
                <p>Let AI create beautiful, professional property photos based on your listing</p>
                
                <button 
                  className="ai-generate-btn"
                  onClick={generateAiPhotos}
                  disabled={aiPhotoLoading || !listing}
                >
                  {aiPhotoLoading ? '🔄 Generating AI Photos...' : '🤖 Generate AI Property Photos'}
                </button>
                
                {aiPhotos.length > 0 && (
                  <div className="photo-preview">
                    <h4>AI-Generated Photos ({aiPhotos.length})</h4>
                    <div className="photo-grid">
                      {aiPhotos.map((photo) => (
                        <div key={photo.id} className="photo-item ai-photo">
                          <img src={photo.url} alt={photo.description} />
                          <div className="photo-label">AI Generated</div>
                          <button 
                            className="remove-photo"
                            onClick={() => removeAiPhoto(photo.id)}
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
              <div className="photo-upload-section">
                <h4>📸 Upload Your Own Photos</h4>
                <p>Upload photos of the property (optional)</p>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  style={{ display: 'none' }}
                />
                
                <button 
                  className="upload-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  📸 Upload Photos
                </button>
                
                <p className="upload-hint">
                  Recommended: 3-5 high-quality photos. We'll automatically crop and position them perfectly.
                </p>
              </div>

              {uploadedPhotos.length > 0 && (
                <div className="photo-preview">
                  <h4>Uploaded Photos ({uploadedPhotos.length})</h4>
                  <div className="photo-grid">
                    {uploadedPhotos.map((photo) => (
                      <div key={photo.id} className="photo-item">
                        <img src={photo.url} alt={photo.name} />
                        <button 
                          className="remove-photo"
                          onClick={() => removePhoto(photo.id)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="step-navigation">
                <button className="back-btn" onClick={() => setStep(2)}>
                  Back
                </button>
                <button 
                  className="generate-btn"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? '🎨 Generating Flyer...' : '🎨 Generate Professional Flyer'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={() => { resetForm(); onClose(); }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
