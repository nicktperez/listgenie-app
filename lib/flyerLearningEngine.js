/**
 * 🧠 Flyer Learning Engine
 * Continuously improves flyer generation through pattern recognition and performance analysis
 */

class FlyerLearningEngine {
  constructor() {
    this.performanceData = {
      flyerStats: new Map(),
      designPatterns: new Map(),
      userPreferences: new Map(),
      marketTrends: new Map(),
      conversionMetrics: new Map()
    };
    
    this.learningConfig = {
      minSamplesForLearning: 5,
      performanceThreshold: 0.7,
      patternConfidence: 0.8,
      maxPatternsPerStyle: 10
    };
    
    this.analytics = {
      totalFlyersGenerated: 0,
      successfulGenerations: 0,
      failedGenerations: 0,
      averageRating: 0,
      topPerformingStyles: [],
      learningCycles: 0
    };
    
    this.initializeLearningEngine();
  }

  /**
   * Initialize the learning engine with default patterns
   */
  initializeLearningEngine() {
    console.log('🧠 Initializing Flyer Learning Engine...');
    
    // Initialize with proven design patterns
    this.initializeProvenPatterns();
    
    // Load existing performance data if available
    this.loadPerformanceData();
    
    // Start learning cycle
    this.startLearningCycle();
  }

  /**
   * Initialize with proven real estate marketing patterns
   */
  initializeProvenPatterns() {
    const provenPatterns = {
      'luxury-real-estate': {
        colorSchemes: [
          { primary: '#1a1a1a', secondary: '#d4af37', accent: '#ffffff', confidence: 0.95 },
          { primary: '#2c1810', secondary: '#c5a572', accent: '#f5f5f5', confidence: 0.92 },
          { primary: '#1e3a8a', secondary: '#fbbf24', accent: '#ffffff', confidence: 0.89 }
        ],
        layoutStructures: [
          { type: 'golden-ratio', spacing: 'generous', confidence: 0.94 },
          { type: 'asymmetric-grid', spacing: 'balanced', confidence: 0.91 },
          { type: 'centered-hero', spacing: 'minimal', confidence: 0.88 }
        ],
        typographyChoices: [
          { heading: 'serif', body: 'sans-serif', hierarchy: 'strong', confidence: 0.93 },
          { heading: 'display', body: 'serif', hierarchy: 'elegant', confidence: 0.90 }
        ]
      },
      'modern-contemporary': {
        colorSchemes: [
          { primary: '#1e40af', secondary: '#3b82f6', accent: '#0f172a', confidence: 0.94 },
          { primary: '#059669', secondary: '#10b981', accent: '#064e3b', confidence: 0.91 },
          { primary: '#7c3aed', secondary: '#a855f7', accent: '#1e1b4b', confidence: 0.89 }
        ],
        layoutStructures: [
          { type: 'grid-modern', spacing: 'consistent', confidence: 0.93 },
          { type: 'card-based', spacing: 'moderate', confidence: 0.90 },
          { type: 'minimalist', spacing: 'tight', confidence: 0.87 }
        ],
        typographyChoices: [
          { heading: 'sans-serif', body: 'sans-serif', hierarchy: 'clean', confidence: 0.92 },
          { heading: 'geometric', body: 'geometric', hierarchy: 'modern', confidence: 0.89 }
        ]
      },
      'classic-traditional': {
        colorSchemes: [
          { primary: '#1f2937', secondary: '#6b7280', accent: '#f9fafb', confidence: 0.93 },
          { primary: '#374151', secondary: '#9ca3af', accent: '#ffffff', confidence: 0.90 },
          { primary: '#111827', secondary: '#4b5563', accent: '#f3f4f6', confidence: 0.88 }
        ],
        layoutStructures: [
          { type: 'symmetrical', spacing: 'traditional', confidence: 0.92 },
          { type: 'column-based', spacing: 'structured', confidence: 0.89 },
          { type: 'formal-grid', spacing: 'balanced', confidence: 0.86 }
        ],
        typographyChoices: [
          { heading: 'serif', body: 'serif', hierarchy: 'formal', confidence: 0.91 },
          { heading: 'classic', body: 'classic', hierarchy: 'traditional', confidence: 0.88 }
        ]
      }
    };

    this.performanceData.designPatterns = new Map(Object.entries(provenPatterns));
    console.log('✅ Proven patterns initialized:', Object.keys(provenPatterns));
  }

