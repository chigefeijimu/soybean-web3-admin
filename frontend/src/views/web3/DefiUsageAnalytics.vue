<template>
  <div class="defi-usage-analytics">
    <div class="header">
      <h2>📊 DeFi Protocol Usage Analytics</h2>
      <div class="actions">
        <input 
          v-model="walletAddress" 
          placeholder="Enter wallet address..." 
          class="address-input"
          @keyup.enter="loadAnalytics"
        />
        <button @click="loadAnalytics" :disabled="loading" class="btn-primary">
          {{ loading ? 'Loading...' : 'Analyze Usage' }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Analyzing your DeFi usage patterns...</p>
    </div>

    <div v-else-if="data" class="analytics-content">
      <!-- Summary Cards -->
      <div class="summary-grid">
        <div class="summary-card">
          <div class="card-icon">📈</div>
          <div class="card-content">
            <span class="card-label">Total Transactions</span>
            <span class="card-value">{{ data.summary.totalTransactions }}</span>
            <span class="card-sub">Across {{ data.summary.uniqueProtocols }} protocols</span>
          </div>
        </div>

        <div class="summary-card">
          <div class="card-icon">⛽</div>
          <div class="card-content">
            <span class="card-label">Total Gas Spent</span>
            <span class="card-value">{{ data.summary.totalGasSpent }} ETH</span>
            <span class="card-sub">All chains combined</span>
          </div>
        </div>

        <div class="summary-card">
          <div class="card-icon">📅</div>
          <div class="card-content">
            <span class="card-label">Active Days</span>
            <span class="card-value">{{ data.summary.uniqueDays }}</span>
            <span class="card-sub">{{ data.summary.avgTransactionsPerDay }} tx/day avg</span>
          </div>
        </div>

        <div class="summary-card">
          <div class="card-icon">🎯</div>
          <div class="card-content">
            <span class="card-label">Engagement Score</span>
            <span class="card-value">{{ data.summary.engagementScore }}</span>
            <span class="card-sub score-level" :class="getScoreLevel(data.summary.engagementScore)">
              {{ getScoreLabel(data.summary.engagementScore) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Insights Section -->
      <div v-if="data.insights && data.insights.length > 0" class="section insights-section">
        <h3>💡 Insights</h3>
        <div class="insights-grid">
          <div v-for="(insight, idx) in data.insights" :key="idx" class="insight-card">
            <span class="insight-icon">{{ insight.icon }}</span>
            <div class="insight-content">
              <span class="insight-title">{{ insight.title }}</span>
              <span class="insight-desc">{{ insight.description }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Protocol Usage -->
      <div v-if="data.protocolUsage && data.protocolUsage.length > 0" class="section protocol-section">
        <h3>🔗 Protocol Usage</h3>
        <div class="protocol-table">
          <table>
            <thead>
              <tr>
                <th>Protocol</th>
                <th>Transactions</th>
                <th>Gas Spent (ETH)</th>
                <th>Volume (ETH)</th>
                <th>Share</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="protocol in data.protocolUsage" :key="protocol.name">
                <td>
                  <span class="protocol-name">{{ protocol.name }}</span>
                </td>
                <td>{{ protocol.txCount }}</td>
                <td>{{ protocol.gasSpent?.toFixed(4) }}</td>
                <td>{{ protocol.volume?.toFixed(4) }}</td>
                <td>
                  <div class="progress-bar">
                    <div 
                      class="progress-fill" 
                      :style="{ width: (protocol.txCount / data.summary.totalTransactions * 100) + '%' }"
                    ></div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Chain Usage -->
      <div v-if="data.chainUsage && data.chainUsage.length > 0" class="section chain-section">
        <h3>⛓️ Chain Distribution</h3>
        <div class="chain-grid">
          <div v-for="chain in data.chainUsage" :key="chain.chainName" class="chain-card">
            <span class="chain-name">{{ chain.chainName }}</span>
            <div class="chain-stats">
              <div class="stat">
                <span class="stat-label">Transactions</span>
                <span class="stat-value">{{ chain.txCount }}</span>
              </div>
              <div class="stat">
                <span class="stat-label">Gas</span>
                <span class="stat-value">{{ chain.gasSpent?.toFixed(4) }} ETH</span>
              </div>
            </div>
            <div class="chain-bar">
              <div 
                class="chain-fill" 
                :style="{ width: (chain.txCount / data.summary.totalTransactions * 100) + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Time Distribution -->
      <div class="section time-section">
        <h3>⏰ Activity Patterns</h3>
        <div class="time-grid">
          <div class="time-chart">
            <h4>By Hour of Day</h4>
            <div class="hour-bars">
              <div 
                v-for="(count, hour) in data.timeDistribution.byHour" 
                :key="hour" 
                class="hour-bar"
                :style="{ height: getBarHeight(count, data.timeDistribution.byHour) }"
                :title="`${hour}:00 - ${count} transactions`"
              >
                <span class="hour-label">{{ hour }}</span>
              </div>
            </div>
          </div>
          <div class="activity-summary">
            <div class="activity-item">
              <span class="activity-label">Most Active Hour</span>
              <span class="activity-value">{{ data.timeDistribution.mostActiveHour }}:00</span>
            </div>
            <div class="activity-item">
              <span class="activity-label">Most Active Day</span>
              <span class="activity-value">{{ data.timeDistribution.mostActiveDay }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Recommendations -->
      <div v-if="data.recommendations && data.recommendations.length > 0" class="section recommendations-section">
        <h3>💡 Recommendations</h3>
        <div class="recommendations-list">
          <div v-for="(rec, idx) in data.recommendations" :key="idx" class="recommendation-item">
            <span class="rec-bullet">•</span>
            <span class="rec-text">{{ rec }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="!loading && !data" class="empty-state">
      <div class="empty-icon">📊</div>
      <h3>No Data Yet</h3>
      <p>Enter a wallet address to analyze DeFi protocol usage patterns</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';

const walletAddress = ref('');
const loading = ref(false);
const data = ref<any>(null);

const API_BASE = 'http://localhost:3019/defi-usage-analytics';

const loadAnalytics = async () => {
  if (!walletAddress.value) return;
  
  loading.value = true;
  try {
    const response = await axios.get(`${API_BASE}/analyze/${walletAddress.value}`);
    data.value = response.data;
  } catch (error) {
    console.error('Error loading analytics:', error);
    data.value = {
      error: 'Failed to load analytics data'
    };
  } finally {
    loading.value = false;
  }
};

const getScoreLevel = (score: number) => {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'moderate';
  return 'low';
};

const getScoreLabel = (score: number) => {
  if (score >= 80) return 'Expert';
  if (score >= 60) return 'Advanced';
  if (score >= 40) return 'Intermediate';
  return 'Beginner';
};

const getBarHeight = (count: number, data: Record<string, number>) => {
  const max = Math.max(...Object.values(data));
  return max > 0 ? `${(count / max) * 100}%` : '0%';
};

onMounted(() => {
  // Optional: Load default data if needed
});
</script>

<style scoped>
.defi-usage-analytics {
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
}

.actions {
  display: flex;
  gap: 12px;
}

.address-input {
  padding: 10px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  width: 400px;
  font-size: 14px;
}

.btn-primary {
  padding: 10px 24px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
}

.btn-primary:hover {
  background: #4338ca;
}

.btn-primary:disabled {
  background: #a5a5a5;
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

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.summary-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.card-icon {
  font-size: 32px;
}

.card-content {
  display: flex;
  flex-direction: column;
}

.card-label {
  font-size: 12px;
  color: #666;
  text-transform: uppercase;
}

.card-value {
  font-size: 28px;
  font-weight: 600;
  margin: 4px 0;
}

.card-sub {
  font-size: 12px;
  color: #888;
}

.score-level {
  font-weight: 600;
}

.score-level.excellent { color: #10b981; }
.score-level.good { color: #3b82f6; }
.score-level.moderate { color: #f59e0b; }
.score-level.low { color: #ef4444; }

.section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.section h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
}

.insights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.insight-card {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
}

.insight-icon {
  font-size: 24px;
}

.insight-content {
  display: flex;
  flex-direction: column;
}

.insight-title {
  font-weight: 600;
  font-size: 14px;
}

.insight-desc {
  font-size: 12px;
  color: #666;
}

.protocol-table table {
  width: 100%;
  border-collapse: collapse;
}

.protocol-table th,
.protocol-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.protocol-table th {
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  color: #666;
}

.protocol-name {
  font-weight: 500;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #4f46e5;
  transition: width 0.3s ease;
}

.chain-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.chain-card {
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
}

.chain-name {
  font-weight: 600;
  font-size: 14px;
  display: block;
  margin-bottom: 8px;
}

.chain-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
}

.stat {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 10px;
  color: #666;
}

.stat-value {
  font-size: 14px;
  font-weight: 500;
}

.chain-bar {
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
}

.chain-fill {
  height: 100%;
  background: #4f46e5;
}

.time-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

.hour-bars {
  display: flex;
  align-items: flex-end;
  height: 120px;
  gap: 4px;
}

.hour-bar {
  flex: 1;
  background: #4f46e5;
  border-radius: 4px 4px 0 0;
  min-height: 4px;
  position: relative;
}

.hour-bar:hover {
  background: #4338ca;
}

.hour-label {
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10px;
  color: #666;
}

.activity-summary {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.activity-item {
  display: flex;
  flex-direction: column;
}

.activity-label {
  font-size: 12px;
  color: #666;
}

.activity-value {
  font-size: 16px;
  font-weight: 600;
}

.recommendations-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.recommendation-item {
  display: flex;
  gap: 8px;
  padding: 12px;
  background: #f0fdf4;
  border-radius: 8px;
  border-left: 3px solid #10b981;
}

.rec-bullet {
  color: #10b981;
  font-weight: bold;
}

.rec-text {
  font-size: 14px;
  color: #333;
}

.empty-state {
  text-align: center;
  padding: 60px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state h3 {
  margin: 0 0 8px 0;
}

.empty-state p {
  color: #666;
}
</style>
