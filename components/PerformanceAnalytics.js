import { useState, useEffect } from 'react';

/**
 * 📊 Performance Analytics Dashboard
 * Displays insights from the Flyer Learning Engine and Market Intelligence
 */

const PerformanceAnalytics = ({ isOpen, onClose }) => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [marketInsights, setMarketInsights] = useState(null);
  const [learningStatus, setLearningStatus] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (isOpen) {
      // Simulate fetching analytics data
      fetchAnalyticsData();
    }
  }, [isOpen]);

  const fetchAnalyticsData = async () => {
    try {
      // In a real implementation, this would call your API endpoints
      // For now, we'll simulate the data
      const mockAnalytics = {
        totalFlyersGenerated: 47,
        successfulGenerations: 43,
        failedGenerations: 4,
        successRate: 91.5,
        averageGenerationTime: 2.3,
        topPerformingStyles: ['modern-contemporary', 'luxury-real-estate', 'classic-traditional'],
        learningCycles: 8,
        patternsLearned: 23,
        marketAdaptations: 15
      };

      const mockMarketInsights = {
        currentSeason: 'winter',
        marketCondition: 'balanced-market',
        seasonalTrends: {
          winter: {
            marketActivity: 'lower',
            buyerDemand: 'decreasing',
            recommendedFeatures: ['heating-systems', 'insulation', 'indoor-spaces']
          }
        },
        propertyTrends: {
          'single-family': { currentTrend: 'stable', popularFeatures: ['home-office', 'outdoor-space'] },
          'condo': { currentTrend: 'increasing', popularFeatures: ['amenities', 'low-maintenance'] }
        }
      };

      const mockLearningStatus = {
        engineStatus: 'active',
        lastLearningCycle: '2 hours ago',
        patternsConfidence: 87.3,
        recommendationsGenerated: 12,
        performanceImprovement: '+23%'
      };

      setAnalyticsData(mockAnalytics);
      setMarketInsights(mockMarketInsights);
      setLearningStatus(mockLearningStatus);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">📊 Performance Analytics Dashboard</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl font-bold"
            >
              ×
            </button>
          </div>
          <p className="text-blue-100 mt-2">
            Real-time insights from your AI-powered flyer generation system
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: '📈' },
              { id: 'learning', label: 'Learning Engine', icon: '🧠' },
              { id: 'market', label: 'Market Intelligence', icon: '🏠' },
              { id: 'patterns', label: 'Design Patterns', icon: '🎨' },
              { id: 'recommendations', label: 'Recommendations', icon: '💡' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'overview' && <OverviewTab analyticsData={analyticsData} />}
          {activeTab === 'learning' && <LearningTab learningStatus={learningStatus} />}
          {activeTab === 'market' && <MarketTab marketInsights={marketInsights} />}
          {activeTab === 'patterns' && <PatternsTab />}
          {activeTab === 'recommendations' && <RecommendationsTab />}
        </div>
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ analyticsData }) => {
  if (!analyticsData) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Flyers Generated"
          value={analyticsData.totalFlyersGenerated}
          change="+12 this week"
          icon="🎯"
          color="blue"
        />
        <MetricCard
          title="Success Rate"
          value={`${analyticsData.successRate}%`}
          change="+5.2% vs last week"
          icon="✅"
          color="green"
        />
        <MetricCard
          title="Learning Cycles"
          value={analyticsData.learningCycles}
          change="+2 this week"
          icon="🧠"
          color="purple"
        />
        <MetricCard
          title="Market Adaptations"
          value={analyticsData.marketAdaptations}
          change="+3 this week"
          icon="🏠"
          color="orange"
        />
      </div>

      {/* Performance Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trends</h3>
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-4xl mb-2">📊</div>
            <p>Performance charts would be displayed here</p>
            <p className="text-sm">Integration with Chart.js or similar library</p>
          </div>
        </div>
      </div>

      {/* Top Performing Styles */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Styles</h3>
        <div className="space-y-3">
          {analyticsData.topPerformingStyles.map((style, index) => (
            <div key={style} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <span className="text-lg mr-3">🏆</span>
                <span className="font-medium capitalize">{style.replace('-', ' ')}</span>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Rank #{index + 1}</div>
                <div className="text-lg font-semibold text-blue-600">
                  {Math.round(85 - index * 10)}% success
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Learning Tab Component
const LearningTab = ({ learningStatus }) => {
  if (!learningStatus) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Learning Engine Status */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Engine Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Engine Status:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                learningStatus.engineStatus === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {learningStatus.engineStatus}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Last Learning Cycle:</span>
              <span className="font-medium">{learningStatus.lastLearningCycle}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Patterns Confidence:</span>
              <span className="font-medium text-blue-600">{learningStatus.patternsConfidence}%</span>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Recommendations:</span>
              <span className="font-medium">{learningStatus.recommendationsGenerated}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Performance Improvement:</span>
              <span className="font-medium text-green-600">{learningStatus.performanceImprovement}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Learning Insights */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Learning Insights</h3>
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
            <div className="flex items-start">
              <span className="text-blue-600 mr-3">💡</span>
              <div>
                <h4 className="font-medium text-blue-900">Color Harmony Improvement</h4>
                <p className="text-blue-700 text-sm mt-1">
                  Learned that flyers with blue-green color combinations perform 23% better in winter months
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
            <div className="flex items-start">
              <span className="text-green-600 mr-3">🎯</span>
              <div>
                <h4 className="font-medium text-green-900">Layout Optimization</h4>
                <p className="text-green-700 text-sm mt-1">
                  Grid-based layouts with 12-column systems show 18% higher engagement
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-400">
            <div className="flex items-start">
              <span className="text-purple-600 mr-3">📱</span>
              <div>
                <h4 className="font-medium text-purple-900">Responsive Design</h4>
                <p className="text-purple-700 text-sm mt-1">
                  Mobile-optimized flyers have 31% higher download rates
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Market Tab Component
const MarketTab = ({ marketInsights }) => {
  if (!marketInsights) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Current Market Conditions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Market Conditions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-3xl mb-2">🌤️</div>
            <h4 className="font-medium text-gray-900">Season</h4>
            <p className="text-2xl font-bold text-blue-600 capitalize">{marketInsights.currentSeason}</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-3xl mb-2">📊</div>
            <h4 className="font-medium text-gray-900">Market Condition</h4>
            <p className="text-lg font-bold text-green-600 capitalize">
              {marketInsights.marketCondition.replace('-', ' ')}
            </p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-3xl mb-2">📈</div>
            <h4 className="font-medium text-gray-900">Activity Level</h4>
            <p className="text-lg font-bold text-orange-600 capitalize">
              {marketInsights.seasonalTrends[marketInsights.currentSeason]?.marketActivity}
            </p>
          </div>
        </div>
      </div>

      {/* Seasonal Recommendations */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Seasonal Recommendations</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <span className="text-2xl mr-3">🌿</span>
              <div>
                <h4 className="font-medium">Recommended Features</h4>
                <p className="text-sm text-gray-600">
                  {marketInsights.seasonalTrends[marketInsights.currentSeason]?.recommendedFeatures.join(', ')}
                </p>
              </div>
            </div>
            <span className="text-sm text-gray-500">High Priority</span>
          </div>
        </div>
      </div>

      {/* Property Type Trends */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Type Trends</h3>
        <div className="space-y-3">
          {Object.entries(marketInsights.propertyTrends).map(([type, data]) => (
            <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <span className="text-lg mr-3">🏠</span>
                <span className="font-medium capitalize">{type.replace('-', ' ')}</span>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Trend: {data.currentTrend}</div>
                <div className="text-sm font-medium text-blue-600">
                  {data.popularFeatures.slice(0, 2).join(', ')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Patterns Tab Component
const PatternsTab = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Design Pattern Analysis</h3>
        <div className="text-center text-gray-500 py-12">
          <div className="text-4xl mb-4">🎨</div>
          <p>Design pattern analysis would be displayed here</p>
          <p className="text-sm">Showing learned patterns, confidence scores, and usage statistics</p>
        </div>
      </div>
    </div>
  );
};

// Recommendations Tab Component
const RecommendationsTab = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">AI-Generated Recommendations</h3>
        <div className="text-center text-gray-500 py-12">
          <div className="text-4xl mb-4">💡</div>
          <p>AI recommendations would be displayed here</p>
          <p className="text-sm">Based on performance analysis and market intelligence</p>
        </div>
      </div>
    </div>
  );
};

// Metric Card Component
const MetricCard = ({ title, value, change, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600'
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <span className="text-2xl">{icon}</span>
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
      <div className="mt-4">
        <span className="text-sm text-green-600 font-medium">{change}</span>
      </div>
    </div>
  );
};

export default PerformanceAnalytics;
