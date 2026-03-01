<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useWeb3 } from '@/composables/web3/useWeb3';

interface YieldPosition {
  id: string;
  protocol: string;
  pool: string;
  token: string;
  deposited: number;
  currentValue: number;
  apy: number;
  pnl: number;
  pnlPercent: number;
  chainId: number;
  tokenAddress: string;
  poolAddress: string;
}

interface YieldStats {
  totalDeposited: number;
  totalValue: number;
  totalPnL: number;
  totalPnLPercent: number;
  averageApy: number;
  positions: YieldPosition[];
}

interface YieldHistory {
  date: string;
  value: number;
  pnl: number;
}

interface Protocol {
  name: string;
  logo: string;
  chains: number[];
  tokens: string[];
  avgApy: string;
}

const { account } = useWeb3();

const loading = ref(false);
const error = ref('');
const stats = ref<YieldStats | null>(null);
const history = ref<YieldHistory[]>([]);
const protocols = ref<Protocol[]>([]);
const activeView = ref<'dashboard' | 'positions' | 'protocols'>('dashboard');
const selectedChain = ref<number | null>(null);

// Form for adding new position
const showAddModal = ref(false);
const newPosition = ref({
  protocol: '',
  pool: '',
  token: '',
  deposited: 0,
  chainId: 1,
  tokenAddress: '',
  poolAddress: ''
});

const fetchYieldStats = async () => {
  if (!account.value) {
    // Use demo address for testing
    account.value = '0x0000000000000000000000000000000000000000';
  }
  
  loading.value = true;
  error.value = '';
  
  try {
    const url = `http://localhost:3000/api/web3/yield/stats/${account.value}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch yield stats');
    stats.value = await response.json();
  } catch (e: any) {
    error.value = e.message;
    // Use mock data if API fails
    stats.value = {
      totalDeposited: 55000,
      totalValue: 63750,
      totalPnL: 8750,
      totalPnLPercent: 15.91,
      averageApy: 6.84,
      positions: [
        {
          id: '1',
          protocol: 'Aave',
          pool: 'USDC Supply',
          token: 'USDC',
          deposited: 10000,
          currentValue: 10450,
          apy: 4.5,
          pnl: 450,
          pnlPercent: 4.5,
          chainId: 1,
          tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          poolAddress: '0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9'
        },
        {
          id: '2',
          protocol: 'Uniswap',
          pool: 'ETH/USDC',
          token: 'LP Token',
          deposited: 25000,
          currentValue: 28500,
          apy: 12.8,
          pnl: 3500,
          pnlPercent: 14.0,
          chainId: 1,
          tokenAddress: '0x4e68cC8e6d4D3e3d24d7A1E2a3E5f8B9C0d1e2F3',
          poolAddress: '0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8'
        },
        {
          id: '3',
          protocol: 'Compound',
          pool: 'ETH Collateral',
          token: 'ETH',
          deposited: 5,
          currentValue: 5.8,
          apy: 3.2,
          pnl: 0.8,
          pnlPercent: 16.0,
          chainId: 1,
          tokenAddress: '0x0000000000000000000000000000000000000000',
          poolAddress: '0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B'
        },
        {
          id: '4',
          protocol: 'Curve',
          pool: 'stETH/ETH',
          token: 'crvETH',
          deposited: 15000,
          currentValue: 16800,
          apy: 8.5,
          pnl: 1800,
          pnlPercent: 12.0,
          chainId: 1,
          tokenAddress: '0x06325440a0149f7e15f3d6b30027d5a59f4ed0a5',
          poolAddress: '0xDC24316b9AE028F1497c275EB9192a3Ea0f67022'
        },
        {
          id: '5',
          protocol: 'Lido',
          pool: 'stETH',
          token: 'stETH',
          deposited: 8,
          currentValue: 9.2,
          apy: 5.2,
          pnl: 1.2,
          pnlPercent: 15.0,
          chainId: 1,
          tokenAddress: '0xae7ab96520de3a18e5e111b5eaab095312d7fe84',
          poolAddress: '0xae7ab96520de3a18e5e111b5eaab095312d7fe84'
        }
      ]
    };
  } finally {
    loading.value = false;
  }
};

const fetchHistory = async () => {
  if (!account.value) return;
  
  try {
    const url = `http://localhost:3000/api/web3/yield/history/${account.value}?days=30`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch history');
    history.value = await response.json();
  } catch (e) {
    // Generate mock data
    const mockHistory: YieldHistory[] = [];
    const now = new Date();
    let baseValue = 50000;
    for (let i = 30; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      baseValue *= 1 + (Math.random() * 0.01 - 0.002);
      mockHistory.push({
        date: date.toISOString().split('T')[0],
        value: baseValue,
        pnl: baseValue - 50000
      });
    }
    history.value = mockHistory;
  }
};

