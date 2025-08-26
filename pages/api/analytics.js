/**
 * 📊 Analytics API Endpoint
 * Provides insights from the Flyer Learning Engine and Market Intelligence
 */

import FlyerLearningEngine from '../../lib/flyerLearningEngine.js';
import MarketIntelligenceEngine from '../../lib/marketIntelligenceEngine.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📊 API /analytics: Request received');

    // Initialize engines
    const learningEngine = new FlyerLearningEngine();
    const marketIntelligence = new MarketIntelligenceEngine();

    // Get analytics data
    const learningData = learningEngine.exportLearningData();
    const marketData = marketIntelligence.exportMarketIntelligence();

    // Combine analytics data
    const analyticsData = {
      timestamp: new Date().toISOString(),
      learning: {
        status: learningEngine.getStatus(),
        recentFlyers: learningData.recentFlyers,
        patterns: learningData.patterns
      },
      market: {
        summary: marketData.summary,
        currentAnalysis: marketData.currentAnalysis
      },
      performance: {
        totalFlyers: learningData.status.analytics.totalFlyersGenerated,
        successRate: learningData.status.analytics.successfulGenerations / learningData.status.analytics.totalFlyersGenerated * 100,
        learningCycles: learningData.status.analytics.learningCycles,
        patternsLearned: Object.keys(learningData.patterns).length
      }
    };

    console.log('📊 API /analytics: Data prepared successfully');
    
    res.status(200).json({
      success: true,
      data: analyticsData
    });

  } catch (error) {
    console.error('❌ API /analytics: Error occurred:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}
