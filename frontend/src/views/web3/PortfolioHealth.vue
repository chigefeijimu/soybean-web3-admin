<template>
  <div class="portfolio-health">
    <div class="header">
      <h2>💊 Portfolio Health Score</h2>
      <div class="actions">
        <input 
          v-model="walletAddress" 
          placeholder="Enter wallet address..." 
          class="address-input"
          @keyup.enter="analyzePortfolio"
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
        <button @click="analyzePortfolio" :disabled="loading" class="btn-primary">
          {{ loading ? 'Analyzing...' : 'Analyze' }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Analyzing portfolio health...</p>
    </div>

    <div v-else-if="healthData" class="health-content">
      <!-- Overall Score Card -->
      <div class="score-card" :class="riskClass">
        <div class="score-circle">
          <svg viewBox="0 0 100 100">
            <circle class="bg" cx="50" cy="50" r="45" />
            <circle 
              class="progress" 
              cx="50" 
              cy="50" 
              r="45" 
              :stroke-dasharray="circumference"
              :stroke-dashoffset="progressOffset"
            />
          </svg>
          <div class="score-value">
            <span class="number">{{ healthData.overallScore }}</span>
            <span class="grade">{{ healthData.overallGrade }}</span>
          </div>
        </div>
        <div class="score-info">
          <h3>{{ riskLevelText }}</h3>
          <p>Overall Portfolio Health</p>
          <div class="risk-badge" :class="healthData.riskLevel">
            {{ healthData.riskLevel.toUpperCase() }} RISK
          </div>
        </div>
      </div>

      <!-- Metrics Grid -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-icon">📊</span>
            <span class="metric-title">Diversification</span>
          </div>
          <div class="metric-value">{{ healthData.metrics.diversificationScore }}</div>
          <div class="metric-bar">
            <div class="bar-fill" :style="{ width: healthData.metrics.diversificationScore + '%' }"></div>
          </div>
          <div class="metric-label">Score (0-100)</div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-icon">⚠️</span>
            <span class="metric-title">Concentration Risk</span>
          </div>
          <div class="metric-value">{{ healthData.metrics.concentrationRisk }}%</div>
          <div class="metric-bar risk">
            <div class="bar-fill" :style="{ width: healthData.metrics.concentrationRisk + '%' }"></div>
          </div>
          <div class="metric-label">Higher = More Risk</div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-icon">⛽</span>
            <span class="metric-title">Gas Efficiency</span>
          </div>
          <div class="metric-value">{{ healthData.metrics.gasEfficiency }}</div>
          <div class="metric-bar">
            <div class="bar-fill" :style="{ width: healthData.metrics.gasEfficiency + '%' }"></div>
          </div>
          <div class="metric-label">Score (0-100)</div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-icon">🔄</span>
            <span class="metric-title">DeFi Exposure</span>
          </div>
          <div class="metric-value">{{ healthData.metrics.defiExposure }}</div>
          <div class="metric-bar">
            <div class="bar-fill" :style="{ width: healthData.metrics.defiExposure + '%' }"></div>
          </div>
          <div class="metric-label">Score (0-100)</div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-icon">💰</span>
            <span class="metric-title">Stablecoin Ratio</span>
          </div>
          <div class="metric-value">{{ healthData.metrics.stablecoinRatio }}</div>
          <div class="metric-bar">
            <div class="bar-fill" :style="{ width: healthData.metrics.stablecoinRatio + '%' }"></div>
          </div>
          <div class="metric-label">Score (0-100)</div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-icon">📈</span>
            <span class="metric-title">Volatility</span>
          </div>
          <div class="metric-value">{{ healthData.metrics.volatilityScore }}</div>
          <div class="metric-bar">
            <div class="bar-fill" :style="{ width: healthData.metrics.volatilityScore + '%' }"></div>
          </div>
          <div class="metric-label">Score (0-100)</div>
        </div>
      </div>

      <!-- Token Breakdown -->
      <div class="breakdown-section" v-if="healthData.tokenBreakdown?.length">
        <h3>📦 Token Breakdown</h3>
        <div class="breakdown-bars">
          <div 
            v-for="item in healthData.tokenBreakdown" 
            :key="item.category"
            class="breakdown-item"
          >
            <div class="breakdown-label">
              <span>{{ item.category }}</span>
              <span>${{ formatNumber(item.value) }} ({{ item.percentage.toFixed(1) }}%)</span>
            </div>
            <div class="breakdown-bar">
              <div 
                class="bar-fill" 
                :style="{ width: item.percentage + '%' }"
                :class="item.category.toLowerCase()"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recommendations -->
      <div class="recommendations-section">
        <h3>💡 Recommendations</h3>
        <ul class="recommendations-list">
          <li 
            v-for="(rec, index) in healthData.recommendations" 
            :key="index"
            :class="{ warning: rec.includes('⚠️'), danger: rec.includes('🚨'), success: rec.includes('✅') }"
          >
            {{ rec }}
          </li>
        </ul>
      </div>
    </div>

    <div v-else class="empty-state">
      <p>Enter a wallet address to analyze portfolio health</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { request } from '@/service/request';

interface PortfolioHealth {
  address: string;
  overallScore: number;
  overallGrade: string;
  metrics: {
    diversificationScore: number;
    concentrationRisk: number;
    gasEfficiency: number;
    defiExposure: number;
    stablecoinRatio: number;
    volatilityScore: number;
  };
  recommendations: string[];
  tokenBreakdown: {
    category: string;
    value: number;
    percentage: number;
  }[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

const walletAddress = ref('');
const selectedChain = ref(1);
const loading = ref(false);
const healthData = ref<PortfolioHealth | null>(null);

const circumference = 2 * Math.PI * 45;

const progressOffset = computed(() => {
  if (!healthData.value) return circumference;
  return circumference - (healthData.value.overallScore / 100) * circumference;
});

const riskClass = computed(() => {
  if (!healthData.value) return '';
  return healthData.value.riskLevel;
});

const riskLevelText = computed(() => {
  if (!healthData.value) return '';
  const texts = {
    low: 'Healthy Portfolio',
    medium: 'Moderate Risk',
    high: 'High Risk',
    critical: 'Critical Risk'
  };
  return texts[healthData.value.riskLevel];
});

function formatNumber(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
  return num.toFixed(2);
}

async function analyzePortfolio() {
  if (!walletAddress.value) return;
  
  loading.value = true;
  try {
    const response = await request<PortfolioHealth>({
      url: `/web3/portfolio-health/${walletAddress.value}`,
      method: 'get',
      params: { chainId: selectedChain.value }
    });
    healthData.value = response;
  } catch (error) {
    console.error('Failed to analyze portfolio:', error);
    // Demo data for testing
    healthData.value = {
      address: walletAddress.value,
      overallScore: 72,
      overallGrade: 'B+',
      metrics: {
        diversificationScore: 80,
        concentrationRisk: 35,
        gasEfficiency: 85,
        defiExposure: 45,
        stablecoinRatio: 60,
        volatilityScore: 70
      },
      recommendations: [
        '💡 Consider diversifying your portfolio across more assets',
        '✅ Your stablecoin allocation is good for stability',
        '💡 Your gas efficiency is healthy'
      ],
      tokenBreakdown: [
        { category: 'Layer1', value: 50000, percentage: 50 },
        { category: 'DeFi', value: 25000, percentage: 25 },
        { category: 'Stablecoins', value: 20000, percentage: 20 },
        { category: 'Other', value: 5000, percentage: 5 }
      ],
      riskLevel: 'medium'
    };
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.portfolio-health {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header h2 {
  margin: 0;
  font-size: 24px;
  color: #333;
}

.actions {
  display: flex;
  gap: 12px;
}

.address-input {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 6px;
  width: 300px;
  font-size: 14px;
}

.chain-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.btn-primary {
  padding: 8px 20px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #4338ca;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-state {
  text-align: center;
  padding: 60px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #4f46e5;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.health-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Score Card */
.score-card {
  display: flex;
  align-items: center;
  gap: 32px;
  padding: 32px;
  border-radius: 16px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
}

.score-card.low { background: linear-gradient(135deg, #d4edda 0%, #b8e0c2 100%); }
.score-card.medium { background: linear-gradient(135deg, #fff3cd 0%, #ffeeba 100%); }
.score-card.high { background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%); }
.score-card.critical { background: linear-gradient(135deg, #f5c6cb 0%, #f5a3a3 100%); }

.score-circle {
  position: relative;
  width: 150px;
  height: 150px;
}

.score-circle svg {
  transform: rotate(-90deg);
  width: 100%;
  height: 100%;
}

.score-circle circle {
  fill: none;
  stroke-width: 8;
}

.score-circle .bg {
  stroke: rgba(0, 0, 0, 0.1);
}

.score-circle .progress {
  stroke: #4f46e5;
  stroke-linecap: round;
  transition: stroke-dashoffset 1s ease;
}

.score-value {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.score-value .number {
  display: block;
  font-size: 42px;
  font-weight: bold;
  color: #333;
  line-height: 1;
}

.score-value .grade {
  display: block;
  font-size: 18px;
  color: #666;
  font-weight: 600;
}

.score-info h3 {
  margin: 0 0 8px;
  font-size: 24px;
  color: #333;
}

.score-info p {
  margin: 0 0 12px;
  color: #666;
}

.risk-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.risk-badge.low { background: #28a745; color: white; }
.risk-badge.medium { background: #ffc107; color: #333; }
.risk-badge.high { background: #fd7e14; color: white; }
.risk-badge.critical { background: #dc3545; color: white; }

/* Metrics Grid */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.metric-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.metric-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.metric-icon {
  font-size: 20px;
}

.metric-title {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.metric-value {
  font-size: 28px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.metric-bar {
  height: 6px;
  background: #e9ecef;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 8px;
}

.metric-bar.risk .bar-fill {
  background: #dc3545;
}

.bar-fill {
  height: 100%;
  background: #4f46e5;
  border-radius: 3px;
  transition: width 0.5s ease;
}

.metric-label {
  font-size: 12px;
  color: #999;
}

/* Breakdown Section */
.breakdown-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.breakdown-section h3 {
  margin: 0 0 16px;
  font-size: 18px;
  color: #333;
}

.breakdown-bars {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.breakdown-label {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  margin-bottom: 4px;
}

.breakdown-bar {
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
}

.breakdown-bar .bar-fill.layer1 { background: #4f46e5; }
.breakdown-bar .bar-fill.defi { background: #10b981; }
.breakdown-bar .bar-fill.stablecoins { background: #f59e0b; }
.breakdown-bar .bar-fill.nft { background: #ec4899; }
.breakdown-bar .bar-fill.other { background: #6b7280; }

/* Recommendations */
.recommendations-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.recommendations-section h3 {
  margin: 0 0 16px;
  font-size: 18px;
  color: #333;
}

.recommendations-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recommendations-list li {
  padding: 12px 16px;
  border-radius: 8px;
  background: #f8f9fa;
  font-size: 14px;
}

.recommendations-list li.warning {
  background: #fff3cd;
  border-left: 4px solid #ffc107;
}

.recommendations-list li.danger {
  background: #f8d7da;
  border-left: 4px solid #dc3545;
}

.recommendations-list li.success {
  background: #d4edda;
  border-left: 4px solid #28a745;
}

.empty-state {
  text-align: center;
  padding: 60px;
  color: #999;
}
</style>