const fetchProtocols = async () => {
  try {
    const url = 'http://localhost:3000/api/web3/yield/protocols';
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch protocols');
    protocols.value = await response.json();
  } catch (e) {
    protocols.value = [
      { name: 'Aave', logo: '👻', chains: [1, 137, 42161], tokens: ['USDC', 'USDT', 'ETH', 'WBTC', 'DAI'], avgApy: '3-8%' },
      { name: 'Uniswap', logo: '🦄', chains: [1, 137, 42161, 8453], tokens: ['ETH', 'USDC', 'USDT', 'WBTC'], avgApy: '5-25%' },
      { name: 'Compound', logo: '🔷', chains: [1, 137], tokens: ['USDC', 'USDT', 'ETH', 'WBTC', 'DAI'], avgApy: '2-5%' },
      { name: 'Curve', logo: '💚', chains: [1, 137], tokens: ['ETH', 'stETH', 'WBTC', 'USDC'], avgApy: '2-15%' },
      { name: 'Lido', logo: '🧤', chains: [1], tokens: ['ETH', 'stETH'], avgApy: '4-6%' },
      { name: 'Yearn', logo: '🎩', chains: [1, 137], tokens: ['USDC', 'USDT', 'ETH', 'WBTC'], avgApy: '5-20%' },
      { name: 'Gearbox', logo: '⚙️', chains: [1], tokens: ['USDC', 'ETH', 'WBTC'], avgApy: '5-30%' },
      { name: 'Morpho', logo: '🟣', chains: [1, 137], tokens: ['USDC', 'ETH', 'WBTC'], avgApy: '3-10%' }
    ];
  }
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

const formatPercent = (value: number): string => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
};

const getChainName = (chainId: number): string => {
  const chains: Record<number, string> = {
    1: 'Ethereum',
    5: 'Goerli',
    137: 'Polygon',
    80001: 'Mumbai',
    42161: 'Arbitrum',
    8453: 'Base'
  };
  return chains[chainId] || `Chain ${chainId}`;
};

const getProtocolColor = (protocol: string): string => {
  const colors: Record<string, string> = {
    'Aave': '#2EBAC6',
    'Uniswap': '#FF007A',
    'Compound': '#00D395',
    'Curve': '#FFD700',
    'Lido': '#00A3FF',
    'Yearn': '#FAB005',
    'Gearbox': '#7B61FF',
    'Morpho': '#FF5C00'
  };
  return colors[protocol] || '#888';
};

const removePosition = async (id: string) => {
  try {
    await fetch(`http://localhost:3000/api/web3/yield/positions/${id}`, {
      method: 'DELETE'
    });
    await fetchYieldStats();
  } catch (e) {
    // Remove locally
    if (stats.value) {
      stats.value.positions = stats.value.positions.filter(p => p.id !== id);
    }
  }
};

onMounted(() => {
  fetchYieldStats();
  fetchHistory();
  fetchProtocols();
});

watch(account, () => {
  if (account.value) {
    fetchYieldStats();
    fetchHistory();
  }
});
</script>

