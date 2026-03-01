<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

// State
const connectedAddress = ref('');
const positions = ref<any[]>([]);
const alerts = ref<any[]>([]);
const isLoading = ref(false);
const selectedProtocol = ref('all');
const selectedChain = ref(1);
const showAlertModal = ref(false);
const editingAlert = ref<any>(null);

// Form for new alert
const alertForm = ref({
  positionAddress: '',
  healthFactorThreshold: 1.5,
  notificationEmail: '',
  telegramEnabled: false,
  emailEnabled: true,
});

// Supported chains
const chains = [
  { id: 1, name: 'Ethereum', symbol: 'ETH', color: '#627EEA' },
  { id: 137, name: 'Polygon', symbol: 'MATIC', color: '#8247E5' },
  { id: 42161, name: 'Arbitrum', symbol: 'ETH', color: '#28A0F0' },
  { id: 10, name: 'Optimism', symbol: 'ETH', color: '#FF0420' },
];

// Mock protocol data - in production would fetch from API
const protocols = [
  { id: 'aave', name: 'Aave', logo: '👻', color: '#2EBAC6' },
  { id: 'compound', name: 'Compound', logo: '🔷', color: '#00D395' },
  { id: 'liquity', name: 'Liquity', logo: '🔴', color: '#F74A4A' },
  { id: 'morpho', name: 'Morpho', logo: '🟣', color: '#6B4EFF' },
];

// Mock monitored positions
const mockPositions = [
  {
    id: '1',
    protocol: 'aave',
    chain: 1,
    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f...',
    fullAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f1234',
    collateral: '12.5',
    collateralSymbol: 'ETH',
    debt: '18500',
    debtSymbol: 'USDC',
    healthFactor: 1.42,
    liquidationPrice: 1850,
    currentPrice: 2450,
    ltv: 0.75,
    maxLtv: 0.8,
    status: 'warning',
  },
  {
    id: '2',
    protocol: 'compound',
    chain: 1,
    address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
    fullAddress: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
    collateral: '25000',
    collateralSymbol: 'USDC',
    debt: '8.2',
    debtSymbol: 'ETH',
    healthFactor: 2.15,
    liquidationPrice: 0.028,
    currentPrice: 0.032,
    ltv: 0.65,
    maxLtv: 0.75,
    status: 'safe',
  },
  {
    id: '3',
    protocol: 'liquity',
    chain: 1,
    address: '0x4aa42145Cd6E72f17200dcD027bDD16293e32Ce9',
    fullAddress: '0x4aa42145Cd6E72f17200dcD027bDD16293e32Ce9',
    collateral: '5.2',
    collateralSymbol: 'ETH',
    debt: '8500',
    debtSymbol: 'LUSD',
    healthFactor: 1.05,
    liquidationPrice: 2100,
    currentPrice: 2450,
    ltv: 0.85,
    maxLtv: 0.9,
    status: 'danger',
  },
  {
    id: '4',
    protocol: 'aave',
    chain: 137,
    address: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6',
    fullAddress: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6',
    collateral: '15000',
    collateralSymbol: 'USDC',
    debt: '0.45',
    debtSymbol: 'MATIC',
    healthFactor: 1.85,
    liquidationPrice: 0.65,
    currentPrice: 0.82,
    ltv: 0.6,
    maxLtv: 0.75,
    status: 'safe',
  },
  {
    id: '5',
    protocol: 'morpho',
    chain: 42161,
    address: '0x82D8bf5aAc7b72f2EEF2a50Ab2fC2dcF03aEDA87',
    fullAddress: '0x82D8bf5aAc7b72f2EEF2a50Ab2fC2dcF03aEDA87',
    collateral: '3.2',
    collateralSymbol: 'ETH',
    debt: '5200',
    debtSymbol: 'USDC',
    healthFactor: 1.12,
    liquidationPrice: 2050,
    currentPrice: 2450,
    ltv: 0.82,
    maxLtv: 0.85,
    status: 'warning',
  },
];

// Mock alerts
const mockAlerts = [
  {
    id: '1',
    positionAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f1234',
    protocol: 'aave',
    healthFactorThreshold: 1.3,
    currentHealthFactor: 1.42,
    status: 'active',
    lastTriggered: '2026-03-02 04:30',
    type: 'health_factor',
  },
  {
    id: '2',
    positionAddress: '0x4aa42145Cd6E72f17200dcD027bDD16293e32Ce9',
    protocol: 'liquity',
    healthFactorThreshold: 1.1,
    currentHealthFactor: 1.05,
    status: 'triggered',
    lastTriggered: '2026-03-02 05:00',
    type: 'liquidation_warning',
  },
];

