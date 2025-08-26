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

      console.log('🎨 ProfessionalFlyerEngine: Generating CSS...');
      const css = this.generateProfessionalCSS(data, designSystem);
      console.log('🎨 ProfessionalFlyerEngine: CSS generated, length:', css.length);

      console.log('🎨 ProfessionalFlyerEngine: Generating HTML...');
      const html = this.generateProfessionalHTML(data);
      console.log('🎨 ProfessionalFlyerEngine: HTML generated, length:', html.length);

      console.log('🎨 ProfessionalFlyerEngine: Generating animations...');
      const animations = this.generateProfessionalAnimations();
      console.log('🎨 ProfessionalFlyerEngine: Animations generated, length:', animations.length);

      console.log('🎨 ProfessionalFlyerEngine: Combining elements...');
      const flyer = this.combineFlyerElements(html, css, animations, data);
      console.log('🎨 ProfessionalFlyerEngine: Elements combined successfully');

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
