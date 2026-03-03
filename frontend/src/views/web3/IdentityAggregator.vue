<template>
  <div class="identity-aggregator">
    <el-row :gutter="20">
      <el-col :span="24">
        <el-card class="header-card">
          <div class="header-content">
            <div class="title-section">
              <h1>🌐 Cross-chain Identity Aggregator</h1>
              <p class="subtitle">Unified Web3 identity resolution across multiple chains and domains</p>
            </div>
            <div class="header-actions">
              <el-input
                v-model="walletAddress"
                placeholder="Enter wallet address or domain"
                class="wallet-input"
                clearable
                @keyup.enter="searchIdentity"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
                <template #append>
                  <el-button @click="searchIdentity">Search</el-button>
                </template>
              </el-input>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Stats Overview -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon identity-icon">🆔</div>
            <div class="stat-info">
              <div class="stat-value">{{ statsData?.totalIdentities || 0 }}</div>
              <div class="stat-label">Total Identities</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon domain-icon">🔤</div>
            <div class="stat-info">
              <div class="stat-value">{{ statsData?.totalDomains || 0 }}</div>
              <div class="stat-label">Domain Names</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon verified-icon">✅</div>
            <div class="stat-info">
              <div class="stat-value">{{ statsData?.verifiedProfiles || 0 }}</div>
              <div class="stat-label">Verified Profiles</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon chain-icon">⛓️</div>
            <div class="stat-info">
              <div class="stat-value">{{ statsData?.chains?.length || 0 }}</div>
              <div class="stat-label">Supported Chains</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <!-- Identity Profile -->
      <el-col :span="12">
        <el-card class="profile-card">
          <template #header>
            <div class="card-header">
              <span>👤 Identity Profile</span>
              <el-tag v-if="profileData?.verified?.ens" type="success" size="small">Verified</el-tag>
            </div>
          </template>
          
          <div v-if="profileData" class="profile-content">
            <div class="profile-avatar">
              <el-avatar :size="80" :src="crossChainData?.unifiedProfile?.avatar">
                {{ walletAddress?.slice(0, 4) }}
              </el-avatar>
            </div>
            
            <div class="profile-name">
              <h3>{{ profileData.primaryDomain || 'Unknown' }}</h3>
              <el-tag size="small" type="info">{{ walletAddress?.slice(0, 10) }}...</el-tag>
            </div>

            <el-divider />

            <div class="domain-section">
              <h4>🌐 Domain Names</h4>
              <div class="domain-list">
                <div class="domain-item">
                  <span class="domain-type">ENS</span>
                  <span class="domain-value">{{ profileData.domains.ens || 'Not set' }}</span>
                  <el-icon v-if="profileData.verified.ens" class="verified-icon"><CircleCheck /></el-icon>
                </div>
                <div class="domain-item">
                  <span class="domain-type">.sol</span>
                  <span class="domain-value">{{ profileData.domains.sol || 'Not set' }}</span>
                </div>
                <div class="domain-item">
                  <span class="domain-type">UD</span>
                  <span class="domain-value">{{ profileData.domains.ud || 'Not set' }}</span>
                </div>
              </div>
            </div>

            <div class="social-section">
              <h4>📱 Social Accounts</h4>
              <div class="social-list">
                <div class="social-item">
                  <span class="social-icon">🐦</span>
                  <span class="social-value">{{ profileData.social.twitter || 'Not connected' }}</span>
                  <el-icon v-if="profileData.verified.twitter" class="verified-icon"><CircleCheck /></el-icon>
                </div>
                <div class="social-item">
                  <span class="social-icon">📸</span>
                  <span class="social-value">{{ profileData.social.lens || 'Not connected' }}</span>
                  <el-icon v-if="profileData.verified.lens" class="verified-icon"><CircleCheck /></el-icon>
                </div>
                <div class="social-item">
                  <span class="social-icon">🫂</span>
                  <span class="social-value">{{ profileData.social.farcaster || 'Not connected' }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <el-empty v-else description="Enter a wallet address to view identity profile" />
        </el-card>
      </el-col>

      <!-- Reputation Score -->
      <el-col :span="12">
        <el-card class="reputation-card">
          <template #header>
            <div class="card-header">
              <span>⭐ Reputation Score</span>
            </div>
          </template>
          
          <div v-if="reputationData" class="reputation-content">
            <div class="score-display">
              <el-progress
                type="circle"
                :percentage="reputationData.score"
                :width="150"
                :color="getScoreColor(reputationData.score)"
              >
                <template #default="{ percentage }">
                  <div class="score-circle">
                    <span class="score-value">{{ percentage }}</span>
                    <span class="score-grade">{{ reputationData.grade }}</span>
                  </div>
                </template>
              </el-progress>
            </div>

            <div class="factors-section">
              <h4>📊 Score Factors</h4>
              <div class="factor-item">
                <span class="factor-label">Identity Verification</span>
                <el-progress :percentage="reputationData.factors.identityVerification" :show-text="false" />
              </div>
              <div class="factor-item">
                <span class="factor-label">Domain Age</span>
                <el-progress :percentage="reputationData.factors.domainAge" :show-text="false" />
              </div>
              <div class="factor-item">
                <span class="factor-label">Social Connections</span>
                <el-progress :percentage="reputationData.factors.socialConnections" :show-text="false" />
              </div>
              <div class="factor-item">
                <span class="factor-label">Cross-chain Presence</span>
                <el-progress :percentage="reputationData.factors.crossChainPresence" :show-text="false" />
              </div>
              <div class="factor-item">
                <span class="factor-label">Activity Level</span>
                <el-progress :percentage="reputationData.factors.activityLevel" :show-text="false" />
              </div>
            </div>
          </div>
          
          <el-empty v-else description="Search for an address to see reputation" />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <!-- Cross-chain Identities -->
      <el-col :span="12">
        <el-card class="cross-chain-card">
          <template #header>
            <div class="card-header">
              <span>⛓️ Cross-chain Identities</span>
            </div>
          </template>
          
          <div v-if="crossChainData" class="cross-chain-content">
            <el-table :data="crossChainTableData" style="width: 100%">
              <el-table-column prop="chain" label="Chain" width="120">
                <template #default="{ row }">
                  <el-tag>{{ row.chain }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="address" label="Address" min-width="180" show-overflow-tooltip />
              <el-table-column prop="domain" label="Domain" min-width="120">
                <template #default="{ row }">
                  <span :class="{ 'no-domain': !row.domain }">{{ row.domain || '-' }}</span>
                </template>
              </el-table-column>
            </el-table>
          </div>
          
          <el-empty v-else description="Search for cross-chain identities" />
        </el-card>
      </el-col>

      <!-- Social Graph -->
      <el-col :span="12">
        <el-card class="social-graph-card">
          <template #header>
            <div class="card-header">
              <span>🕸️ Social Graph</span>
            </div>
          </template>
          
          <div v-if="socialGraphData" class="social-graph-content">
            <div class="graph-stats">
              <el-statistic title="Total Connections" :value="socialGraphData.totalConnections" />
              <el-statistic title="Verified" :value="socialGraphData.verifiedConnections" />
            </div>
            
            <el-divider />
            
            <div class="connections-list">
              <h4>📡 Connected Accounts</h4>
              <div v-for="conn in socialGraphData.connections" :key="conn.identifier" class="connection-item">
                <div class="connection-icon">{{ getConnectionIcon(conn.type) }}</div>
                <div class="connection-info">
                  <span class="connection-type">{{ conn.type }}</span>
                  <span class="connection-identifier">{{ conn.identifier }}</span>
                </div>
                <el-tag v-if="conn.verified" type="success" size="small">Verified</el-tag>
              </div>
            </div>
          </div>
          
          <el-empty v-else description="Search for social graph" />
        </el-card>
      </el-col>
    </el-row>

    <!-- Popular Domains -->
    <el-row :gutter="20">
      <el-col :span="24">
        <el-card class="popular-domains-card">
          <template #header>
            <div class="card-header">
              <span>🔥 Popular Domain Names</span>
              <el-select v-model="selectedChain" placeholder="Filter by chain" clearable style="width: 150px">
                <el-option label="All Chains" value="" />
                <el-option label="Ethereum" value="ethereum" />
                <el-option label="Solana" value="solana" />
                <el-option label="Multi-chain" value="multi" />
              </el-select>
            </div>
          </template>
          
          <el-table :data="filteredPopularDomains" style="width: 100%">
            <el-table-column prop="domain" label="Domain" min-width="180">
              <template #default="{ row }">
                <span class="domain-name">{{ row.domain }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="type" label="Type" width="120">
              <template #default="{ row }">
                <el-tag>{{ row.type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="chain" label="Chain" width="120">
              <template #default="{ row }">
                <span>{{ row.chain }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="holders" label="Holders" width="120">
              <template #default="{ row }">
                {{ formatNumber(row.holders) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { identityAggregator, type IdentityProfile, type ReputationScore, type CrossChainIdentities, type SocialGraph } from '@/service/identityAggregator';

const walletAddress = ref('');
const selectedChain = ref('');
const statsData = ref<any>(null);
const profileData = ref<IdentityProfile | null>(null);
const reputationData = ref<ReputationScore | null>(null);
const crossChainData = ref<CrossChainIdentities | null>(null);
const socialGraphData = ref<SocialGraph | null>(null);
const popularDomains = ref<any[]>([]);

const filteredPopularDomains = computed(() => {
  if (!selectedChain.value) return popularDomains.value;
  return popularDomains.value.filter(d => d.chain === selectedChain.value);
});

const crossChainTableData = computed(() => {
  if (!crossChainData.value) return [];
  const identities = crossChainData.value.identities;
  return [
    { chain: 'Ethereum', address: identities.ethereum.address, domain: identities.ethereum.ens },
    { chain: 'Solana', address: identities.solana.address, domain: identities.solana.domain },
    { chain: 'Polygon', address: identities.polygon.address, domain: identities.polygon.domain },
    { chain: 'Arbitrum', address: identities.arbitrum.address, domain: identities.arbitrum.domain },
    { chain: 'Optimism', address: identities.optimism.address, domain: identities.optimism.domain },
    { chain: 'Base', address: identities.base.address, domain: identities.base.domain },
    { chain: 'Avalanche', address: identities.avalanche.address, domain: identities.avalanche.domain },
  ];
});

onMounted(async () => {
  await loadStats();
  await loadPopularDomains();
});

const loadStats = async () => {
  try {
    const res = await identityAggregator.getStats();
    statsData.value = res.data;
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
};

const loadPopularDomains = async () => {
  try {
    const res = await identityAggregator.getPopularDomains();
    popularDomains.value = res.data;
  } catch (error) {
    console.error('Failed to load popular domains:', error);
  }
};

const searchIdentity = async () => {
  if (!walletAddress.value) {
    ElMessage.warning('Please enter a wallet address or domain');
    return;
  }

  try {
    // Load all data in parallel
    const [profileRes, reputationRes, crossChainRes, socialGraphRes] = await Promise.all([
      identityAggregator.getProfile(walletAddress.value),
      identityAggregator.getReputation(walletAddress.value),
      identityAggregator.getCrossChainIdentities(walletAddress.value),
      identityAggregator.getSocialGraph(walletAddress.value),
    ]);

    profileData.value = profileRes.data;
    reputationData.value = reputationRes.data;
    crossChainData.value = crossChainRes.data;
    socialGraphData.value = socialGraphRes.data;

    ElMessage.success('Identity data loaded successfully');
  } catch (error) {
    console.error('Failed to search identity:', error);
    ElMessage.error('Failed to load identity data');
  }
};

const getScoreColor = (score: number) => {
  if (score >= 90) return '#67C23A';
  if (score >= 75) return '#409EFF';
  if (score >= 60) return '#E6A23C';
  if (score >= 45) return '#F56C6C';
  return '#909399';
};

const getConnectionIcon = (type: string) => {
  const icons: Record<string, string> = {
    twitter: '🐦',
    lens: '📸',
    farcaster: '🫂',
    ens: '🌐',
    github: '🐙',
  };
  return icons[type] || '📱';
};

const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};
</script>

<style scoped>
.identity-aggregator {
  padding: 20px;
}

.header-card {
  margin-bottom: 20px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-section h1 {
  margin: 0;
  font-size: 24px;
}

.subtitle {
  margin: 5px 0 0;
  color: #666;
}

.wallet-input {
  width: 400px;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-icon {
  font-size: 32px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
}

.stat-label {
  color: #666;
  font-size: 12px;
}

.profile-card,
.reputation-card,
.cross-chain-card,
.social-graph-card,
.popular-domains-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.profile-content {
  text-align: center;
}

.profile-avatar {
  margin-bottom: 15px;
}

.profile-name h3 {
  margin: 10px 0;
}

.domain-section,
.social-section {
  text-align: left;
  margin-top: 15px;
}

.domain-section h4,
.social-section h4,
.factors-section h4,
.connections-list h4 {
  margin-bottom: 10px;
}

.domain-list,
.social-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.domain-item,
.social-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background: #f5f7fa;
  border-radius: 4px;
}

.domain-type,
.social-icon {
  font-weight: bold;
  min-width: 50px;
}

.verified-icon {
  color: #67C23A;
}

.reputation-content {
  text-align: center;
}

.score-display {
  margin-bottom: 20px;
}

.score-circle {
  display: flex;
  flex-direction: column;
}

.score-value {
  font-size: 32px;
  font-weight: bold;
}

.score-grade {
  font-size: 18px;
  color: #409EFF;
}

.factors-section {
  text-align: left;
}

.factor-item {
  margin-bottom: 10px;
}

.factor-label {
  font-size: 12px;
  color: #666;
  display: block;
  margin-bottom: 5px;
}

.graph-stats {
  display: flex;
  justify-content: space-around;
}

.connections-list {
  text-align: left;
}

.connection-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-bottom: 1px solid #eee;
}

.connection-icon {
  font-size: 20px;
}

.connection-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.connection-type {
  font-weight: bold;
  font-size: 12px;
  text-transform: capitalize;
}

.connection-identifier {
  font-size: 14px;
}

.no-domain {
  color: #999;
}

.domain-name {
  font-family: monospace;
}

.popular-domains-card .card-header {
  display: flex;
  gap: 10px;
}
</style>