  /**
   * Record flyer generation attempt and results
   */
  recordFlyerGeneration(flyerData, result, metadata = {}) {
    const flyerId = this.generateFlyerId();
    const timestamp = new Date().toISOString();
    
    const flyerRecord = {
      id: flyerId,
      timestamp,
      input: flyerData,
      result,
      metadata: {
        ...metadata,
        generationTime: metadata.generationTime || 0,
        fileSize: metadata.fileSize || 0,
        userAgent: metadata.userAgent || 'unknown'
      },
      performance: {
        success: result.success,
        rating: metadata.rating || null,
        downloadCount: 0,
        conversionRate: null,
        userFeedback: null
      }
    };

    // Store flyer record
    this.performanceData.flyerStats.set(flyerId, flyerRecord);
    
    // Update analytics
    this.updateAnalytics(flyerRecord);
    
    // Trigger learning if we have enough data
    this.checkForLearningOpportunity();
    
    console.log(`📊 Recorded flyer generation: ${flyerId} (${result.success ? 'SUCCESS' : 'FAILED'})`);
    
    return flyerId;
  }

  /**
   * Analyze flyer performance and extract patterns
   */
  analyzeFlyerPerformance(flyerId) {
    const flyerRecord = this.performanceData.flyerStats.get(flyerId);
    if (!flyerRecord) return null;

    const analysis = {
      flyerId,
      timestamp: flyerRecord.timestamp,
      style: flyerRecord.input.style,
      success: flyerRecord.result.success,
      patterns: this.extractDesignPatterns(flyerRecord),
      recommendations: this.generateRecommendations(flyerRecord),
      learningInsights: this.generateLearningInsights(flyerRecord)
    };

    console.log(`🔍 Performance analysis for ${flyerId}:`, analysis);
    return analysis;
  }

  /**
   * Extract design patterns from successful flyers
   */
  extractDesignPatterns(flyerRecord) {
    if (!flyerRecord.result.success) return null;

    const patterns = {
      colorUsage: this.analyzeColorPatterns(flyerRecord),
      layoutStructure: this.analyzeLayoutPatterns(flyerRecord),
      typographyChoices: this.analyzeTypographyPatterns(flyerRecord),
      contentStructure: this.analyzeContentPatterns(flyerRecord),
      visualHierarchy: this.analyzeVisualHierarchy(flyerRecord)
    };

    return patterns;
  }

  /**
   * Analyze color patterns in successful flyers
   */
  analyzeColorPatterns(flyerRecord) {
    // Extract color information from CSS
    const css = flyerRecord.result.css || '';
    const colorPatterns = {
      primaryColors: this.extractColorsFromCSS(css, 'primary'),
      accentColors: this.extractColorsFromCSS(css, 'accent'),
      neutralColors: this.extractColorsFromCSS(css, 'neutral'),
      colorHarmony: this.assessColorHarmony(css)
    };

    return colorPatterns;
  }

  /**
   * Extract colors from CSS content
   */
  extractColorsFromCSS(css, colorType) {
    const colorRegex = /#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}|rgb\([^)]+\)|rgba\([^)]+\)/g;
    const colors = css.match(colorRegex) || [];
    
    // Filter and categorize colors based on type
    return colors.filter(color => {
      if (colorType === 'primary') {
        return this.isPrimaryColor(color);
      } else if (colorType === 'accent') {
        return this.isAccentColor(color);
      } else if (colorType === 'neutral') {
        return this.isNeutralColor(color);
      }
      return true;
    });
  }

