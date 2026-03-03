<template>
  <div class="nft-rarity-calculator">
    <div class="header">
      <h1>🎨 NFT稀有度计算器</h1>
      <p class="subtitle">实时分析NFT稀有属性，发现潜在的宝石</p>
    </div>

    <!-- Search Section -->
    <div class="search-section">
      <div class="search-form">
        <div class="form-group">
          <label>Collection Address</label>
          <input 
            v-model="collectionAddress" 
            placeholder="0x..."
            class="address-input"
          />
        </div>
        <div class="form-group">
          <label>Chain</label>
          <select v-model="selectedChain" class="chain-select">
            <option value="ethereum">Ethereum</option>
            <option value="polygon">Polygon</option>
            <option value="arbitrum">Arbitrum</option>
            <option value="optimism">Optimism</option>
            <option value="base">Base</option>
          </select>
        </div>
        <div class="form-group">
          <label>Token ID (Optional)</label>
          <input 
            v-model="tokenId" 
            placeholder="e.g., 1234"
            type="text"
          />
        </div>
        <button @click="calculateRarity" :disabled="loading" class="search-btn">
          {{ loading ? '计算中...' : '计算稀有度' }}
        </button>
      </div>

      <!-- Quick Links -->
      <div class="quick-links">
        <span class="quick-label">快速查询:</span>
        <button 
          v-for="collection in popularCollections" 
          :key="collection.address"
          @click="loadCollection(collection)"
          class="quick-btn"
        >
          {{ collection.name }}
        </button>
      </div>
    </div>

    <!-- Results Section -->
    <div v-if="result" class="results-section">
      <!-- Rarity Score Card -->
      <div class="rarity-score-card">
        <div class="score-circle" :class="getScoreClass(result.rarityScore)">
          <span class="score-value">{{ result.rarityScore.toFixed(1) }}</span>
          <span class="score-label">稀有度分数</span>
        </div>
        <div class="score-details">
          <div class="rank-badge">
            <span class="rank-label">Rank</span>
            <span class="rank-value">#{{ result.rank || 'N/A' }}</span>
          </div>
          <div class="supply-info">
            <span class="supply-label">Total Supply</span>
            <span class="supply-value">{{ result.totalSupply.toLocaleString() }}</span>
          </div>
          <div class="confidence">
            <span class="confidence-label">Confidence</span>
            <span class="confidence-value">{{ result.confidence }}%</span>
          </div>
        </div>
      </div>

      <!-- Trait Distribution -->
      <div class="trait-distribution">
        <h3>属性分布</h3>
        <div class="trait-bars">
          <div 
            v-for="(count, level) in result.traits" 
            :key="level"
            class="trait-bar"
            :class="level"
          >
            <div class="bar-label">
              <span class="trait-name">{{ getTraitName(level) }}</span>
              <span class="trait-count">{{ count }}</span>
            </div>
            <div class="bar-track">
              <div 
                class="bar-fill" 
                :style="{ width: (count / 5 * 100) + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Attributes Table -->
      <div class="attributes-section">
        <h3>稀有属性详情</h3>
        <div class="attributes-grid">
          <div 
            v-for="attr in result.attributes" 
            :key="attr.trait_type"
            class="attribute-card"
            :class="getRarityClass(attr.rarity)"
          >
            <span class="attr-type">{{ attr.trait_type }}</span>
            <span class="attr-value">{{ attr.value }}</span>
            <span class="attr-rarity">{{ (attr.rarity * 100).toFixed(0) }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Collection Stats Section -->
    <div v-if="collectionStats" class="collection-stats-section">
      <h2>📊 集合稀有度统计</h2>
      
      <!-- Stats Overview -->
      <div class="stats-overview">
        <div class="stat-card">
          <span class="stat-value">{{ collectionStats.totalSupply.toLocaleString() }}</span>
          <span class="stat-label">总供应量</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ collectionStats.averageRarityScore.toFixed(1) }}</span>
          <span class="stat-label">平均稀有度</span>
        </div>
      </div>

      <!-- Rarity Distribution -->
      <div class="distribution-chart">
        <h3>稀有度分布</h3>
        <div class="distribution-bars">
          <div 
            v-for="(percent, level) in collectionStats.rarityDistribution" 
            :key="level"
            class="distribution-bar"
            :class="level"
          >
            <div class="bar-info">
              <span>{{ getTraitName(level) }}</span>
              <span>{{ percent }}%</span>
            </div>
            <div class="bar-container">
              <div class="bar-fill" :style="{ width: percent + '%' }"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Top Rarity Tokens -->
      <div class="top-tokens">
        <h3>🏆 Top 稀有NFT</h3>
        <div class="tokens-list">
          <div 
            v-for="(token, idx) in collectionStats.topRarityTokens" 
            :key="token.tokenId"
            class="token-item"
            :class="{ top3: idx < 3 }"
          >
            <span class="token-rank">#{{ idx + 1 }}</span>
            <span class="token-id">Token #{{ token.tokenId }}</span>
            <span class="token-score">{{ token.rarityScore.toFixed(1) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Rare Traits Section -->
    <div v-if="rareTraits.length > 0" class="rare-traits-section">
      <h3>💎 稀有属性发现</h3>
      <div class="rare-traits-grid">
        <div 
          v-for="trait in rareTraits" 
          :key="trait.trait + trait.value"
          class="rare-trait-card"
        >
          <span class="trait-type">{{ trait.trait }}</span>
          <span class="trait-value">{{ trait.value }}</span>
          <span class="trait-rarity">{{ (trait.rarity * 100).toFixed(0) }}% 稀有</span>
        </div>
      </div>
    </div>

    <!-- Batch Analysis -->
    <div class="batch-section">
      <h3>📦 批量分析</h3>
      <p>输入多个Token ID进行批量稀有度计算（逗号分隔）</p>
      <div class="batch-input">
        <input 
          v-model="batchTokenIds" 
          placeholder="1, 2, 3, 4, 5"
          class="batch-textarea"
        />
        <button @click="batchCalculate" :disabled="batchLoading || !batchTokenIds" class="batch-btn">
          {{ batchLoading ? '计算中...' : '批量计算' }}
        </button>
      </div>
      
      <div v-if="batchResults.length > 0" class="batch-results">
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Token ID</th>
              <th>稀有度分数</th>
              <th>属性数量</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in batchResults" :key="r.tokenId">
              <td>#{{ r.rank }}</td>
              <td>{{ r.tokenId }}</td>
              <td :class="getScoreClass(r.rarityScore)">{{ r.rarityScore.toFixed(1) }}</td>
              <td>{{ r.attributes.length }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="error-message">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { get, post } from '@/service/api';

interface NftAttribute {
  trait_type: string;
  value: string;
  rarity: number;
}

interface NftRarityResult {
  tokenId: string;
  rarityScore: number;
  rank: number;
  totalSupply: number;
  attributes: NftAttribute[];
  confidence: number;
  traits: {
    common: number;
    uncommon: number;
    rare: number;
    epic: number;
    legendary: number;
  };
}

interface CollectionStats {
  collectionAddress: string;
  chain: string;
  totalSupply: number;
  averageRarityScore: number;
  rarityDistribution: {
    common: number;
    uncommon: number;
    rare: number;
    epic: number;
    legendary: number;
  };
  topRarityTokens: {
    tokenId: string;
    rarityScore: number;
  }[];
}

const collectionAddress = ref('');
const selectedChain = ref('ethereum');
const tokenId = ref('');
const loading = ref(false);
const error = ref('');
const result = ref<NftRarityResult | null>(null);
const collectionStats = ref<CollectionStats | null>(null);
const rareTraits = ref<{ trait: string; value: string; rarity: number }[]>([]);
const batchTokenIds = ref('');
const batchLoading = ref(false);
const batchResults = ref<NftRarityResult[]>([]);

const popularCollections = [
  { name: 'BoredApe', address: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D', chain: 'ethereum' },
  { name: 'Pudgy', address: '0x524CAB2e691C64551D7cE1E187f528426C9AD81a', chain: 'ethereum' },
  { name: 'Azuki', address: '0xED5AF388653567Af2F388E6224dC7C4b3241C544', chain: 'ethereum' },
];

const loadCollection = (collection: any) => {
  collectionAddress.value = collection.address;
  selectedChain.value = collection.chain;
  calculateRarity();
};

const calculateRarity = async () => {
  if (!collectionAddress.value) {
    error.value = '请输入Collection Address';
    return;
  }

  loading.value = true;
  error.value = '';
  result.value = null;
  collectionStats.value = null;
  rareTraits.value = [];

  try {
    // Calculate single NFT rarity
    const res = await post('/nft-rarity/calculate', {
      collectionAddress: collectionAddress.value,
      chain: selectedChain.value,
      tokenId: tokenId.value || undefined,
    });
    result.value = res;

    // Get collection stats
    const statsRes = await get('/nft-rarity/collection/' + collectionAddress.value, {
      chain: selectedChain.value,
      limit: 100,
    });
    collectionStats.value = statsRes;

    // Find rare traits
    const traitsRes = await get('/nft-rarity/rare-traits/' + collectionAddress.value, {
      chain: selectedChain.value,
    });
    rareTraits.value = traitsRes;
  } catch (e: any) {
    error.value = e.message || '计算失败，请稍后重试';
  } finally {
    loading.value = false;
  }
};

const batchCalculate = async () => {
  if (!batchTokenIds.value || !collectionAddress.value) return;

  batchLoading.value = true;
  batchResults.value = [];

  try {
    const tokenIds = batchTokenIds.value.split(',').map(t => t.trim()).filter(Boolean);
    const res = await post('/nft-rarity/batch', {
      collectionAddress: collectionAddress.value,
      chain: selectedChain.value,
      tokenIds,
    });
    batchResults.value = res;
  } catch (e: any) {
    error.value = e.message || '批量计算失败';
  } finally {
    batchLoading.value = false;
  }
};

const getScoreClass = (score: number): string => {
  if (score >= 80) return 'legendary';
  if (score >= 60) return 'epic';
  if (score >= 40) return 'rare';
  if (score >= 20) return 'uncommon';
  return 'common';
};

const getRarityClass = (rarity: number): string => {
  if (rarity >= 0.8) return 'legendary';
  if (rarity >= 0.6) return 'epic';
  if (rarity >= 0.4) return 'rare';
  if (rarity >= 0.2) return 'uncommon';
  return 'common';
};

const getTraitName = (level: string): string => {
  const names: Record<string, string> = {
    common: '普通',
    uncommon: '稀有',
    rare: '罕见',
    epic: '史诗',
    legendary: '传奇',
  };
  return names[level] || level;
};
</script>

<style scoped>
.nft-rarity-calculator {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  margin-bottom: 24px;
}

.header h1 {
  font-size: 28px;
  margin-bottom: 8px;
  color: #1a1a2e;
}

.subtitle {
  color: #666;
  font-size: 14px;
}

.search-section {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.search-form {
  display: flex;
  gap: 16px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.form-group {
  flex: 1;
  min-width: 200px;
}

.form-group label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 6px;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
}

.address-input {
  font-family: monospace;
}

.search-btn {
  padding: 12px 24px;
  background: #6366f1;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.search-btn:hover:not(:disabled) {
  background: #4f46e5;
}

.search-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.quick-links {
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.quick-label {
  font-size: 12px;
  color: #999;
}

.quick-btn {
  padding: 6px 12px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-btn:hover {
  background: #e5e7eb;
}

.results-section {
  display: grid;
  gap: 24px;
}

.rarity-score-card {
  display: flex;
  align-items: center;
  gap: 32px;
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.score-circle {
  width: 160px;
  height: 160px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 6px solid;
}

.score-circle.legendary { border-color: #f59e0b; background: #fffbeb; }
.score-circle.epic { border-color: #8b5cf6; background: #f5f3ff; }
.score-circle.rare { border-color: #3b82f6; background: #eff6ff; }
.score-circle.uncommon { border-color: #10b981; background: #ecfdf5; }
.score-circle.common { border-color: #6b7280; background: #f3f4f6; }

.score-value {
  font-size: 36px;
  font-weight: 700;
}

.score-label {
  font-size: 12px;
  color: #666;
}

.score-details {
  display: flex;
  gap: 24px;
}

.rank-badge, .supply-info, .confidence {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rank-label, .supply-label, .confidence-label {
  font-size: 12px;
  color: #999;
}

.rank-value {
  font-size: 24px;
  font-weight: 600;
  color: #6366f1;
}

.supply-value, .confidence-value {
  font-size: 18px;
  font-weight: 500;
  color: #333;
}

.trait-distribution, .attributes-section {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.trait-distribution h3, .attributes-section h3 {
  margin-bottom: 16px;
  font-size: 16px;
}

.trait-bars {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.trait-bar {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.bar-label {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.trait-name {
  color: #333;
}

.trait-count {
  color: #666;
}

.bar-track {
  height: 8px;
  background: #f3f4f6;
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s;
}

.trait-bar.common .bar-fill { background: #6b7280; }
.trait-bar.uncommon .bar-fill { background: #10b981; }
.trait-bar.rare .bar-fill { background: #3b82f6; }
.trait-bar.epic .bar-fill { background: #8b5cf6; }
.trait-bar.legendary .bar-fill { background: #f59e0b; }

.attributes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}

.attribute-card {
  padding: 12px;
  border-radius: 8px;
  border: 1px solid;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.attribute-card.common { border-color: #e5e7eb; background: #f9fafb; }
.attribute-card.uncommon { border-color: #a7f3d0; background: #ecfdf5; }
.attribute-card.rare { border-color: #93c5fd; background: #eff6ff; }
.attribute-card.epic { border-color: #c4b5fd; background: #f5f3ff; }
.attribute-card.legendary { border-color: #fcd34d; background: #fffbeb; }

.attr-type {
  font-size: 11px;
  color: #999;
}

.attr-value {
  font-size: 14px;
  font-weight: 500;
}

.attr-rarity {
  font-size: 12px;
  color: #666;
}

.collection-stats-section {
  margin-top: 24px;
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.collection-stats-section h2 {
  font-size: 20px;
  margin-bottom: 20px;
}

.stats-overview {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
}

.stat-card {
  flex: 1;
  padding: 20px;
  background: #f9fafb;
  border-radius: 12px;
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 28px;
  font-weight: 700;
  color: #6366f1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 13px;
  color: #666;
}

.distribution-chart h3, .top-tokens h3 {
  font-size: 16px;
  margin-bottom: 16px;
}

.distribution-bars {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.distribution-bar {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.distribution-bar .bar-info {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.distribution-bar .bar-container {
  height: 24px;
  background: #f3f4f6;
  border-radius: 4px;
  overflow: hidden;
}

.distribution-bar .bar-fill {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 8px;
  color: #fff;
  font-size: 12px;
  font-weight: 500;
}

.distribution-bar.common .bar-fill { background: #6b7280; }
.distribution-bar.uncommon .bar-fill { background: #10b981; }
.distribution-bar.rare .bar-fill { background: #3b82f6; }
.distribution-bar.epic .bar-fill { background: #8b5cf6; }
.distribution-bar.legendary .bar-fill { background: #f59e0b; }

.tokens-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.token-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.token-item.top3 {
  background: #eff6ff;
}

.token-rank {
  font-weight: 600;
  color: #6366f1;
  width: 40px;
}

.token-id {
  flex: 1;
  font-family: monospace;
}

.token-score {
  font-weight: 600;
  color: #333;
}

.rare-traits-section {
  margin-top: 24px;
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.rare-traits-section h3 {
  font-size: 18px;
  margin-bottom: 16px;
}

.rare-traits-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.rare-trait-card {
  padding: 16px;
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  border: 1px solid #fcd34d;
  border-radius: 8px;
}

.rare-trait-card .trait-type {
  display: block;
  font-size: 11px;
  color: #999;
  margin-bottom: 4px;
}

.rare-trait-card .trait-value {
  display: block;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
}

.rare-trait-card .trait-rarity {
  font-size: 13px;
  color: #f59e0b;
  font-weight: 500;
}

.batch-section {
  margin-top: 24px;
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.batch-section h3 {
  font-size: 18px;
  margin-bottom: 8px;
}

.batch-section p {
  font-size: 13px;
  color: #666;
  margin-bottom: 16px;
}

.batch-input {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.batch-textarea {
  flex: 1;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-family: monospace;
  font-size: 14px;
}

.batch-btn {
  padding: 12px 24px;
  background: #10b981;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
}

.batch-btn:hover:not(:disabled) {
  background: #059669;
}

.batch-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.batch-results table {
  width: 100%;
  border-collapse: collapse;
}

.batch-results th,
.batch-results td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.batch-results th {
  background: #f9fafb;
  font-weight: 600;
  font-size: 13px;
  color: #666;
}

.batch-results .legendary { color: #f59e0b; font-weight: 600; }
.batch-results .epic { color: #8b5cf6; font-weight: 600; }
.batch-results .rare { color: #3b82f6; font-weight: 600; }
.batch-results .uncommon { color: #10b981; }
.batch-results .common { color: #6b7280; }

.error-message {
  margin-top: 16px;
  padding: 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 14px;
}
</style>
