<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';

// State
const activeTab = ref('protocols');
const loading = ref(false);
const error = ref('');
const walletAddress = ref('');
const portfolioValue = ref(100000);

// Data
const protocols = ref<any[]>([]);
const marketStats = ref<any>(null);
const claimsHistory = ref<any[]>([]);
const walletCoverage = ref<any[]>([]);
const recommendations = ref<any[]>([]);
const providerComparison = ref<any[]>([]);

// Premium calculator
const coverageAmount = ref(50000);
const selectedProtocol = ref('uniswap-v3');
const duration = ref(365);
const premiumResult = ref<any>(null);

// API Base URL
const API_BASE = 'http://localhost:3000/api/web3/insurance';

// Load data
const loadProtocols = async () => {
  loading.value = true;
  error.value = '';
  try {
    const response = await fetch(`${API_BASE}/protocols`);
    protocols.value = await response.json();
  } catch (e: any) {
    error.value = 'Failed to load protocols';
    // Use mock data as fallback
    protocols.value = [
      { name: 'Nexus Mutual', logo: '🛡️', chain: 'ETH', TVL: '$320M', coverage: '$1.2B', avgPremium: '2.5%', claimsPaid: '$45M', description: 'Decentralized insurance protocol covering smart contract failures' },
      { name: 'Cover Protocol', logo: '📒', chain: 'ETH', TVL: '$45M', coverage: '$180M', avgPremium: '3.2%', claimsPaid: '$8M', description: 'Peer-to-peer coverage for DeFi protocols' },
      { name: 'InsurAce', logo: '🌂', chain: 'Multi', TVL: '$120M', coverage: '$500M', avgPremium: '2.8%', claimsPaid: '$12M', description: 'Cross-chain DeFi insurance with portfolio protection' },
      { name: 'Armor', logo: '🦾', chain: 'ETH', TVL: '$25M', coverage: '$90M', avgPremium: '4.1%', claimsPaid: '$3M', description: 'NFT-based coverage for DeFi positions' },
      { name: 'Unslashed', logo: '⚔️', chain: 'ETH', TVL: '$18M', coverage: '$65M', avgPremium: '3.5%', claimsPaid: '$2.5M', description: 'Community-curated insurance pool' },
      { name: 'Tidal Finance', logo: '🌊', chain: 'Multi', TVL: '$35M', coverage: '$150M', avgPremium: '2.9%', claimsPaid: '$5M', description: 'Multi-chain insurance with parametric covers' },
    ];
  }
  loading.value = false;
};

const loadMarketStats = async () => {
  try {
    const response = await fetch(`${API_BASE}/stats`);
    marketStats.value = await response.json();
  } catch (e) {
    marketStats.value = {
      totalTVL: '$563M',
      totalCoverage: '$2.19B',
      totalClaimsPaid: '$75.5M',
      avgPremium: '3.0%',
      activePolicies: '12,450',
      protocolsCount: 6,
      chains: ['Ethereum', 'Polygon', 'Arbitrum', 'Optimism', 'Avalanche'],
      growth24h: '+5.2%',
    };
  }
};

const loadClaimsHistory = async () => {
  try {
    const response = await fetch(`${API_BASE}/claims`);
    claimsHistory.value = await response.json();
  } catch (e) {
    claimsHistory.value = [
      { protocol: 'Harvest Finance', amount: '$3.2M', reason: 'Smart Contract Exploit', date: '2024-10-26', status: 'Paid' },
      { protocol: 'EasyFi', amount: '$1.8M', reason: 'Private Key Compromise', date: '2024-04-19', status: 'Paid' },
      { protocol: 'Cream Finance', amount: '$1.5M', reason: 'Flash Loan Attack', date: '2024-08-30', status: 'Paid' },
      { protocol: 'BadgerDAO', amount: '$1.2M', reason: 'Bridge Exploit', date: '2024-12-02', status: 'Paid' },
      { protocol: 'Rari Capital', amount: '$800K', reason: 'Smart Contract Bug', date: '2024-05-15', status: 'Paid' },
    ];
  }
};

