<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

// Types
interface TaxTransaction {
  hash: string;
  timestamp: number;
  date: string;
  type: 'buy' | 'sell' | 'transfer_in' | 'transfer_out' | 'reward' | 'airdrop' | 'fork' | 'mining';
  token: string;
  amount: number;
  priceUSD: number;
  feeUSD: number;
  totalUSD: number;
  gainLoss?: number;
  shortTerm?: boolean;
}

interface TaxSummary {
  totalTransactions: number;
  totalBuys: number;
  totalSells: number;
  totalVolume: number;
  totalGains: number;
  totalLosses: number;
  netGainLoss: number;
  shortTermGains: number;
  longTermGains: number;
  shortTermLosses: number;
  longTermLosses: number;
  taxableEvents: number;
  estimatedTax: number;
}

// State
const walletAddress = ref('');
const isLoading = ref(false);
const selectedYear = ref(new Date().getFullYear());
const selectedMethod = ref<'FIFO' | 'LIFO' | 'HIFO'>('FIFO');
const transactions = ref<TaxTransaction[]>([]);
const summary = ref<TaxSummary | null>(null);
const showExportModal = ref(false);
const exportedCSV = ref('');

// Available years
const years = [2026, 2025, 2024, 2023];

// Methods
const methods = [
  { value: 'FIFO', label: 'FIFO (First In, First Out)', desc: 'Oldest assets sold first' },
  { value: 'LIFO', label: 'LIFO (Last In, First Out)', desc: 'Newest assets sold first' },
  { value: 'HIFO', label: 'HIFO (Highest In, First Out)', desc: 'Highest cost assets sold first' },
];

// Generate mock transactions
const generateMockTransactions = (address: string): TaxTransaction[] => {
  const tokens = ['ETH', 'BTC', 'USDC', 'LINK', 'UNI', 'AAVE', 'ARB', 'OP', 'SOL'];
  const txTypes: TaxTransaction['type'][] = ['buy', 'sell', 'transfer_in', 'transfer_out', 'reward'];
  const txs: TaxTransaction[] = [];
  
  const now = new Date();
  const yearStart = new Date(selectedYear.value, 0, 1);
  
  for (let i = 0; i < 50 + Math.random() * 50; i++) {
    const timestamp = yearStart.getTime() + Math.random() * (now.getTime() - yearStart.getTime());
    const token = tokens[Math.floor(Math.random() * tokens.length)];
    const typeRoll = Math.random();
    let type: TaxTransaction['type'];
    
    if (typeRoll < 0.4) type = 'buy';
    else if (typeRoll < 0.7) type = 'sell';
    else if (typeRoll < 0.85) type = 'transfer_in';
    else if (typeRoll < 0.95) type = 'transfer_out';
    else type = 'reward';
    
    const price = token === 'BTC' ? 85000 : token === 'ETH' ? 2850 : token === 'SOL' ? 145 : 
                  token === 'USDC' ? 1 : Math.random() * 100 + 1;
    const amount = (Math.random() * 5 + 0.1) * (token === 'BTC' ? 0.1 : 1);
    const totalUSD = amount * price;
    const feeUSD = totalUSD * 0.003;
    
    const txDate = new Date(timestamp);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    let gainLoss = 0;
    if (type === 'sell') {
      // Simulate gain/loss
      const costBasis = totalUSD * (0.7 + Math.random() * 0.5);
      gainLoss = totalUSD - costBasis - feeUSD;
    }
    
    txs.push({
      hash: `0x${Math.random().toString(16).substr(2, 64)}`,
      timestamp: Math.floor(timestamp / 1000),
      date: txDate.toISOString().split('T')[0],
      type,
      token,
      amount: Math.round(amount * 1000) / 1000,
      priceUSD: Math.round(price * 100) / 100,
      feeUSD: Math.round(feeUSD * 100) / 100,
      totalUSD: Math.round(totalUSD * 100) / 100,
      gainLoss: type === 'sell' ? Math.round(gainLoss * 100) / 100 : undefined,
      shortTerm: txDate > oneYearAgo,
    });
  }
  
  return txs.sort((a, b) => a.timestamp - b.timestamp);
};

