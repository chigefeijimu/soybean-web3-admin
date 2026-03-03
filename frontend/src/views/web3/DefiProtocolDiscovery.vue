<template>
  <div class="defi-protocol-discovery">
    <n-card title="🔍 DeFi Protocol Discovery Engine" bordered>
      <n-tabs type="line" animated>
        <n-tab-pane name="discover" tab="Discover Protocols">
          <!-- Preferences Form -->
          <n-card title="Configure Your Preferences" class="preferences-card">
            <n-space vertical :size="16">
              <n-form-item label="Risk Tolerance">
                <n-radio-group v-model:value="preferences.riskTolerance">
                  <n-space>
                    <n-radio value="low">🛡️ Low Risk</n-radio>
                    <n-radio value="medium">⚖️ Medium Risk</n-radio>
                    <n-radio value="high">🎯 High Risk</n-radio>
                  </n-space>
                </n-radio-group>
              </n-form-item>

              <n-form-item label="Investment Goal">
                <n-select
                  v-model:value="preferences.investmentGoal"
                  :options="goalOptions"
                  placeholder="Select your goal"
                />
              </n-form-item>

              <n-form-item label="Preferred Chains">
                <n-select
                  v-model:value="preferences.preferredChains"
                  :options="chainOptions"
                  multiple
                  placeholder="Select chains (or all)"
                  clearable
                />
              </n-form-item>

              <n-form-item label="Investment Amount (USD)">
                <n-input-number
                  v-model:value="preferences.investmentAmount"
                  :min="100"
                  :max="10000000"
                  :step="1000"
                >
                  <template #prefix>$</template>
                </n-input-number>
              </n-form-item>

              <n-form-item label="Experience Level">
                <n-radio-group v-model:value="preferences.experienceLevel">
                  <n-space>
                    <n-radio value="beginner">🌱 Beginner</n-radio>
                    <n-radio value="intermediate">🌿 Intermediate</n-radio>
                    <n-radio value="advanced">🌳 Advanced</n-radio>
                  </n-space>
                </n-radio-group>
              </n-form-item>

              <n-button type="primary" @click="discoverProtocols" :loading="loading" block>
                🔍 Discover Protocols
              </n-button>
            </n-space>
          </n-card>

          <!-- Results -->
          <div v-if="recommendations.length > 0" class="results-section">
            <n-divider>Recommended Protocols</n-divider>
            
            <n-space vertical :size="12">
              <n-card
                v-for="protocol in recommendations"
                :key="protocol.protocol"
                class="protocol-card"
                hoverable
              >
                <n-space justify="space-between" align="center">
                  <n-space vertical :size="4">
                    <n-text strong style="font-size: 18px">
                      {{ protocol.protocol }}
                    </n-text>
                    <n-space :size="8">
                      <n-tag :type="getCategoryType(protocol.category)" size="small">
                        {{ formatCategory(protocol.category) }}
                      </n-tag>
                      <n-tag :type="getChainType(protocol.chain)" size="small">
                        {{ protocol.chain.toUpperCase() }}
                      </n-tag>
                      <n-tag :type="getRiskType(protocol.riskLevel)" size="small">
                        {{ protocol.riskLevel.toUpperCase() }} Risk
                      </n-tag>
                    </n-space>
                  </n-space>

                  <n-space vertical :size="4" align="end">
                    <n-text strong style="font-size: 16px; color: #18a058">
                      {{ formatAPY(protocol.apy) }}% APY
                    </n-text>
                    <n-text depth="3">TVL: {{ formatTVL(protocol.tvl) }}</n-text>
                  </n-space>
                </n-space>

                <n-divider />
                
                <n-space vertical :size="8">
                  <n-space align="center">
                    <n-text strong>Match Score:</n-text>
                    <n-progress
                      type="line"
                      :percentage="protocol.matchScore"
                      :indicator-placement="'inside'"
                      :status="getScoreStatus(protocol.matchScore)"
                      style="width: 150px"
                    />
                  </n-space>

                  <n-space v-if="protocol.reasons.length" :size="8">
                    <n-text strong>Why:</n-text>
                    <n-text depth="2">{{ protocol.reasons.join(' • ') }}</n-text>
                  </n-space>

                  <n-space :size="8">
                    <n-tag v-for="feature in protocol.features.slice(0, 3)" :key="feature" size="small" round>
                      {{ feature }}
                    </n-tag>
                  </n-space>
                </n-space>

                <template #footer>
                  <n-space justify="end">
                    <n-button size="small" @click="openWebsite(protocol.website)">
                      🌐 Website
                    </n-button>
                    <n-button size="small" type="primary" @click="openDocs(protocol.documentation)">
                      📖 Docs
                    </n-button>
                  </n-space>
                </template>
              </n-card>
            </n-space>

            <!-- Insights -->
            <n-card title="💡 Personalized Insights" class="insights-card" v-if="insights.length">
              <n-list>
                <n-list-item v-for="(insight, index) in insights" :key="index">
                  <n-space align="center">
                    <n-icon color="#2080f0" :component="LightbulbOutline" />
                    <n-text>{{ insight }}</n-text>
                  </n-space>
                </n-list-item>
              </n-list>
            </n-card>
          </div>
        </n-tab-pane>

        <n-tab-pane name="trending" tab="🔥 Trending Protocols">
          <n-card title="Trending DeFi Protocols" subtitle="Based on TVL and popularity">
            <n-space vertical :size="12">
              <n-card
                v-for="protocol in trendingProtocols"
                :key="protocol.protocol"
                class="protocol-card"
                hoverable
              >
                <n-space justify="space-between" align="center">
                  <n-space vertical :size="4">
                    <n-text strong style="font-size: 18px">{{ protocol.protocol }}</n-text>
                    <n-space :size="8">
                      <n-tag :type="getCategoryType(protocol.category)" size="small">
                        {{ formatCategory(protocol.category) }}
                      </n-tag>
                      <n-tag :type="getChainType(protocol.chain)" size="small">
                        {{ protocol.chain.toUpperCase() }}
                      </n-tag>
                    </n-space>
                  </n-space>
                  <n-space vertical :size="4" align="end">
                    <n-text strong style="font-size: 16px; color: #18a058">
                      ~{{ formatAPY(protocol.apy) }}% APY
                    </n-text>
                    <n-text depth="3">TVL: {{ formatTVL(protocol.tvl) }}</n-text>
                  </n-space>
                </n-space>
              </n-card>
            </n-space>
          </n-card>
        </n-tab-pane>

        <n-tab-pane name="categories" tab="📂 Categories">
          <n-space vertical :size="16">
            <n-card
              v-for="category in categories"
              :key="category"
              :title="formatCategory(category)"
              hoverable
              @click="selectCategory(category)"
              class="category-card"
            >
              <n-text>Explore {{ formatCategory(category) }} protocols →</n-text>
            </n-card>
          </n-space>
        </n-tab-pane>
      </n-tabs>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  NCard, NTabs, NTabPane, NButton, NSpace, NFormItem,
  NRadioGroup, NRadio, NSelect, NInputNumber, NDivider,
  NTag, NProgress, NList, NListItem, NIcon, NText
} from 'naive-ui';
import { LightbulbOutline } from '@vicons/ionicons5';