  /**
   * Assess color harmony in CSS
   */
  assessColorHarmony(css) {
    const colors = this.extractColorsFromCSS(css, 'all');
    
    if (colors.length < 2) return { score: 0.5, harmony: 'insufficient' };
    
    // Simple color harmony assessment
    const hasContrast = this.hasGoodContrast(colors);
    const hasBalance = this.hasColorBalance(colors);
    const hasCohesion = this.hasColorCohesion(colors);
    
    const score = (hasContrast + hasBalance + hasCohesion) / 3;
    
    return {
      score,
      harmony: score > 0.7 ? 'excellent' : score > 0.5 ? 'good' : 'needs-improvement',
      factors: { contrast: hasContrast, balance: hasBalance, cohesion: hasCohesion }
    };
  }

  /**
   * Check if colors have good contrast
   */
  hasGoodContrast(colors) {
    // Simplified contrast checking
    const darkColors = colors.filter(color => this.isDarkColor(color));
    const lightColors = colors.filter(color => this.isLightColor(color));
    
    return darkColors.length > 0 && lightColors.length > 0 ? 1 : 0.3;
  }

  /**
   * Check if colors are balanced
   */
  hasColorBalance(colors) {
    // Check if we have a good mix of color types
    const primaryCount = colors.filter(c => this.isPrimaryColor(c)).length;
    const accentCount = colors.filter(c => this.isAccentColor(c)).length;
    const neutralCount = colors.filter(c => this.isNeutralColor(c)).length;
    
    const total = colors.length;
    const balance = Math.abs(primaryCount - accentCount) / total;
    
    return balance < 0.5 ? 1 : 1 - balance;
  }

  /**
   * Check if colors work well together
   */
  hasColorCohesion(colors) {
    // Simplified cohesion check
    return colors.length <= 5 ? 1 : 0.8;
  }

  /**
   * Color classification helpers
   */
  isPrimaryColor(color) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Primary colors are typically more saturated
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max === 0 ? 0 : (max - min) / max;
    
