<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

// Types
interface PortfolioPosition {
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  chainId: number;
  quantity: number;
  currentPrice: number;
  currentValue: number;
  purchasePrice: number;
  totalCost: number;
  pnl: number;
  pnlPercent: number;
  isLoss: boolean;
  purchaseDate?: string;
}

interface HarvestingOpportunity {
  tokenAddress: string;
  tokenSymbol: string;
  quantity: number;
  currentValue: number;
  realizedLoss: number;
  taxSavings: number;
  recommendation: string;
}

interface TaxSummary {
  totalPortfolioValue: number;
  totalCostBasis: number;
  totalUnrealizedPnL: number;
  totalUnrealizedGains: number;
  totalUnrealizedLosses: number;
  harvestingOpportunities: number;
  potentialTaxSavings: number;
  lossPositions: number;
  gainPositions: number;
}

interface AddPositionForm {
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  chainId: number;
  purchasePrice: number;
  quantity: number;
  purchaseDate: string;
}

// State
const walletAddress = ref('');
const isLoading = ref(false);
const selectedChain = ref(1);
const positions = ref<PortfolioPosition[]>([]);
const summary = ref<TaxSummary | null>(null);
const opportunities = ref<HarvestingOpportunity[]>([]);
const showAddModal = ref(false);
const activeView = ref<'portfolio' | 'opportunities'>('portfolio');
const addForm = ref<AddPositionForm>({
  tokenAddress: '',
  tokenSymbol: '',
  tokenName: '',
  chainId: 1,
  purchasePrice: 0,
  quantity: 0,
  purchaseDate: new Date().toISOString().split('T')[0],
});

// Chain options
const chains = [
  { id: 1, name: 'Ethereum', symbol: 'ETH' },
  { id: 137, name: 'Polygon', symbol: 'MATIC' },
  { id: 42161, name: 'Arbitrum', symbol: 'ETH' },
  { id: 10, name: 'Optimism', symbol: 'ETH' },
];

// Tax rate (assumed)
const TAX_RATE = 0.25;

// Methods
const analyzePortfolio = async () => {
  if (!walletAddress.value) return;
  
  isLoading.value = true;
  
  try {
    // In production, this would call the backend API
    // For demo, generate mock data
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockPositions = generateMockPositions(walletAddress.value, selectedChain.value);
    positions.value = mockPositions;
    summary.value = calculateSummary(mockPositions);
    
    // Calculate harvesting opportunities
    opportunities.value = mockPositions
      .filter(p => p.isLoss && p.pnl < -10)
      .map(p => ({
        tokenAddress: p.tokenAddress,
        tokenSymbol: p.tokenSymbol,
        quantity: p.quantity,
        currentValue: p.currentValue,
        realizedLoss: Math.abs(p.pnl),
        taxSavings: Math.abs(p.pnl) * TAX_RATE,
        recommendation: generateRecommendation(p),
      }))
      .sort((a, b) => b.taxSavings - a.taxSavings);
  } catch (error) {
    console.error('Error analyzing portfolio:', error);
  } finally {
    isLoading.value = false;
  }
};

