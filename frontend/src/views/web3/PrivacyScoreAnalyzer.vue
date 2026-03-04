<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

// API Base URL
const API_BASE = '/api/web3';

// Types
interface PrivacyFactor {
  score: number;
  value: string;
  description: string;
}

interface ChainData {
  chainId: number;
  chainName: string;
  txCount: number;
  uniqueContracts: number;
  firstActivity: string;
  lastActivity: string;
  privacyScore: number;
}

interface Recommendation {
  factor: string;
  recommendation: string;
  priority: string;
}

interface PrivacyResult {
  address: string;
  overallScore: number;
  grade: string;
  riskLevel: string;
  factors: Record<string, PrivacyFactor>;
  chainData: ChainData[];
  recommendations: Recommendation[];
  stats: {
    totalTransactions: number;
    totalContracts: number;
    activeChains: number;
    averageScore: number;
  };
}

interface Chain {
  id: number;
  name: string;
  symbol: string;
  color: string;
}

interface PrivacyFactorInfo {
  factor: string;
  name: string;
  description: string;
  weight: number;
  impact: string;
}

// State
const address = ref('');
const loading = ref(false);
const error = ref('');
const result = ref<PrivacyResult | null>(null);
const chains = ref<Chain[]>([]);
const factors = ref<PrivacyFactorInfo[]>([]);
const recommendations = ref<Recommendation[]>([]);
const selectedChain = ref('all');
const activeTab = ref('overview');

// Analysis state
const analyzedAddresses = ref<Array<{ address: string; score: number; grade: string; time: string }>>([]);

// Load supported chains
async function loadChains() {
  try {
    const res = await fetch(`${API_BASE}/privacy/chains`);
    const data = await res.json();
    chains.value = data.data;
  } catch (e) {
    console.error('Failed to load chains:', e);
  }
}

// Load privacy factors
async function loadFactors() {
  try {
    const res = await fetch(`${API_BASE}/privacy/factors`);
    const data = await res.json();
    factors.value = data.data;
  } catch (e) {
    console.error('Failed to load factors:', e);
  }
}

// Load recommendations
async function loadRecommendations() {
  try {
    const res = await fetch(`${API_BASE}/privacy/recommendations`);
    const data = await res.json();
    recommendations.value = data.data;
  } catch (e) {
    console.error('Failed to load recommendations:', e);
  }
}

// Analyze privacy
async function analyzePrivacy() {
  if (!address.value) {
    error.value = 'Please enter a wallet address';
    return;
  }
  
  loading.value = true;
  error.value = '';
  
  try {
    const chainParam = selectedChain.value !== 'all' ? `&chains=${selectedChain.value}` : '';
    const res = await fetch(`${API_BASE}/privacy/analyze?address=${address.value}${chainParam}`);
    
    if (!res.ok) {
      throw new Error('Failed to analyze privacy');
    }
    
    const data = await res.json();
    result.value = data.data;
    
    // Add to history
    analyzedAddresses.value.unshift({
      address: address.value,
      score: data.data.overallScore,
      grade: data.data.grade,
      time: new Date().toISOString(),
    });
    
    // Keep only last 10
    if (analyzedAddresses.value.length > 10) {
      analyzedAddresses.value.pop();
    }
  } catch (e: any) {
    error.value = e.message || 'An error occurred';
  } finally {
    loading.value = false;
  }
}

// Quick analyze from history
function quickAnalyze(addr: string) {
  address.value = addr;
  analyzePrivacy();
}

// Get score color
function getScoreColor(score: number): string {
  if (score >= 80) return '#10B981';
  if (score >= 60) return '#F59E0B';
  if (score >= 40) return '#F97316';
  return '#EF4444';
}

// Get grade color
function getGradeColor(grade: string): Record<string, string> {
  const colors: Record<string, string> = {
    'A+': '#10B981',
    'A': '#10B981',
    'B': '#3B82F6',
    'C': '#F59E0B',
    'D': '#F97316',
    'F': '#EF4444',
  };
  return {
    color: colors[grade] || '#6B7280',
    bg: `${colors[grade] || '#6B7280'}20`,
  };
}

// Get risk badge style
function getRiskStyle(level: string): Record<string, string> {
  const styles: Record<string, Record<string, string>> = {
    low: { bg: '#10B98120', color: '#10B981', border: '#10B981' },
    medium: { bg: '#F59E0B20', color: '#F59E0B', border: '#F59E0B' },
    high: { bg: '#F9731620', color: '#F97316', border: '#F97316' },
    critical: { bg: '#EF444420', color: '#EF4444', border: '#EF4444' },
  };
  return styles[level] || styles.medium;
}

