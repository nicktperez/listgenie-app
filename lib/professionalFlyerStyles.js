// Professional Flyer Styles Configuration
// Modern, engaging designs with gradients and professional aesthetics

const PROFESSIONAL_FLYER_STYLES = {
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
  }
};

const FLYER_COLOR_SCHEMES = {
  'luxury-gold-black': {
    primary: '#D4AF37',
    secondary: '#000000',
    accent: '#FFD700',
    background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
    text: '#ffffff',
    highlight: '#D4AF37'
  },
  'modern-blue-white': {
    primary: '#1e40af',
    secondary: '#ffffff',
    accent: '#3b82f6',
    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    text: '#1e293b',
    highlight: '#1e40af'
  },
  'classic-navy-cream': {
    primary: '#1e3a8a',
    secondary: '#fef3c7',
    accent: '#3b82f6',
    background: 'linear-gradient(135deg, #ffffff 0%, #fef3c7 100%)',
    text: '#1e3a8a',
    highlight: '#3b82f6'
  }
};

const FLYER_TYPOGRAPHY_SYSTEMS = {
  'luxury-serif': {
    primary: 'Playfair Display',
    secondary: 'Montserrat',
    accent: 'Great Vibes',
    weights: {
      primary: [400, 500, 600, 700, 900],
      secondary: [300, 400, 500, 600, 700],
      accent: [400]
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
    }
  },
  'classic-serif': {
    primary: 'Georgia',
    secondary: 'Times New Roman',
    accent: 'Baskerville',
    weights: {
      primary: [400, 500, 600, 700],
      secondary: [400, 500, 600, 700],
      accent: [400]
    }
  }
};

const FLYER_LAYOUT_SYSTEMS = {
  'golden-ratio': {
    name: 'Golden Ratio',
    description: 'Classic golden ratio layout for luxury properties',
    grid: 'golden-ratio-grid',
    spacing: 'luxury-spacing'
  },
  'grid-modern': {
    name: 'Modern Grid',
    description: 'Clean, responsive grid layout',
    grid: 'modern-grid',
    spacing: 'modern-spacing'
  },
  'traditional-grid': {
    name: 'Traditional Grid',
    description: 'Classic, structured layout',
    grid: 'traditional-grid',
    spacing: 'traditional-spacing'
  }
};

const FLYER_ANIMATION_CONFIGS = {
  'luxury': {
    entrance: 'fade-in-up',
    hover: 'scale-lift',
    transition: 'smooth-ease'
  },
  'modern': {
    entrance: 'slide-in-right',
    hover: 'glow-effect',
    transition: 'cubic-bezier'
  },
  'classic': {
    entrance: 'fade-in',
    hover: 'subtle-lift',
    transition: 'ease-in-out'
  }
};

// Export all constants
module.exports = {
  PROFESSIONAL_FLYER_STYLES,
  FLYER_COLOR_SCHEMES,
  FLYER_TYPOGRAPHY_SYSTEMS,
  FLYER_LAYOUT_SYSTEMS,
  FLYER_ANIMATION_CONFIGS
};