const generateMockPositions = (address: string, chainId: number): PortfolioPosition[] => {
  const tokens = [
    { symbol: 'ETH', name: 'Ethereum', cost: 2100 },
    { symbol: 'USDC', name: 'USD Coin', cost: 1.0 },
    { symbol: 'LINK', name: 'Chainlink', cost: 15 },
    { symbol: 'UNI', name: 'Uniswap', cost: 9 },
    { symbol: 'AAVE', name: 'Aave', cost: 300 },
    { symbol: 'MATIC', name: 'Polygon', cost: 1.1 },
    { symbol: 'ARB', name: 'Arbitrum', cost: 2.2 },
    { symbol: 'OP', name: 'Optimism', cost: 3.5 },
  ];
  
  const currentPrices: Record<string, number> = {
    ETH: 2450,
    USDC: 1,
    LINK: 14.5,
    UNI: 7.2,
    AAVE: 280,
    MATIC: 0.85,
    ARB: 1.8,
    OP: 3.2,
  };
  
  return tokens.map(token => {
    const quantity = Math.random() * 5 + 0.5;
    const currentPrice = currentPrices[token.symbol] || Math.random() * 100;
    const currentValue = quantity * currentPrice;
    const totalCost = quantity * token.cost;
    const pnl = currentValue - totalCost;
    const pnlPercent = (pnl / totalCost) * 100;
    
    return {
      tokenAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
      tokenSymbol: token.symbol,
      tokenName: token.name,
      chainId,
      quantity,
      currentPrice,
      currentValue,
      purchasePrice: token.cost,
      totalCost,
      pnl,
      pnlPercent,
      isLoss: pnl < 0,
      purchaseDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    };
  });
};

const calculateSummary = (positions: PortfolioPosition[]): TaxSummary => {
  const totalPortfolioValue = positions.reduce((sum, p) => sum + p.currentValue, 0);
  const totalCostBasis = positions.reduce((sum, p) => sum + p.totalCost, 0);
  const totalUnrealizedPnL = positions.reduce((sum, p) => sum + p.pnl, 0);
  const totalUnrealizedGains = positions.filter(p => p.pnl > 0).reduce((sum, p) => sum + p.pnl, 0);
  const totalUnrealizedLosses = positions.filter(p => p.pnl < 0).reduce((sum, p) => sum + p.pnl, 0);
  const lossPositions = positions.filter(p => p.isLoss).length;
  const gainPositions = positions.filter(p => !p.isLoss).length;
  
  return {
    totalPortfolioValue,
    totalCostBasis,
    totalUnrealizedPnL,
    totalUnrealizedGains,
    totalUnrealizedLosses,
    harvestingOpportunities: lossPositions,
    potentialTaxSavings: Math.abs(totalUnrealizedLosses) * TAX_RATE,
    lossPositions,
    gainPositions,
  };
};

const generateRecommendation = (position: PortfolioPosition): string => {
  const lossPercent = Math.abs(position.pnlPercent);
  
  if (lossPercent > 50) {
    return `⚠️ Heavy loss (${lossPercent.toFixed(1)}%). Strong candidate for tax-loss harvesting.`;
  } else if (lossPercent > 20) {
    return `Moderate loss (${lossPercent.toFixed(1)}%). Consider harvesting to offset gains.`;
  } else if (lossPercent > 10) {
    return `Small loss (${lossPercent.toFixed(1)}%). Hold for potential recovery.`;
  } else {
    return `Minimal loss (${lossPercent.toFixed(1)}%). Not a priority for harvesting.`;
  }
};