// Computed
const filteredPositions = computed(() => {
  let filtered = positions.value;
  if (selectedProtocol.value !== 'all') {
    filtered = filtered.filter((p) => p.protocol === selectedProtocol.value);
  }
  if (selectedChain.value) {
    filtered = filtered.filter((p) => p.chain === selectedChain.value);
  }
  return filtered;
});

const stats = computed(() => {
  const total = positions.value.length;
  const safe = positions.value.filter((p) => p.status === 'safe').length;
  const warning = positions.value.filter((p) => p.status === 'warning').length;
  const danger = positions.value.filter((p) => p.status === 'danger').length;
  const totalDebt = positions.value.reduce((sum, p) => sum + parseFloat(p.debt), 0);
  const totalCollateral = positions.value.reduce((sum, p) => sum + parseFloat(p.collateral), 0);

  return { total, safe, warning, danger, totalDebt, totalCollateral };
});

// Methods
const fetchPositions = async () => {
  isLoading.value = true;
  try {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    positions.value = mockPositions;
    alerts.value = mockAlerts;
  } catch (error) {
    console.error('Failed to fetch positions:', error);
  } finally {
    isLoading.value = false;
  }
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    safe: 'text-green-400',
    warning: 'text-yellow-400',
    danger: 'text-red-400',
  };
  return colors[status] || 'text-gray-400';
};

const getStatusBg = (status: string) => {
  const colors: Record<string, string> = {
    safe: 'bg-green-500/20 border-green-500/30',
    warning: 'bg-yellow-500/20 border-yellow-500/30',
    danger: 'bg-red-500/20 border-red-500/30',
  };
  return colors[status] || 'bg-gray-500/20';
};

const getProtocolLogo = (protocol: string) => {
  const protocolData = protocols.find((p) => p.id === protocol);
  return protocolData?.logo || '❓';
};

const getProtocolColor = (protocol: string) => {
  const protocolData = protocols.find((p) => p.id === protocol);
  return protocolData?.color || '#666';
};

const getChainName = (chainId: number) => {
  const chain = chains.find((c) => c.id === chainId);
  return chain?.name || 'Unknown';
};

