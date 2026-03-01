<script setup lang="ts">
import { ref, computed } from 'vue';

// State
const contractAddress = ref('');
const tokenId = ref('');
const chainId = ref(1);
const loading = ref(false);
const error = ref('');
const nftData = ref<any>(null);
const rarityData = ref<any>(null);

// Chains
const chains = [
  { id: 1, name: 'Ethereum', symbol: 'ETH' },
  { id: 137, name: 'Polygon', symbol: 'MATIC' },
  { id: 8453, name: 'Base', symbol: 'ETH' },
  { id: 42161, name: 'Arbitrum', symbol: 'ETH' },
  { id: 56, name: 'BSC', symbol: 'BNB' }
];

// Mock NFT metadata for demo (in production, fetch from chain)
const mockFetchNFT = async (contract: string, token: string, chain: number) => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Generate realistic mock data
  const attributes = [
    { trait_type: 'Background', value: ['Blue', 'Purple', 'Orange', 'Green', 'Red'][Math.floor(Math.random() * 5)], rarity: 'Common' },
    { trait_type: 'Body', value: ['Robot', 'Alien', 'Human', 'Zombie', 'Demon'][Math.floor(Math.random() * 5)], rarity: 'Uncommon' },
    { trait_type: 'Eyes', value: ['Laser', 'Cyclops', 'Visor', 'Normal', 'Glowing'][Math.floor(Math.random() * 5)], rarity: 'Rare' },
    { trait_type: 'Accessory', value: ['Cape', 'Wings', 'Shield', 'Sword', 'None'][Math.floor(Math.random() * 5)], rarity: 'Epic' },
    { trait_type: 'Power Level', value: Math.floor(Math.random() * 100), rarity: 'Legendary' }
  ];
  
  return {
    name: `#${token}`,
    description: 'A unique digital collectible',
    image: `https://picsum.photos/seed/${contract}${token}/400/400`,
    attributes
  };
};

// Calculate rarity scores
const calculateRarity = (attributes: any[]) => {
  const rarityScores: Record<string, number> = {
    'Common': 1,
    'Uncommon': 2,
    'Rare': 3,
    'Epic': 4,
    'Legendary': 5,
    'Mythic': 10
  };
  
  const totalScore = attributes.reduce((sum, attr) => {
    return sum + (rarityScores[attr.rarity] || 1);
  }, 0);
  
  const maxPossible = attributes.length * 10;
  const rarityPercentile = Math.round((totalScore / maxPossible) * 100);
  
  // Rank calculation
  let rank = 'Common';
  if (rarityPercentile >= 90) rank = 'Mythic';
  else if (rarityPercentile >= 75) rank = 'Legendary';
  else if (rarityPercentile >= 60) rank = 'Epic';
  else if (rarityPercentile >= 45) rank = 'Rare';
  else if (rarityPercentile >= 25) rank = 'Uncommon';
  
  return {
    score: totalScore,
    maxScore: maxPossible,
    percentile: rarityPercentile,
    rank,
    attributes: attributes.map(attr => ({
      ...attr,
      score: rarityScores[attr.rarity] || 1
    })).sort((a, b) => b.score - a.score)
  };
};

// Analyze NFT
const analyzeNFT = async () => {
  if (!contractAddress.value || !tokenId.value) {
    error.value = 'Please enter contract address and token ID';
    return;
  }
  
  error.value = '';
  loading.value = true;
  
  try {
    const data = await mockFetchNFT(contractAddress.value, tokenId.value, chainId.value);
    nftData.value = data;
    rarityData.value = calculateRarity(data.attributes);
  } catch (e: any) {
    error.value = e.message || 'Failed to fetch NFT data';
  } finally {
    loading.value = false;
  }
};

// Get rank color
const getRankColor = (rank: string) => {
  const colors: Record<string, string> = {
    'Mythic': 'text-red-500',
    'Legendary': 'text-orange-500',
    'Epic': 'text-purple-500',
    'Rare': 'text-blue-500',
    'Uncommon': 'text-green-500',
    'Common': 'text-gray-400'
  };
  return colors[rank] || 'text-gray-400';
};

// Get rank badge color
const getRankBadge = (rank: string) => {
  const colors: Record<string, string> = {
    'Mythic': 'bg-red-500/20 border-red-500',
    'Legendary': 'bg-orange-500/20 border-orange-500',
    'Epic': 'bg-purple-500/20 border-purple-500',
    'Rare': 'bg-blue-500/20 border-blue-500',
    'Uncommon': 'bg-green-500/20 border-green-500',
    'Common': 'bg-gray-500/20 border-gray-500'
  };
  return colors[rank] || 'bg-gray-500/20 border-gray-500';
};