interface ProtocolRecommendation {
  protocol: string;
  category: string;
  chain: string;
  tvl: number;
  apy: number;
  riskScore: number;
  riskLevel: string;
  matchScore: number;
  reasons: string[];
  features: string[];
  website: string;
  documentation: string;
}

const loading = ref(false);
const recommendations = ref<ProtocolRecommendation[]>([]);
const trendingProtocols = ref<ProtocolRecommendation[]>([]);
const insights = ref<string[]>([]);
const categories = ref<string[]>([]);

const preferences = ref({
  riskTolerance: 'medium',
  investmentGoal: 'balanced',
  preferredChains: [] as string[],
  investmentAmount: 10000,
  experienceLevel: 'intermediate'
});

const goalOptions = [
  { label: '🎯 Balanced', value: 'balanced' },
  { label: '🌾 Yield Farming', value: 'yield_farming' },
  { label: '💰 Lending', value: 'lending' },
  { label: '🔒 Staking', value: 'staking' },
  { label: '💧 Liquidity', value: 'liquidity' },
  { label: '⚡ Arbitrage', value: 'arbitrage' }
];

const chainOptions = [
  { label: 'Ethereum', value: 'ethereum' },
  { label: 'Polygon', value: 'polygon' },
  { label: 'Arbitrum', value: 'arbitrum' },
  { label: 'Optimism', value: 'optimism' },
  { label: 'Avalanche', value: 'avalanche' },
  { label: 'Base', value: 'base' },
  { label: 'BSC', value: 'bsc' }
];