// Format number
function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
  return num.toString();
}

// Initialize
onMounted(() => {
  loadChains();
  loadFactors();
  loadRecommendations();
});
</script>

<template>
  <div class="privacy-analyzer">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          <span class="title-icon">🔒</span>
          Cross-chain Privacy Score Analyzer
        </h1>
        <p class="page-desc">
          Analyze wallet privacy across multiple chains and get recommendations to improve anonymity
        </p>
      </div>
    </div>

    <!-- Search Section -->
    <div class="search-section">
      <div class="search-box">
        <div class="input-group">
          <input
            v-model="address"
            type="text"
            placeholder="Enter wallet address (e.g., 0x...)"
            class="address-input"
            @keyup.enter="analyzePrivacy"
          />
          <select v-model="selectedChain" class="chain-select">
            <option value="all">All Chains</option>
            <option v-for="chain in chains" :key="chain.id" :value="chain.id">
              {{ chain.name }}
            </option>
          </select>
          <button 
            class="analyze-btn" 
            @click="analyzePrivacy"
            :disabled="loading"
          >
            {{ loading ? 'Analyzing...' : 'Analyze Privacy' }}
          </button>
        </div>
      </div>
      
      <!-- Error Message -->
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </div>

    <!-- Results Section -->
    <div v-if="result" class="results-section">
      <!-- Score Overview -->
      <div class="score-overview">
        <div class="main-score-card">
          <div class="score-circle" :style="{ borderColor: getScoreColor(result.overallScore) }">
            <div class="score-value">{{ result.overallScore }}</div>
            <div class="score-label">Privacy Score</div>
          </div>
          <div class="score-details">
            <div 
              class="grade-badge"
              :style="{ 
                backgroundColor: getGradeColor(result.grade).bg,
                color: getGradeColor(result.grade).color,
                borderColor: getGradeColor(result.grade).color
              }"
            >
              Grade: {{ result.grade }}
            </div>
            <div 
              class="risk-badge"
              :style="{ 
                backgroundColor: getRiskStyle(result.riskLevel).bg,
                color: getRiskStyle(result.riskLevel).color,
                borderColor: getRiskStyle(result.riskLevel).border
              }"
            >
              Risk: {{ result.riskLevel.toUpperCase() }}
            </div>
          </div>
        </div>
        
        <!-- Stats Cards -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">{{ formatNumber(result.stats.totalTransactions) }}</div>
            <div class="stat-label">Total Transactions</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ result.stats.totalContracts }}</div>
            <div class="stat-label">Unique Contracts</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ result.stats.activeChains }}</div>
            <div class="stat-label">Active Chains</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ result.stats.averageScore }}</div>
            <div class="stat-label">Average Score</div>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button 
          v-for="tab in ['overview', 'factors', 'chains', 'recommendations']" 
          :key="tab"
          :class="['tab-btn', { active: activeTab === tab }]"
          @click="activeTab = tab"
        >
          {{ tab.charAt(0).toUpperCase() + tab.slice(1) }}
        </button>
      </div>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Overview Tab -->
        <div v-if="activeTab === 'overview'" class="overview-tab">
          <div class="address-info">
            <div class="info-label">Analyzed Address</div>
            <div class="address-value">{{ result.address }}</div>
          </div>
          
          <div class="factors-summary">
            <h3>Privacy Factors</h3>
            <div class="factors-grid">
              <div 
                v-for="(factor, key) in result.factors" 
                :key="key"
                class="factor-card"
              >
                <div class="factor-header">
                  <span class="factor-name">{{ key.replace(/([A-Z])/g, ' $1').trim() }}</span>
                  <span 
                    class="factor-score"
                    :style="{ color: getScoreColor(factor.score) }"
                  >
                    {{ factor.score }}
                  </span>
                </div>
                <div class="factor-value">{{ factor.value }}</div>
                <div class="factor-desc">{{ factor.description }}</div>
                <div class="factor-bar">
                  <div 
                    class="factor-bar-fill"
                    :style="{ 
                      width: `${factor.score}%`,
                      backgroundColor: getScoreColor(factor.score)
                    }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Factors Tab -->
        <div v-if="activeTab === 'factors'" class="factors-tab">
          <h3>Privacy Scoring Factors</h3>
          <div class="factors-table">
            <table>
              <thead>
                <tr>
                  <th>Factor</th>
                  <th>Description</th>
                  <th>Weight</th>
                  <th>Impact</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="factor in factors" :key="factor.factor">
                  <td>{{ factor.name }}</td>
                  <td>{{ factor.description }}</td>
                  <td>{{ factor.weight }}%</td>
                  <td>
                    <span :class="['impact-badge', factor.impact]">
                      {{ factor.impact }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Chains Tab -->
        <div v-if="activeTab === 'chains'" class="chains-tab">
          <h3>Chain-by-Chain Analysis</h3>
          <div class="chains-grid">
            <div 
              v-for="chain in result.chainData" 
              :key="chain.chainId"
              class="chain-card"
            >
              <div class="chain-header">
                <span class="chain-name">{{ chain.chainName }}</span>
                <span 
                  class="chain-score"
                  :style="{ color: getScoreColor(chain.privacyScore) }"
                >
                  {{ chain.privacyScore }}
                </span>
              </div>
              <div class="chain-stats">
                <div class="chain-stat">
                  <span class="stat-label">Transactions</span>
                  <span class="stat-value">{{ formatNumber(chain.txCount) }}</span>
                </div>
                <div class="chain-stat">
                  <span class="stat-label">Contracts</span>
                  <span class="stat-value">{{ chain.uniqueContracts }}</span>
                </div>
              </div>
              <div class="chain-dates">
                <div>First: {{ chain.firstActivity }}</div>
                <div>Last: {{ chain.lastActivity }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recommendations Tab -->
        <div v-if="activeTab === 'recommendations'" class="recommendations-tab">
          <h3>Privacy Recommendations</h3>
          
          <div v-if="result > 0".recommendations.length class="personal-recs">
            <h4>Personalized Recommendations</h4>
            <div class="rec-list">
              <div 
                v-for="(rec, idx) in result.recommendations" 
                :key="idx"
                class="rec-card"
                :class="rec.priority"
              >
                <div class="rec-header">
                  <span class="rec-factor">{{ rec.factor }}</span>
                  <span :class="['priority-badge', rec.priority]">{{ rec.priority }}</span>
                </div>
                <p class="rec-text">{{ rec.recommendation }}</p>
              </div>
            </div>
          </div>
          
          <div class="general-recs">
            <h4>General Privacy Tips</h4>
            <div class="tips-grid">
              <div 
                v-for="rec in recommendations" 
                :key="rec.id"
                class="tip-card"
              >
                <h5>{{ rec.title }}</h5>
                <p>{{ rec.description }}</p>
                <div class="tip-meta">
                  <span :class="['impact-tag', rec.impact]">{{ rec.impact }} impact</span>
                  <span :class="['difficulty-tag', rec.difficulty]">{{ rec.difficulty }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- History Section -->
    <div v-if="analyzedAddresses.length > 0" class="history-section">
      <h3>Recent Analyses</h3>
      <div class="history-list">
        <div 
          v-for="(item, idx) in analyzedAddresses" 
          :key="idx"
          class="history-item"
          @click="quickAnalyze(item.address)"
        >
          <div class="history-address">{{ item.address.slice(0, 6) }}...{{ item.address.slice(-4) }}</div>
          <div class="history-score" :style="{ color: getScoreColor(item.score) }">
            {{ item.score }} ({{ item.grade }})
          </div>
          <div class="history-time">{{ new Date(item.time).toLocaleTimeString() }}</div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-overlay">
      <div class="spinner"></div>
      <p>Analyzing privacy score...</p>
    </div>
  </div>
</template>

<style scoped>
.privacy-analyzer {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 0 8px 0;
}

.title-icon {
  font-size: 32px;
}

.page-desc {
  color: #6b7280;
  font-size: 14px;
  margin: 0;
}

.search-section {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.search-box {
  display: flex;
  gap: 12px;
}

.input-group {
  display: flex;
  gap: 12px;
  flex: 1;
}

.address-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.address-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.chain-select {
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  min-width: 160px;
  cursor: pointer;
}

.analyze-btn {
  padding: 12px 24px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.analyze-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.analyze-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  margin-top: 12px;
  padding: 12px;
  background: #fef2f2;
  color: #dc2626;
  border-radius: 8px;
  font-size: 14px;
}

.results-section {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.score-overview {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
}

.main-score-card {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 24px;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border-radius: 12px;
  flex: 1;
}

.score-circle {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  border: 6px solid;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: white;
}

.score-value {
  font-size: 42px;
  font-weight: 800;
  color: #1f2937;
  line-height: 1;
}

.score-label {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}

.score-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.grade-badge,
.risk-badge {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  border: 2px solid;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  flex: 1;
}

.stat-card {
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 12px;
}

.tab-btn {
  padding: 8px 16px;
  border: none;
  background: none;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
}

.tab-btn.active {
  background: #3b82f6;
  color: white;
}

.tab-btn:hover:not(.active) {
  background: #f3f4f6;
}

.tab-content {
  min-height: 300px;
}

.overview-tab,
.factors-tab,
.chains-tab,
.recommendations-tab {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.address-info {
  margin-bottom: 24px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
}

.info-label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.address-value {
  font-family: monospace;
  font-size: 14px;
  color: #1f2937;
  word-break: break-all;
}

.factors-summary h3,
.factors-tab h3,
.chains-tab h3,
.recommendations-tab h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 16px 0;
}

.factors-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.factor-card {
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.factor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.factor-name {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  text-transform: capitalize;
}

.factor-score {
  font-size: 20px;
  font-weight: 700;
}

.factor-value {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 4px;
}

.factor-desc {
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 8px;
}

.factor-bar {
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
}

.factor-bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.5s ease;
}

.factors-table table {
  width: 100%;
  border-collapse: collapse;
}

.factors-table th,
.factors-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.factors-table th {
  background: #f8fafc;
  font-weight: 600;
  font-size: 12px;
  color: #6b7280;
  text-transform: uppercase;
}

.impact-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.impact-badge.positive {
  background: #d1fae5;
  color: #059669;
}

.impact-badge.negative {
  background: #fee2e2;
  color: #dc2626;
}

.chains-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.chain-card {
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.chain-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.chain-name {
  font-weight: 600;
  color: #1f2937;
}

.chain-score {
  font-size: 20px;
  font-weight: 700;
}

.chain-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
}

.chain-stat {
  display: flex;
  flex-direction: column;
}

.chain-stat .stat-label {
  font-size: 11px;
  color: #9ca3af;
}

.chain-stat .stat-value {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.chain-dates {
  font-size: 11px;
  color: #9ca3af;
}

.personal-recs {
  margin-bottom: 24px;
}

.personal-recs h4,
.general-recs h4 {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 12px 0;
}

.rec-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rec-card {
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  border-left: 4px solid;
}

.rec-card.high {
  border-color: #dc2626;
}

.rec-card.medium {
  border-color: #f59e0b;
}

.rec-card.low {
  border-color: #10b981;
}

.rec-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.rec-factor {
  font-weight: 600;
  color: #1f2937;
  text-transform: capitalize;
}

.priority-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.priority-badge.high {
  background: #fee2e2;
  color: #dc2626;
}

.priority-badge.medium {
  background: #fef3c7;
  color: #d97706;
}

.priority-badge.low {
  background: #d1fae5;
  color: #059669;
}

.rec-text {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.tips-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.tip-card {
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.tip-card h5 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.tip-card p {
  margin: 0 0 12px 0;
  font-size: 13px;
  color: #6b7280;
}

.tip-meta {
  display: flex;
  gap: 8px;
}

.impact-tag,
.difficulty-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.impact-tag.high {
  background: #fee2e2;
  color: #dc2626;
}

.impact-tag.medium {
  background: #fef3c7;
  color: #d97706;
}

.impact-tag.low {
  background: #d1fae5;
  color: #059669;
}

.difficulty-tag.easy {
  background: #dbeafe;
  color: #2563eb;
}

.difficulty-tag.medium {
  background: #e0e7ff;
  color: #4f46e5;
}

.difficulty-tag.hard {
  background: #f3e8ff;
  color: #7c3aed;
}

.history-section {
  margin-top: 24px;
  padding: 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.history-section h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 12px 0;
}

.history-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.history-item:hover {
  background: #f1f5f9;
}

.history-address {
  font-family: monospace;
  font-size: 13px;
  color: #1f2937;
}

.history-score {
  font-size: 13px;
  font-weight: 600;
}

.history-time {
  font-size: 11px;
  color: #9ca3af;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-overlay p {
  margin-top: 16px;
  color: #6b7280;
  font-size: 14px;
}
</style>
