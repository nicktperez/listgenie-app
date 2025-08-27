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
    
    // Generate modern HTML structure
    const html = `
      <div class="modern-flyer-container">
        <!-- Hero Section with Gradient Background -->
        <div class="hero-section">
          <div class="hero-overlay"></div>
          <div class="hero-content">
            <div class="status-badge">${headline}</div>
            <h1 class="property-address">${propertyInfo.address}</h1>
            <div class="property-highlights">
              <div class="highlight-item">
                <span class="highlight-value">${propertyInfo.bedrooms || 'Contact for details'}</span>
                <span class="highlight-label">BR</span>
              </div>
              <div class="highlight-item">
                <span class="highlight-value">${propertyInfo.bathrooms || 'Contact for details'}</span>
                <span class="highlight-label">BA</span>
              </div>
              <div class="highlight-item">
                <span class="highlight-value">${propertyInfo.sqft || 'Contact for details'}</span>
                <span class="highlight-label">sq ft</span>
              </div>
            </div>
            <p class="property-description">
              A stunning ${propertyType.toLowerCase()} that combines comfort, style, and functionality in a prime location.
            </p>
          </div>
        </div>
        
        <!-- Property Details Section -->
        <div class="details-section">
          <div class="details-grid">
            <div class="detail-card">
              <h3 class="card-title">
                <svg class="card-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 2C2.44772 2 2 2.44772 2 3V17C2 17.5523 2.44772 18 3 18H17C17.5523 18 18 17.5523 18 17V3C18 2.44772 17.5523 2 17 2H3Z" fill="currentColor"/>
                  <path d="M3 2C2.44772 2 2 2.44772 2 3V17C2 17.5523 2.44772 18 3 18H17C17.5523 18 18 17.5523 18 17V3C18 2.44772 17.5523 2 17 2H3Z" fill="currentColor"/>
                </svg>
                Property Details
              </h3>
              <div class="detail-list">
                <div class="detail-item">
                  <span class="detail-label">Property Type:</span>
                  <span class="detail-value">${propertyType}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Address:</span>
                  <span class="detail-value">${propertyInfo.address}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Bedrooms:</span>
                  <span class="detail-value">${propertyInfo.bedrooms || 'Contact for details'}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Bathrooms:</span>
                  <span class="detail-value">${propertyInfo.bathrooms || 'Contact for details'}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Square Feet:</span>
                  <span class="detail-value">${propertyInfo.sqft || 'Contact for details'}</span>
                </div>
              </div>
            </div>
            
            <div class="detail-card">
              <h3 class="card-title">
                <svg class="card-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L14 8L20 10L14 12L12 18L10 12L4 10L10 8L12 2Z" fill="currentColor"/>
                </svg>
                Property Photos
              </h3>
              <div class="photo-placeholder">
                <div class="photo-icon">📷</div>
                <p>Property Photo 1</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Agent Information -->
        <div class="agent-section">
          <div class="agent-card">
            <h3 class="agent-title">Contact Information</h3>
            <div class="agent-details">
              <div class="agent-item">
                <strong>${agentInfo.name || 'Professional Agent'}</strong>
              </div>
              <div class="agent-item">
                ${agentInfo.agency || 'Premier Real Estate'}
              </div>
              <div class="agent-item">
                📞 ${agentInfo.phone || 'Contact for details'}
              </div>
              <div class="agent-item">
                ✉️ ${agentInfo.email || 'agent@premiere.com'}
              </div>
            </div>
          </div>
        </div>
        
        <!-- Dynamic Features Section -->
        <div class="features-section">
          <div class="features-grid">
            ${data.dynamicFeatures ? data.dynamicFeatures.map(feature => `
              <div class="feature-card">
                <svg class="feature-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L14 8L20 10L14 12L12 18L10 12L4 10L10 8L12 2Z" fill="currentColor"/>
                </svg>
                <h3 class="feature-title">${feature.title}</h3>
                <p class="feature-description">${feature.description}</p>
              </div>
            `).join('') : `
              <div class="feature-card">
                <svg class="feature-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L14 8L20 10L14 12L12 18L10 12L4 10L10 8L12 2Z" fill="currentColor"/>
                </svg>
                <h3 class="feature-title">Premium Location</h3>
                <p class="feature-description">Situated in one of the most desirable neighborhoods with easy access to amenities, schools, and transportation.</p>
              </div>
              
              <div class="feature-card">
                <svg class="feature-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 2C2.44772 2 2 2.44772 2 3V17C2 17.5523 2 17 3 17H17C17.5523 17 18 17.5523 18 17V3C18 2.44772 17.5523 2 17 2H3Z" fill="currentColor"/>
                </svg>
                <h3 class="feature-title">Modern Design</h3>
                <p class="feature-description">Contemporary architecture with premium finishes and thoughtful design elements throughout.</p>
              </div>
              
              <div class="feature-card">
                <svg class="feature-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <h3 class="feature-title">Family Friendly</h3>
                <p class="feature-description">Perfect for families with spacious rooms, outdoor areas, and a safe neighborhood environment.</p>
              </div>
              
              <div class="feature-card">
                <svg class="feature-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L14 8L20 10L14 12L12 18L10 12L4 10L10 8L12 2Z" fill="currentColor"/>
                </svg>
                <h3 class="feature-title">Investment Value</h3>
                <p class="feature-description">Strong potential for appreciation in this rapidly developing area with excellent market fundamentals.</p>
              </div>
            `}
          </div>
        </div>
        
        <!-- Footer Section -->
        <div class="footer-section">
          <div class="footer-content">
            <h2 class="footer-title">Ready to Make This Your Home?</h2>
            <p class="footer-description">
              Don't miss this exceptional opportunity to own a piece of luxury real estate. 
              Contact us today to schedule a private viewing and experience the lifestyle this property offers.
            </p>
            <a href="#" class="footer-cta">Schedule Viewing Now</a>
          </div>
        </div>
      </div>
    `;
    
    return { html, propertyType, headline };
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
      /* Ultra Modern Professional Real Estate Flyer - ${designSystem.name} */
      
      /* Import Google Fonts */
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300,400,500,600,700,800,900&family=Montserrat:wght@400,500,600,700,800&family=Poppins:wght@400,500,600,700,800&display=swap');
      
      /* CSS Custom Properties */
      :root {
        --color-primary: ${colors.primary};
        --color-secondary: ${colors.secondary};
        --color-accent: ${colors.accent};
        --color-background: ${colors.background};
        --color-text: ${colors.text};
        --color-highlight: ${colors.highlight};
        --color-gold: #fbbf24;
        --color-gold-light: #fcd34d;
        --color-gold-dark: #f59e0b;
        
        --font-primary: 'Inter', sans-serif;
        --font-secondary: 'Montserrat', sans-serif;
        --font-accent: 'Poppins', sans-serif;
        
        --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
        --shadow-md: 0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23);
        --shadow-lg: 0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23);
        --shadow-xl: 0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22);
        --shadow-glow: 0 0 20px rgba(59, 130, 246, 0.3);
        
        --border-radius: 16px;
        --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        --transition-bounce: 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
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
        padding: 0;
        background: var(--color-background);
      }
      
      /* Hero Section with Stunning Gradients */
      .hero-section {
        position: relative;
        min-height: 60vh;
        background: linear-gradient(135deg, 
          #667eea 0%, 
          #764ba2 25%, 
          #f093fb 50%, 
          #f5576c 75%, 
          #4facfe 100%);
        background-size: 400% 400%;
        animation: gradientShift 8s ease infinite;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        color: white;
        overflow: hidden;
      }
      
      @keyframes gradientShift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      
      .hero-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%);
        z-index: 1;
      }
      
      .hero-content {
        position: relative;
        z-index: 2;
        max-width: 800px;
        padding: 2rem;
      }
      
      .status-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        background: linear-gradient(135deg, var(--color-gold) 0%, var(--color-gold-light) 100%);
        color: var(--color-accent-dark);
        padding: 0.75rem 1.5rem;
        border-radius: 50px;
        font-size: 1.1rem;
        font-weight: 700;
        margin-bottom: 1.5rem;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.3);
        text-transform: uppercase;
        letter-spacing: 2px;
        box-shadow: var(--shadow-lg);
        animation: badgePulse 2s ease-in-out infinite;
      }
      
      .status-badge.open-house {
        background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
        color: white;
      }
      
      .status-badge.for-sale {
        background: linear-gradient(135deg, var(--color-gold) 0%, var(--color-gold-light) 100%);
        color: var(--color-accent-dark);
      }
      
      @keyframes badgePulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
      
      .badge-icon {
        width: 20px;
        height: 20px;
        color: currentColor;
      }
      
      .property-address {
        font-family: var(--font-accent);
        font-size: clamp(2.5rem, 6vw, 4rem);
        font-weight: 800;
        margin-bottom: 2rem;
        text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        line-height: 1.1;
        background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      
      .property-highlights {
        display: flex;
        justify-content: center;
        gap: 2rem;
        margin-bottom: 2rem;
        flex-wrap: wrap;
      }
      
      .highlight-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        background: rgba(255, 255, 255, 0.15);
        padding: 1.5rem;
        border-radius: var(--border-radius);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        min-width: 120px;
        transition: all var(--transition);
      }
      
      .highlight-item:hover {
        transform: translateY(-8px);
        background: rgba(255, 255, 255, 0.25);
        box-shadow: var(--shadow-xl);
      }
      
      .highlight-value {
        font-size: 1.75rem;
        font-weight: 700;
        margin-bottom: 0.25rem;
      }
      
      .highlight-label {
        font-size: 0.9rem;
        opacity: 0.9;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      
      .property-description {
        font-size: 1.2rem;
        max-width: 600px;
        margin: 0 auto;
        opacity: 0.95;
        line-height: 1.6;
      }
      
      /* Details Section - Filled with Professional Gradients */
      .details-section {
        padding: 3rem 2rem;
        background: linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%);
        color: white;
        position: relative;
        overflow: hidden;
      }
      
      .details-section::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.03)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.03)"/><circle cx="50" cy="10" r="0.5" fill="rgba(255,255,255,0.02)"/><circle cx="10" cy="60" r="0.5" fill="rgba(255,255,255,0.02)"/><circle cx="90" cy="40" r="0.5" fill="rgba(255,255,255,0.02)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
        opacity: 0.6;
      }
      
      .details-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
        gap: 2rem;
        max-width: 1200px;
        margin: 0 auto;
        position: relative;
        z-index: 2;
      }
      
      .detail-card {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%);
        backdrop-filter: blur(20px);
        border-radius: 20px;
        padding: 2rem;
        box-shadow: var(--shadow-lg);
        border: 1px solid rgba(255, 255, 255, 0.2);
        transition: all var(--transition);
        position: relative;
        overflow: hidden;
      }
      
      .detail-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%);
      }
      
      .detail-card:nth-child(2)::before {
        background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%);
      }
      
      .detail-card:hover {
        transform: translateY(-8px);
        box-shadow: var(--shadow-2xl), var(--shadow-glow);
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.1) 100%);
      }
      
      .card-title {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-size: 1.5rem;
        font-weight: 600;
        color: white;
        margin-bottom: 1.5rem;
        font-family: var(--font-secondary);
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      }
      
      .card-icon {
        width: 24px;
        height: 24px;
        color: #fbbf24;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
      }
      
      .detail-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      
      .detail-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
        border-radius: 12px;
        transition: all var(--transition-fast);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .detail-item:hover {
        background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
        color: #1e293b;
        transform: translateX(8px);
        box-shadow: 0 4px 12px rgba(251, 191, 36, 0.4);
      }
      
      .detail-label {
        font-weight: 600;
        color: inherit;
      }
      
      .detail-value {
        color: inherit;
        font-weight: 500;
        text-transform: capitalize;
      }
      
      .photo-placeholder {
        text-align: center;
        padding: 2rem;
        background: linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.1) 100%);
        border-radius: 16px;
        border: 2px dashed rgba(251, 191, 36, 0.5);
        position: relative;
        overflow: hidden;
        transition: all var(--transition);
      }
      
      .photo-placeholder:hover {
        background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
        color: #1e293b;
        transform: scale(1.05);
        border-color: #fbbf24;
        box-shadow: 0 8px 25px rgba(251, 191, 36, 0.4);
      }
      
      .photo-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
        opacity: 0.8;
        color: #fbbf24;
        transition: all var(--transition);
      }
      
      .photo-placeholder:hover .photo-icon {
        color: #1e293b;
        transform: scale(1.1);
      }
      
      .photo-placeholder p {
        color: inherit;
        opacity: 0.9;
      }
      
      /* Agent Section with Enhanced Gradients */
      .agent-section {
        padding: 3rem 2rem;
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #334155 50%, #475569 75%, #64748b 100%);
        color: white;
        position: relative;
        overflow: hidden;
      }
      
      .agent-section::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="1" fill="rgba(251,191,36,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23dots)"/></svg>');
        opacity: 0.4;
      }
      
      .agent-card {
        max-width: 600px;
        margin: 0 auto;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%);
        backdrop-filter: blur(20px);
        border-radius: 20px;
        padding: 2rem;
        border: 1px solid rgba(255, 255, 255, 0.2);
        box-shadow: var(--shadow-xl);
        position: relative;
        z-index: 2;
        text-align: center;
      }
      
      .agent-title {
        font-size: 1.5rem;
        font-weight: 600;
        color: white;
        margin-bottom: 1.5rem;
        font-family: var(--font-secondary);
      }
      
      .agent-details {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      
      .agent-item {
        font-size: 1.1rem;
        color: white;
        padding: 0.75rem;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        transition: all var(--transition-fast);
      }
      
      .agent-item:hover {
        background: linear-gradient(135deg, rgba(251, 191, 36, 0.3) 0%, rgba(245, 158, 11, 0.2) 100%);
        transform: translateX(8px);
        border-color: rgba(251, 191, 36, 0.5);
      }
      
      /* Responsive Design */
      @media (max-width: 768px) {
        .hero-section {
          min-height: 300px;
        }
        
        .property-highlights {
          gap: 1rem;
        }
        
        .highlight-item {
          min-width: 100px;
          padding: 0.75rem 1rem;
        }
        
        .details-grid {
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }
        
        .hero-content {
          padding: 1.5rem;
        }
        
        .property-address {
          font-size: clamp(1.5rem, 4vw, 2.5rem);
        }
      }
      
      /* Print Styles */
      @media print {
        .modern-flyer-container {
          background: white;
          color: black;
        }
        
        .hero-section {
          background: var(--color-primary) !important;
          -webkit-print-color-adjust: exact;
          color-adjust: exact;
        }
        
        .detail-card,
        .agent-card {
          box-shadow: none;
          border: 1px solid #ccc;
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
