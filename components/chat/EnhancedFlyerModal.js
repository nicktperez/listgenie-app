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

  const handleSubmit = () => {
    if (!agentInfo.name || !agentInfo.agency) {
      alert('Please fill in at least your name and agency');
      return;
    }

    onGenerate({
      agentInfo,
      style: selectedStyle,
      photos: photoFiles,
      listing
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
  };

  if (!isOpen) return null;

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
                  Next: Upload Photos
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="step-content">
              <h3>Step 3: Property Photos</h3>
              <p>Upload photos of the property (optional - we can generate AI photos too)</p>
              
              <div className="photo-upload-section">
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
