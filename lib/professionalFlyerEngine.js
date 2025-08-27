// Professional Flyer Engine - Marketing Professional Quality
// Enhanced with comprehensive debugging

import FlyerLearningEngine from './flyerLearningEngine.js';
import MarketIntelligenceEngine from './marketIntelligenceEngine.js';
import { PROFESSIONAL_FLYER_STYLES, FLYER_COLOR_SCHEMES, FLYER_TYPOGRAPHY_SYSTEMS, FLYER_LAYOUT_SYSTEMS, FLYER_ANIMATION_CONFIGS } from './professionalFlyerStyles.js';

/**
 * 🚀 Professional Flyer Engine
 * Generates marketing professional quality real estate flyers using programmatic design
 */

class ProfessionalFlyerEngine {
  constructor() {
    // Initialize design systems
    this.designSystems = this.initializeDesignSystems();
    this.typographyEngine = this.initializeTypographyEngine();
    this.colorEngine = this.initializeColorEngine();
    this.layoutEngine = this.initializeLayoutEngine();
    this.animationEngine = this.initializeAnimationEngine();
    
    // Initialize the learning engine
    this.learningEngine = new FlyerLearningEngine();
    
    // Initialize the market intelligence engine
    this.marketIntelligence = new MarketIntelligenceEngine();
    
    console.log('🚀 Professional Flyer Engine initialized with Learning Engine & Market Intelligence');
  }

  // Initialize professional design systems
  initializeDesignSystems() {
    return {
      'luxury-real-estate': {
        name: 'Luxury Real Estate',
        description: 'Premium, sophisticated design for high-end properties',
        visualStyle: 'elegant, sophisticated, premium',
        colorScheme: 'luxury-gold-black',
        typography: 'luxury-serif',
        layout: 'golden-ratio'
      },
      'modern-contemporary': {
        name: 'Modern Contemporary',
        description: 'Clean, minimalist design with modern aesthetics',
        visualStyle: 'clean, minimal, contemporary',
        colorScheme: 'modern-blue-white',
        typography: 'modern-sans',
        layout: 'grid-modern'
      },
      'classic-elegant': {
        name: 'Classic Elegant',
        description: 'Timeless, traditional design with elegant touches',
        visualStyle: 'traditional, elegant, timeless',
        colorScheme: 'classic-navy-cream',
        typography: 'classic-serif',
        layout: 'traditional-grid'
      },
      'premium-luxury': {
        name: 'Premium Luxury',
        description: 'Ultra-premium design with luxury branding',
        visualStyle: 'luxury, premium, sophisticated',
        colorScheme: 'premium-gold-silver',
        typography: 'premium-combo',
        layout: 'luxury-asymmetric'
      }
    };
  }

  // Initialize professional typography engine
  initializeTypographyEngine() {
    return {
      'luxury-serif': {
        primary: 'Playfair Display',
        secondary: 'Montserrat',
        accent: 'Great Vibes',
        weights: {
          primary: [400, 500, 600, 700, 900],
          secondary: [300, 400, 500, 600, 700],
          accent: [400]
        },
        scale: {
          h1: 'clamp(2.5rem, 6vw, 4rem)',
          h2: 'clamp(2rem, 4vw, 3rem)',
          h3: 'clamp(1.5rem, 3vw, 2.25rem)',
          body: 'clamp(1rem, 2vw, 1.125rem)',
          caption: 'clamp(0.875rem, 1.5vw, 1rem)'
        }
      },
      'modern-sans': {
        primary: 'Inter',
        secondary: 'Montserrat',
        accent: 'Poppins',
        weights: {
          primary: [300, 400, 500, 600, 700],
          secondary: [400, 500, 600],
          accent: [400, 500, 600]
        },
        scale: {
          h1: 'clamp(2.25rem, 5vw, 3.5rem)',
          h2: 'clamp(1.75rem, 4vw, 2.75rem)',
          h3: 'clamp(1.25rem, 3vw, 2rem)',
          body: 'clamp(1rem, 2vw, 1.125rem)',
          caption: 'clamp(0.875rem, 1.5vw, 1rem)'
        }
      },
      'classic-serif': {
        primary: 'Bodoni Moda',
        secondary: 'Crimson Text',
        accent: 'Playfair Display',
        weights: {
          primary: [400, 500, 600, 700],
          secondary: [400, 500, 600],
          accent: [400, 500, 600]
        },
        scale: {
          h1: 'clamp(2.5rem, 6vw, 4rem)',
          h2: 'clamp(2rem, 4vw, 3rem)',
          h3: 'clamp(1.5rem, 3vw, 2.25rem)',
          body: 'clamp(1rem, 2vw, 1.125rem)',
          caption: 'clamp(0.875rem, 1.5vw, 1rem)'
        }
      },
      'premium-combo': {
        primary: 'Futura',
        secondary: 'Bodoni Moda',
        accent: 'Great Vibes',
        weights: {
          primary: [300, 400, 500, 600, 700],
          secondary: [400, 500, 600, 700],
          accent: [400]
        },
        scale: {
          h1: 'clamp(2.75rem, 7vw, 4.5rem)',
          h2: 'clamp(2.25rem, 5vw, 3.5rem)',
          h3: 'clamp(1.75rem, 4vw, 2.75rem)',
          body: 'clamp(1.125rem, 2.5vw, 1.25rem)',
          caption: 'clamp(1rem, 2vw, 1.125rem)'
        }
      }
    };
  }

