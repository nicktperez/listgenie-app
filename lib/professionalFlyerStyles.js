// Professional Flyer Styles Configuration
// Easy to customize and extend design systems

export const PROFESSIONAL_FLYER_STYLES = {
  'luxury-real-estate': {
    id: 'luxury-real-estate',
    name: 'Luxury Real Estate',
    description: 'Premium, sophisticated design for high-end properties',
    visualStyle: 'elegant, sophisticated, premium',
    colorScheme: 'luxury-gold-black',
    typography: 'luxury-serif',
    layout: 'golden-ratio',
    icon: '🏰',
    features: [
      'Premium typography',
      'Luxury color palette',
      'Sophisticated layout',
      'Professional shadows',
      'Golden ratio proportions'
    ]
  },
  'modern-contemporary': {
    id: 'modern-contemporary',
    name: 'Modern Contemporary',
    description: 'Clean, minimalist design with modern aesthetics',
    visualStyle: 'clean, minimal, contemporary',
    colorScheme: 'modern-blue-white',
    typography: 'modern-sans',
    layout: 'grid-modern',
    icon: '🏢',
    features: [
      'Clean typography',
      'Modern color scheme',
      'Grid-based layout',
      'Minimal design',
      'Contemporary aesthetics'
    ]
  },
  'classic-elegant': {
    id: 'classic-elegant',
    name: 'Classic Elegant',
    description: 'Timeless, traditional design with elegant touches',
    visualStyle: 'traditional, elegant, timeless',
    colorScheme: 'classic-navy-cream',
    typography: 'classic-serif',
    layout: 'traditional-grid',
    icon: '🏛️',
    features: [
      'Traditional typography',
      'Classic color palette',
      'Elegant layout',
      'Timeless design',
      'Professional appearance'
    ]
  },
  'premium-luxury': {
    id: 'premium-luxury',
    name: 'Premium Luxury',
    description: 'Ultra-premium design with luxury branding',
    visualStyle: 'luxury, premium, sophisticated',
    colorScheme: 'premium-gold-silver',
    typography: 'premium-combo',
    layout: 'luxury-asymmetric',
    icon: '👑',
    features: [
      'Premium typography',
      'Luxury color scheme',
      'Asymmetric layout',
      'Sophisticated design',
      'High-end branding'
    ]
  }
};

export const FLYER_STYLE_ICONS = {
  'luxury-real-estate': '🏰',
  'modern-contemporary': '🏢',
  'classic-elegant': '🏛️',
  'premium-luxury': '👑'
};

export const FLYER_STYLE_DESCRIPTIONS = {
  'luxury-real-estate': 'Perfect for luxury homes, estates, and high-end properties. Features premium typography and sophisticated color schemes.',
  'modern-contemporary': 'Ideal for modern properties, condos, and contemporary homes. Clean, minimalist design with professional aesthetics.',
  'classic-elegant': 'Great for traditional homes, historic properties, and elegant residences. Timeless design with classic appeal.',
  'premium-luxury': 'Designed for ultra-premium properties and luxury branding. Sophisticated layout with high-end visual elements.'
};

// Color schemes for each style
export const FLYER_COLOR_SCHEMES = {
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

// Typography systems for each style
export const FLYER_TYPOGRAPHY_SYSTEMS = {
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

// Layout systems for each style
export const FLYER_LAYOUT_SYSTEMS = {
  'golden-ratio': {
    ratio: 1.618,
    grid: 'golden-grid',
    spacing: 'golden-spacing',
    proportions: 'golden-proportions',
    description: 'Uses the golden ratio (1.618) for optimal visual harmony and professional proportions.'
  },
  'grid-modern': {
    columns: 12,
    gutters: 'modern-gutters',
    spacing: 'modern-spacing',
    proportions: 'modern-proportions',
    description: 'Modern 12-column grid system with clean spacing and contemporary proportions.'
  },
  'traditional-grid': {
    columns: 8,
    gutters: 'traditional-gutters',
    spacing: 'traditional-spacing',
    proportions: 'traditional-proportions',
    description: 'Traditional 8-column grid with classic spacing and elegant proportions.'
  },
  'luxury-asymmetric': {
    ratio: 1.414,
    grid: 'asymmetric-grid',
    spacing: 'luxury-spacing',
    proportions: 'luxury-proportions',
    description: 'Asymmetric layout system with luxury spacing and sophisticated proportions.'
  }
};

// Animation configurations for each style
export const FLYER_ANIMATION_CONFIGS = {
  'luxury-real-estate': {
    entrance: { duration: 1.0, ease: [0.25, 0.46, 0.45, 0.94], stagger: 0.15 },
    hover: { duration: 0.4, ease: [0.4, 0, 0.2, 1], scale: 1.03, y: -3 },
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }
  },
  'modern-contemporary': {
    entrance: { duration: 0.6, ease: [0.4, 0, 0.2, 1], stagger: 0.1 },
    hover: { duration: 0.2, ease: [0.4, 0, 0.2, 1], scale: 1.02, y: -2 },
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
  },
  'classic-elegant': {
    entrance: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94], stagger: 0.12 },
    hover: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94], scale: 1.02, y: -2 },
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }
  },
  'premium-luxury': {
    entrance: { duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94], stagger: 0.2 },
    hover: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94], scale: 1.04, y: -4 },
    transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }
  }
};

// Get all available styles
export const getAllFlyerStyles = () => Object.values(PROFESSIONAL_FLYER_STYLES);

// Get style by ID
export const getFlyerStyleById = (id) => PROFESSIONAL_FLYER_STYLES[id];

// Get color scheme by style
export const getColorSchemeByStyle = (styleId) => {
  const style = PROFESSIONAL_FLYER_STYLES[styleId];
  return style ? FLYER_COLOR_SCHEMES[style.colorScheme] : null;
};

// Get typography by style
export const getTypographyByStyle = (styleId) => {
  const style = PROFESSIONAL_FLYER_STYLES[styleId];
  return style ? FLYER_TYPOGRAPHY_SYSTEMS[style.typography] : null;
};

// Get layout by style
export const getLayoutByStyle = (styleId) => {
  const style = PROFESSIONAL_FLYER_STYLES[styleId];
  return style ? FLYER_LAYOUT_SYSTEMS[style.layout] : null;
};

// Get animation config by style
export const getAnimationConfigByStyle = (styleId) => {
  const style = PROFESSIONAL_FLYER_STYLES[styleId];
  return style ? FLYER_ANIMATION_CONFIGS[styleId] : null;
};
