<template>
  <div class="wallet-social">
    <div class="header">
      <h2>👥 Wallet Social - 钱包社交跟随</h2>
      <div class="actions">
        <input 
          v-model="searchAddress" 
          placeholder="输入钱包地址..." 
          class="address-input"
          @keyup.enter="lookupAndFollow"
        />
        <button @click="lookupAndFollow" :disabled="loading" class="btn-primary">
          关注钱包
        </button>
      </div>
    </div>

    <div v-if="lookupResult" class="lookup-result">
      <div class="known-badge" v-if="lookupResult.isKnown">
        <span class="badge-icon">⭐</span>
        <span class="badge-label">{{ lookupResult.label }}</span>
        <span class="badge-category">{{ lookupResult.category }}</span>
        <span class="badge-risk" :class="getRiskClass(lookupResult.riskAssessment)">
          {{ lookupResult.riskAssessment }}
        </span>
      </div>
      <div v-else class="unknown-badge">
        <span>未识别的地址</span>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        :class="['tab', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Tab Content -->
    <div class="tab-content">
      <!-- Following Tab -->
      <div v-if="activeTab === 'following'" class="following-list">
        <div v-if="followedWallets.length === 0" class="empty-state">
          <p>还没有关注任何钱包</p>
          <p class="hint">输入钱包地址开始关注</p>
        </div>
        <div v-else class="wallet-grid">
          <div 
            v-for="wallet in followedWallets" 
            :key="wallet.address" 
            class="wallet-card"
            @click="selectWallet(wallet)"
          >
            <div class="wallet-header">
              <span class="wallet-label">{{ wallet.label }}</span>
              <span class="wallet-category">{{ wallet.category }}</span>
            </div>
            <div class="wallet-address">{{ formatAddress(wallet.address) }}</div>
            <div class="wallet-footer">
              <span class="follow-time">关注于: {{ formatTime(wallet.followedAt) }}</span>
              <button @click.stop="unfollow(wallet.address)" class="btn-unfollow">
                取消关注
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Activity Tab -->
      <div v-if="activeTab === 'activity'" class="activity-section">
        <div class="activity-header">
          <h3>📊 钱包活动</h3>
          <div class="activity-stats" v-if="walletStats">
            <div class="stat-item">
              <span class="stat-label">交易总数</span>
              <span class="stat-value">{{ walletStats.totalTransactions }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">总交易量</span>
              <span class="stat-value">${{ formatNumber(walletStats.totalVolume) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">活跃度评分</span>
              <span class="stat-value">{{ walletStats.activityScore }}/100</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">风险等级</span>
              <span class="stat-value risk" :class="walletStats.riskLevel">
                {{ walletStats.riskLevel.toUpperCase() }}
              </span>
            </div>
          </div>
        </div>

        <div v-if="walletActivities.length > 0" class="activity-list">
          <table class="data-table">
            <thead>
              <tr>
                <th>时间</th>
                <th>类型</th>
                <th>代币</th>
                <th>金额</th>
                <th>价值 (USD)</th>
                <th>链</th>
                <th>状态</th>
                <th>哈希</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="activity in walletActivities" :key="activity.hash">
                <td>{{ formatTime(activity.timestamp) }}</td>
                <td>
                  <span class="type-badge" :class="activity.type">
                    {{ getTypeLabel(activity.type) }}
                  </span>
                </td>
                <td>{{ activity.token }}</td>
                <td>{{ activity.value }}</td>
                <td>${{ formatNumber(activity.tokenValue) }}</td>
                <td>{{ activity.chain }}</td>
                <td>
                  <span class="status-badge" :class="activity.status">
                    {{ activity.status }}
                  </span>
                </td>
                <td class="hash-cell">
                  <a :href="getExplorerUrl(activity.hash, activity.chain)" target="_blank">
                    {{ formatAddress(activity.hash) }}
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="empty-state">
          <p>选择要查看的钱包</p>
        </div>
      </div>

      <!-- Feed Tab -->
      <div v-if="activeTab === 'feed'" class="feed-section">
        <div v-if="socialFeed.length > 0" class="feed-list">
          <div v-for="(item, index) in socialFeed" :key="index" class="feed-item">
            <div class="feed-header">
              <span class="feed-label">{{ item.label }}</span>
              <span class="feed-address">{{ formatAddress(item.wallet) }}</span>
              <span class="feed-followers">{{ item.followers }} 粉丝</span>
            </div>
            <div class="feed-activity">
              <span class="type-badge" :class="item.activity.type">
                {{ getTypeLabel(item.activity.type) }}
              </span>
              <span class="feed-amount">
                {{ item.activity.value }} {{ item.activity.token }}
                (~${{ formatNumber(item.activity.tokenValue) }})
              </span>
            </div>
            <div class="feed-time">{{ formatTime(item.activity.timestamp) }}</div>
          </div>
        </div>
        <div v-else class="empty-state">
          <p>暂无动态</p>
          <p class="hint">关注一些钱包来获取他们的最新动态</p>
        </div>
      </div>

      <!-- Trending Tab -->
      <div v-if="activeTab === 'trending'" class="trending-section">
        <div v-if="trendingWallets.length > 0" class="trending-list">
          <div 
            v-for="wallet in trendingWallets" 
            :key="wallet.address" 
            class="trending-item"
          >
            <div class="trending-info">
              <span class="trending-label">{{ wallet.label }}</span>
              <span class="trending-category">{{ wallet.category }}</span>
            </div>
            <div class="trending-stats">
              <span class="trending-followers">👥 {{ wallet.followerCount }}</span>
              <span class="trending-activity">📊 {{ wallet.recentActivity }}</span>
            </div>
            <button @click="followTrending(wallet)" class="btn-follow">
              关注
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { 
  getFollowedWallets, 
  followWallet, 
  unfollowWallet as apiUnfollowWallet,
  getWalletActivity,
  getWalletStats,
  getSocialFeed,
  getTrendingWallets,
  lookupAddress
} from '@/service/api/walletSocial';

const userId = ref('user_' + Math.random().toString(36).substr(2, 9));
const searchAddress = ref('');
const loading = ref(false);
const activeTab = ref('following');
const followedWallets = ref<any[]>([]);
const selectedWallet = ref('');
const walletActivities = ref<any[]>([]);
const walletStats = ref<any>(null);
const socialFeed = ref<any[]>([]);
const trendingWallets = ref<any[]>([]);
const lookupResult = ref<any>(null);

const tabs = [
  { id: 'following', label: '已关注' },
  { id: 'activity', label: '活动' },
  { id: 'feed', label: '动态' },
  { id: 'trending', label: '热门' }
];

onMounted(async () => {
  await loadFollowedWallets();
  await loadTrending();
  await loadFeed();
});

async function loadFollowedWallets() {
  try {
    followedWallets.value = await getFollowedWallets(userId.value);
  } catch (e) {
    console.error('Failed to load followed wallets:', e);
  }
}

async function loadTrending() {
  try {
    trendingWallets.value = await getTrendingWallets(10);
  } catch (e) {
    console.error('Failed to load trending:', e);
  }
}

async function loadFeed() {
  try {
    socialFeed.value = await getSocialFeed(userId.value, 20);
  } catch (e) {
    console.error('Failed to load feed:', e);
  }
}

async function lookupAndFollow() {
  if (!searchAddress.value) return;
  
  loading.value = true;
  try {
    // First lookup the address
    lookupResult.value = await lookupAddress(searchAddress.value);
    
    // Then follow
    await followWallet({
      userId: userId.value,
      walletAddress: searchAddress.value,
      label: lookupResult.value?.label,
      category: lookupResult.value?.category
    });
    
    await loadFollowedWallets();
    searchAddress.value = '';
  } catch (e) {
    console.error('Failed to follow wallet:', e);
  } finally {
    loading.value = false;
  }
}

async function unfollow(address: string) {
  try {
    await apiUnfollowWallet(userId.value, address);
    await loadFollowedWallets();
    if (selectedWallet.value === address) {
      selectedWallet.value = '';
      walletActivities.value = [];
      walletStats.value = null;
    }
  } catch (e) {
    console.error('Failed to unfollow:', e);
  }
}

async function followTrending(wallet: any) {
  try {
    await followWallet({
      userId: userId.value,
      walletAddress: wallet.address,
      label: wallet.label,
      category: wallet.category
    });
    await loadFollowedWallets();
  } catch (e) {
    console.error('Failed to follow:', e);
  }
}

async function selectWallet(wallet: any) {
  selectedWallet.value = wallet.address;
  activeTab.value = 'activity';
  
  loading.value = true;
  try {
    const [activities, stats] = await Promise.all([
      getWalletActivity(wallet.address, 1, 20),
      getWalletStats(wallet.address, 1)
    ]);
    walletActivities.value = activities;
    walletStats.value = stats;
  } catch (e) {
    console.error('Failed to load wallet data:', e);
  } finally {
    loading.value = false;
  }
}

function formatAddress(addr: string): string {
  if (!addr) return '';
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN');
}

function formatNumber(num: string | number): string {
  const n = typeof num === 'string' ? parseFloat(num) : num;
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    swap: 'Swap',
    transfer: '转账',
    nft: 'NFT',
    defi: 'DeFi',
    stake: '质押',
    unknown: '未知'
  };
  return labels[type] || type;
}

function getRiskClass(risk?: string): string {
  if (!risk) return '';
  if (risk.toLowerCase().includes('low')) return 'risk-low';
  if (risk.toLowerCase().includes('medium')) return 'risk-medium';
  if (risk.toLowerCase().includes('high')) return 'risk-high';
  return '';
}

function getExplorerUrl(hash: string, chain: string): string {
  const explorers: Record<string, string> = {
    'Ethereum': 'https://etherscan.io/tx/',
    'BNB Chain': 'https://bscscan.com/tx/',
    'Polygon': 'https://polygonscan.com/tx/',
    'Arbitrum': 'https://arbiscan.io/tx/',
    'Optimism': 'https://optimistic.etherscan.io/tx/',
    'Base': 'https://basescan.org/tx/',
    'Avalanche': 'https://snowtrace.io/tx/'
  };
  return (explorers[chain] || explorers['Ethereum']) + hash;
}
</script>

<style scoped>
.wallet-social {
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

.actions {
  display: flex;
  gap: 10px;
}

.address-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 300px;
  font-size: 14px;
}

.btn-primary {
  padding: 8px 16px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.lookup-result {
  margin-bottom: 20px;
}

.known-badge, .unknown-badge {
  padding: 12px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.known-badge {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 1px solid #f59e0b;
}

.unknown-badge {
  background: #f3f4f6;
  color: #6b7280;
}

.badge-icon {
  font-size: 20px;
}

.badge-category {
  background: #dbeafe;
  color: #1d4ed8;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.badge-risk {
  margin-left: auto;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.risk-low {
  background: #d1fae5;
  color: #065f46;
}

.risk-medium {
  background: #fef3c7;
  color: #92400e;
}

.risk-high {
  background: #fee2e2;
  color: #991b1b;
}

.tabs {
  display: flex;
  gap: 5px;
  margin-bottom: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.tab {
  padding: 10px 20px;
  background: none;
  border: none;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  font-size: 14px;
}

.tab.active {
  border-bottom-color: #4f46e5;
  color: #4f46e5;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}

.hint {
  font-size: 14px;
  color: #9ca3af;
}

.wallet-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.wallet-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.wallet-card:hover {
  border-color: #4f46e5;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.1);
}

.wallet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.wallet-label {
  font-weight: 600;
}

.wallet-category {
  background: #e0e7ff;
  color: #4f46e5;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.wallet-address {
  font-family: monospace;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 12px;
}

.wallet-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.follow-time {
  font-size: 12px;
  color: #9ca3af;
}

.btn-unfollow {
  padding: 4px 8px;
  background: #fee2e2;
  color: #991b1b;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.activity-section h3 {
  margin: 0 0 16px 0;
}

.activity-stats {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.stat-item {
  background: #f9fafb;
  padding: 12px 16px;
  border-radius: 8px;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
}

.stat-value.risk.low {
  color: #059669;
}

.stat-value.risk.medium {
  color: #d97706;
}

.stat-value.risk.high {
  color: #dc2626;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.data-table th {
  background: #f9fafb;
  font-weight: 600;
  font-size: 12px;
  color: #6b7280;
}

.type-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.type-badge.swap { background: #dbeafe; color: #1d4ed8; }
.type-badge.transfer { background: #d1fae5; color: #065f46; }
.type-badge.nft { background: #fce7f3; color: #be185d; }
.type-badge.defi { background: #e0e7ff; color: #4f46e5; }
.type-badge.stake { background: #fef3c7; color: #92400e; }

.status-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.status-badge.success {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.failed {
  background: #fee2e2;
  color: #991b1b;
}

.hash-cell a {
  color: #4f46e5;
  text-decoration: none;
  font-family: monospace;
  font-size: 12px;
}

.feed-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feed-item {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
}

.feed-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.feed-label {
  font-weight: 600;
}

.feed-address {
  font-family: monospace;
  font-size: 12px;
  color: #6b7280;
}

.feed-followers {
  margin-left: auto;
  font-size: 12px;
  color: #9ca3af;
}

.feed-activity {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.feed-amount {
  font-weight: 500;
}

.feed-time {
  font-size: 12px;
  color: #9ca3af;
}

.trending-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.trending-item {
  display: flex;
  align-items: center;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
}

.trending-info {
  flex: 1;
}

.trending-label {
  font-weight: 600;
  display: block;
}

.trending-category {
  font-size: 12px;
  color: #6b7280;
}

.trending-stats {
  display: flex;
  gap: 16px;
  margin-right: 16px;
}

.trending-followers,
.trending-activity {
  font-size: 14px;
  color: #6b7280;
}

.btn-follow {
  padding: 8px 16px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>
