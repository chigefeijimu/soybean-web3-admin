<template>
  <div class="token-vesting">
    <div class="header">
      <h2>📅 Token Vesting Schedule Tracker</h2>
      <div class="address-input">
        <input 
          v-model="tokenAddress" 
          placeholder="Enter token address (0x...)" 
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
        <button @click="loadVesting" :disabled="loading" class="analyze-btn">
          {{ loading ? 'Loading...' : 'Get Vesting' }}
        </button>
      </div>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <!-- Popular Tokens Section -->
    <div class="popular-section" v-if="!vestingData">
      <h3>🔥 Popular Vesting Tokens</h3>
      <div class="popular-tokens">
        <div 
          v-for="token in popularTokens" 
          :key="token.token_address"
          class="popular-token-card"
          @click="selectPopularToken(token)"
        >
          <div class="token-symbol">{{ token.token_symbol }}</div>
          <div class="token-name">{{ token.token_name }}</div>
          <div class="vest-progress">
            <div class="progress-bar">
              <div class="progress" :style="{ width: token.unlock_progress + '%' }"></div>
            </div>
            <span class="progress-text">{{ token.unlock_progress.toFixed(1) }}% unlocked</span>
          </div>
          <div class="next-unlock" v-if="token.days_until_next_unlock !== null">
            <span v-if="token.days_until_next_unlock === 0" class="unlock-soon">Unlocked today!</span>
            <span v-else-if="token.days_until_next_unlock < 7" class="unlock-soon">{{ token.days_until_next_unlock }} days</span>
            <span v-else>{{ token.days_until_next_unlock }} days</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="vestingData" class="vesting-content">
      <!-- Summary Cards -->
      <div class="summary-cards">
        <div class="card total-vested">
          <div class="card-label">Total Vested</div>
          <div class="card-value">${{ formatNumber(parseFloat(vestingData.summary.total_vested)) }}</div>
        </div>
        <div class="card unlocked">
          <div class="card-label">Unlocked</div>
          <div class="card-value">${{ formatNumber(parseFloat(vestingData.summary.total_unlocked)) }}</div>
        </div>
        <div class="card locked">
          <div class="card-label">Locked</div>
          <div class="card-value">${{ formatNumber(parseFloat(vestingData.summary.total_locked)) }}</div>
        </div>
        <div class="card progress-card">
          <div class="card-label">Unlock Progress</div>
          <div class="card-value">{{ vestingData.summary.unlock_percentage.toFixed(1) }}%</div>
          <div class="progress-bar large">
            <div class="progress" :style="{ width: vestingData.summary.unlock_percentage + '%' }"></div>
          </div>
        </div>
      </div>

      <!-- Next Unlock Alert -->
      <div v-if="vestingData.summary.next_unlock_date" class="next-unlock-alert">
        <span class="alert-icon">⏰</span>
        <span>Next unlock: <strong>{{ formatDate(vestingData.summary.next_unlock_date) }}</strong> - <strong>${{ formatNumber(parseFloat(vestingData.summary.next_unlock_amount)) }}</strong></span>
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
        <!-- Schedule Tab -->
        <div v-if="activeTab === 'schedule'" class="schedule-tab">
          <div v-for="(schedule, idx) in vestingData.vesting_schedule" :key="idx" class="schedule-card">
            <div class="schedule-header">
              <span class="beneficiary-type" :class="schedule.beneficiary_type">
                {{ schedule.beneficiary_type }}
              </span>
              <span :class="['risk-badge', schedule.risk_level]">{{ schedule.risk_level }}</span>
            </div>
            <div class="beneficiary">
              <span class="label">Beneficiary:</span>
              <span class="address">{{ shortenAddress(schedule.beneficiary) }}</span>
            </div>
            <div class="amounts">
              <div class="amount-item">
                <span class="label">Total Allocated</span>
                <span class="value">{{ formatNumber(parseFloat(schedule.total_allocated)) }}</span>
              </div>
              <div class="amount-item">
                <span class="label">Unlocked</span>
                <span class="value success">{{ formatNumber(parseFloat(schedule.unlocked_amount)) }}</span>
              </div>
              <div class="amount-item">
                <span class="label">Locked</span>
                <span class="value warning">{{ formatNumber(parseFloat(schedule.locked_amount)) }}</span>
              </div>
            </div>
            <div class="dates">
              <span>Start: {{ formatDate(schedule.start_date) }}</span>
              <span>End: {{ formatDate(schedule.end_date) }}</span>
              <span v-if="schedule.cliff_period">Cliff: {{ schedule.cliff_period }} days</span>
            </div>
            
            <!-- Release Schedule -->
            <div class="release-timeline">
              <h4>Release Timeline</h4>
              <div class="release-events">
                <div 
                  v-for="(event, eIdx) in schedule.release_schedule" 
                  :key="eIdx"
                  :class="['release-event', { released: event.is_released }]"
                >
                  <div class="event-date">{{ formatDate(event.date) }}</div>
                  <div class="event-amount">{{ formatNumber(parseFloat(event.amount)) }}</div>
                  <div class="event-percentage">{{ event.percentage.toFixed(1) }}%</div>
                  <div class="event-status">{{ event.is_released ? '✓ Released' : '⏳ Pending' }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Timeline Tab -->
        <div v-if="activeTab === 'timeline'" class="timeline-tab">
          <div class="timeline-chart">
            <div 
              v-for="(event, idx) in timelineData" 
              :key="idx"
              :class="['timeline-event', event.event_type]"
            >
              <div class="timeline-marker"></div>
              <div class="timeline-content">
                <div class="event-header">
                  <span class="event-type">{{ formatEventType(event.event_type) }}</span>
                  <span class="event-date">{{ formatDate(event.date) }}</span>
                </div>
                <div class="event-amount">+{{ formatNumber(parseFloat(event.amount)) }}</div>
                <div class="event-beneficiary">{{ event.beneficiary }}</div>
                <div class="cumulative">Cumulative: {{ formatNumber(parseFloat(event.cumulative_unlocked)) }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Analysis Tab -->
        <div v-if="activeTab === 'analysis'" class="analysis-tab">
          <div class="analysis-card">
            <h3>📊 Vesting Analysis</h3>
            <div class="analysis-stats">
              <div class="stat-item">
                <span class="stat-label">Fully Unlocked</span>
                <span class="stat-value success">{{ vestingData.summary.fully_unlocked_count }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Partially Unlocked</span>
                <span class="stat-value warning">{{ vestingData.summary.partially_unlocked_count }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Fully Locked</span>
                <span class="stat-value danger">{{ vestingData.summary.fully_locked_count }}</span>
              </div>
            </div>
            
            <div class="distribution-chart">
              <h4>Beneficiary Distribution</h4>
              <div class="distribution-bars">
                <div 
                  v-for="schedule in vestingData.vesting_schedule" 
                  :key="schedule.beneficiary"
                  class="distribution-bar"
                >
                  <div class="bar-label">{{ schedule.beneficiary_type }}</div>
                  <div class="bar-container">
                    <div 
                      class="bar unlocked" 
                      :style="{ width: (parseFloat(schedule.unlocked_amount) / parseFloat(vestingData.summary.total_vested) * 100) + '%' }"
                    ></div>
                    <div 
                      class="bar locked" 
                      :style="{ width: (parseFloat(schedule.locked_amount) / parseFloat(vestingData.summary.total_vested) * 100) + '%' }"
                    ></div>
                  </div>
                  <div class="bar-value">{{ formatNumber(parseFloat(schedule.total_allocated)) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { tokenVestingApi } from '../service/tokenVesting';

// State
const tokenAddress = ref('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48');
const selectedChain = ref(1);
const loading = ref(false);
const error = ref('');
const vestingData = ref<any>(null);
const popularTokens = ref<any[]>([]);
const timelineData = ref<any[]>([]);
const activeTab = ref('schedule');

const tabs = [
  { id: 'schedule', label: 'Vesting Schedule', icon: '📅' },
  { id: 'timeline', label: 'Timeline', icon: '📈' },
  { id: 'analysis', label: 'Analysis', icon: '📊' },
];

// Load popular tokens on mount
onMounted(async () => {
  await loadPopularTokens();
});

// Load popular tokens
const loadPopularTokens = async () => {
  try {
    const res = await tokenVestingApi.getPopularTokens({
      limit: 6,
      sort_by: 'unlock_progress',
    });
    if (res.data.success) {
      popularTokens.value = res.data.data;
    }
  } catch (e) {
    console.error('Failed to load popular tokens:', e);
  }
};

// Select popular token
const selectPopularToken = (token: any) => {
  tokenAddress.value = token.token_address;
  selectedChain.value = token.chain_id;
  loadVesting();
};

// Load vesting data
const loadVesting = async () => {
  if (!tokenAddress.value) {
    error.value = 'Please enter a token address';
    return;
  }

  loading.value = true;
  error.value = '';
  
  try {
    const res = await tokenVestingApi.getVestingInfo(tokenAddress.value, selectedChain.value);
    if (res.data.success) {
      vestingData.value = res.data.data;
      
      // Also load timeline
      const timelineRes = await tokenVestingApi.getVestingTimeline(
        tokenAddress.value, 
        selectedChain.value
      );
      if (timelineRes.data.success) {
        timelineData.value = timelineRes.data.data.timeline;
      }
    } else {
      error.value = res.data.msg || 'Failed to load vesting data';
    }
  } catch (e: any) {
    error.value = e.message || 'Failed to load vesting data';
  } finally {
    loading.value = false;
  }
};

// Utility functions
const formatNumber = (num: number): string => {
  if (isNaN(num)) return '0';
  return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
};

const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

const shortenAddress = (address: string): string => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const formatEventType = (type: string): string => {
  const types: Record<string, string> = {
    'unlock': 'Token Unlock',
    'cliff': 'Cliff Period',
    'schedule_start': 'Schedule Start',
  };
  return types[type] || type;
};
</script>

<style scoped>
.token-vesting {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h2 {
  margin: 0;
  font-size: 24px;
}

.address-input {
  display: flex;
  gap: 10px;
}

.address-input-field {
  padding: 8px 12px;
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

.analyze-btn {
  padding: 8px 20px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.analyze-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.error-message {
  padding: 12px;
  background: #fee2e2;
  color: #dc2626;
  border-radius: 6px;
  margin-bottom: 20px;
}

/* Popular Tokens Section */
.popular-section {
  margin-bottom: 20px;
}

.popular-section h3 {
  margin-bottom: 15px;
}

.popular-tokens {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
}

.popular-token-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.2s;
}

.popular-token-card:hover {
  border-color: #4f46e5;
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.2);
}

.token-symbol {
  font-size: 18px;
  font-weight: bold;
  color: #1f2937;
}

.token-name {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 10px;
}

.vest-progress {
  margin-bottom: 8px;
}

.progress-bar {
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 4px;
}

.progress-bar.large {
  height: 10px;
}

.progress {
  height: 100%;
  background: #10b981;
  border-radius: 3px;
}

.progress-text {
  font-size: 11px;
  color: #6b7280;
}

.next-unlock {
  font-size: 11px;
  color: #6b7280;
}

.unlock-soon {
  color: #f59e0b;
  font-weight: bold;
}

/* Summary Cards */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 15px;
}

.card-label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 5px;
}

.card-value {
  font-size: 20px;
  font-weight: bold;
  color: #1f2937;
}

.card.total-vested .card-value {
  color: #4f46e5;
}

.card.unlocked .card-value {
  color: #10b981;
}

.card.locked .card-value {
  color: #f59e0b;
}

/* Next Unlock Alert */
.next-unlock-alert {
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 8px;
  padding: 12px 15px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.alert-icon {
  font-size: 20px;
}

/* Tabs */
.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.tab-btn {
  padding: 10px 20px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  font-size: 14px;
  color: #6b7280;
}

.tab-btn.active {
  color: #4f46e5;
  border-bottom-color: #4f46e5;
}

/* Schedule Cards */
.schedule-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 15px;
}

.schedule-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.beneficiary-type {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  text-transform: capitalize;
}

.beneficiary-type.team { background: #dbeafe; color: #1d4ed8; }
.beneficiary-type.investor { background: #d1fae5; color: #047857; }
.beneficiary-type.advisor { background: #fef3c7; color: #b45309; }
.beneficiary-type.foundation { background: #e0e7ff; color: #4338ca; }
.beneficiary-type.community { background: #fce7f3; color: #be185d; }

.risk-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  text-transform: uppercase;
}

.risk-badge.low { background: #d1fae5; color: #047857; }
.risk-badge.medium { background: #fef3c7; color: #b45309; }
.risk-badge.high { background: #fee2e2; color: #dc2626; }

.beneficiary {
  margin-bottom: 15px;
}

.beneficiary .label {
  color: #6b7280;
  font-size: 12px;
  margin-right: 8px;
}

.beneficiary .address {
  font-family: monospace;
  color: #1f2937;
}

.amounts {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-bottom: 15px;
}

.amount-item {
  text-align: center;
}

.amount-item .label {
  display: block;
  font-size: 11px;
  color: #6b7280;
  margin-bottom: 4px;
}

.amount-item .value {
  font-size: 16px;
  font-weight: bold;
}

.amount-item .value.success { color: #10b981; }
.amount-item .value.warning { color: #f59e0b; }

.dates {
  display: flex;
  gap: 20px;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e5e7eb;
}

/* Release Timeline */
.release-timeline h4 {
  margin-bottom: 10px;
  font-size: 14px;
}

.release-events {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;
}

.release-event {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 10px;
  text-align: center;
}

.release-event.released {
  border-color: #10b981;
  background: #ecfdf5;
}

.event-date {
  font-size: 11px;
  color: #6b7280;
  margin-bottom: 4px;
}

.event-amount {
  font-size: 14px;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 4px;
}

.event-percentage {
  font-size: 11px;
  color: #6b7280;
  margin-bottom: 4px;
}

.event-status {
  font-size: 10px;
  color: #10b981;
}

.release-event:not(.released) .event-status {
  color: #f59e0b;
}

/* Timeline Tab */
.timeline-tab {
  background: #f9fafb;
  border-radius: 8px;
  padding: 20px;
}

.timeline-chart {
  position: relative;
  padding-left: 30px;
}

.timeline-event {
  position: relative;
  padding-bottom: 20px;
  border-left: 2px solid #e5e7eb;
  padding-left: 20px;
}

.timeline-event:last-child {
  border-left: none;
}

.timeline-marker {
  position: absolute;
  left: -7px;
  top: 0;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #e5e7eb;
}

.timeline-event.unlock .timeline-marker {
  background: #10b981;
}

.timeline-event.cliff .timeline-marker {
  background: #f59e0b;
}

.timeline-event.schedule_start .timeline-marker {
  background: #4f46e5;
}

.timeline-content {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 12px;
}

.event-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.event-type {
  font-weight: 500;
  color: #1f2937;
}

.event-date {
  font-size: 12px;
  color: #6b7280;
}

.event-amount {
  font-size: 18px;
  font-weight: bold;
  color: #10b981;
  margin-bottom: 4px;
}

.event-beneficiary {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.cumulative {
  font-size: 11px;
  color: #9ca3af;
}

/* Analysis Tab */
.analysis-tab {
  background: #f9fafb;
  border-radius: 8px;
  padding: 20px;
}

.analysis-card h3 {
  margin-bottom: 15px;
}

.analysis-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.stat-item {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 15px;
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
}

.stat-value.success { color: #10b981; }
.stat-value.warning { color: #f59e0b; }
.stat-value.danger { color: #dc2626; }

.distribution-chart h4 {
  margin-bottom: 15px;
}

.distribution-bars {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.distribution-bar {
  display: flex;
  align-items: center;
  gap: 10px;
}

.bar-label {
  width: 80px;
  font-size: 12px;
  text-transform: capitalize;
}

.bar-container {
  flex: 1;
  height: 20px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
}

.bar {
  height: 100%;
}

.bar.unlocked { background: #10b981; }
.bar.locked { background: #f59e0b; }

.bar-value {
  width: 80px;
  text-align: right;
  font-size: 12px;
}
</style>