<template>
  <div class="yield-tracker">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-xl font-bold text-white">Yield Tracker</h2>
        <p class="text-sm text-slate-400">Track your DeFi yields</p>
      </div>
      <div class="flex gap-2">
        <button
          v-for="view in ['dashboard', 'positions', 'protocols']"
          :key="view"
          @click="activeView = view as any"
          :class="[
            'px-3 py-1.5 rounded-lg text-sm transition-all',
            activeView === view 
              ? 'bg-purple-600 text-white' 
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          ]"
        >
          {{ view.charAt(0).toUpperCase() + view.slice(1) }}
        </button>
      </div>
    </div>

    <!-- Loading/Error -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
    </div>
    
    <div v-else-if="error" class="bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-300 mb-4">
      {{ error }}
    </div>

    <!-- Dashboard View -->
    <div v-else-if="activeView === 'dashboard' && stats">
      <!-- Stats Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <div class="text-sm text-slate-400 mb-1">Total Value</div>
          <div class="text-xl font-bold text-white">{{ formatCurrency(stats.totalValue) }}</div>
        </div>
        <div class="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <div class="text-sm text-slate-400 mb-1">Total Deposited</div>
          <div class="text-xl font-bold text-white">{{ formatCurrency(stats.totalDeposited) }}</div>
        </div>
        <div class="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <div class="text-sm text-slate-400 mb-1">Total P&L</div>
          <div :class="['text-xl font-bold', stats.totalPnL >= 0 ? 'text-green-400' : 'text-red-400']">
            {{ formatCurrency(stats.totalPnL) }}
          </div>
        </div>
        <div class="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <div class="text-sm text-slate-400 mb-1">Avg APY</div>
          <div class="text-xl font-bold text-purple-400">{{ stats.averageApy.toFixed(2) }}%</div>
        </div>
      </div>

      <!-- History Chart Placeholder -->
      <div class="bg-slate-800/50 rounded-xl p-4 border border-slate-700 mb-6">
        <h3 class="text-lg font-semibold text-white mb-4">Yield History (30 Days)</h3>
        <div class="h-48 flex items-end gap-1">
          <div
            v-for="(point, index) in history.slice(-14)"
            :key="index"
            class="flex-1 bg-purple-500/50 hover:bg-purple-400/50 rounded-t transition-all cursor-pointer relative group"
            :style="{ height: `${(point.value / Math.max(...history.map(h => h.value))) * 100}%` }"
          >
            <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
              {{ formatCurrency(point.value) }} ({{ point.date }})
            </div>
          </div>
        </div>
        <div class="flex justify-between mt-2 text-xs text-slate-500">
          <span>14 days ago</span>
          <span>Today</span>
        </div>
      </div>

      <!-- Protocol Distribution -->
      <div class="grid md:grid-cols-2 gap-6">
        <div class="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <h3 class="text-lg font-semibold text-white mb-4">Protocol Distribution</h3>
          <div class="space-y-3">
            <div 
              v-for="position in stats.positions" 
              :key="position.id"
              class="flex items-center justify-between"
            >
              <div class="flex items-center gap-2">
                <div 
                  class="w-3 h-3 rounded-full"
                  :style="{ backgroundColor: getProtocolColor(position.protocol) }"
                ></div>
                <span class="text-white">{{ position.protocol }}</span>
              </div>
              <div class="text-right">
                <div class="text-white font-medium">{{ formatCurrency(position.currentValue) }}</div>
                <div class="text-xs text-slate-400">{{ position.apy.toFixed(1) }}% APY</div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <h3 class="text-lg font-semibold text-white mb-4">Top Performers</h3>
          <div class="space-y-3">
            <div 
              v-for="position in [...stats.positions].sort((a, b) => b.pnlPercent - a.pnlPercent).slice(0, 5)" 
              :key="position.id"
              class="flex items-center justify-between"
            >
              <div class="flex items-center gap-2">
                <span class="text-lg">{{ position.protocol === 'Aave' ? '👻' : position.protocol === 'Uniswap' ? '🦄' : position.protocol === 'Compound' ? '🔷' : position.protocol === 'Curve' ? '💚' : '🧤' }}</span>
                <span class="text-white">{{ position.pool }}</span>
              </div>
              <div :class="['text-right font-medium', position.pnlPercent >= 0 ? 'text-green-400' : 'text-red-400']">
                {{ formatPercent(position.pnlPercent) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Positions View -->
    <div v-else-if="activeView === 'positions' && stats">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold text-white">Your Positions</h3>
        <button 
          @click="showAddModal = true"
          class="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-sm transition-colors"
        >
          + Add Position
        </button>
      </div>
      
      <div class="space-y-3">
        <div 
          v-for="position in stats.positions" 
          :key="position.id"
          class="bg-slate-800/50 rounded-xl p-4 border border-slate-700 hover:border-purple-500/50 transition-all"
        >
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div 
                class="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                :style="{ backgroundColor: getProtocolColor(position.protocol) + '20' }"
              >
                {{ position.protocol === 'Aave' ? '👻' : position.protocol === 'Uniswap' ? '🦄' : position.protocol === 'Compound' ? '🔷' : position.protocol === 'Curve' ? '💚' : '🧤' }}
              </div>
              <div>
                <div class="text-white font-medium">{{ position.pool }}</div>
                <div class="text-sm text-slate-400">{{ position.protocol }} • {{ getChainName(position.chainId) }}</div>
              </div>
            </div>
            <button 
              @click="removePosition(position.id)"
              class="text-slate-500 hover:text-red-400 transition-colors"
            >
              ✕
            </button>
          </div>
          
          <div class="grid grid-cols-3 gap-4 mt-4">
            <div>
              <div class="text-xs text-slate-500">Deposited</div>
              <div class="text-white font-medium">{{ formatCurrency(position.deposited) }}</div>
            </div>
            <div>
              <div class="text-xs text-slate-500">Current Value</div>
              <div class="text-white font-medium">{{ formatCurrency(position.currentValue) }}</div>
            </div>
            <div>
              <div class="text-xs text-slate-500">P&L</div>
              <div :class="['font-medium', position.pnl >= 0 ? 'text-green-400' : 'text-red-400']">
                {{ formatCurrency(position.pnl) }} ({{ formatPercent(position.pnlPercent) }})
              </div>
            </div>
          </div>
          
          <div class="mt-3 pt-3 border-t border-slate-700 flex justify-between items-center">
            <span class="text-xs text-slate-500">Token: {{ position.token }}</span>
            <span class="bg-purple-500/20 text-purple-400 px-2 py-1 rounded text-xs">
              {{ position.apy.toFixed(1) }}% APY
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Protocols View -->
    <div v-else-if="activeView === 'protocols'">
      <h3 class="text-lg font-semibold text-white mb-4">Supported Protocols</h3>
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div 
          v-for="protocol in protocols" 
          :key="protocol.name"
          class="bg-slate-800/50 rounded-xl p-4 border border-slate-700 hover:border-purple-500/50 transition-all cursor-pointer"
        >
          <div class="flex items-center gap-3 mb-3">
            <span class="text-2xl">{{ protocol.logo }}</span>
            <div>
              <div class="text-white font-medium">{{ protocol.name }}</div>
              <div class="text-xs text-purple-400">{{ protocol.avgApy }} avg APY</div>
            </div>
          </div>
          <div class="space-y-2">
            <div>
              <span class="text-xs text-slate-500">Supported Chains:</span>
              <div class="flex gap-1 mt-1">
                <span 
                  v-for="chain in protocol.chains" 
                  :key="chain"
                  class="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded"
                >
                  {{ getChainName(chain) }}
                </span>
              </div>
            </div>
            <div>
              <span class="text-xs text-slate-500">Tokens:</span>
              <div class="flex flex-wrap gap-1 mt-1">
                <span 
                  v-for="token in protocol.tokens" 
                  :key="token"
                  class="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded"
                >
                  {{ token }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Position Modal -->
    <div v-if="showAddModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700">
        <h3 class="text-lg font-semibold text-white mb-4">Add Yield Position</h3>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm text-slate-400 mb-1">Protocol</label>
            <select 
              v-model="newPosition.protocol"
              class="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600"
            >
              <option value="">Select Protocol</option>
              <option v-for="p in protocols" :key="p.name" :value="p.name">{{ p.name }}</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm text-slate-400 mb-1">Pool Name</label>
            <input 
              v-model="newPosition.pool"
              type="text"
              placeholder="e.g., USDC Supply"
              class="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600"
            />
          </div>
          
          <div>
            <label class="block text-sm text-slate-400 mb-1">Token</label>
            <input 
              v-model="newPosition.token"
              type="text"
              placeholder="e.g., USDC"
              class="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600"
            />
          </div>
          
          <div>
            <label class="block text-sm text-slate-400 mb-1">Deposited Amount</label>
            <input 
              v-model.number="newPosition.deposited"
              type="number"
              placeholder="0.00"
              class="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600"
            />
          </div>
          
          <div>
            <label class="block text-sm text-slate-400 mb-1">Chain</label>
            <select 
              v-model.number="newPosition.chainId"
              class="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600"
            >
              <option :value="1">Ethereum</option>
              <option :value="137">Polygon</option>
              <option :value="42161">Arbitrum</option>
              <option :value="8453">Base</option>
            </select>
          </div>
        </div>
        
        <div class="flex gap-3 mt-6">
          <button 
            @click="showAddModal = false"
            class="flex-1 bg-slate-700 text-white py-2 rounded-lg hover:bg-slate-600 transition-colors"
          >
            Cancel
          </button>
          <button 
            @click="showAddModal = false"
            class="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-500 transition-colors"
          >
            Add Position
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.yield-tracker {
  color: white;
}
</style>