const loadWalletCoverage = async () => {
  if (!walletAddress.value) {
    error.value = 'Please enter a wallet address';
    return;
  }
  loading.value = true;
  try {
    const response = await fetch(`${API_BASE}/coverage/${walletAddress.value}`);
    walletCoverage.value = await response.json();
  } catch (e) {
    walletCoverage.value = [
      { protocol: 'Uniswap V3', coveredAmount: '50,000 USDC', premium: '125 USDC/year', coverageEndDate: '2026-06-15', status: 'active', protectionType: 'Smart Contract' },
      { protocol: 'Aave V3', coveredAmount: '100,000 USDC', premium: '250 USDC/year', coverageEndDate: '2026-09-20', status: 'active', protectionType: 'Liquidation' },
      { protocol: 'Compound', coveredAmount: '25,000 USDC', premium: '75 USDC/year', coverageEndDate: '2025-12-01', status: 'expired', protectionType: 'Smart Contract' },
    ];
  }
  loading.value = false;
};

const loadRecommendations = async () => {
  try {
    const response = await fetch(`${API_BASE}/recommendations?portfolioValue=${portfolioValue.value}`);
    recommendations.value = await response.json();
  } catch (e) {
    recommendations.value = [
      { type: 'DEX LP', protocols: ['Uniswap', 'Curve', 'SushiSwap'], recommendedCoverage: '$30,000 - $50,000', estimatedPremium: '$900/year', riskLevel: 'Medium' },
      { type: 'Lending', protocols: ['Aave', 'Compound', 'Morpho'], recommendedCoverage: '$40,000 - $60,000', estimatedPremium: '$1,200/year', riskLevel: 'High' },
      { type: 'Staking', protocols: ['Lido', 'Rocket Pool', 'Stakewise'], recommendedCoverage: '$20,000 - $30,000', estimatedPremium: '$600/year', riskLevel: 'Low' },
      { type: 'Yield Farm', protocols: ['Yearn', 'Convex', 'Gearbox'], recommendedCoverage: '$50,000 - $80,000', estimatedPremium: '$1,500/year', riskLevel: 'High' },
    ];
  }
};

const loadProviderComparison = async () => {
  loading.value = true;
  try {
    const response = await fetch(`${API_BASE}/compare?protocol=${selectedProtocol.value}&coverageAmount=${coverageAmount.value}`);
    providerComparison.value = await response.json();
  } catch (e) {
    providerComparison.value = [
      { name: 'Nexus Mutual', logo: '🛡️', premium: '$1,250/year', premiumPercent: '2.5%', coverageLimit: 75000, claimsProcess: '7 days', rating: '4.5', features: ['DAO Governance', 'Capital Efficient'] },
      { name: 'InsurAce', logo: '🌂', premium: '$1,400/year', premiumPercent: '2.8%', coverageLimit: 75000, claimsProcess: '14 days', rating: '4.2', features: ['Cross-chain', 'Instant Claims'] },
      { name: 'Cover Protocol', logo: '📒', premium: '$1,600/year', premiumPercent: '3.2%', coverageLimit: 75000, claimsProcess: '7 days', rating: '3.9', features: ['NFT Coverage', 'Community Pool'] },
    ];
  }
  loading.value = false;
};

const calculatePremium = async () => {
  try {
    const response = await fetch(`${API_BASE}/premium`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        coverageAmount: coverageAmount.value,
        protocol: selectedProtocol.value,
        duration: duration.value,
      }),
    });
    premiumResult.value = await response.json();
  } catch (e) {
    const rates: Record<string, number> = {
      'uniswap-v3': 0.025,
      'aave-v3': 0.025,
      compound: 0.03,
      'curve-pool': 0.02,
      'lido': 0.035,
      default: 0.03,
    };
    const rate = rates[selectedProtocol.value] || rates.default;
    premiumResult.value = {
      premium: Math.round(coverageAmount.value * rate * (duration.value / 365) * 100) / 100,
      premiumPercent: rate * 100,
    };
  }
};

// Lifecycle
onMounted(() => {
  loadProtocols();
  loadMarketStats();
  loadClaimsHistory();
  loadRecommendations();
});

// Tab options
const tabs = [
  { id: 'protocols', label: 'Protocols', icon: '🛡️' },
  { id: 'stats', label: 'Market Stats', icon: '📊' },
  { id: 'coverage', label: 'My Coverage', icon: '💼' },
  { id: 'calculator', label: 'Calculator', icon: '🧮' },
  { id: 'compare', label: 'Compare', icon: '⚖️' },
  { id: 'claims', label: 'Claims', icon: '📋' },
  { id: 'recommend', label: 'Recommendations', icon: '💡' },
];