    return saturation > 0.3;
  }

  isAccentColor(color) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Accent colors are typically bright and vibrant
    const brightness = (r + g + b) / 3;
    return brightness > 128;
  }

  isNeutralColor(color) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Neutral colors have similar RGB values
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const difference = max - min;
    
    return difference < 50;
  }

  isDarkColor(color) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    const brightness = (r + g + b) / 3;
    return brightness < 128;
  }

  isLightColor(color) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    const brightness = (r + g + b) / 3;
    return brightness > 128;
  }

  /**
   * Analyze layout patterns
   */
  analyzeLayoutPatterns(flyerRecord) {
    const html = flyerRecord.result.html || '';
    
    return {
      gridSystem: this.detectGridSystem(html),
      spacing: this.analyzeSpacing(html),
      alignment: this.analyzeAlignment(html),
      responsiveness: this.analyzeResponsiveness(html)
    };
  }

  /**
   * Detect grid system used
   */
  detectGridSystem(html) {
    if (html.includes('grid-template-columns')) {
      return 'css-grid';
    } else if (html.includes('flexbox') || html.includes('display: flex')) {
      return 'flexbox';
    } else if (html.includes('float')) {
      return 'float-based';
    } else {
      return 'traditional';
    }
  }

  /**
   * Analyze spacing patterns
   */
  analyzeSpacing(html) {
    const spacingPatterns = {
      consistent: html.includes('--spacing-') || html.includes('margin:') || html.includes('padding:'),
      generous: html.includes('2rem') || html.includes('3rem') || html.includes('4rem'),
      tight: html.includes('0.5rem') || html.includes('0.25rem'),
      balanced: html.includes('1rem') || html.includes('1.5rem')
    };

    const detectedSpacing = Object.entries(spacingPatterns)
      .filter(([key, value]) => value)
      .map(([key]) => key);

    return detectedSpacing.length > 0 ? detectedSpacing[0] : 'unknown';
  }

  /**
   * Analyze alignment patterns
   */
  analyzeAlignment(html) {
    const alignmentPatterns = {
      centered: html.includes('text-align: center') || html.includes('justify-content: center'),
      left: html.includes('text-align: left') || html.includes('justify-content: flex-start'),
      right: html.includes('text-align: right') || html.includes('justify-content: flex-end'),
      justified: html.includes('text-align: justify')
    };

    const detectedAlignment = Object.entries(alignmentPatterns)
      .filter(([key, value]) => value)
      .map(([key]) => key);

    return detectedAlignment.length > 0 ? detectedAlignment[0] : 'mixed';
  }

  /**
   * Analyze responsiveness
   */
  analyzeResponsiveness(html) {
    const responsiveFeatures = {
      mediaQueries: html.includes('@media'),
      flexibleUnits: html.includes('rem') || html.includes('em') || html.includes('vw'),
      responsiveImages: html.includes('max-width: 100%') || html.includes('width: 100%'),
      mobileFirst: html.includes('min-width') && !html.includes('max-width')
    };

    const responsiveScore = Object.values(responsiveFeatures).filter(Boolean).length;
    
    return {
      score: responsiveScore / 4,
      level: responsiveScore >= 3 ? 'excellent' : responsiveScore >= 2 ? 'good' : 'basic',
      features: Object.keys(responsiveFeatures).filter(key => responsiveFeatures[key])
    };
  }

  /**
   * Analyze typography patterns
   */
  analyzeTypographyPatterns(flyerRecord) {
    const html = flyerRecord.result.html || '';
    const css = flyerRecord.result.css || '';
    
    return {
      fontFamilies: this.extractFontFamilies(css),
      fontSizes: this.extractFontSizes(css),
      fontWeights: this.extractFontWeights(css),
      hierarchy: this.analyzeTypographyHierarchy(css)
    };
  }

  /**
   * Extract font families from CSS
   */
  extractFontFamilies(css) {
    const fontFamilyRegex = /font-family:\s*([^;]+)/g;
    const matches = [...css.matchAll(fontFamilyRegex)];
    
    return matches.map(match => 
      match[1].replace(/['"]/g, '').trim()
    ).filter(Boolean);
  }

  /**
   * Extract font sizes from CSS
   */
  extractFontSizes(css) {
    const fontSizeRegex = /font-size:\s*([^;]+)/g;
    const matches = [...css.matchAll(fontSizeRegex)];
    
    return matches.map(match => match[1].trim()).filter(Boolean);
  }

  /**
   * Extract font weights from CSS
   */
  extractFontWeights(css) {
    const fontWeightRegex = /font-weight:\s*([^;]+)/g;
    const matches = [...css.matchAll(fontWeightRegex)];
    
    return matches.map(match => match[1].trim()).filter(Boolean);
  }

  /**
   * Analyze typography hierarchy
   */
  analyzeTypographyHierarchy(css) {
    const sizes = this.extractFontSizes(css);
    const weights = this.extractFontWeights(css);
    
    if (sizes.length < 2) return 'minimal';
    
    const sizeVariations = new Set(sizes).size;
    const weightVariations = new Set(weights).size;
    
    if (sizeVariations >= 4 && weightVariations >= 3) {
      return 'strong';
    } else if (sizeVariations >= 3 && weightVariations >= 2) {
      return 'moderate';
    } else {
      return 'basic';
    }
  }

  /**
   * Analyze content structure
   */
  analyzeContentPatterns(flyerRecord) {
    const html = flyerRecord.result.html || '';
    
    return {
      sections: this.countSections(html),
      images: this.countImages(html),
      textBlocks: this.countTextBlocks(html),
      callToActions: this.countCallToActions(html),
      contentBalance: this.assessContentBalance(html)
    };
  }

  /**
   * Count content sections
   */
  countSections(html) {
    const sectionTags = ['section', 'div', 'article', 'aside'];
    return sectionTags.reduce((count, tag) => {
      const regex = new RegExp(`<${tag}[^>]*>`, 'g');
      const matches = html.match(regex);
      return count + (matches ? matches.length : 0);
    }, 0);
  }

  /**
   * Count images
   */
  countImages(html) {
    const imgRegex = /<img[^>]*>/g;
    const matches = html.match(imgRegex);
    return matches ? matches.length : 0;
  }

  /**
   * Count text blocks
   */
  countTextBlocks(html) {
    const textTags = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span'];
    return textTags.reduce((count, tag) => {
      const regex = new RegExp(`<${tag}[^>]*>`, 'g');
      const matches = html.match(regex);
      return count + (matches ? matches.length : 0);
    }, 0);
  }

  /**
   * Count call to actions
   */
  countCallToActions(html) {
    const ctaPatterns = [
      /call|contact|schedule|view|tour|visit/gi,
      /button|cta|action/gi
    ];
    
    return ctaPatterns.reduce((count, pattern) => {
      const matches = html.match(pattern);
      return count + (matches ? matches.length : 0);
    }, 0);
  }

  /**
   * Assess content balance
   */
  assessContentBalance(html) {
    const images = this.countImages(html);
    const textBlocks = this.countTextBlocks(html);
    
    if (textBlocks === 0) return 'image-heavy';
    if (images === 0) return 'text-heavy';
    
    const ratio = images / textBlocks;
    
    if (ratio > 0.5) return 'image-balanced';
    if (ratio < 0.2) return 'text-balanced';
    return 'well-balanced';
  }

  /**
   * Analyze visual hierarchy
   */
  analyzeVisualHierarchy(flyerRecord) {
    const css = flyerRecord.result.css || '';
    
    return {
      contrast: this.assessVisualContrast(css),
      spacing: this.assessVisualSpacing(css),
      emphasis: this.assessVisualEmphasis(css),
      flow: this.assessVisualFlow(css)
    };
  }

  /**
   * Assess visual contrast
   */
  assessVisualContrast(css) {
    const contrastIndicators = [
      css.includes('box-shadow'),
      css.includes('text-shadow'),
      css.includes('border'),
      css.includes('background')
    ];
    
    const score = contrastIndicators.filter(Boolean).length / 4;
    
    return {
      score,
      level: score > 0.75 ? 'excellent' : score > 0.5 ? 'good' : 'needs-improvement'
    };
  }

  /**
   * Assess visual spacing
   */
  assessVisualSpacing(css) {
    const spacingIndicators = [
      css.includes('margin'),
      css.includes('padding'),
      css.includes('gap'),
      css.includes('--spacing')
    ];
    
    const score = spacingIndicators.filter(Boolean).length / 4;
    
    return {
      score,
      level: score > 0.75 ? 'excellent' : score > 0.5 ? 'good' : 'needs-improvement'
    };
  }

  /**
   * Assess visual emphasis
   */
  assessVisualEmphasis(css) {
    const emphasisIndicators = [
      css.includes('font-weight'),
      css.includes('font-size'),
      css.includes('color'),
      css.includes('background')
    ];
    
    const score = emphasisIndicators.filter(Boolean).length / 4;
    
    return {
      score,
      level: score > 0.75 ? 'excellent' : score > 0.5 ? 'good' : 'needs-improvement'
    };
  }

  /**
   * Assess visual flow
   */
  assessVisualFlow(css) {
    const flowIndicators = [
      css.includes('display: grid'),
      css.includes('display: flex'),
      css.includes('position'),
      css.includes('z-index')
    ];
    
    const score = flowIndicators.filter(Boolean).length / 4;
    
    return {
      score,
      level: score > 0.75 ? 'excellent' : score > 0.5 ? 'good' : 'needs-improvement'
    };
  }

  /**
   * Generate recommendations based on analysis
   */
  generateRecommendations(flyerRecord) {
    const analysis = this.extractDesignPatterns(flyerRecord);
    if (!analysis) return [];

    const recommendations = [];

    // Color recommendations
    if (analysis.colorUsage?.colorHarmony?.score < 0.7) {
      recommendations.push({
        category: 'color',
        priority: 'high',
        suggestion: 'Improve color harmony by ensuring better contrast and balance',
        action: 'Adjust color palette to create more visual interest'
      });
    }

    // Layout recommendations
    if (analysis.layoutStructure?.responsiveness?.score < 0.6) {
      recommendations.push({
        category: 'layout',
        priority: 'medium',
        suggestion: 'Enhance responsive design for better mobile experience',
        action: 'Add more media queries and flexible units'
      });
    }

    // Typography recommendations
    if (analysis.typographyChoices?.hierarchy === 'basic') {
      recommendations.push({
        category: 'typography',
        priority: 'medium',
        suggestion: 'Strengthen typography hierarchy for better readability',
        action: 'Increase font size and weight variations'
      });
    }

    return recommendations;
  }

  /**
   * Generate learning insights
   */
  generateLearningInsights(flyerRecord) {
    const analysis = this.extractDesignPatterns(flyerRecord);
    if (!analysis) return [];

    const insights = [];

    // Successful pattern insights
    if (analysis.colorUsage?.colorHarmony?.score > 0.8) {
      insights.push({
        type: 'success-pattern',
        pattern: 'excellent-color-harmony',
        confidence: analysis.colorUsage.colorHarmony.score,
        description: 'This flyer demonstrates excellent color harmony'
      });
    }

    if (analysis.layoutStructure?.responsiveness?.score > 0.8) {
      insights.push({
        type: 'success-pattern',
        pattern: 'excellent-responsiveness',
        confidence: analysis.layoutStructure.responsiveness.score,
        description: 'This flyer shows excellent responsive design'
      });
    }

    return insights;
  }

  /**
   * Update analytics with new flyer data
   */
  updateAnalytics(flyerRecord) {
    this.analytics.totalFlyersGenerated++;
    
    if (flyerRecord.result.success) {
      this.analytics.successfulGenerations++;
    } else {
      this.analytics.failedGenerations++;
    }

    // Update success rate
    const successRate = this.analytics.successfulGenerations / this.analytics.totalFlyersGenerated;
    
    console.log(`📈 Analytics updated - Success Rate: ${(successRate * 100).toFixed(1)}%`);
  }

  /**
   * Check if we have enough data for learning
   */
  checkForLearningOpportunity() {
    if (this.analytics.totalFlyersGenerated >= this.learningConfig.minSamplesForLearning) {
      this.triggerLearningCycle();
    }
  }

  /**
   * Trigger a learning cycle
   */
  triggerLearningCycle() {
    console.log('🧠 Triggering learning cycle...');
    
    // Analyze recent flyers
    const recentFlyers = this.getRecentFlyers(10);
    const successfulFlyers = recentFlyers.filter(f => f.result.success);
    
    if (successfulFlyers.length >= 3) {
      this.learnFromSuccessfulFlyers(successfulFlyers);
      this.updateDesignPatterns();
      this.analytics.learningCycles++;
      
      console.log(`✅ Learning cycle completed. Total cycles: ${this.analytics.learningCycles}`);
    }
  }

  /**
   * Get recent flyers for analysis
   */
  getRecentFlyers(count = 10) {
    const allFlyers = Array.from(this.performanceData.flyerStats.values());
    return allFlyers
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, count);
  }

  /**
   * Learn from successful flyers
   */
  learnFromSuccessfulFlyers(successfulFlyers) {
    console.log(`🎯 Learning from ${successfulFlyers.length} successful flyers...`);
    
    // Group by style
    const flyersByStyle = this.groupFlyersByStyle(successfulFlyers);
    
    // Analyze each style group
    Object.entries(flyersByStyle).forEach(([style, flyers]) => {
      this.analyzeStyleGroup(style, flyers);
    });
  }

  /**
   * Group flyers by style
   */
  groupFlyersByStyle(flyers) {
    const groups = {};
    
    flyers.forEach(flyer => {
      const style = flyer.input.style;
      if (!groups[style]) {
        groups[style] = [];
      }
      groups[style].push(flyer);
    });
    
    return groups;
  }

  /**
   * Analyze a group of flyers with the same style
   */
  analyzeStyleGroup(style, flyers) {
    console.log(`🔍 Analyzing style group: ${style} (${flyers.length} flyers)`);
    
    // Extract common patterns
    const commonPatterns = this.extractCommonPatterns(flyers);
    
    // Update style patterns with new insights
    this.updateStylePatterns(style, commonPatterns);
  }

  /**
   * Extract common patterns across multiple flyers
   */
  extractCommonPatterns(flyers) {
    const patterns = {
      colors: this.findCommonColors(flyers),
      layouts: this.findCommonLayouts(flyers),
      typography: this.findCommonTypography(flyers)
    };
    
    return patterns;
  }

  /**
   * Find common colors across flyers
   */
  findCommonColors(flyers) {
    const colorCounts = new Map();
    
    flyers.forEach(flyer => {
      const colors = this.extractColorsFromCSS(flyer.result.css, 'all');
      colors.forEach(color => {
        colorCounts.set(color, (colorCounts.get(color) || 0) + 1);
      });
    });
    
    // Return colors that appear in multiple flyers
    const commonColors = Array.from(colorCounts.entries())
      .filter(([color, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([color]) => color);
    
    return commonColors;
  }

  /**
   * Find common layout patterns
   */
  findCommonLayouts(flyers) {
    const layoutCounts = new Map();
    
    flyers.forEach(flyer => {
      const layout = this.detectGridSystem(flyer.result.html);
      layoutCounts.set(layout, (layoutCounts.get(layout) || 0) + 1);
    });
    
    return Array.from(layoutCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([layout]) => layout);
  }

  /**
   * Find common typography patterns
   */
  findCommonTypography(flyers) {
    const fontCounts = new Map();
    
    flyers.forEach(flyer => {
      const fonts = this.extractFontFamilies(flyer.result.css);
      fonts.forEach(font => {
        fontCounts.set(font, (fontCounts.get(font) || 0) + 1);
      });
    });
    
    return Array.from(fontCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([font]) => font);
  }

  /**
   * Update style patterns with new insights
   */
  updateStylePatterns(style, newPatterns) {
    if (!this.performanceData.designPatterns.has(style)) {
      this.performanceData.designPatterns.set(style, {});
    }
    
    const currentPatterns = this.performanceData.designPatterns.get(style);
    
    // Update with new insights
    Object.entries(newPatterns).forEach(([category, patterns]) => {
      if (!currentPatterns[category]) {
        currentPatterns[category] = [];
      }
      
      // Add new patterns with confidence scores
      patterns.forEach(pattern => {
        const existingPattern = currentPatterns[category].find(p => 
          typeof p === 'string' ? p === pattern : p.pattern === pattern
        );
        
        if (!existingPattern) {
          const patternWithConfidence = {
            pattern,
            confidence: 0.7, // Initial confidence for learned patterns
            learnedAt: new Date().toISOString(),
            usageCount: 1
          };
          
          currentPatterns[category].push(patternWithConfidence);
        } else if (existingPattern.usageCount) {
          existingPattern.usageCount++;
          existingPattern.confidence = Math.min(0.95, existingPattern.confidence + 0.05);
        }
      });
    });
    
    console.log(`✅ Updated patterns for style: ${style}`);
  }

  /**
   * Update design patterns based on learning
   */
  updateDesignPatterns() {
    console.log('🔄 Updating design patterns based on learning...');
    
    // This would integrate with the main flyer engine
    // For now, we'll just log the updated patterns
    
    this.performanceData.designPatterns.forEach((patterns, style) => {
      console.log(`📊 ${style} patterns updated:`, patterns);
    });
  }

  /**
   * Start the learning cycle
   */
  startLearningCycle() {
    console.log('🚀 Flyer Learning Engine started successfully!');
    console.log('📊 Ready to analyze and improve flyer generation...');
  }

  /**
   * Generate unique flyer ID
   */
  generateFlyerId() {
    return `flyer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Load performance data from storage
   */
  loadPerformanceData() {
    try {
      // In a real implementation, this would load from database or file
      console.log('📂 Performance data loaded (simulated)');
    } catch (error) {
      console.log('⚠️ Could not load performance data, starting fresh');
    }
  }

  /**
   * Get learning engine status
   */
  getStatus() {
    return {
      analytics: this.analytics,
      learningConfig: this.learningConfig,
      patternsCount: this.performanceData.designPatterns.size,
      flyersAnalyzed: this.performanceData.flyerStats.size
    };
  }

  /**
   * Export learning data for external analysis
   */
  exportLearningData() {
    return {
      timestamp: new Date().toISOString(),
      status: this.getStatus(),
      patterns: Object.fromEntries(this.performanceData.designPatterns),
      recentFlyers: this.getRecentFlyers(20).map(f => ({
        id: f.id,
        style: f.input.style,
        success: f.result.success,
        timestamp: f.timestamp
      }))
    };
  }
}

// Export the learning engine
module.exports = FlyerLearningEngine;