const discoverProtocols = async () => {
  loading.value = true;
  try {
    const response = await fetch('/api/defi-protocol-discovery/discover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preferences.value)
    });
    const data = await response.json();
    recommendations.value = data.recommendations || [];
    insights.value = data.insights || [];
  } catch (error) {
    console.error('Failed to discover protocols:', error);
  } finally {
    loading.value = false;
  }
};

const loadTrending = async () => {
  try {
    const response = await fetch('/api/defi-protocol-discovery/trending');
    const data = await response.json();
    trendingProtocols.value = data || [];
  } catch (error) {
    console.error('Failed to load trending:', error);
  }
};

const loadCategories = async () => {
  try {
    const response = await fetch('/api/defi-protocol-discovery/categories');
    const data = await response.json();
    categories.value = data || [];
  } catch (error) {
    console.error('Failed to load categories:', error);
  }
};

const selectCategory = async (category: string) => {
  try {
    const response = await fetch(`/api/defi-protocol-discovery/category/${category}`);
    const data = await response.json();
    recommendations.value = data || [];
  } catch (error) {
    console.error('Failed to load category:', error);
  }
};

const formatAPY = (apy: number) => apy.toFixed(1);
const formatTVL = (tvl: number) => {
  if (tvl >= 1e9) return `$${(tvl / 1e9).toFixed(1)}B`;
  if (tvl >= 1e6) return `$${(tvl / 1e6).toFixed(1)}M`;
  return `$${(tvl / 1e3).toFixed(0)}K`;
};

const formatCategory = (category: string) => {
  const map: Record<string, string> = {
    lending: '💰 Lending',
    yield_farming: '🌾 Yield Farming',
    staking: '🔒 Staking',
    liquidity: '💧 Liquidity',
    arbitrage: '⚡ Arbitrage'
  };
  return map[category] || category;
};

const getCategoryType = (category: string) => {
  const map: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
    lending: 'success',
    yield_farming: 'warning',
    staking: 'info',
    liquidity: 'warning',
    arbitrage: 'error'
  };
  return map[category] || 'default';
};

const getChainType = (chain: string) => {
  const map: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
    ethereum: 'success',
    polygon: 'warning',
    arbitrum: 'info',
    optimism: 'info',
    avalanche: 'error',
    base: 'warning',
    bsc: 'warning'
  };
  return map[chain] || 'default';
};

const getRiskType = (risk: string) => {
  if (risk === 'low') return 'success';
  if (risk === 'high') return 'error';
  return 'warning';
};

const getScoreStatus = (score: number) => {
  if (score >= 80) return 'success';
  if (score >= 60) return 'warning';
  return 'error';
};

const openWebsite = (url: string) => window.open(url, '_blank');
const openDocs = (url: string) => window.open(url, '_blank');

onMounted(() => {
  loadTrending();
  loadCategories();
});
</script>

<style scoped>
.defi-protocol-discovery {
  padding: 16px;
}

.preferences-card {
  margin-bottom: 24px;
}

.results-section {
  margin-top: 24px;
}

.protocol-card {
  margin-bottom: 12px;
  transition: transform 0.2s;
}

.protocol-card:hover {
  transform: translateY(-2px);
}

.insights-card {
  margin-top: 24px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e6f4ff 100%);
}

.category-card {
  cursor: pointer;
  transition: all 0.2s;
}

.category-card:hover {
  border-color: #18a058;
}
</style>