// Reset
const reset = () => {
  contractAddress.value = '';
  tokenId.value = '';
  nftData.value = null;
  rarityData.value = null;
  error.value = '';
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl">
      <div class="flex items-center gap-3 mb-4">
        <span class="text-3xl">💎</span>
        <div>
          <h2 class="text-xl font-semibold">NFT Rarity Analyzer</h2>
          <p class="text-sm text-slate-400">Analyze NFT attribute rarity & calculate scores</p>
        </div>
      </div>
      
      <!-- Input Form -->
      <div class="grid gap-4 lg:grid-cols-4">
        <div>
          <label class="mb-1 block text-xs text-slate-400">Chain</label>
          <select
            v-model="chainId"
            class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
          >
            <option v-for="chain in chains" :key="chain.id" :value="chain.id">
              {{ chain.name }}
            </option>
          </select>
        </div>
        <div class="lg:col-span-2">
          <label class="mb-1 block text-xs text-slate-400">Contract Address</label>
          <input
            v-model="contractAddress"
            type="text"
            placeholder="0x..."
            class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
          />
        </div>
        <div>
          <label class="mb-1 block text-xs text-slate-400">Token ID</label>
          <input
            v-model="tokenId"
            type="text"
            placeholder="123"
            class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
          />
        </div>
      </div>
      
      <div class="mt-4 flex gap-3">
        <button
          :disabled="loading"
          class="rounded-lg bg-purple-500 px-6 py-2 text-sm font-medium transition-all hover:bg-purple-600 disabled:opacity-50"
          @click="analyzeNFT"
        >
          {{ loading ? 'Analyzing...' : '🔍 Analyze Rarity' }}
        </button>
        <button
          class="rounded-lg border border-slate-700 bg-slate-800 px-6 py-2 text-sm transition-all hover:bg-slate-700"
          @click="reset"
        >
          Reset
        </button>
      </div>
      
      <!-- Error -->
      <div v-if="error" class="mt-4 rounded-lg border border-red-500/50 bg-red-500/20 p-3 text-sm text-red-400">
        {{ error }}
      </div>
    </div>
    
    <!-- Loading -->
    <div v-if="loading" class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-12 text-center backdrop-blur-xl">
      <div class="mb-4 text-4xl animate-pulse">💎</div>
      <p class="text-slate-400">Fetching NFT metadata and analyzing rarity...</p>
    </div>
    
    <!-- Results -->
    <div v-if="nftData && rarityData && !loading" class="grid gap-6 lg:grid-cols-2">
      <!-- NFT Preview -->
      <div class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl">
        <h3 class="mb-4 text-lg font-semibold">NFT Preview</h3>
        <div class="relative aspect-square overflow-hidden rounded-xl bg-slate-900">
          <img
            :src="nftData.image"
            :alt="nftData.name"
            class="h-full w-full object-cover"
            @error="(e: any) => e.target.src = 'https://picsum.photos/400/400'"
          />
        </div>
        <h4 class="mt-4 text-lg font-semibold">{{ nftData.name }}</h4>
        <p class="text-sm text-slate-400 line-clamp-2">{{ nftData.description }}</p>
      </div>
      
      <!-- Rarity Score -->
      <div class="space-y-6">
        <!-- Overall Score -->
        <div class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl">
          <h3 class="mb-4 text-lg font-semibold">Rarity Score</h3>
          
          <div class="flex items-center justify-center mb-6">
            <div class="relative flex h-40 w-40 items-center justify-center">
              <!-- Background circle -->
              <svg class="absolute h-full w-full -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="currentColor"
                  stroke-width="12"
                  fill="none"
                  class="text-slate-700"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="currentColor"
                  stroke-width="12"
                  fill="none"
                  :stroke-dasharray="`${(rarityData.percentile / 100) * 440} 440`"
                  class="text-purple-500"
                />
              </svg>
              <div class="text-center">
                <div class="text-4xl font-bold">{{ rarityData.percentile }}</div>
                <div class="text-xs text-slate-400">Percentile</div>
              </div>
            </div>
          </div>
          
          <!-- Rank Badge -->
          <div class="flex justify-center">
            <span
              class="rounded-full border px-6 py-2 text-lg font-bold"
              :class="getRankBadge(rarityData.rank)"
            >
              {{ rarityData.rank }}
            </span>
          </div>
          
          <!-- Score Details -->
          <div class="mt-4 grid grid-cols-2 gap-4 text-center">
            <div class="rounded-lg bg-slate-900/50 p-3">
              <div class="text-2xl font-bold text-purple-400">{{ rarityData.score }}</div>
              <div class="text-xs text-slate-400">Score</div>
            </div>
            <div class="rounded-lg bg-slate-900/50 p-3">
              <div class="text-2xl font-bold text-slate-400">{{ rarityData.maxScore }}</div>
              <div class="text-xs text-slate-400">Max Possible</div>
            </div>
          </div>
        </div>
        
        <!-- Attribute Breakdown -->
        <div class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl">
          <h3 class="mb-4 text-lg font-semibold">Attribute Rarity</h3>
          <div class="space-y-3">
            <div
              v-for="attr in rarityData.attributes"
              :key="attr.trait_type"
              class="flex items-center justify-between rounded-lg bg-slate-900/50 p-3"
            >
              <div>
                <div class="font-medium">{{ attr.trait_type }}</div>
                <div class="text-sm text-slate-400">{{ attr.value }}</div>
              </div>
              <div class="text-right">
                <span
                  class="rounded-full border px-3 py-1 text-xs font-medium"
                  :class="getRankBadge(attr.rarity)"
                >
                  {{ attr.rarity }}
                </span>
                <div class="mt-1 text-xs text-slate-500">+{{ attr.score }} pts</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Empty State -->
    <div v-if="!nftData && !loading" class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-12 text-center backdrop-blur-xl">
      <div class="mb-4 text-5xl">🔍</div>
      <h3 class="mb-2 text-lg font-semibold">Analyze Your NFT</h3>
      <p class="text-sm text-slate-400">Enter a contract address and token ID to see rarity analysis</p>
    </div>
  </div>
</template>