const addPosition = async () => {
  if (!addForm.value.tokenSymbol || !addForm.value.quantity) return;
  
  const currentPrices: Record<string, number> = {
    ETH: 2450, USDC: 1, LINK: 14.5, UNI: 7.2, AAVE: 280,
    MATIC: 0.85, ARB: 1.8, OP: 3.2, BTC: 65000, SOL: 120,
  };
  
  const currentPrice = currentPrices[addForm.value.tokenSymbol.toUpperCase()] || Math.random() * 100;
  const currentValue = addForm.value.quantity * currentPrice;
  const totalCost = addForm.value.quantity * addForm.value.purchasePrice;
  const pnl = currentValue - totalCost;
  const pnlPercent = (pnl / totalCost) * 100;
  
  const newPosition: PortfolioPosition = {
    tokenAddress: addForm.value.tokenAddress || `0x${Math.random().toString(16).substr(2, 40)}`,
    tokenSymbol: addForm.value.tokenSymbol.toUpperCase(),
    tokenName: addForm.value.tokenName || addForm.value.tokenSymbol,
    chainId: addForm.value.chainId,
    quantity: addForm.value.quantity,
    currentPrice,
    currentValue,
    purchasePrice: addForm.value.purchasePrice,
    totalCost,
    pnl,
    pnlPercent,
    isLoss: pnl < 0,
    purchaseDate: addForm.value.purchaseDate,
  };
  
  positions.value.push(newPosition);
  summary.value = calculateSummary(positions.value);
  
  // Update opportunities
  if (newPosition.isLoss && newPosition.pnl < -10) {
    opportunities.value.push({
      tokenAddress: newPosition.tokenAddress,
      tokenSymbol: newPosition.tokenSymbol,
      quantity: newPosition.quantity,
      currentValue: newPosition.currentValue,
      realizedLoss: Math.abs(newPosition.pnl),
      taxSavings: Math.abs(newPosition.pnl) * TAX_RATE,
      recommendation: generateRecommendation(newPosition),
    });
    opportunities.value.sort((a, b) => b.taxSavings - a.taxSavings);
  }
  
  showAddModal.value = false;
  addForm.value = {
    tokenAddress: '',
    tokenSymbol: '',
    tokenName: '',
    chainId: 1,
    purchasePrice: 0,
    quantity: 0,
    purchaseDate: new Date().toISOString().split('T')[0],
  };
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatPercent = (value: number): string => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
};