const formatAddress = (addr: string) => {
  if (!addr) return '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

const formatNumber = (num: string | number, decimals = 2) => {
  const value = typeof num === 'string' ? parseFloat(num) : num;
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

const calculateRiskScore = (position: any) => {
  const healthFactorScore = Math.max(0, (position.healthFactor - 1) * 50);
  const ltvScore = (position.ltv / position.maxLtv) * 100;
  return Math.round(100 - healthFactorScore - (100 - ltvScore) / 2);
};

const addAlert = () => {
  const newAlert = {
    id: Date.now().toString(),
    positionAddress: alertForm.value.positionAddress,
    protocol: 'aave',
    healthFactorThreshold: alertForm.value.healthFactorThreshold,
    currentHealthFactor: 1.5,
    status: 'active',
    lastTriggered: '-',
    type: 'health_factor',
  };
  alerts.value.push(newAlert);
  showAlertModal.value = false;
  resetForm();
};

const deleteAlert = (id: string) => {
  alerts.value = alerts.value.filter((a) => a.id !== id);
};

const resetForm = () => {
  alertForm.value = {
    positionAddress: '',
    healthFactorThreshold: 1.5,
    notificationEmail: '',
    telegramEnabled: false,
    emailEnabled: true,
  };
};

const setEditingAlert = (alert: any) => {
  editingAlert.value = { ...alert };
  showAlertModal.value = true;
};

// Lifecycle
onMounted(() => {
  fetchPositions();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 class="text-2xl font-bold text-white">Liquidation Alert System</h2>
        <p class="text-slate-400">Monitor DeFi positions for liquidation risk</p>
      </div>
      <div class="flex gap-3">
        <button
          class="rounded-lg bg-purple-500/20 px-4 py-2 text-purple-400 border border-purple-500/30 transition-all hover:bg-purple-500/30"
          @click="showAlertModal = true"
        >
          + Set Alert
        </button>
        <button
          class="rounded-lg bg-slate-700 px-4 py-2 text-white transition-all hover:bg-slate-600"
          @click="fetchPositions"
          :disabled="isLoading"
        >
          {{ isLoading ? '⏳' : '🔄' }} Refresh
        </button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-2 gap-4 lg:grid-cols-6">
      <div class="border border-slate-700/50 rounded-xl bg-slate-800/50 p-4">
        <p class="text-xs text-slate-400">Total Positions</p>
        <p class="text-2xl font-bold text-white">{{ stats.total }}</p>
      </div>
      <div class="border border-green-500/30 rounded-xl bg-green-500/10 p-4">
        <p class="text-xs text-green-400">Safe</p>
        <p class="text-2xl font-bold text-green-400">{{ stats.safe }}</p>
      </div>
      <div class="border border-yellow-500/30 rounded-xl bg-yellow-500/10 p-4">
        <p class="text-xs text-yellow-400">Warning</p>
        <p class="text-2xl font-bold text-yellow-400">{{ stats.warning }}</p>
      </div>
      <div class="border border-red-500/30 rounded-xl bg-red-500/10 p-4">
        <p class="text-xs text-red-400">Danger</p>
        <p class="text-2xl font-bold text-red-400">{{ stats.danger }}</p>
      </div>
      <div class="border border-slate-700/50 rounded-xl bg-slate-800/50 p-4">
        <p class="text-xs text-slate-400">Total Debt</p>
        <p class="text-xl font-bold text-white">${{ formatNumber(stats.totalDebt) }}</p>
      </div>
      <div class="border border-slate-700/50 rounded-xl bg-slate-800/50 p-4">
        <p class="text-xs text-slate-400">Total Collateral</p>
        <p class="text-xl font-bold text-white">${{ formatNumber(stats.totalCollateral) }}</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-4">
      <select
        v-model="selectedProtocol"
        class="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
      >
        <option value="all">All Protocols</option>
        <option v-for="p in protocols" :key="p.id" :value="p.id">
          {{ p.logo }} {{ p.name }}
        </option>
      </select>
      <select
        v-model="selectedChain"
        class="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
      >
        <option :value="0">All Chains</option>
        <option v-for="c in chains" :key="c.id" :value="c.id">
          {{ c.name }}
        </option>
      </select>
    </div>

    <!-- Positions Table -->
    <div class="border border-slate-700/50 rounded-xl bg-slate-800/50 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="border-b border-slate-700 bg-slate-900/50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Position</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Collateral</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Debt</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Health Factor</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">LTV</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Risk Score</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-700/50">
            <tr
              v-for="position in filteredPositions"
              :key="position.id"
              class="transition-colors hover:bg-slate-700/30"
            >
              <td class="px-4 py-4">
                <div class="flex items-center gap-3">
                  <span class="text-2xl">{{ getProtocolLogo(position.protocol) }}</span>
                  <div>
                    <p class="font-medium text-white capitalize">{{ position.protocol }}</p>
                    <p class="text-xs text-slate-400">{{ getChainName(position.chain) }}</p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-4">
                <p class="text-white font-medium">{{ formatNumber(position.collateral) }} {{ position.collateralSymbol }}</p>
                <p class="text-xs text-slate-400">~${{ formatNumber(parseFloat(position.collateral) * (position.currentPrice || 2500)) }}</p>
              </td>
              <td class="px-4 py-4">
                <p class="text-white font-medium">{{ formatNumber(position.debt) }} {{ position.debtSymbol }}</p>
                <p class="text-xs text-slate-400">~${{ formatNumber(position.debt) }}</p>
              </td>
              <td class="px-4 py-4">
                <div class="flex items-center gap-2">
                  <span
                    class="text-lg font-bold"
                    :class="getStatusColor(position.status)"
                  >
                    {{ position.healthFactor.toFixed(2) }}
                  </span>
                  <span v-if="position.healthFactor < 1.5" class="text-xs text-red-400">⚠️</span>
                </div>
                <p class="text-xs text-slate-400">Liqq: ${{ formatNumber(position.liquidationPrice, 0) }}</p>
              </td>
              <td class="px-4 py-4">
                <div class="flex items-center gap-2">
                  <div class="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      class="h-full rounded-full transition-all"
                      :class="{
                        'bg-green-500': position.ltv / position.maxLtv < 0.7,
                        'bg-yellow-500': position.ltv / position.maxLtv >= 0.7 && position.ltv / position.maxLtv < 0.9,
                        'bg-red-500': position.ltv / position.maxLtv >= 0.9,
                      }"
                      :style="{ width: `${(position.ltv / position.maxLtv) * 100}%` }"
                    ></div>
                  </div>
                  <span class="text-sm text-slate-300">{{ Math.round((position.ltv / position.maxLtv) * 100) }}%</span>
                </div>
              </td>
              <td class="px-4 py-4">
                <div class="flex items-center gap-2">
                  <span
                    class="text-sm font-bold"
                    :class="{
                      'text-green-400': calculateRiskScore(position) >= 70,
                      'text-yellow-400': calculateRiskScore(position) >= 40 && calculateRiskScore(position) < 70,
                      'text-red-400': calculateRiskScore(position) < 40,
                    }"
                  >
                    {{ calculateRiskScore(position) }}
                  </span>
                  <span class="text-xs text-slate-500">/100</span>
                </div>
              </td>
              <td class="px-4 py-4">
                <span
                  class="rounded-full px-3 py-1 text-xs font-medium border"
                  :class="getStatusBg(position.status)"
                >
                  {{ position.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Alerts Section -->
    <div class="border border-slate-700/50 rounded-xl bg-slate-800/50 p-6">
      <h3 class="text-lg font-semibold text-white mb-4">📢 Active Alerts</h3>
      <div class="space-y-3">
        <div
          v-for="alert in alerts"
          :key="alert.id"
          class="flex items-center justify-between rounded-lg bg-slate-900/50 p-4"
        >
          <div class="flex items-center gap-4">
            <span class="text-2xl">{{ getProtocolLogo(alert.protocol) }}</span>
            <div>
              <p class="text-white font-medium">{{ formatAddress(alert.positionAddress) }}</p>
              <p class="text-xs text-slate-400">
                Threshold: {{ alert.healthFactorThreshold }} | Current: {{ alert.currentHealthFactor }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <span
              class="rounded-full px-3 py-1 text-xs font-medium"
              :class="alert.status === 'triggered' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'"
            >
              {{ alert.status }}
            </span>
            <button
              class="text-slate-400 hover:text-white"
              @click="setEditingAlert(alert)"
            >
              ⚙️
            </button>
            <button
              class="text-red-400 hover:text-red-300"
              @click="deleteAlert(alert.id)"
            >
              🗑️
            </button>
          </div>
        </div>
        <p v-if="alerts.length === 0" class="text-center text-slate-400 py-8">
          No alerts configured. Click "Set Alert" to add one.
        </p>
      </div>
    </div>

    <!-- Alert Modal -->
    <div
      v-if="showAlertModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      @click.self="showAlertModal = false"
    >
      <div class="w-full max-w-md rounded-xl border border-slate-700 bg-slate-800 p-6">
        <h3 class="text-lg font-semibold text-white mb-4">Set Liquidation Alert</h3>
        <div class="space-y-4">
          <div>
            <label class="mb-1 block text-sm text-slate-400">Position Address</label>
            <input
              v-model="alertForm.positionAddress"
              type="text"
              placeholder="0x..."
              class="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm text-slate-400">Health Factor Threshold</label>
            <input
              v-model.number="alertForm.healthFactorThreshold"
              type="number"
              step="0.1"
              min="1"
              max="5"
              class="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
            />
            <p class="mt-1 text-xs text-slate-500">Alert when health factor drops below this value</p>
          </div>
          <div>
            <label class="mb-1 block text-sm text-slate-400">Email for Notifications</label>
            <input
              v-model="alertForm.notificationEmail"
              type="email"
              placeholder="your@email.com"
              class="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
            />
          </div>
          <div class="flex gap-4">
            <label class="flex items-center gap-2 text-sm text-slate-400">
              <input
                v-model="alertForm.emailEnabled"
                type="checkbox"
                class="rounded border-slate-700 bg-slate-900 text-purple-500 focus:ring-purple-500"
              />
              Email
            </label>
            <label class="flex items-center gap-2 text-sm text-slate-400">
              <input
                v-model="alertForm.telegramEnabled"
                type="checkbox"
                class="rounded border-slate-700 bg-slate-900 text-purple-500 focus:ring-purple-500"
              />
              Telegram
            </label>
          </div>
        </div>
        <div class="mt-6 flex gap-3">
          <button
            class="flex-1 rounded-lg bg-slate-700 px-4 py-2 text-white transition-all hover:bg-slate-600"
            @click="showAlertModal = false"
          >
            Cancel
          </button>
          <button
            class="flex-1 rounded-lg bg-purple-500 px-4 py-2 text-white transition-all hover:bg-purple-600"
            @click="addAlert"
          >
            Add Alert
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