const protocolOptions = [
  { value: 'uniswap-v3', label: 'Uniswap V3' },
  { value: 'aave-v3', label: 'Aave V3' },
  { value: 'compound', label: 'Compound' },
  { value: 'curve-pool', label: 'Curve Pool' },
  { value: 'lido', label: 'Lido' },
];

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    active: 'text-green-400',
    expired: 'text-yellow-400',
    claimed: 'text-blue-400',
    Paid: 'text-green-400',
  };
  return colors[status] || 'text-gray-400';
};

const getRiskColor = (risk: string) => {
  const colors: Record<string, string> = {
    High: 'text-red-400',
    Medium: 'text-yellow-400',
    Low: 'text-green-400',
  };
  return colors[risk] || 'text-gray-400';
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-white">🛡️ DeFi Insurance Tracker</h2>
        <p class="text-slate-400">Track and manage your DeFi insurance coverage</p>
      </div>
    </div>

    <!-- Error Alert -->
    <div v-if="error" class="rounded-lg bg-red-500/20 border border-red-500/50 p-4 text-red-300">
      {{ error }}
    </div>

    <!-- Tab Navigation -->
    <div class="flex gap-2 overflow-x-auto pb-2">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all"
        :class="activeTab === tab.id 
          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50' 
          : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50'"
        @click="activeTab = tab.id"
      >
        <span class="mr-2">{{ tab.icon }}</span>
        {{ tab.label }}
      </button>
    </div>

    <!-- Protocols Tab -->
    <div v-show="activeTab === 'protocols'" class="space-y-4">
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="protocol in protocols"
          :key="protocol.name"
          class="rounded-xl border border-slate-700/50 bg-slate-800/50 p-5 backdrop-blur-xl transition-all hover:border-purple-500/30"
        >
          <div class="mb-4 flex items-center gap-3">
            <span class="text-3xl">{{ protocol.logo }}</span>
            <div>
              <h3 class="font-semibold text-white">{{ protocol.name }}</h3>
              <span class="text-xs text-slate-400">{{ protocol.chain }}</span>
            </div>
          </div>
          
          <p class="mb-4 text-sm text-slate-300">{{ protocol.description }}</p>
          
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span class="text-slate-400">TVL</span>
              <p class="font-semibold text-white">{{ protocol.TVL }}</p>
            </div>
            <div>
              <span class="text-slate-400">Coverage</span>
              <p class="font-semibold text-white">{{ protocol.coverage }}</p>
            </div>
            <div>
              <span class="text-slate-400">Avg Premium</span>
              <p class="font-semibold text-green-400">{{ protocol.avgPremium }}</p>
            </div>
            <div>
              <span class="text-slate-400">Claims Paid</span>
              <p class="font-semibold text-blue-400">{{ protocol.claimsPaid }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Market Stats Tab -->
    <div v-show="activeTab === 'stats'" class="space-y-6">
      <div v-if="marketStats" class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div class="rounded-xl border border-slate-700/50 bg-slate-800/50 p-5 backdrop-blur-xl">
          <p class="text-sm text-slate-400">Total TVL</p>
          <p class="text-2xl font-bold text-white">{{ marketStats.totalTVL }}</p>
        </div>
        <div class="rounded-xl border border-slate-700/50 bg-slate-800/50 p-5 backdrop-blur-xl">
          <p class="text-sm text-slate-400">Total Coverage</p>
          <p class="text-2xl font-bold text-white">{{ marketStats.totalCoverage }}</p>
        </div>
        <div class="rounded-xl border border-slate-700/50 bg-slate-800/50 p-5 backdrop-blur-xl">
          <p class="text-sm text-slate-400">Claims Paid</p>
          <p class="text-2xl font-bold text-green-400">{{ marketStats.totalClaimsPaid }}</p>
        </div>
        <div class="rounded-xl border border-slate-700/50 bg-slate-800/50 p-5 backdrop-blur-xl">
          <p class="text-sm text-slate-400">24h Growth</p>
          <p class="text-2xl font-bold text-green-400">{{ marketStats.growth24h }}</p>
        </div>
      </div>

      <div class="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6 backdrop-blur-xl">
        <h3 class="mb-4 text-lg font-semibold text-white">Supported Chains</h3>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="chain in marketStats?.chains"
            :key="chain"
            class="rounded-full bg-slate-700/50 px-4 py-2 text-sm text-slate-300"
          >
            {{ chain }}
          </span>
        </div>
      </div>

      <div class="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6 backdrop-blur-xl">
        <h3 class="mb-4 text-lg font-semibold text-white">📈 Market Overview</h3>
        <div class="h-48 flex items-end gap-2">
          <div
            v-for="(month, index) in ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar']"
            :key="month"
            class="flex-1 rounded-t-lg bg-gradient-to-t from-purple-600 to-purple-400 transition-all hover:from-purple-500 hover:to-purple-300"
            :style="{ height: `${40 + index * 12}%` }"
          >
            <span class="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-slate-400">{{ month }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- My Coverage Tab -->
    <div v-show="activeTab === 'coverage'" class="space-y-4">
      <div class="flex gap-4">
        <input
          v-model="walletAddress"
          type="text"
          placeholder="Enter wallet address (0x...)"
          class="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
        />
        <button
          class="rounded-lg bg-purple-600 px-6 py-3 font-semibold text-white transition-all hover:bg-purple-500"
          @click="loadWalletCoverage"
        >
          Check Coverage
        </button>
      </div>

      <div v-if="walletCoverage.length > 0" class="space-y-3">
        <div
          v-for="(position, index) in walletCoverage"
          :key="index"
          class="rounded-xl border border-slate-700/50 bg-slate-800/50 p-5 backdrop-blur-xl"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="text-2xl">📋</span>
              <div>
                <h4 class="font-semibold text-white">{{ position.protocol }}</h4>
                <p class="text-sm text-slate-400">{{ position.protectionType }}</p>
              </div>
            </div>
            <span :class="['text-sm font-medium', getStatusColor(position.status)]">
              {{ position.status.toUpperCase() }}
            </span>
          </div>
          
          <div class="mt-4 grid grid-cols-3 gap-4 text-sm">
            <div>
              <span class="text-slate-400">Covered Amount</span>
              <p class="font-semibold text-white">{{ position.coveredAmount }}</p>
            </div>
            <div>
              <span class="text-slate-400">Premium</span>
              <p class="font-semibold text-green-400">{{ position.premium }}</p>
            </div>
            <div>
              <span class="text-slate-400">Expires</span>
              <p class="font-semibold text-white">{{ position.coverageEndDate }}</p>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="rounded-xl border border-slate-700/50 bg-slate-800/50 p-12 text-center">
        <div class="mb-4 text-5xl">💼</div>
        <p class="text-slate-400">Enter your wallet address to check coverage</p>
      </div>
    </div>

    <!-- Calculator Tab -->
    <div v-show="activeTab === 'calculator'" class="space-y-6">
      <div class="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6 backdrop-blur-xl">
        <h3 class="mb-6 text-lg font-semibold text-white">🧮 Premium Calculator</h3>
        
        <div class="grid gap-6 md:grid-cols-2">
          <div>
            <label class="mb-2 block text-sm text-slate-400">Coverage Amount (USD)</label>
            <input
              v-model.number="coverageAmount"
              type="number"
              class="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
            />
          </div>
          
          <div>
            <label class="mb-2 block text-sm text-slate-400">Protocol</label>
            <select
              v-model="selectedProtocol"
              class="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
            >
              <option v-for="opt in protocolOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>
          
          <div>
            <label class="mb-2 block text-sm text-slate-400">Duration (days)</label>
            <input
              v-model.number="duration"
              type="number"
              class="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
            />
          </div>
          
          <div class="flex items-end">
            <button
              class="w-full rounded-lg bg-purple-600 py-3 font-semibold text-white transition-all hover:bg-purple-500"
              @click="calculatePremium"
            >
              Calculate Premium
            </button>
          </div>
        </div>

        <div v-if="premiumResult" class="mt-6 rounded-xl bg-slate-900/50 p-6">
          <div class="text-center">
            <p class="text-sm text-slate-400">Estimated Premium</p>
            <p class="text-4xl font-bold text-green-400">${{ premiumResult.premium.toLocaleString() }}</p>
            <p class="mt-2 text-slate-400">{{ premiumResult.premiumPercent.toFixed(1) }}% of coverage</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Compare Tab -->
    <div v-show="activeTab === 'compare'" class="space-y-6">
      <div class="flex gap-4">
        <select
          v-model="selectedProtocol"
          class="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
        >
          <option v-for="opt in protocolOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
        
        <input
          v-model.number="coverageAmount"
          type="number"
          placeholder="Coverage amount"
          class="w-48 rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
        />
        
        <button
          class="rounded-lg bg-purple-600 px-6 py-3 font-semibold text-white transition-all hover:bg-purple-500"
          @click="loadProviderComparison"
        >
          Compare
        </button>
      </div>

      <div v-if="providerComparison.length > 0" class="space-y-4">
        <div
          v-for="(provider, index) in providerComparison"
          :key="provider.name"
          class="rounded-xl border border-slate-700/50 bg-slate-800/50 p-5 backdrop-blur-xl"
          :class="{ 'border-purple-500/50': index === 0 }"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <span v-if="index === 0" class="rounded-full bg-yellow-500/20 px-3 py-1 text-xs font-bold text-yellow-400">
                BEST
              </span>
              <span class="text-3xl">{{ provider.logo }}</span>
              <div>
                <h4 class="font-semibold text-white">{{ provider.name }}</h4>
                <div class="flex items-center gap-1 text-sm text-slate-400">
                  <span>⭐</span>
                  <span>{{ provider.rating }}</span>
                  <span class="ml-2">{{ provider.claimsProcess }}</span>
                </div>
              </div>
            </div>
            
            <div class="text-right">
              <p class="text-2xl font-bold text-green-400">{{ provider.premium }}</p>
              <p class="text-sm text-slate-400">{{ provider.premiumPercent }}</p>
            </div>
          </div>
          
          <div class="mt-4 flex flex-wrap gap-2">
            <span
              v-for="feature in provider.features"
              :key="feature"
              class="rounded-full bg-slate-700/50 px-3 py-1 text-xs text-slate-300"
            >
              {{ feature }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Claims Tab -->
    <div v-show="activeTab === 'claims'" class="space-y-4">
      <div class="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6 backdrop-blur-xl">
        <h3 class="mb-4 text-lg font-semibold text-white">📋 Historical Claims</h3>
        
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-slate-700">
                <th class="pb-3 text-left text-sm text-slate-400">Protocol</th>
                <th class="pb-3 text-left text-sm text-slate-400">Amount</th>
                <th class="pb-3 text-left text-sm text-slate-400">Reason</th>
                <th class="pb-3 text-left text-sm text-slate-400">Date</th>
                <th class="pb-3 text-left text-sm text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="claim in claimsHistory"
                :key="claim.protocol + claim.date"
                class="border-b border-slate-700/50"
              >
                <td class="py-4 text-white">{{ claim.protocol }}</td>
                <td class="py-4 font-semibold text-red-400">{{ claim.amount }}</td>
                <td class="py-4 text-slate-300">{{ claim.reason }}</td>
                <td class="py-4 text-slate-400">{{ claim.date }}</td>
                <td class="py-4">
                  <span :class="['text-sm font-medium', getStatusColor(claim.status)]">
                    {{ claim.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Recommendations Tab -->
    <div v-show="activeTab === 'recommend'" class="space-y-6">
      <div class="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6 backdrop-blur-xl">
        <div class="mb-6 flex items-center gap-4">
          <label class="text-sm text-slate-400">Portfolio Value:</label>
          <input
            v-model.number="portfolioValue"
            type="number"
            class="w-48 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
          />
          <button
            class="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-purple-500"
            @click="loadRecommendations"
          >
            Update
          </button>
        </div>

        <div class="space-y-4">
          <div
            v-for="rec in recommendations"
            :key="rec.type"
            class="rounded-xl border border-slate-700/50 bg-slate-900/50 p-5"
          >
            <div class="flex items-center justify-between">
              <div>
                <h4 class="font-semibold text-white">{{ rec.type }}</h4>
                <p class="text-sm text-slate-400">Recommended: {{ rec.recommendedCoverage }}</p>
              </div>
              <div class="text-right">
                <span :class="['text-sm font-medium', getRiskColor(rec.riskLevel)]">
                  {{ rec.riskLevel }} Risk
                </span>
                <p class="text-sm text-green-400">{{ rec.estimatedPremium }}</p>
              </div>
            </div>
            
            <div class="mt-3 flex flex-wrap gap-2">
              <span
                v-for="protocol in rec.protocols"
                :key="protocol"
                class="rounded-full bg-slate-700/50 px-3 py-1 text-xs text-slate-300"
              >
                {{ protocol }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