// Calculate summary from transactions
const calculateSummary = (txs: TaxTransaction[]): TaxSummary => {
  let totalBuys = 0;
  let totalSells = 0;
  let totalVolume = 0;
  let totalGains = 0;
  let totalLosses = 0;
  let shortTermGains = 0;
  let longTermGains = 0;
  let shortTermLosses = 0;
  let longTermLosses = 0;
  let taxableEvents = 0;
  
  for (const tx of txs) {
    totalVolume += tx.totalUSD;
    
    if (tx.type === 'buy') totalBuys++;
    else if (tx.type === 'sell') {
      totalSells++;
      taxableEvents++;
      
      if (tx.gainLoss !== undefined) {
        if (tx.gainLoss > 0) {
          totalGains += tx.gainLoss;
          if (tx.shortTerm) shortTermGains += tx.gainLoss;
          else longTermGains += tx.gainLoss;
        } else {
          totalLosses += Math.abs(tx.gainLoss);
          if (tx.shortTerm) shortTermLosses += Math.abs(tx.gainLoss);
          else longTermLosses += Math.abs(tx.gainLoss);
        }
      }
    }
  }
  
  const netGainLoss = totalGains - totalLosses;
  const estimatedTax = Math.max(0, (shortTermGains - shortTermLosses) * 0.32 + (longTermGains - longTermLosses) * 0.2);
  
  return {
    totalTransactions: txs.length,
    totalBuys,
    totalSells,
    totalVolume: Math.round(totalVolume * 100) / 100,
    totalGains: Math.round(totalGains * 100) / 100,
    totalLosses: Math.round(totalLosses * 100) / 100,
    netGainLoss: Math.round(netGainLoss * 100) / 100,
    shortTermGains: Math.round(shortTermGains * 100) / 100,
    longTermGains: Math.round(longTermGains * 100) / 100,
    shortTermLosses: Math.round(shortTermLosses * 100) / 100,
    longTermLosses: Math.round(longTermLosses * 100) / 100,
    taxableEvents,
    estimatedTax: Math.round(estimatedTax * 100) / 100,
  };
};

// Load tax data
const loadTaxData = async () => {
  if (!walletAddress.value) return;
  
  isLoading.value = true;
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  transactions.value = generateMockTransactions(walletAddress.value);
  summary.value = calculateSummary(transactions.value);
  
  isLoading.value = false;
};

// Export to CSV
const exportToCSV = () => {
  if (!transactions.value.length) return;
  
  const headers = ['Date', 'Type', 'Token', 'Amount', 'Price (USD)', 'Total (USD)', 'Fee (USD)', 'Gain/Loss (USD)', 'Term'];
  
  const rows = transactions.value.map(tx => [
    tx.date,
    tx.type,
    tx.token,
    tx.amount,
    tx.priceUSD,
    tx.totalUSD,
    tx.feeUSD,
    tx.gainLoss?.toFixed(2) || '0.00',
    tx.shortTerm ? 'Short-term' : 'Long-term',
  ].join(','));
  
  exportedCSV.value = [headers.join(','), ...rows].join('\n');
  showExportModal.value = true;
};

// Download CSV
const downloadCSV = () => {
  const blob = new Blob([exportedCSV.value], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tax_report_${walletAddress.value?.slice(0, 6)}_${selectedYear.value}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

// Format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
};

// Get type color
const getTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    buy: 'text-green-400',
    sell: 'text-red-400',
    transfer_in: 'text-blue-400',
    transfer_out: 'text-yellow-400',
    reward: 'text-purple-400',
    airdrop: 'text-pink-400',
    mining: 'text-cyan-400',
    fork: 'text-orange-400',
  };
  return colors[type] || 'text-gray-400';
};

// Get type icon
const getTypeIcon = (type: string) => {
  const icons: Record<string, string> = {
    buy: '↓',
    sell: '↑',
    transfer_in: '⇲',
    transfer_out: '⇱',
    reward: '🎁',
    airdrop: '🪂',
    mining: '⛏️',
    fork: '🍴',
  };
  return icons[type] || '•';
};

// Net gain/loss class
const netGainLossClass = computed(() => {
  if (!summary.value) return '';
  return summary.value.netGainLoss >= 0 ? 'text-green-400' : 'text-red-400';
});

// Quick fill address
const fillDemoAddress = () => {
  walletAddress.value = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0';
};
</script>

