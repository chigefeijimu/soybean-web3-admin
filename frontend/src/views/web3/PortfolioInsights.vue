<template>
  <div class="portfolio-insights">
    <div class="header">
      <h2>📊 AI Portfolio Insights</h2>
      <div class="address-input">
        <input 
          v-model="address" 
          placeholder="Enter wallet address (0x...)" 
          class="address-input-field"
        />
        <select v-model="selectedChain" class="chain-select">
          <option :value="1">Ethereum</option>
          <option :value="137">Polygon</option>
          <option :value="42161">Arbitrum</option>
          <option :value="10">Optimism</option>
          <option :value="56">BSC</option>
          <option :value="8453">Base</option>
          <option :value="43114">Avalanche</option>
        </select>
        <button @click="loadInsights" :disabled="loading" class="analyze-btn">
          {{ loading ? 'Analyzing...' : 'Analyze' }}
        </button>
      </div>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-if="insightsData" class="insights-content">
      <!-- Summary Cards -->
      <div class="summary-cards">
        <div class="card total-value">
          <div class="card-label">Total Portfolio Value</div>
          <div class="card-value">${{ formatNumber(insightsData.summary.totalValue) }}</div>
        </div>
        <div class="card token-count">
          <div class="card-label">Token Count</div>
          <div class="card-value">{{ insightsData.summary.tokenCount }}</div>
        </div>
        <div class="card risk-score" :class="insightsData.summary.riskLevel">
          <div class="card-label">Risk Score</div>
          <div class="card-value">{{ insightsData.summary.riskScore }}/100</div>
          <div class="risk-level">{{ insightsData.summary.riskLevel.toUpperCase() }}</div>
        </div>
      </div>

      <!-- AI Analysis -->
      <div class="ai-analysis-card">
        <h3>🤖 AI Analysis</h3>
        <p>{{ insightsData.aiAnalysis }}</p>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          :class="['tab-btn', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          {{ tab.icon }} {{ tab.label }}
        </button>
      </div>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Portfolio Composition -->
        <div v-if="activeTab === 'composition'" class="composition-tab">
          <div v-for="(insight, idx) in insightsData.insights" :key="idx" class="insight-card">
            <div class="insight-header">
              <span class="insight-type">{{ insight.type }}</span>
              <span :class="['severity', insight.severity]">{{ insight.severity }}</span>
            </div>
            <h4>{{ insight.title }}</h4>
            <p>{{ insight.description }}</p>
            <div v-if="insight.breakdown" class="breakdown">
              <div v-for="(item, i) in insight.breakdown" :key="i" class="breakdown-item">
                <span class="category">{{ item.category }}</span>
                <span class="percentage">{{ item.percentage.toFixed(1) }}%</span>
                <div class="progress-bar">
                  <div class="progress" :style="{ width: item.percentage + '%' }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Risk Assessment -->
        <div v-if="activeTab === 'risk'" class="risk-tab">
          <div class="risk-factors">
            <h3>Risk Factors</h3>
            <div v-for="(factor, idx) in riskData.factors" :key="idx" class="factor-card">
              <div class="factor-header">
                <span class="factor-name">{{ factor.factor }}</span>
                <span :class="['impact', factor.impact]">{{ factor.impact }} impact</span>
              </div>
              <p>{{ factor.description }}</p>
            </div>
          </div>

          <div class="stress-test">
            <h3>Stress Test Results</h3>
            <div class="stress-scenarios">
              <div class="scenario moderate">
                <div class="scenario-label">Moderate Crash (-30%)</div>
                <div class="scenario-value">
                  ${{ formatNumber(riskData.stressTest.moderateCrash.portfolioValue) }}
                  <span class="loss">({{ riskData.stressTest.moderateCrash.percentageLoss }}% loss)</span>
                </div>
              </div>
              <div class="scenario severe">
                <div class="scenario-label">Severe Crash (-50%)</div>
                <div class="scenario-value">
                  ${{ formatNumber(riskData.stressTest.severeCrash.portfolioValue) }}
                  <span class="loss">({{ riskData.stressTest.severeCrash.percentageLoss }}% loss)</span>
                </div>
              </div>
            </div>
            <p class="stress-recommendation">{{ riskData.stressTest.recommendation }}</p>
          </div>
        </div>

        <!-- Optimization -->
        <div v-if="activeTab === 'optimization'" class="optimization-tab">
          <div class="optimization-score">
            <h3>Optimization Score</h3>
            <div class="score-circle" :class="getOptimizationClass(optimizationData.optimizationScore)">
              {{ optimizationData.optimizationScore }}
            </div>
          </div>

          <div class="recommendations">
            <h3>Recommendations</h3>
            <div v-for="(rec, idx) in optimizationData.recommendations" :key="idx" class="rec-card">
              <div class="rec-header">
                <span class="rec-type">{{ rec.type }}</span>
                <span :class="['priority', rec.priority]">{{ rec.priority }}</span>
              </div>
              <h4>{{ rec.title }}</h4>
              <p>{{ rec.description }}</p>
              <div class="rec-action">
                <strong>Action:</strong> {{ rec.action }}
              </div>
              <div v-if="rec.potentialImpact" class="rec-impact">
                <strong>Potential Impact:</strong> {{ rec.potentialImpact }}
              </div>
            </div>
          </div>

          <div v-if="optimizationData.quickWins?.length" class="quick-wins">
            <h3>⚡ Quick Wins</h3>
            <div v-for="(win, idx) in optimizationData.quickWins" :key="idx" class="win-card">
              <span class="win-action">{{ win.action }}</span>
              <span class="win-savings">{{ win.savings }}</span>
            </div>
          </div>
        </div>

        <!-- Sentiment -->
        <div v-if="activeTab === 'sentiment'" class="sentiment-tab">
          <div class="overall-sentiment" :class="sentimentData.overallSentiment.sentiment">
            <h3>Overall Market Sentiment</h3>
            <div class="sentiment-score">{{ sentimentData.overallSentiment.sentiment.replace('_', ' ').toUpperCase() }}</div>
            <div class="sentiment-details">
              Score: {{ sentimentData.overallSentiment.score }}/100
              <br>
              24h Change: {{ sentimentData.overallSentiment.averageChange24h.toFixed(2) }}%
            </div>
          </div>

          <div class="sector-exposure">
            <h3>Sector Exposure</h3>
            <div v-for="(sector, idx) in sentimentData.sectorExposure" :key="idx" class="sector-card">
              <span class="sector-name">{{ sector.sector }}</span>
              <span class="sector-pct">{{ sector.percentage.toFixed(1) }}%</span>
              <div class="sector-bar">
                <div class="sector-fill" :style="{ width: sector.percentage + '%' }"></div>
              </div>
            </div>
          </div>

          <div class="token-sentiments">
            <h3>Token Sentiments</h3>
            <div v-for="(token, idx) in sentimentData.sentimentByToken" :key="idx" class="token-sentiment-card">
              <div class="token-symbol">{{ token.symbol }}</div>
              <div class="token-sentiment" :class="token.sentiment">
                {{ token.sentiment.replace('_', ' ') }}
              </div>
              <p class="token-rationale">{{ token.rationale }}</p>
            </div>
          </div>
        </div>

        <!-- Benchmark -->
        <div v-if="activeTab === 'benchmark'" class="benchmark-tab">
          <div class="percentile-card">
            <h3>Portfolio Percentile</h3>
            <div class="percentile-value">{{ benchmarkData.percentile }}th</div>
            <p>percentile compared to market benchmarks</p>
          </div>

          <div class="comparison-table">
            <h3>Allocation Comparison</h3>
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Portfolio</th>
                  <th>Benchmark</th>
                  <th>Difference</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(comp, key) in benchmarkData.comparison" :key="key">
                  <td>{{ key }}</td>
                  <td>{{ comp.portfolio }}%</td>
                  <td>{{ comp.benchmark }}%</td>
                  <td :class="parseFloat(comp.difference) > 0 ? 'positive' : 'negative'">
                    {{ comp.difference > 0 ? '+' : '' }}{{ comp.difference }}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="benchmark-recommendation">
            <h3>Recommendation</h3>
            <p>{{ benchmarkData.recommendation }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { portfolioInsightsApi } from '@/service/portfolioInsights';

const address = ref('0x742d35Cc6634C0532925a3b844Bc9e7595f0eB1E');
const selectedChain = ref(1);
const loading = ref(false);
const error = ref('');
const activeTab = ref('composition');

const insightsData = ref<any>(null);
const riskData = ref<any>(null);
const optimizationData = ref<any>(null);
const sentimentData = ref<any>(null);
const benchmarkData = ref<any>(null);

const tabs = [
  { id: 'composition', label: 'Composition', icon: '📊' },
  { id: 'risk', label: 'Risk Assessment', icon: '⚠️' },
  { id: 'optimization', label: 'Optimization', icon: '🎯' },
  { id: 'sentiment', label: 'Sentiment', icon: '💭' },
  { id: 'benchmark', label: 'Benchmark', icon: '📈' },
];

const formatNumber = (num: number) => {
  return num?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0';
};

const getOptimizationClass = (score: number) => {
  if (score >= 70) return 'good';
  if (score >= 50) return 'medium';
  return 'poor';
};

const loadInsights = async () => {
  if (!address.value) {
    error.value = 'Please enter a wallet address';
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    // Load all data in parallel
    const [insights, risk, optimization, sentiment, benchmark] = await Promise.all([
      portfolioInsightsApi.getInsights(address.value, selectedChain.value),
      portfolioInsightsApi.getRiskAssessment(address.value, selectedChain.value),
      portfolioInsightsApi.getOptimization(address.value, selectedChain.value),
      portfolioInsightsApi.getSentiment(address.value, selectedChain.value),
      portfolioInsightsApi.getBenchmark(address.value, selectedChain.value),
    ]);

    insightsData.value = insights.data;
    riskData.value = risk.data;
    optimizationData.value = optimization.data;
    sentimentData.value = sentiment.data;
    benchmarkData.value = benchmark.data;
  } catch (e: any) {
    error.value = e.message || 'Failed to load portfolio insights';
  } finally {
    loading.value = false;
  }
};

// Auto-load on mount
loadInsights();
</script>

<style scoped>
.portfolio-insights {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.header h2 {
  margin: 0;
  font-size: 24px;
  color: #fff;
}

.address-input {
  display: flex;
  gap: 8px;
}

.address-input-field {
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #333;
  background: #1a1a2e;
  color: #fff;
  width: 300px;
}

.chain-select {
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #333;
  background: #1a1a2e;
  color: #fff;
}

.analyze-btn {
  padding: 8px 20px;
  border-radius: 6px;
  border: none;
  background: #4f46e5;
  color: #fff;
  cursor: pointer;
  font-weight: 600;
}

.analyze-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  background: #fee2e2;
  color: #dc2626;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.card {
  background: #1a1a2e;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
}

.card-label {
  color: #888;
  font-size: 14px;
  margin-bottom: 8px;
}

.card-value {
  font-size: 28px;
  font-weight: bold;
  color: #fff;
}

.risk-score {
  border: 2px solid #22c55e;
}

.risk-score.medium {
  border-color: #eab308;
}

.risk-score.high, .risk-score.critical {
  border-color: #ef4444;
}

.risk-level {
  margin-top: 8px;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  background: #22c55e;
  color: #fff;
  display: inline-block;
}

.ai-analysis-card {
  background: linear-gradient(135deg, #1a1a2e 0%, #2d1f3d 100%);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.ai-analysis-card h3 {
  margin-top: 0;
  color: #a855f7;
}

.ai-analysis-card p {
  color: #ddd;
  line-height: 1.6;
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.tab-btn {
  padding: 10px 16px;
  border-radius: 8px;
  border: none;
  background: #1a1a2e;
  color: #888;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn.active {
  background: #4f46e5;
  color: #fff;
}

.tab-content {
  background: #1a1a2e;
  border-radius: 12px;
  padding: 20px;
}

.insight-card, .factor-card, .rec-card, .token-sentiment-card {
  background: #252542;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.insight-header, .factor-header, .rec-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.insight-type, .rec-type {
  color: #4f46e5;
  font-weight: 600;
}

.severity {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}

.severity.warning {
  background: #fef3c7;
  color: #d97706;
}

.severity.info {
  background: #dbeafe;
  color: #2563eb;
}

.severity.error {
  background: #fee2e2;
  color: #dc2626;
}

.impact {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}

.impact.high {
  background: #fee2e2;
  color: #dc2626;
}

.impact.medium {
  background: #fef3c7;
  color: #d97706;
}

.impact.low {
  background: #dbeafe;
  color: #2563eb;
}

.priority {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}

.priority.high {
  background: #dc2626;
  color: #fff;
}

.priority.medium {
  background: #d97706;
  color: #fff;
}

.priority.low {
  background: #2563eb;
  color: #fff;
}

.breakdown-item {
  margin: 8px 0;
}

.category {
  display: inline-block;
  width: 120px;
  color: #888;
}

.percentage {
  display: inline-block;
  width: 60px;
  text-align: right;
  color: #fff;
}

.progress-bar, .sector-bar {
  height: 6px;
  background: #333;
  border-radius: 3px;
  overflow: hidden;
  margin-top: 4px;
}

.progress, .sector-fill {
  height: 100%;
  background: #4f46e5;
}

.stress-test {
  margin-top: 24px;
}

.stress-scenarios {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin: 16px 0;
}

.scenario {
  background: #252542;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
}

.scenario.moderate {
  border-left: 4px solid #eab308;
}

.scenario.severe {
  border-left: 4px solid #ef4444;
}

.scenario-label {
  font-size: 14px;
  color: #888;
}

.scenario-value {
  font-size: 24px;
  font-weight: bold;
  color: #fff;
  margin-top: 8px;
}

.loss {
  font-size: 14px;
  color: #ef4444;
}

.stress-recommendation {
  color: #888;
  font-style: italic;
}

.optimization-score {
  text-align: center;
  margin-bottom: 24px;
}

.score-circle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  font-size: 36px;
  font-weight: bold;
  margin-top: 16px;
}

.score-circle.good {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: #fff;
}

.score-circle.medium {
  background: linear-gradient(135deg, #eab308, #ca8a04);
  color: #fff;
}

.score-circle.poor {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: #fff;
}

.rec-action, .rec-impact {
  margin-top: 8px;
  font-size: 14px;
  color: #888;
}

.quick-wins {
  margin-top: 24px;
}

.win-card {
  display: flex;
  justify-content: space-between;
  background: #252542;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 8px;
}

.win-action {
  color: #fff;
}

.win-savings {
  color: #22c55e;
}

.overall-sentiment {
  text-align: center;
  padding: 24px;
  border-radius: 12px;
  margin-bottom: 24px;
}

.overall-sentiment.bullish, .overall-sentiment.strongly_bullish {
  background: linear-gradient(135deg, #22c55e, #16a34a);
}

.overall-sentiment.neutral {
  background: linear-gradient(135deg, #6b7280, #4b5563);
}

.overall-sentiment.bearish, .overall-sentiment.strongly_bearish {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.sentiment-score {
  font-size: 24px;
  font-weight: bold;
  color: #fff;
}

.sentiment-details {
  color: rgba(255,255,255,0.8);
  margin-top: 8px;
}

.sector-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #252542;
  border-radius: 8px;
  margin-bottom: 8px;
}

.sector-name {
  width: 100px;
  color: #fff;
}

.sector-pct {
  width: 60px;
  text-align: right;
  color: #888;
}

.sector-card .sector-bar {
  flex: 1;
}

.token-sentiment {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-block;
  margin: 4px 0;
}

.token-sentiment.strongly_bullish {
  background: #22c55e;
  color: #fff;
}

.token-sentiment.bullish {
  background: #86efac;
  color: #000;
}

.token-sentiment.neutral {
  background: #6b7280;
  color: #fff;
}

.token-sentiment.bearish {
  background: #fca5a5;
  color: #000;
}

.token-sentiment.strongly_bearish {
  background: #ef4444;
  color: #fff;
}

.token-rationale {
  font-size: 12px;
  color: #888;
  margin: 8px 0 0 0;
}

.percentile-card {
  text-align: center;
  padding: 24px;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  border-radius: 12px;
  margin-bottom: 24px;
}

.percentile-value {
  font-size: 48px;
  font-weight: bold;
  color: #fff;
}

.comparison-table {
  margin-bottom: 24px;
}

.comparison-table table {
  width: 100%;
  border-collapse: collapse;
}

.comparison-table th,
.comparison-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #333;
}

.comparison-table th {
  color: #888;
  font-weight: 600;
}

.comparison-table .positive {
  color: #22c55e;
}

.comparison-table .negative {
  color: #ef4444;
}

.benchmark-recommendation {
  background: #252542;
  padding: 16px;
  border-radius: 8px;
  color: #ddd;
}
</style>