  // Initialize professional color engine
  initializeColorEngine() {
    return {
      'luxury-gold-black': {
        primary: ['#1a1a1a', '#2c2c2c', '#3d3d3d'],
        accent: ['#d4af37', '#b8860b', '#daa520'],
        neutral: ['#f8f8f8', '#e8e8e8', '#d8d8d8'],
        gradient: 'linear-gradient(135deg, #d4af37 0%, #b8860b 100%)'
      },
      'modern-blue-white': {
        primary: ['#1e40af', '#3b82f6', '#60a5fa'],
        accent: ['#0f172a', '#1e293b', '#334155'],
        neutral: ['#ffffff', '#f8fafc', '#f1f5f9'],
        gradient: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)'
      },
      'classic-navy-cream': {
        primary: ['#1e3a8a', '#2563eb', '#3b82f6'],
        accent: ['#92400e', '#a16207', '#ca8a04'],
        neutral: ['#fefce8', '#fef3c7', '#fde68a'],
        gradient: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)'
      },
      'premium-gold-silver': {
        primary: ['#d4af37', '#b8860b', '#daa520'],
        accent: ['#6b7280', '#9ca3af', '#d1d5db'],
        neutral: ['#000000', '#111827', '#1f2937'],
        gradient: 'linear-gradient(135deg, #d4af37 0%, #b8860b 50%, #daa520 100%)'
      }
    };
  }

  // Initialize professional layout engine
  initializeLayoutEngine() {
    return {
      'golden-ratio': {
        ratio: 1.618,
        grid: 'golden-grid',
        spacing: 'golden-spacing',
        proportions: 'golden-proportions'
      },
      'grid-modern': {
        columns: 12,
        gutters: 'modern-gutters',
        spacing: 'modern-spacing',
        proportions: 'modern-proportions'
      },
      'traditional-grid': {
        columns: 8,
        gutters: 'traditional-gutters',
        spacing: 'traditional-spacing',
        proportions: 'traditional-proportions'
      },
      'luxury-asymmetric': {
        ratio: 1.414,
        grid: 'asymmetric-grid',
        spacing: 'luxury-spacing',
        proportions: 'luxury-proportions'
      }
    };
  }

  // Initialize professional animation engine
  initializeAnimationEngine() {
    return {
      'entrance': {
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94],
        stagger: 0.1
      },
      'hover': {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1],
        scale: 1.02,
        y: -2
      },
      'transition': {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    };
  }

  // Main method to generate professional flyer
  async generateProfessionalFlyer(data) {
    const startTime = Date.now();
    
    try {
      console.log('🎨 ProfessionalFlyerEngine: Starting flyer generation with data:', data);
      console.log('🎨 ProfessionalFlyerEngine: Data type:', typeof data);
      console.log('🎨 ProfessionalFlyerEngine: Data keys:', Object.keys(data || {}));
      
      if (!data) {
        throw new Error('No data provided to generateProfessionalFlyer');
      }

      console.log('🎨 ProfessionalFlyerEngine: Selecting design system...');
      const designSystem = this.selectDesignSystem(data.style);
      console.log('🎨 ProfessionalFlyerEngine: Design system selected:', designSystem);

      // Get market intelligence insights
      console.log('🏠 ProfessionalFlyerEngine: Analyzing market conditions...');
      const marketInsights = this.marketIntelligence.generateMarketAdaptations(data);
      console.log('🏠 ProfessionalFlyerEngine: Market insights:', marketInsights);

      console.log('🎨 ProfessionalFlyerEngine: Generating modern flyer content...');
      const flyerContent = this.generateModernFlyerContent(data, designSystem, marketInsights);
      console.log('🎨 ProfessionalFlyerEngine: Modern flyer content generated');

      console.log('🎨 ProfessionalFlyerEngine: Applying modern design system...');
      const styledFlyer = this.applyModernDesignSystem(flyerContent, designSystem);
      console.log('🎨 ProfessionalFlyerEngine: Modern design system applied');

      console.log('🎨 ProfessionalFlyerEngine: Generating modern animations...');
      const animations = this.generateModernAnimations(designSystem);
      console.log('🎨 ProfessionalFlyerEngine: Modern animations generated');

      console.log('🎨 ProfessionalFlyerEngine: Creating final flyer...');
      const flyer = {
        html: styledFlyer.html,
        css: styledFlyer.css,
        animations: animations,
        metadata: {
          generatedAt: new Date().toISOString(),
          propertyInfo: data.propertyInfo,
          agentInfo: data.agentInfo,
          style: data.style,
          quality: 'marketing-professional'
        }
      };
      console.log('🎨 ProfessionalFlyerEngine: Final flyer created successfully');

      // Create the result object
      const result = {
        success: true,
        type: 'professional-flyer',
        flyer: {
          html: flyer.html,
          css: flyer.css,
          animations: flyer.animations,
          metadata: flyer.metadata
        },
        designSystem: designSystem.name,
        quality: 'marketing-professional'
      };

      // Record this flyer generation for learning
      const generationTime = Date.now() - startTime;
      const flyerId = this.learningEngine.recordFlyerGeneration(
        data,
        result,
        { 
          generationTime,
          fileSize: this.calculateFileSize(result),
          userAgent: 'professional-flyer-engine'
        }
      );
      
      // Analyze performance for immediate insights
      const analysis = this.learningEngine.analyzeFlyerPerformance(flyerId);
      if (analysis) {
        console.log('🧠 Learning Engine Analysis:', analysis);
      }

      console.log('✅ ProfessionalFlyerEngine: Flyer generation completed successfully with learning integration');
      return result;
      
    } catch (error) {
      console.error('❌ ProfessionalFlyerEngine: Flyer generation failed:', error);
      console.error('❌ ProfessionalFlyerEngine: Error stack:', error.stack);
      console.error('❌ ProfessionalFlyerEngine: Error name:', error.name);
      console.error('❌ ProfessionalFlyerEngine: Error message:', error.message);
      
      // Record failed generation for learning
      const failedResult = {
        success: false,
        error: error.message || 'Unknown error occurred'
      };
      
      this.learningEngine.recordFlyerGeneration(
        data,
        failedResult,
        { 
          generationTime: Date.now() - startTime,
          error: error.message || 'Unknown error occurred'
        }
      );
      
      return failedResult;
    }
  }

  // Select the best design system
  selectDesignSystem(style) {
    // Ensure designSystems is initialized
    if (!this.designSystems) {
      console.log('⚠️ Design systems not initialized, initializing now...');
      this.designSystems = this.initializeDesignSystems();
    }
    
    if (style && this.designSystems[style]) {
      return this.designSystems[style];
    }
    return this.designSystems['modern-contemporary'];
  }

  // Calculate file size for learning analytics
  calculateFileSize(result) {
    try {
      const htmlSize = new Blob([result.flyer.html]).size;
      const cssSize = new Blob([result.flyer.css]).size;
      const animationsSize = new Blob([result.flyer.animations]).size;
      return htmlSize + cssSize + animationsSize;
    } catch (error) {
      console.log('⚠️ Could not calculate file size:', error.message);
      return 0;
    }
  }

  // Generate modern, engaging flyer content
  generateModernFlyerContent(data, designSystem, marketInsights) {
    const { propertyInfo, agentInfo, flyerType } = data;
    
    // Capitalize property type for better presentation
    const propertyType = propertyInfo.propertyType 
      ? propertyInfo.propertyType.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
      : 'Residential Property';
    
    // Create engaging headline based on flyer type
    const headline = flyerType === 'openhouse' 
      ? 'OPEN HOUSE'
      : 'FOR SALE';
    
    // Handle photos - use actual photos if available, otherwise placeholders
    const hasPhotos = data.photos && data.photos.length > 0;
    const heroPhoto = hasPhotos ? data.photos[0] : null;
    const interiorPhotos = hasPhotos ? data.photos.slice(1, 4) : [];
    
    // Generate modern HTML structure with professional design
    const html = `
      <div class="modern-flyer-container">
        <!-- Hero Section with Large Property Image -->
        <div class="hero-section">
          <div class="hero-image-container">
            ${heroPhoto ? `
              <img src="${heroPhoto}" alt="Property Photo" class="hero-image" />
            ` : `
              <div class="hero-image-placeholder">
                <div class="image-icon">🏠</div>
                <p class="image-text">Property Photo</p>
                <p class="image-subtext">Your uploaded photos will appear here</p>
              </div>
            `}
          </div>
          <div class="hero-overlay">
            <div class="hero-content">
              <div class="status-badge">${headline}</div>
              <h1 class="property-address">${propertyInfo.address}</h1>
              <div class="property-highlights">
                <div class="highlight-item">
                  <span class="highlight-value">${propertyInfo.bedrooms || 'Contact for details'}</span>
                  <span class="highlight-label">Bedrooms</span>
                </div>
                <div class="highlight-item">
                  <span class="highlight-value">${propertyInfo.bathrooms || 'Contact for details'}</span>
                  <span class="highlight-label">Bathrooms</span>
                </div>
                <div class="highlight-item">
                  <span class="highlight-value">${propertyInfo.sqft || 'Contact for details'}</span>
                  <span class="highlight-label">Sq Ft</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Property Information Section -->
        <div class="property-info-section">
          <div class="info-grid">
            <div class="info-card main-info">
              <h3 class="card-title">About This Property</h3>
              <p class="property-description">
                A stunning ${propertyType.toLowerCase()} that combines comfort, style, and functionality in a prime location. 
                This exceptional property offers modern amenities and thoughtful design throughout.
              </p>
              <div class="price-highlight">
                <span class="price-label">Price</span>
                <span class="price-value">${propertyInfo.price || 'Contact for pricing'}</span>
              </div>
            </div>
            
            <div class="info-card property-details">
              <h3 class="card-title">Property Details</h3>
              <div class="details-list">
                <div class="detail-item">
                  <span class="detail-label">Property Type</span>
                  <span class="detail-value">${propertyType}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Address</span>
                  <span class="detail-value">${propertyInfo.address}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Bedrooms</span>
                  <span class="detail-value">${propertyInfo.bedrooms || 'Contact for details'}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Bathrooms</span>
                  <span class="detail-value">${propertyInfo.bathrooms || 'Contact for details'}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Square Feet</span>
                  <span class="detail-value">${propertyInfo.sqft || 'Contact for details'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Property Features Section -->
        <div class="features-section">
          <h3 class="section-title">Property Features</h3>
          <div class="features-grid">
            ${data.dynamicFeatures ? data.dynamicFeatures.map(feature => `
              <div class="feature-card">
                <div class="feature-icon">✨</div>
                <h4 class="feature-title">${feature.title}</h4>
                <p class="feature-description">${feature.description}</p>
              </div>
            `).join('') : `
              <div class="feature-card">
                <div class="feature-icon">📍</div>
                <h4 class="feature-title">Prime Location</h4>
                <p class="feature-description">Strategically located in a highly desirable area with excellent amenities and accessibility.</p>
              </div>
              <div class="feature-card">
                <div class="feature-icon">🏗️</div>
                <h4 class="feature-title">Modern Design</h4>
                <p class="feature-description">Contemporary architecture with premium finishes and thoughtful design elements throughout.</p>
              </div>
              <div class="feature-card">
                <div class="feature-icon">👨‍👩‍👧‍👦</div>
                <h4 class="feature-title">Family Friendly</h4>
                <p class="feature-description">Perfect for families with spacious rooms, outdoor areas, and a safe neighborhood environment.</p>
              </div>
              <div class="feature-card">
                <div class="feature-icon">📈</div>
                <h4 class="feature-title">Investment Value</h4>
                <p class="feature-description">Strong potential for appreciation in this rapidly developing area with excellent market fundamentals.</p>
              </div>
            `}
          </div>
        </div>
        
        <!-- Interior Photos Section -->
        <div class="photos-section">
          <h3 class="section-title">Interior Photos</h3>
          <div class="photos-grid">
            ${interiorPhotos.length > 0 ? interiorPhotos.map((photo, index) => `
              <div class="photo-item">
                <img src="${photo}" alt="Interior Photo ${index + 1}" class="interior-photo" />
              </div>
            `).join('') : `
              <div class="photo-item">
                <div class="photo-placeholder">
                  <div class="photo-icon">🛏️</div>
                  <p>Bedroom</p>
                </div>
              </div>
              <div class="photo-item">
                <div class="photo-placeholder">
                  <div class="photo-icon">🍳</div>
                  <p>Kitchen</p>
                </div>
              </div>
              <div class="photo-item">
                <div class="photo-placeholder">
                  <div class="photo-icon">🛋️</div>
                  <p>Living Room</p>
                </div>
              </div>
            `}
          </div>
        </div>
        
        <!-- Agent Contact Section -->
        <div class="agent-section">
          <div class="agent-card">
            <div class="agent-header">
              <div class="agent-icon">👤</div>
              <div class="agent-info">
                <h3 class="agent-name">${agentInfo?.name || 'Contact for details'}</h3>
                <p class="agent-title">Real Estate Agent</p>
              </div>
            </div>
            <div class="agent-contact">
              <div class="contact-item">
                <span class="contact-icon">📞</span>
                <span class="contact-value">${agentInfo?.phone || 'Contact for details'}</span>
              </div>
              <div class="contact-item">
                <span class="contact-icon">✉️</span>
                <span class="contact-value">${agentInfo?.email || 'Contact for details'}</span>
              </div>
              <div class="contact-item">
                <span class="contact-icon">🏢</span>
                <span class="contact-value">${agentInfo?.agency || 'Contact for details'}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Call to Action Footer -->
        <div class="footer-section">
          <div class="footer-content">
            <h3 class="footer-title">Ready to Make This Your Home?</h3>
            <p class="footer-description">Don't miss this exceptional opportunity. Contact us today to schedule a viewing.</p>
            <div class="footer-cta">
              <span class="cta-icon">📞</span>
              <span class="cta-text">Call Now: ${agentInfo?.phone || 'Contact for details'}</span>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Return the content object
    return {
      html: html,
      css: '' // CSS will be applied separately
    };
  }

  // Apply modern design system with gradients and animations
  applyModernDesignSystem(flyerContent, designSystem) {
    const { html, propertyType, headline } = flyerContent;
    
    // Get color scheme based on design system
    let colors;
    switch (designSystem.colorScheme) {
      case 'luxury-gold-black':
        colors = {
          primary: '#D4AF37',
          secondary: '#000000',
          accent: '#FFD700',
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
          text: '#ffffff',
          highlight: '#D4AF37'
        };
        break;
      case 'modern-blue-white':
        colors = {
          primary: '#1e40af',
          secondary: '#ffffff',
          accent: '#3b82f6',
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          text: '#1e293b',
          highlight: '#1e40af'
        };
        break;
      case 'classic-navy-cream':
        colors = {
          primary: '#1e3a8a',
          secondary: '#fef3c7',
          accent: '#3b82f6',
          background: 'linear-gradient(135deg, #ffffff 0%, #fef3c7 100%)',
          text: '#1e3a8a',
          highlight: '#3b82f6'
        };
        break;
      default:
        colors = {
          primary: '#1e40af',
          secondary: '#ffffff',
          accent: '#3b82f6',
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          text: '#1e293b',
          highlight: '#1e40af'
        };
    }
    
    const css = `
      /* Professional Real Estate Flyer - Modern Design */
      
      /* Import Google Fonts */
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Montserrat:wght@400;500;600;700;800&family=Poppins:wght@400;500;600;700;800&display=swap');
      
      /* CSS Custom Properties */
      :root {
        --color-primary: #1e40af;
        --color-secondary: #1e3a8a;
        --color-accent: #fbbf24;
        --color-background: #ffffff;
        --color-text: #1f2937;
        --color-text-light: #6b7280;
        --color-border: #e5e7eb;
        --color-card: #f9fafb;
        --color-highlight: #3b82f6;
        --color-success: #10b981;
        
        --font-primary: 'Inter', sans-serif;
        --font-secondary: 'Montserrat', sans-serif;
        --font-accent: 'Poppins', sans-serif;
        
        --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
        --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
        --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
        --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.15);
        
        --border-radius: 12px;
        --border-radius-lg: 16px;
        --transition: all 0.3s ease;
      }
      
      /* Base Styles */
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: var(--font-primary);
        line-height: 1.6;
        color: var(--color-text);
        background: var(--color-background);
        min-height: 100vh;
        overflow-x: hidden;
      }
      
      .modern-flyer-container {
        max-width: 1200px;
        margin: 0 auto;
        background: var(--color-background);
        min-height: auto;
        display: flex;
        flex-direction: column;
        gap: 0;
        box-shadow: var(--shadow-xl);
        border-radius: var(--border-radius-lg);
        overflow: hidden;
      }
      
      /* Hero Section with Large Image */
      .hero-section {
        position: relative;
        height: 400px;
        background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
        overflow: hidden;
      }
      
      .hero-image-container {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }
      
      .hero-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center;
      }
      
      .hero-image-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: white;
        background: rgba(0, 0, 0, 0.3);
      }
      
      .image-icon {
        font-size: 64px;
        margin-bottom: 16px;
        opacity: 0.8;
      }
      
      .image-text {
        font-size: 24px;
        font-weight: 600;
        margin-bottom: 8px;
      }
      
      .image-subtext {
        font-size: 16px;
        opacity: 0.8;
      }
      
      .hero-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, rgba(30, 64, 175, 0.8) 0%, rgba(30, 58, 138, 0.8) 100%);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .hero-content {
        text-align: center;
        color: white;
        max-width: 600px;
        padding: 0 20px;
      }
      
      .status-badge {
        display: inline-block;
        background: var(--color-accent);
        color: var(--color-secondary);
        padding: 8px 20px;
        border-radius: 25px;
        font-weight: 700;
        font-size: 16px;
        margin-bottom: 20px;
        text-transform: uppercase;
        letter-spacing: 1px;
        box-shadow: var(--shadow-md);
      }
      
      .property-address {
        font-size: 36px;
        font-weight: 800;
        margin-bottom: 24px;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        line-height: 1.2;
      }
      
      .property-highlights {
        display: flex;
        justify-content: center;
        gap: 32px;
        flex-wrap: wrap;
      }
      
      .highlight-item {
        text-align: center;
      }
      
      .highlight-value {
        display: block;
        font-size: 28px;
        font-weight: 800;
        color: var(--color-accent);
        margin-bottom: 4px;
      }
      
      .highlight-label {
        font-size: 14px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        opacity: 0.9;
        font-weight: 500;
      }
      
      /* Property Information Section */
      .property-info-section {
        padding: 40px;
        background: var(--color-background);
      }
      
      .info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 32px;
        margin-bottom: 32px;
      }
      
      .info-card {
        background: var(--color-card);
        border-radius: var(--border-radius);
        padding: 32px;
        border: 1px solid var(--color-border);
        box-shadow: var(--shadow-sm);
      }
      
      .card-title {
        font-size: 20px;
        font-weight: 700;
        margin-bottom: 20px;
        color: var(--color-primary);
        font-family: var(--font-secondary);
      }
      
      .property-description {
        font-size: 16px;
        line-height: 1.6;
        color: var(--color-text);
        margin-bottom: 24px;
      }
      
      .price-highlight {
        background: var(--color-primary);
        color: white;
        padding: 16px 20px;
        border-radius: var(--border-radius);
        text-align: center;
      }
      
      .price-label {
        display: block;
        font-size: 14px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 8px;
        opacity: 0.9;
      }
      
      .price-value {
        display: block;
        font-size: 24px;
        font-weight: 800;
        font-family: var(--font-secondary);
      }
      
      .details-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      
      .detail-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid var(--color-border);
      }
      
      .detail-item:last-child {
        border-bottom: none;
      }
      
      .detail-label {
        font-weight: 600;
        color: var(--color-text-light);
      }
      
      .detail-value {
        font-weight: 700;
        color: var(--color-text);
      }
      
      /* Features Section */
      .features-section {
        padding: 40px;
        background: var(--color-card);
        border-top: 1px solid var(--color-border);
      }
      
      .section-title {
        font-size: 28px;
        font-weight: 700;
        margin-bottom: 32px;
        color: var(--color-primary);
        text-align: center;
        font-family: var(--font-secondary);
      }
      
      .features-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 24px;
      }
      
      .feature-card {
        background: white;
        border-radius: var(--border-radius);
        padding: 24px;
        border: 1px solid var(--color-border);
        box-shadow: var(--shadow-sm);
        text-align: center;
        transition: var(--transition);
      }
      
      .feature-card:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-lg);
      }
      
      .feature-icon {
        font-size: 32px;
        margin-bottom: 16px;
      }
      
      .feature-title {
        font-size: 18px;
        font-weight: 700;
        margin-bottom: 12px;
        color: var(--color-primary);
        font-family: var(--font-secondary);
      }
      
      .feature-description {
        font-size: 14px;
        line-height: 1.5;
        color: var(--color-text-light);
      }
      
      /* Photos Section */
      .photos-section {
        padding: 40px;
        background: var(--color-background);
        border-top: 1px solid var(--color-border);
      }
      
      .photos-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 24px;
      }
      
      .photo-item {
        aspect-ratio: 4/3;
      }
      
      .interior-photo {
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center;
        border-radius: var(--border-radius);
        border: 1px solid var(--color-border);
      }
      
      .photo-placeholder {
        width: 100%;
        height: 100%;
        background: var(--color-card);
        border: 2px dashed var(--color-border);
        border-radius: var(--border-radius);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: var(--color-text-light);
      }
      
      .photo-icon {
        font-size: 32px;
        margin-bottom: 12px;
        opacity: 0.6;
      }
      
      .photo-placeholder p {
        font-size: 14px;
        font-weight: 500;
      }
      
      /* Agent Section */
      .agent-section {
        padding: 40px;
        background: var(--color-primary);
        color: white;
      }
      
      .agent-card {
        max-width: 600px;
        margin: 0 auto;
        text-align: center;
      }
      
      .agent-header {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 16px;
        margin-bottom: 24px;
      }
      
      .agent-icon {
        font-size: 32px;
        background: rgba(255, 255, 255, 0.2);
        width: 64px;
        height: 64px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .agent-name {
        font-size: 24px;
        font-weight: 700;
        margin-bottom: 4px;
        font-family: var(--font-secondary);
      }
      
      .agent-title {
        font-size: 16px;
        opacity: 0.9;
        font-weight: 500;
      }
      
      .agent-contact {
        display: flex;
        flex-direction: column;
        gap: 16px;
        align-items: center;
      }
      
      .contact-item {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 16px;
      }
      
      .contact-icon {
        font-size: 20px;
      }
      
      .contact-value {
        font-weight: 600;
      }
      
      /* Footer Section */
      .footer-section {
        background: var(--color-secondary);
        color: white;
        padding: 40px;
        text-align: center;
      }
      
      .footer-title {
        font-size: 28px;
        font-weight: 800;
        margin-bottom: 16px;
        font-family: var(--font-secondary);
      }
      
      .footer-description {
        font-size: 18px;
        line-height: 1.5;
        margin-bottom: 24px;
        opacity: 0.9;
        max-width: 600px;
        margin-left: auto;
        margin-right: auto;
      }
      
      .footer-cta {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        background: var(--color-accent);
        color: var(--color-secondary);
        padding: 16px 32px;
        border-radius: 25px;
        font-weight: 700;
        font-size: 18px;
        box-shadow: var(--shadow-md);
        transition: var(--transition);
      }
      
      .footer-cta:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-lg);
      }
      
      .cta-icon {
        font-size: 20px;
      }
      
      /* Responsive Design */
      @media (max-width: 768px) {
        .hero-section {
          height: 300px;
        }
        
        .property-address {
          font-size: 28px;
        }
        
        .property-highlights {
          gap: 20px;
        }
        
        .highlight-value {
          font-size: 24px;
        }
        
        .info-grid {
          grid-template-columns: 1fr;
          gap: 24px;
        }
        
        .features-grid {
          grid-template-columns: 1fr;
        }
        
        .photos-grid {
          grid-template-columns: 1fr;
        }
        
        .property-info-section,
        .features-section,
        .photos-section,
        .agent-section,
        .footer-section {
          padding: 24px;
        }
      }
      
      /* Print Styles */
      @media print {
        .modern-flyer-container {
          max-width: none;
          margin: 0;
          box-shadow: none;
          border-radius: 0;
        }
        
        .hero-section,
        .info-card,
        .feature-card,
        .photo-item,
        .agent-card,
        .footer-section {
          break-inside: avoid;
          page-break-inside: avoid;
        }
      }
    `;
    
    return { html, css };
  }

  // Generate modern animations
  generateModernAnimations(designSystem) {
    return `
      // Modern Flyer Animations
      
      // Entrance animations
      const entranceAnimation = {
        initial: { opacity: 0, y: 50, scale: 0.95 },
        animate: { 
          opacity: 1, 
          y: 0, 
          scale: 1,
          transition: {
            duration: 0.8,
            ease: [0.25, 0.46, 0.45, 0.94],
            staggerChildren: 0.1
          }
        },
        exit: { opacity: 0, y: -50, scale: 0.95 }
      };
      
      // Hover animations
      const hoverAnimation = {
        whileHover: {
          scale: 1.02,
          y: -2,
          transition: { duration: 0.3 }
        },
        whileTap: { scale: 0.98 }
      };
      
      // Stagger children animation
      const staggerContainer = {
        animate: {
          transition: {
            staggerChildren: 0.1
          }
        }
      };
      
      // Fade in up animation
      const fadeInUp = {
        initial: { opacity: 0, y: 30 },
        animate: { 
          opacity: 1, 
          y: 0,
          transition: { duration: 0.5 }
        }
      };
      
      // Apply animations to elements
      document.addEventListener('DOMContentLoaded', function() {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.style.opacity = '1';
              entry.target.style.transform = 'translateY(0)';
            }
          });
        });
        
        // Observe all cards for animation
        document.querySelectorAll('.detail-card, .agent-card').forEach(card => {
          card.style.opacity = '0';
          card.style.transform = 'translateY(30px)';
          card.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
          observer.observe(card);
        });
        
        // Hero section entrance animation
        const heroContent = document.querySelector('.hero-content');
        if (heroContent) {
          heroContent.style.opacity = '0';
          heroContent.style.transform = 'translateY(30px)';
          setTimeout(() => {
            heroContent.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
            heroContent.style.opacity = '1';
            heroContent.style.transform = 'translateY(0)';
          }, 100);
        }
      });
    `;
  }





  // Generate professional CSS with advanced features
  generateProfessionalCSS(data, designSystem) {
    const typography = this.typographyEngine[designSystem.typography];
    const colors = this.colorEngine[designSystem.colorScheme];
    
    return `
      /* Professional Real Estate Flyer - ${designSystem.name} */
      
      /* Import Google Fonts */
      @import url('https://fonts.googleapis.com/css2?family=${typography.primary.replace(' ', '+')}:wght@${typography.weights.primary.join(',')}&family=${typography.secondary.replace(' ', '+')}:wght@${typography.weights.secondary.join(',')}&family=${typography.accent.replace(' ', '+')}:wght@${typography.weights.accent.join(',')}&display=swap');
      
      /* CSS Custom Properties */
      :root {
        /* Typography Scale */
        --font-size-h1: ${typography.scale.h1};
        --font-size-h2: ${typography.scale.h2};
        --font-size-h3: ${typography.scale.h3};
        --font-size-body: ${typography.scale.body};
        --font-size-caption: ${typography.scale.caption};
        
        /* Color Palette */
        --color-primary: ${colors.primary[0]};
        --color-primary-light: ${colors.primary[1]};
        --color-primary-dark: ${colors.primary[2]};
        --color-accent: ${colors.accent[0]};
        --color-accent-light: ${colors.accent[1]};
        --color-accent-dark: ${colors.accent[2]};
        --color-neutral: ${colors.neutral[0]};
        --color-neutral-light: ${colors.neutral[1]};
        --color-neutral-dark: ${colors.neutral[2]};
        
        /* Spacing System */
        --spacing-xs: 0.25rem;
        --spacing-sm: 0.5rem;
        --spacing-md: 1rem;
        --spacing-lg: 1.5rem;
        --spacing-xl: 2rem;
        --spacing-2xl: 3rem;
        --spacing-3xl: 4rem;
        
        /* Shadows */
        --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        --shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        
        /* Transitions */
        --transition-fast: 0.15s ease;
        --transition-normal: 0.3s ease;
        --transition-slow: 0.5s ease;
      }
      
      /* Base Styles */
      .flyer-container {
        font-family: '${typography.primary}', serif;
        line-height: 1.6;
        letter-spacing: 0.02em;
        color: var(--color-primary);
        background: var(--color-neutral);
        min-height: 100vh;
        overflow-x: hidden;
      }
      
      /* Typography */
      .flyer-headline {
        font-family: '${typography.primary}', serif;
        font-size: var(--font-size-h1);
        font-weight: 700;
        line-height: 1.2;
        background: ${colors.gradient};
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        margin-bottom: var(--spacing-lg);
      }
      
      .flyer-subheadline {
        font-family: '${typography.secondary}', sans-serif;
        font-size: var(--font-size-h2);
        font-weight: 600;
        color: var(--color-primary);
        margin-bottom: var(--spacing-md);
      }
      
      .flyer-body {
        font-family: '${typography.secondary}', sans-serif;
        font-size: var(--font-size-body);
        font-weight: 400;
        line-height: 1.6;
        color: var(--color-primary);
        margin-bottom: var(--spacing-md);
      }
      
      .flyer-caption {
        font-family: '${typography.secondary}', sans-serif;
        font-size: var(--font-size-caption);
        font-weight: 400;
        color: var(--color-primary-light);
        margin-bottom: var(--spacing-sm);
      }
      
      /* Layout Grid */
      .flyer-grid {
        display: grid;
        grid-template-columns: repeat(12, 1fr);
        gap: var(--spacing-lg);
        padding: var(--spacing-xl);
        max-width: 1200px;
        margin: 0 auto;
      }
      
      /* Professional Cards */
      .flyer-card {
        background: var(--color-neutral);
        border-radius: 16px;
        padding: var(--spacing-xl);
        box-shadow: var(--shadow-lg);
        border: 1px solid rgba(255, 255, 255, 0.1);
        transition: all var(--transition-normal);
        backdrop-filter: blur(10px);
      }
      
      .flyer-card:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-2xl);
      }
      
      /* Professional Buttons */
      .flyer-button {
        background: ${colors.gradient};
        color: white;
        border: none;
        padding: var(--spacing-md) var(--spacing-xl);
        border-radius: 12px;
        font-family: '${typography.secondary}', sans-serif;
        font-weight: 600;
        font-size: var(--font-size-body);
        cursor: pointer;
        transition: all var(--transition-normal);
        box-shadow: var(--shadow-md);
      }
      
      .flyer-button:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-xl);
      }
      
      /* Professional Images */
      .flyer-image {
        border-radius: 12px;
        overflow: hidden;
        box-shadow: var(--shadow-lg);
        transition: all var(--transition-normal);
      }
      
      .flyer-image:hover {
        transform: scale(1.02);
        box-shadow: var(--shadow-2xl);
      }
      
      /* Responsive Design */
      @media (max-width: 768px) {
        .flyer-grid {
          grid-template-columns: 1fr;
          padding: var(--spacing-md);
        }
        
        .flyer-headline {
          font-size: var(--font-size-h2);
        }
        
        .flyer-subheadline {
          font-size: var(--font-size-h3);
        }
      }
      
      /* Print Styles */
      @media print {
        .flyer-container {
          background: white;
          color: black;
        }
        
        .flyer-card {
          box-shadow: none;
          border: 1px solid #ccc;
        }
      }
    `;
  }

  // Generate professional HTML structure with dynamic content
  generateProfessionalHTML(data) {
    const { propertyInfo, agentInfo, photos, flyerType, style } = data;
    
    // Determine the main headline based on flyer type and property details
    const getMainHeadline = () => {
      if (flyerType === 'openhouse') {
        return 'OPEN HOUSE';
      }
      
      if (propertyInfo.price && propertyInfo.price !== 'Contact for pricing') {
        return 'FOR SALE';
      }
      
      return 'EXCLUSIVE PROPERTY';
    };

    // Generate property features list
    const generateFeaturesList = () => {
      if (propertyInfo.features && propertyInfo.features.length > 0) {
        return propertyInfo.features.map(feature => 
          `<li style="margin-bottom: 8px; padding-left: 20px; position: relative;">
             <span style="position: absolute; left: 0; color: var(--color-accent);">•</span>
             ${feature}
           </li>`
        ).join('');
      }
      
      // Default features based on property type
      const defaultFeatures = [
        'Professional photography',
        'Detailed property description',
        'Virtual tour available',
        'Contact agent for more details'
      ];
      
      return defaultFeatures.map(feature => 
        `<li style="margin-bottom: 8px; padding-left: 20px; position: relative;">
           <span style="position: absolute; left: 0; color: var(--color-accent);">•</span>
           ${feature}
         </li>`
      ).join('');
    };

    // Generate photo gallery
    const generatePhotoGallery = () => {
      if (photos && photos.length > 0) {
        return photos.map((photo, index) => `
          <div class="flyer-image" style="margin-bottom: 15px;">
            <img src="${photo}" alt="Property Photo ${index + 1}" style="width: 100%; height: 180px; object-fit: cover; border-radius: 8px;">
          </div>
        `).join('');
      }
      
      return `
        <div class="flyer-image" style="text-align: center; padding: 40px 20px;">
          <div style="font-size: 48px; margin-bottom: 15px; color: var(--color-primary-light);">📷</div>
          <p style="margin: 0; color: var(--color-primary-light); font-size: 14px;">
            Professional photos coming soon!<br>
            Contact agent for current images.
          </p>
        </div>
      `;
    };

    // Generate open house specific content
    const generateOpenHouseContent = () => {
      if (flyerType !== 'openhouse') return '';
      
      return `
        <div class="flyer-card" style="grid-column: 1 / -1; background: linear-gradient(135deg, var(--color-accent), var(--color-accent-light)); color: white; text-align: center;">
          <h2 style="margin: 0 0 15px 0; font-size: 2.5rem; font-weight: 700;">🗓️ OPEN HOUSE</h2>
          <div style="font-size: 1.5rem; margin-bottom: 10px; font-weight: 600;">
            ${propertyInfo.openHouseDate ? new Date(propertyInfo.openHouseDate).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            }) : 'Date TBD'}
          </div>
          <div style="font-size: 1.25rem; margin-bottom: 20px; opacity: 0.9;">
            ${propertyInfo.openHouseTime ? propertyInfo.openHouseTime : 'Time TBD'}
          </div>
          <div style="font-size: 1.1rem; opacity: 0.8;">
            Don't miss this opportunity to see this beautiful property in person!
          </div>
        </div>
      `;
    };

    // Generate property highlights
    const generatePropertyHighlights = () => {
      const highlights = [];
      
      if (propertyInfo.bedrooms) highlights.push(`${propertyInfo.bedrooms} BR`);
      if (propertyInfo.bathrooms) highlights.push(`${propertyInfo.bathrooms} BA`);
      if (propertyInfo.sqft) highlights.push(`${propertyInfo.sqft} sq ft`);
      
      if (highlights.length === 0) return '';
      
      return `
        <div style="display: flex; gap: 20px; margin: 20px 0; flex-wrap: wrap;">
          ${highlights.map(highlight => `
            <div style="
              background: var(--color-primary-light); 
              color: white; 
              padding: 8px 16px; 
              border-radius: 20px; 
              font-weight: 600; 
              font-size: 14px;
              box-shadow: var(--shadow-sm);
            ">
              ${highlight}
            </div>
          `).join('')}
        </div>
      `;
    };

    return `
      <div class="flyer-container">
        <div class="flyer-grid">
          <!-- Open House Banner (if applicable) -->
          ${generateOpenHouseContent()}
          
          <!-- Hero Section -->
          <div class="flyer-card" style="grid-column: 1 / -1; text-align: center; background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light)); color: white;">
            <h1 class="flyer-headline" style="color: white; margin-bottom: 15px;">${getMainHeadline()}</h1>
            <h2 class="flyer-subheadline" style="color: white; margin-bottom: 20px; font-size: 1.8rem;">
              ${propertyInfo.address || 'Beautiful Property Available'}
            </h2>
            ${generatePropertyHighlights()}
            <div class="flyer-body" style="color: white; opacity: 0.9; font-size: 1.1rem;">
              ${propertyInfo.propertyType ? `A stunning ${propertyInfo.propertyType.toLowerCase()}` : 'A stunning residential property'} 
              that combines comfort, style, and functionality in a prime location.
            </div>
          </div>
          
          <!-- Property Details -->
          <div class="flyer-card" style="grid-column: 1 / 7;">
            <h3 class="flyer-subheadline">🏡 Property Details</h3>
            <div class="flyer-body">
              <div style="margin-bottom: 20px;">
                <strong style="color: var(--color-accent);">Property Type:</strong> ${propertyInfo.propertyType || 'Residential Property'}<br>
                <strong style="color: var(--color-accent);">Address:</strong> ${propertyInfo.address || 'Contact for details'}<br>
                <strong style="color: var(--color-accent);">Bedrooms:</strong> ${propertyInfo.bedrooms || 'Contact for details'}<br>
                <strong style="color: var(--color-accent);">Bathrooms:</strong> ${propertyInfo.bathrooms || 'Contact for details'}<br>
                <strong style="color: var(--color-accent);">Square Feet:</strong> ${propertyInfo.sqft || 'Contact for details'}
              </div>
              
              <div style="
                background: var(--color-neutral-light); 
                padding: 20px; 
                border-radius: 12px; 
                border-left: 4px solid var(--color-accent);
              ">
                <h4 style="margin: '0 0 15px 0'; color: var(--color-accent); font-size: 1.2rem;">💰 Price</h4>
                <div style="font-size: 1.5rem; font-weight: 700; color: var(--color-accent);">
                  ${propertyInfo.price || 'Contact for pricing'}
                </div>
              </div>
            </div>
          </div>
          
          <!-- Property Photos -->
          <div class="flyer-card" style="grid-column: 7 / -1;">
            <h3 class="flyer-subheadline">📸 Property Photos</h3>
            ${generatePhotoGallery()}
          </div>
          
          <!-- Property Features -->
          <div class="flyer-card" style="grid-column: 1 / 7;">
            <h3 class="flyer-subheadline">✨ Property Features</h3>
            <div class="flyer-body">
              <ul style="list-style: none; padding: 0; margin: 0;">
                ${generateFeaturesList()}
              </ul>
            </div>
          </div>
          
          <!-- Agent Information -->
          <div class="flyer-card" style="grid-column: 7 / -1; background: linear-gradient(135deg, var(--color-accent), var(--color-accent-light)); color: white;">
            <h3 class="flyer-subheadline" style="color: white;">👤 Contact Your Agent</h3>
            <div class="flyer-body" style="color: white;">
              <div style="margin-bottom: 15px;">
                <strong style="font-size: 1.2rem;">${agentInfo.name || 'Professional Agent'}</strong><br>
                <span style="opacity: 0.9;">${agentInfo.agency || 'Premier Real Estate'}</span>
              </div>
              
              <div style="margin-bottom: 15px;">
                <div style="margin-bottom: 8px;">
                  📞 <strong>Phone:</strong> ${agentInfo.phone || 'Contact for details'}
                </div>
                <div style="margin-bottom: 8px;">
                  ✉️ <strong>Email:</strong> ${agentInfo.email || 'Contact for details'}
                </div>
              </div>
            </div>
          </div>
          
          <!-- Call to Action -->
          <div class="flyer-card" style="grid-column: 1 / -1; text-align: center; background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light)); color: white;">
            <h3 class="flyer-subheadline" style="color: white; margin-bottom: 20px;">
              ${flyerType === 'openhouse' ? '🎯 Visit Our Open House!' : '🎯 Schedule a Private Viewing!'}
            </h3>
            <div class="flyer-body" style="color: white; margin-bottom: 25px; font-size: 1.1rem;">
              ${flyerType === 'openhouse' 
                ? 'Don\'t miss this opportunity to see this beautiful property in person! Perfect for families, investors, and anyone looking for their dream home.'
                : 'Don\'t miss this exceptional opportunity! Contact us today to schedule a private viewing and discover why this property is perfect for you.'
              }
            </div>
            <button class="flyer-button" style="
              background: white; 
              color: var(--color-primary); 
              font-size: 1.1rem; 
              padding: 15px 30px;
              border: none;
              border-radius: 25px;
              font-weight: 700;
              cursor: pointer;
              transition: all 0.3s ease;
              box-shadow: var(--shadow-lg);
            ">
              ${flyerType === 'openhouse' ? '📅 Mark Your Calendar' : '📞 Contact Agent Now'}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // Generate professional animations
  generateProfessionalAnimations() {
    const animations = this.animationEngine;
    
    return `
      // Professional Flyer Animations
      
      // Entrance animations
      const entranceAnimation = {
        initial: { opacity: 0, y: 50, scale: 0.95 },
        animate: { 
          opacity: 1, 
          y: 0, 
          scale: 1,
          transition: {
            duration: ${animations.entrance.duration},
            ease: [${animations.entrance.ease.join(', ')}],
            staggerChildren: ${animations.entrance.stagger}
          }
        },
        exit: { opacity: 0, y: -50, scale: 0.95 }
      };
      
      // Hover animations
      const hoverAnimation = {
        whileHover: {
          scale: ${animations.hover.scale},
          y: ${animations.hover.y},
          transition: { duration: ${animations.hover.duration} }
        },
        whileTap: { scale: 0.98 }
      };
      
      // Stagger children animation
      const staggerContainer = {
        animate: {
          transition: {
            staggerChildren: ${animations.entrance.stagger}
          }
        }
      };
      
      // Fade in up animation
      const fadeInUp = {
        initial: { opacity: 0, y: 30 },
        animate: { 
          opacity: 1, 
          y: 0,
          transition: { duration: ${animations.transition.duration} }
        }
      };
    `;
  }

  // Combine all flyer elements
  combineFlyerElements(html, css, animations, data) {
    return {
      html,
      css,
      animations,
      metadata: {
        generatedAt: new Date().toISOString(),
        propertyInfo: data.propertyInfo,
        agentInfo: data.agentInfo,
        style: data.style,
        quality: 'marketing-professional'
      }
    };
  }

  // Check if professional generation is available
  async checkAvailability() {
    return {
      available: true,
      service: 'Professional Flyer Engine',
      tier: 'Marketing Professional',
      features: [
        'Advanced design systems',
        'Professional typography',
        'Marketing psychology layouts',
        'Premium color schemes',
        'Professional animations',
        'Responsive design',
        'Print-ready output'
      ],
      quality: 'Competes with marketing agencies'
    };
  }
}

// Export for use in other files
export default ProfessionalFlyerEngine;

// Also export individual functions for flexibility
export const professionalFlyerEngine = new ProfessionalFlyerEngine();