<template>
  <div class="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-6 backdrop-blur-xl">
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-white">💰 Crypto Tax Calculator</h2>
        <p class="mt-1 text-sm text-slate-400">Calculate capital gains & tax liability</p>
      </div>
      <div class="text-4xl">📊</div>
    </div>

    <!-- Input Section -->
    <div class="mb-6 space-y-4">
      <div class="flex flex-col gap-4 lg:flex-row">
        <div class="flex-1">
          <label class="mb-2 block text-sm text-slate-400">Wallet Address</label>
          <div class="flex gap-2">
            <input
              v-model="walletAddress"
              type="text"
              placeholder="0x..."
              class="flex-1 rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
            />
            <button
              class="rounded-lg bg-slate-700 px-4 py-2 text-sm text-slate-400 hover:bg-slate-600 hover:text-white"
              @click="fillDemoAddress"
            >
              Demo
            </button>
          </div>
        </div>
        
        <div class="w-full lg:w-40">
          <label class="mb-2 block text-sm text-slate-400">Tax Year</label>
          <select
            v-model="selectedYear"
            class="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
          >
            <option v-for="year in years" :key="year" :value="year">{{ year }}</option>
          </select>
        </div>
        
        <div class="w-full lg:w-48">
          <label class="mb-2 block text-sm text-slate-400">Cost Basis Method</label>
          <select
            v-model="selectedMethod"
            class="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
          >
            <option v-for="method in methods" :key="method.value" :value="method.value">
              {{ method.value }}
            </option>
          </select>
        </div>
        
        <div class="flex items-end">
          <button
            :disabled="!walletAddress || isLoading"
            class="rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-3 font-semibold text-white transition-all hover:from-blue-600 hover:to-purple-600 disabled:cursor-not-allowed disabled:opacity-50"
            @click="loadTaxData"
          >
            {{ isLoading ? 'Calculating...' : 'Calculate' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Results -->
    <div v-if="summary" class="space-y-6">
      <!-- Summary Cards -->
      <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div class="rounded-xl bg-slate-900/50 p-4">
          <p class="text-xs text-slate-400">Net Gain/Loss</p>
          <p class="text-2xl font-bold" :class="netGainLossClass">
            {{ formatCurrency(summary.netGainLoss) }}
          </p>
        </div>
        <div class="rounded-xl bg-slate-900/50 p-4">
          <p class="text-xs text-slate-400">Total Gains</p>
          <p class="text-2xl font-bold text-green-400">{{ formatCurrency(summary.totalGains) }}</p>
        </div>
        <div class="rounded-xl bg-slate-900/50 p-4">
          <p class="text-xs text-slate-400">Total Losses</p>
          <p class="text-2xl font-bold text-red-400">{{ formatCurrency(summary.totalLosses) }}</p>
        </div>
        <div class="rounded-xl bg-slate-900/50 p-4">
          <p class="text-xs text-slate-400">Est. Tax</p>
          <p class="text-2xl font-bold text-yellow-400">{{ formatCurrency(summary.estimatedTax) }}</p>
        </div>
      </div>

      <!-- Detailed Stats -->
      <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div class="rounded-xl bg-slate-900/50 p-4">
          <p class="text-xs text-slate-400">Total Transactions</p>
          <p class="text-xl font-semibold text-white">{{ summary.totalTransactions }}</p>
        </div>
        <div class="rounded-xl bg-slate-900/50 p-4">
          <p class="text-xs text-slate-400">Buys</p>
          <p class="text-xl font-semibold text-green-400">{{ summary.totalBuys }}</p>
        </div>
        <div class="rounded-xl bg-slate-900/50 p-4">
          <p class="text-xs text-slate-400">Sells</p>
          <p class="text-xl font-semibold text-red-400">{{ summary.totalSells }}</p>
        </div>
        <div class="rounded-xl bg-slate-900/50 p-4">
          <p class="text-xs text-slate-400">Total Volume</p>
          <p class="text-xl font-semibold text-white">{{ formatCurrency(summary.totalVolume) }}</p>
        </div>
      </div>

      <!-- Capital Gains Breakdown -->
      <div class="rounded-xl bg-slate-900/50 p-4">
        <h3 class="mb-4 text-lg font-semibold text-white">Capital Gains Breakdown</h3>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-sm text-slate-400">Short-term Gains (&lt;1 year)</p>
            <p class="text-lg font-semibold text-orange-400">{{ formatCurrency(summary.shortTermGains) }}</p>
          </div>
          <div>
            <p class="text-sm text-slate-400">Short-term Losses</p>
            <p class="text-lg font-semibold text-red-400">{{ formatCurrency(summary.shortTermLosses) }}</p>
          </div>
          <div>
            <p class="text-sm text-slate-400">Long-term Gains (&gt;1 year)</p>
            <p class="text-lg font-semibold text-green-400">{{ formatCurrency(summary.longTermGains) }}</p>
          </div>
          <div>
            <p class="text-sm text-slate-400">Long-term Losses</p>
            <p class="text-lg font-semibold text-red-400">{{ formatCurrency(summary.longTermLosses) }}</p>
          </div>
        </div>
      </div>

      <!-- Export Button -->
      <div class="flex justify-end">
        <button
          class="rounded-lg bg-purple-500/20 border border-purple-500/50 px-6 py-2 text-purple-400 hover:bg-purple-500/30"
          @click="exportToCSV"
        >
          📥 Export CSV
        </button>
      </div>

      <!-- Transaction Table -->
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-slate-700">
              <th class="pb-3 text-left text-sm text-slate-400">Date</th>
              <th class="pb-3 text-left text-sm text-slate-400">Type</th>
              <th class="pb-3 text-left text-sm text-slate-400">Token</th>
              <th class="pb-3 text-right text-sm text-slate-400">Amount</th>
              <th class="pb-3 text-right text-sm text-slate-400">Price</th>
              <th class="pb-3 text-right text-sm text-slate-400">Total</th>
              <th class="pb-3 text-right text-sm text-slate-400">Gain/Loss</th>
              <th class="pb-3 text-right text-sm text-slate-400">Term</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="tx in transactions.slice(0, 20)"
              :key="tx.hash"
              class="border-b border-slate-800 hover:bg-slate-800/50"
            >
              <td class="py-3 text-sm text-white">{{ tx.date }}</td>
              <td class="py-3">
                <span class="flex items-center gap-1 text-sm" :class="getTypeColor(tx.type)">
                  <span>{{ getTypeIcon(tx.type) }}</span>
                  {{ tx.type }}
                </span>
              </td>
              <td class="py-3 text-sm text-white">{{ tx.token }}</td>
              <td class="py-3 text-right text-sm text-white">{{ tx.amount.toFixed(4) }}</td>
              <td class="py-3 text-right text-sm text-slate-400">{{ formatCurrency(tx.priceUSD) }}</td>
              <td class="py-3 text-right text-sm text-white">{{ formatCurrency(tx.totalUSD) }}</td>
              <td class="py-3 text-right text-sm" :class="tx.gainLoss ? (tx.gainLoss >= 0 ? 'text-green-400' : 'text-red-400') : 'text-slate-500'">
                {{ tx.gainLoss !== undefined ? formatCurrency(tx.gainLoss) : '—' }}
              </td>
              <td class="py-3 text-right text-sm" :class="tx.shortTerm ? 'text-orange-400' : 'text-green-400'">
                {{ tx.shortTerm ? 'Short' : 'Long' }}
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="transactions.length > 20" class="mt-2 text-center text-sm text-slate-500">
          ... and {{ transactions.length - 20 }} more transactions
        </p>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="py-12 text-center">
      <div class="mb-4 text-6xl">🧾</div>
      <p class="text-slate-400">Enter a wallet address to calculate taxes</p>
      <p class="mt-2 text-sm text-slate-500">Supports FIFO, LIFO, and HIFO cost basis methods</p>
    </div>

    <!-- Export Modal -->
    <div
      v-if="showExportModal"
      class="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      @click.self="showExportModal = false"
    >
      <div class="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-xl font-semibold text-white">Export Tax Report</h3>
          <button class="text-slate-400 hover:text-white" @click="showExportModal = false">✕</button>
        </div>
        <p class="mb-4 text-sm text-slate-400">
          {{ transactions.length }} transactions exported for {{ selectedYear }} using {{ selectedMethod }} method
        </p>
        <textarea
          v-model="exportedCSV"
          class="h-64 w-full rounded-lg border border-slate-700 bg-slate-800 p-4 font-mono text-xs text-slate-300"
          readonly
        ></textarea>
        <div class="mt-4 flex justify-end gap-3">
          <button
            class="rounded-lg border border-slate-700 px-4 py-2 text-slate-400 hover:bg-slate-800"
            @click="showExportModal = false"
          >
            Close
          </button>
          <button
            class="rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2 font-semibold text-white"
            @click="downloadCSV"
          >
            Download CSV
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