const totalPotentialSavings = computed(() => {
  return opportunities.value.reduce((sum, o) => sum + o.taxSavings, 0);
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-semibold text-white">🌾 Tax-Loss Harvester</h2>
          <p class="mt-1 text-sm text-slate-400">Identify tax-loss harvesting opportunities in your portfolio</p>
        </div>
        <div class="text-right">
          <p class="text-sm text-slate-400">Assumed Tax Rate</p>
          <p class="text-lg font-semibold text-white">25%</p>
        </div>
      </div>
    </div>

    <!-- Search Form -->
    <div class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl">
      <div class="grid gap-4 md:grid-cols-3">
        <div>
          <label class="mb-2 block text-sm text-slate-400">Wallet Address</label>
          <input
            v-model="walletAddress"
            type="text"
            placeholder="0x..."
            class="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
          />
        </div>
        <div>
          <label class="mb-2 block text-sm text-slate-400">Chain</label>
          <select
            v-model="selectedChain"
            class="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
          >
            <option v-for="chain in chains" :key="chain.id" :value="chain.id">
              {{ chain.name }} ({{ chain.symbol }})
            </option>
          </select>
        </div>
        <div class="flex items-end">
          <button
            :disabled="isLoading || !walletAddress"
            class="w-full rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 px-6 py-3 font-semibold text-white transition-all hover:from-purple-600 hover:to-blue-600 disabled:opacity-50"
            @click="analyzePortfolio"
          >
            {{ isLoading ? 'Analyzing...' : 'Analyze Portfolio' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Results -->
    <div v-if="summary" class="space-y-6">
      <!-- Summary Stats -->
      <div class="grid gap-4 md:grid-cols-4">
        <div class="border border-slate-700/50 rounded-xl bg-slate-800/50 p-4 backdrop-blur-xl">
          <p class="text-xs text-slate-400">Portfolio Value</p>
          <p class="text-xl font-bold text-white">{{ formatCurrency(summary.totalPortfolioValue) }}</p>
        </div>
        <div class="border border-slate-700/50 rounded-xl bg-slate-800/50 p-4 backdrop-blur-xl">
          <p class="text-xs text-slate-400">Cost Basis</p>
          <p class="text-xl font-bold text-white">{{ formatCurrency(summary.totalCostBasis) }}</p>
        </div>
        <div class="border border-slate-700/50 rounded-xl bg-slate-800/50 p-4 backdrop-blur-xl">
          <p class="text-xs text-slate-400">Unrealized P&L</p>
          <p class="text-xl font-bold" :class="summary.totalUnrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'">
            {{ formatCurrency(summary.totalUnrealizedPnL) }}
          </p>
        </div>
        <div class="border border-slate-700/50 rounded-xl bg-slate-800/50 p-4 backdrop-blur-xl">
          <p class="text-xs text-slate-400">Potential Tax Savings</p>
          <p class="text-xl font-bold text-purple-400">{{ formatCurrency(summary.potentialTaxSavings) }}</p>
        </div>
      </div>

      <!-- Gain/Loss Breakdown -->
      <div class="grid gap-4 md:grid-cols-2">
        <div class="border border-slate-700/50 rounded-xl bg-slate-800/50 p-4 backdrop-blur-xl">
          <p class="text-sm text-slate-400">Gains ({{ summary.gainPositions }} positions)</p>
          <p class="text-lg font-bold text-green-400">{{ formatCurrency(summary.totalUnrealizedGains) }}</p>
        </div>
        <div class="border border-slate-700/50 rounded-xl bg-slate-800/50 p-4 backdrop-blur-xl">
          <p class="text-sm text-slate-400">Losses ({{ summary.lossPositions }} positions)</p>
          <p class="text-lg font-bold text-red-400">{{ formatCurrency(summary.totalUnrealizedLosses) }}</p>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex gap-4 border-b border-slate-700">
        <button
          class="border-b-2 px-4 py-2 text-sm font-medium transition-colors"
          :class="activeView === 'portfolio' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-400 hover:text-white'"
          @click="activeView = 'portfolio'"
        >
          📊 Portfolio ({{ positions.length }})
        </button>
        <button
          class="border-b-2 px-4 py-2 text-sm font-medium transition-colors"
          :class="activeView === 'opportunities' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-400 hover:text-white'"
          @click="activeView = 'opportunities'"
        >
          🌾 Opportunities ({{ opportunities.length }})
        </button>
        <button
          class="ml-auto border border-slate-600 rounded-lg px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 transition-colors"
          @click="showAddModal = true"
        >
          + Add Position
        </button>
      </div>

      <!-- Portfolio Table -->
      <div v-show="activeView === 'portfolio'" class="border border-slate-700/50 rounded-2xl bg-slate-800/50 overflow-hidden backdrop-blur-xl">
        <table class="w-full">
          <thead class="border-b border-slate-700 bg-slate-900/50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase text-slate-400">Token</th>
              <th class="px-4 py-3 text-right text-xs font-medium uppercase text-slate-400">Quantity</th>
              <th class="px-4 py-3 text-right text-xs font-medium uppercase text-slate-400">Current Price</th>
              <th class="px-4 py-3 text-right text-xs font-medium uppercase text-slate-400">Value</th>
              <th class="px-4 py-3 text-right text-xs font-medium uppercase text-slate-400">Cost Basis</th>
              <th class="px-4 py-3 text-right text-xs font-medium uppercase text-slate-400">P&L</th>
              <th class="px-4 py-3 text-right text-xs font-medium uppercase text-slate-400">P&L %</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-700">
            <tr v-for="position in positions" :key="position.tokenAddress" class="hover:bg-slate-700/30">
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <span class="text-lg">{{ position.tokenSymbol === 'ETH' ? '🔷' : position.tokenSymbol === 'USDC' ? '💵' : '🪙' }}</span>
                  <div>
                    <p class="font-medium text-white">{{ position.tokenSymbol }}</p>
                    <p class="text-xs text-slate-400">{{ position.tokenName }}</p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3 text-right text-slate-300">{{ position.quantity.toFixed(4) }}</td>
              <td class="px-4 py-3 text-right text-slate-300">{{ formatCurrency(position.currentPrice) }}</td>
              <td class="px-4 py-3 text-right text-white font-medium">{{ formatCurrency(position.currentValue) }}</td>
              <td class="px-4 py-3 text-right text-slate-300">{{ formatCurrency(position.totalCost) }}</td>
              <td class="px-4 py-3 text-right font-medium" :class="position.pnl >= 0 ? 'text-green-400' : 'text-red-400'">
                {{ formatCurrency(position.pnl) }}
              </td>
              <td class="px-4 py-3 text-right font-medium" :class="position.pnlPercent >= 0 ? 'text-green-400' : 'text-red-400'">
                {{ formatPercent(position.pnlPercent) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Harvesting Opportunities -->
      <div v-show="activeView === 'opportunities'" class="space-y-4">
        <div v-if="opportunities.length === 0" class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-8 text-center backdrop-blur-xl">
          <div class="text-4xl mb-4">✅</div>
          <p class="text-lg font-medium text-white">No harvesting opportunities found</p>
          <p class="text-sm text-slate-400 mt-2">Your portfolio doesn't have any significant losses to harvest</p>
        </div>
        
        <div
          v-for="opp in opportunities"
          :key="opp.tokenAddress"
          class="border border-slate-700/50 rounded-xl bg-slate-800/50 p-4 backdrop-blur-xl hover:border-red-500/50 transition-colors"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <span class="text-2xl">🪙</span>
              <div>
                <p class="font-semibold text-white">{{ opp.tokenSymbol }}</p>
                <p class="text-sm text-slate-400">{{ opp.quantity.toFixed(4) }} tokens</p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-sm text-slate-400">Realized Loss</p>
              <p class="text-lg font-bold text-red-400">-{{ formatCurrency(opp.realizedLoss) }}</p>
            </div>
            <div class="text-right">
              <p class="text-sm text-slate-400">Tax Savings</p>
              <p class="text-lg font-bold text-purple-400">{{ formatCurrency(opp.taxSavings) }}</p>
            </div>
          </div>
          <p class="mt-3 text-sm text-slate-300">{{ opp.recommendation }}</p>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!summary && !isLoading" class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-12 text-center backdrop-blur-xl">
      <div class="text-6xl mb-4">🌾</div>
      <p class="text-lg text-slate-300">Enter a wallet address to analyze tax-loss harvesting opportunities</p>
      <p class="mt-2 text-sm text-slate-500">Supports ETH, Polygon, Arbitrum, and Optimism</p>
    </div>

    <!-- Add Position Modal -->
    <div v-if="showAddModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div class="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-800 p-6">
        <h3 class="text-lg font-semibold text-white">Add Manual Position</h3>
        <p class="mt-1 text-sm text-slate-400">Add a position to track tax-loss harvesting opportunities</p>
        
        <div class="mt-6 space-y-4">
          <div>
            <label class="mb-2 block text-sm text-slate-400">Token Symbol</label>
            <input
              v-model="addForm.tokenSymbol"
              type="text"
              placeholder="e.g., ETH, LINK, UNI"
              class="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
            />
          </div>
          <div>
            <label class="mb-2 block text-sm text-slate-400">Quantity</label>
            <input
              v-model.number="addForm.quantity"
              type="number"
              step="0.0001"
              placeholder="0.0"
              class="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
            />
          </div>
          <div>
            <label class="mb-2 block text-sm text-slate-400">Purchase Price (USD)</label>
            <input
              v-model.number="addForm.purchasePrice"
              type="number"
              step="0.01"
              placeholder="0.00"
              class="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
            />
          </div>
          <div>
            <label class="mb-2 block text-sm text-slate-400">Purchase Date</label>
            <input
              v-model="addForm.purchaseDate"
              type="date"
              class="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
            />
          </div>
        </div>
        
        <div class="mt-6 flex gap-3">
          <button
            class="flex-1 rounded-lg border border-slate-600 px-4 py-3 text-slate-300 hover:bg-slate-700"
            @click="showAddModal = false"
          >
            Cancel
          </button>
          <button
            class="flex-1 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 px-4 py-3 font-semibold text-white"
            @click="addPosition"
          >
            Add Position
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
