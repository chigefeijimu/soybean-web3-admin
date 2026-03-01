<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useWeb3 } from '@/composables/web3/useWeb3';

// Contract types
type ContractType = 'ERC20' | 'ERC721' | 'ERC1155' | 'Multisig';

interface DeployParams {
  chainId: number;
  contractType: ContractType;
  name: string;
  symbol?: string;
  initialSupply?: string;
  owners?: string[];
  threshold?: number;
  uri?: string;
}

interface GasEstimate {
  estimatedGas: number;
  gasPrice: string;
  estimatedCost: string;
  estimatedCostEth: string;
  chainId: number;
}

interface DeployResult {
  success: boolean;
  contractAddress: string;
  transactionHash: string;
  contractType: string;
  name: string;
  symbol?: string;
  chainId: number;
  explorerUrl: string;
  message: string;
}

// Form state
const contractType = ref<ContractType>('ERC20');
const tokenName = ref('');
const tokenSymbol = ref('');
const initialSupply = ref('');
const uri = ref('');
const multisigOwners = ref('1');
const multisigThreshold = ref(1);

// Deployment state
const isDeploying = ref(false);
const isEstimating = ref(false);
const deployResult = ref<DeployResult | null>(null);
const error = ref('');

// Gas estimate
const gasEstimate = ref<GasEstimate | null>(null);

// Web3
const { isConnected, account, chainId, sendTransaction } = useWeb3();

// Filter available chains
const availableChains = computed(() => {
  return Object.entries({
    1: { name: 'Ethereum', symbol: 'ETH' },
    5: { name: 'Goerli', symbol: 'ETH' },
    11155111: { name: 'Sepolia', symbol: 'ETH' },
    137: { name: 'Polygon', symbol: 'MATIC' },
    80001: { name: 'Mumbai', symbol: 'MATIC' },
    42161: { name: 'Arbitrum', symbol: 'ETH' },
    421613: { name: 'Arbitrum Goerli', symbol: 'ETH' },
    56: { name: 'BNB Chain', symbol: 'BNB' },
    97: { name: 'BNB Testnet', symbol: 'BNB' }
  }).map(([id, info]) => ({
    id: Number(id),
    ...info
  }));
});

const selectedChain = ref(1);

// Form validation
const isFormValid = computed(() => {
  if (!tokenName.value.trim()) return false;
  
  if (contractType.value === 'ERC20' || contractType.value === 'ERC721' || contractType.value === 'ERC1155') {
    if (contractType.value !== 'ERC721' && !tokenSymbol.value.trim()) return false;
  }
  
  if (contractType.value === 'Multisig') {
    const ownerCount = parseInt(multisigOwners.value);
    if (ownerCount < 1 || ownerCount > 10) return false;
    if (multisigThreshold.value < 1 || multisigThreshold.value > ownerCount) return false;
  }
  
  return true;
});

// Contract templates with descriptions
const contractTemplates = [
  {
    type: 'ERC20' as ContractType,
    name: 'ERC20 Token',
    description: 'Fungible token standard (like USDT, DAI)',
    icon: '🪙',
    fields: ['name', 'symbol', 'initialSupply']
  },
  {
    type: 'ERC721' as ContractType,
    name: 'ERC721 NFT',
    description: 'Non-fungible token (like CryptoPunks, BAYC)',
    icon: '🖼️',
    fields: ['name', 'symbol', 'uri']
  },
  {
    type: 'ERC1155' as ContractType,
    name: 'ERC1155 Multi-Token',
    description: 'Multi-token standard (game items, semi-fungible)',
    icon: '🎮',
    fields: ['name', 'uri']
  },
  {
    type: 'Multisig' as ContractType,
    name: 'Multisig Wallet',
    description: 'Multi-signature wallet requiring multiple approvals',
    icon: '🔐',
    fields: ['owners', 'threshold']
  }
];

// Get current template
const currentTemplate = computed(() => {
  return contractTemplates.find(t => t.type === contractType.value);
});

// Estimate gas
const estimateGas = async () => {
  if (!isFormValid.value) return;
  
  isEstimating.value = true;
  error.value = '';
  
  try {
    const params: DeployParams = {
      chainId: selectedChain.value,
      contractType: contractType.value,
      name: tokenName.value,
      symbol: tokenSymbol.value,
      initialSupply: initialSupply.value,
      uri: uri.value,
      owners: Array(parseInt(multisigOwners.value)).fill(account.value || ''),
      threshold: multisigThreshold.value
    };

    const response = await fetch('/api/web3/contract/estimate-gas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    if (!response.ok) throw new Error('Failed to estimate gas');
    
    gasEstimate.value = await response.json();
  } catch (e: any) {
    // Use mock estimate if API not available
    const mockEstimates: Record<ContractType, GasEstimate> = {
      'ERC20': { estimatedGas: 1500000, gasPrice: '20000000000', estimatedCost: '30000000000000000', estimatedCostEth: '0.03', chainId: selectedChain.value },
      'ERC721': { estimatedGas: 2500000, gasPrice: '20000000000', estimatedCost: '50000000000000000', estimatedCostEth: '0.05', chainId: selectedChain.value },
      'ERC1155': { estimatedGas: 3000000, gasPrice: '20000000000', estimatedCost: '60000000000000000', estimatedCostEth: '0.06', chainId: selectedChain.value },
      'Multisig': { estimatedGas: 2000000, gasPrice: '20000000000', estimatedCost: '40000000000000000', estimatedCostEth: '0.04', chainId: selectedChain.value }
    };
    gasEstimate.value = mockEstimates[contractType.value];
  } finally {
    isEstimating.value = false;
  }
};

// Deploy contract (demo mode - shows what would be deployed)
const deployContract = async () => {
  if (!isFormValid.value) return;
  
  isDeploying.value = true;
  error.value = '';
  deployResult.value = null;
  
  try {
    // In production, this would use the wallet to deploy
    // For demo, we'll simulate the deployment
    const mockAddress = generateMockAddress();
    const mockTxHash = generateMockTxHash();
    
    deployResult.value = {
      success: true,
      contractAddress: mockAddress,
      transactionHash: mockTxHash,
      contractType: contractType.value,
      name: tokenName.value,
      symbol: tokenSymbol.value || tokenName.value.substring(0, 3).toUpperCase(),
      chainId: selectedChain.value,
      explorerUrl: `https://etherscan.io/address/${mockAddress}`,
      message: 'Contract deployment simulated. In production, connect wallet to deploy.'
    };
    
    // Reset form
    tokenName.value = '';
    tokenSymbol.value = '';
    initialSupply.value = '';
    uri.value = '';
  } catch (e: any) {
    error.value = e.message || 'Deployment failed';
  } finally {
    isDeploying.value = false;
  }
};

// Helper functions
function generateMockAddress(): string {
  const chars = '0123456789abcdef';
  let address = '0x';
  for (let i = 0; i < 40; i++) {
    address += chars[Math.floor(Math.random() * chars.length)];
  }
  return address;
}

function generateMockTxHash(): string {
  const chars = '0123456789abcdef';
  let hash = '0x';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

// Get chain explorer URL
function getExplorerUrl(address: string): string {
  const explorers: Record<number, string> = {
    1: `https://etherscan.io/address/${address}`,
    5: `https://goerli.etherscan.io/address/${address}`,
    11155111: `https://sepolia.etherscan.io/address/${address}`,
    137: `https://polygonscan.com/address/${address}`,
    80001: `https://mumbai.polygonscan.com/address/${address}`,
    42161: `https://arbiscan.io/address/${address}`,
    421613: `https://goerli.arbiscan.io/address/${address}`,
    56: `https://bscscan.com/address/${address}`,
    97: `https://testnet.bscscan.com/address/${address}`
  };
  return explorers[selectedChain.value] || `#`;
}

// Watch for contract type changes to reset form
watch(contractType, () => {
  deployResult.value = null;
  gasEstimate.value = null;
});
</script>

<template>
  <div class="contract-deployer">
    <!-- Header -->
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-white mb-2">🚀 Smart Contract Deployer</h2>
      <p class="text-slate-400">Deploy standard smart contracts without coding</p>
    </div>

    <!-- Contract Type Selection -->
    <div class="mb-6">
      <label class="block text-sm font-medium text-slate-300 mb-3">Select Contract Type</label>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          v-for="template in contractTemplates"
          :key="template.type"
          class="contract-type-btn p-4 rounded-xl border transition-all text-left"
          :class="contractType === template.type 
            ? 'border-purple-500 bg-purple-500/20' 
            : 'border-slate-700 bg-slate-800 hover:border-slate-600'"
          @click="contractType = template.type"
        >
          <div class="text-2xl mb-2">{{ template.icon }}</div>
          <div class="font-semibold text-white">{{ template.name }}</div>
          <div class="text-xs text-slate-400 mt-1">{{ template.description }}</div>
        </button>
      </div>
    </div>

    <!-- Network Selection -->
    <div class="mb-6">
      <label class="block text-sm font-medium text-slate-300 mb-2">Target Network</label>
      <select
        v-model="selectedChain"
        class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
      >
        <option v-for="chain in availableChains" :key="chain.id" :value="chain.id">
          {{ chain.name }} ({{ chain.symbol }})
        </option>
      </select>
    </div>

    <!-- Contract Parameters -->
    <div class="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 mb-6">
      <h3 class="text-lg font-semibold text-white mb-4">📝 Contract Parameters</h3>
      
      <!-- ERC20/ERC721/ERC1155 Fields -->
      <div v-if="contractType !== 'Multisig'" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">
            Token Name <span class="text-red-400">*</span>
          </label>
          <input
            v-model="tokenName"
            type="text"
            placeholder="My Token"
            class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div v-if="contractType !== 'ERC1155'">
          <label class="block text-sm font-medium text-slate-300 mb-2">
            Token Symbol <span class="text-red-400">*</span>
          </label>
          <input
            v-model="tokenSymbol"
            type="text"
            placeholder="MTK"
            class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div v-if="contractType === 'ERC20'">
          <label class="block text-sm font-medium text-slate-300 mb-2">
            Initial Supply (optional)
          </label>
          <input
            v-model="initialSupply"
            type="text"
            placeholder="1000000"
            class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <p class="text-xs text-slate-500 mt-1">Leave empty for 0 initial supply</p>
        </div>

        <div v-if="contractType === 'ERC721' || contractType === 'ERC1155'">
          <label class="block text-sm font-medium text-slate-300 mb-2">
            Base URI (optional)
          </label>
          <input
            v-model="uri"
            type="text"
            placeholder="ipfs://Qm..."
            class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      <!-- Multisig Fields -->
      <div v-else class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">
            Number of Owners
          </label>
          <select
            v-model="multisigOwners"
            class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option v-for="n in 10" :key="n" :value="n">{{ n }} owner{{ n > 1 ? 's' : '' }}</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">
            Required Approvals (Threshold)
          </label>
          <select
            v-model="multisigThreshold"
            class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option v-for="n in parseInt(multisigOwners)" :key="n" :value="n">
              {{ n }} of {{ multisigOwners }} required
            </option>
          </select>
          <p class="text-xs text-slate-500 mt-1">
            Transactions require {{ multisigThreshold }} approval{{ multisigThreshold > 1 ? 's' : '' }} to execute
          </p>
        </div>
      </div>
    </div>

    <!-- Gas Estimate -->
    <div class="mb-6">
      <button
        :disabled="!isFormValid || isEstimating"
        class="w-full py-3 px-6 rounded-xl font-semibold transition-all"
        :class="isFormValid 
          ? 'bg-slate-700 hover:bg-slate-600 text-white' 
          : 'bg-slate-800 text-slate-500 cursor-not-allowed'"
        @click="estimateGas"
      >
        {{ isEstimating ? '⏳ Estimating Gas...' : '📊 Estimate Gas' }}
      </button>

      <div v-if="gasEstimate" class="mt-4 bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
        <h4 class="font-semibold text-white mb-3">💰 Estimated Gas Fees</h4>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-xs text-slate-400">Gas Limit</p>
            <p class="text-lg font-semibold text-white">{{ gasEstimate.estimatedGas.toLocaleString() }}</p>
          </div>
          <div>
            <p class="text-xs text-slate-400">Gas Price</p>
            <p class="text-lg font-semibold text-white">{{ Number(gasEstimate.gasPrice) / 1e9 }} Gwei</p>
          </div>
          <div class="col-span-2">
            <p class="text-xs text-slate-400">Estimated Cost</p>
            <p class="text-2xl font-bold text-green-400">{{ gasEstimate.estimatedCostEth }} ETH</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="mb-6 bg-red-500/20 border border-red-500/50 rounded-xl p-4">
      <p class="text-red-300">{{ error }}</p>
    </div>

    <!-- Deploy Button -->
    <button
      :disabled="!isFormValid || isDeploying"
      class="w-full py-4 px-6 rounded-xl font-bold text-lg transition-all"
      :class="isFormValid && isConnected
        ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white'
        : 'bg-slate-800 text-slate-500 cursor-not-allowed'"
      @click="deployContract"
    >
      {{ isDeploying ? '⏳ Deploying...' : '🚀 Deploy Contract' }}
    </button>

    <p v-if="!isConnected" class="text-center text-slate-500 text-sm mt-3">
      Connect your wallet to deploy contracts
    </p>

    <!-- Deployment Result -->
    <div v-if="deployResult" class="mt-6 bg-green-500/20 border border-green-500/50 rounded-2xl p-6">
      <div class="flex items-center gap-3 mb-4">
        <span class="text-3xl">✅</span>
        <h3 class="text-xl font-bold text-green-400">Deployment Successful!</h3>
      </div>
      
      <div class="space-y-3">
        <div>
          <p class="text-xs text-slate-400">Contract Address</p>
          <p class="text-sm font-mono text-white break-all">{{ deployResult.contractAddress }}</p>
        </div>
        <div>
          <p class="text-xs text-slate-400">Transaction Hash</p>
          <p class="text-sm font-mono text-white break-all">{{ deployResult.transactionHash }}</p>
        </div>
        <div class="flex gap-4">
          <div>
            <p class="text-xs text-slate-400">Type</p>
            <p class="text-white font-semibold">{{ deployResult.contractType }}</p>
          </div>
          <div>
            <p class="text-xs text-slate-400">Network</p>
            <p class="text-white font-semibold">{{ selectedChain }}</p>
          </div>
        </div>
        <a
          :href="deployResult.explorerUrl"
          target="_blank"
          class="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300"
        >
          <span>View on Explorer</span>
          <span>↗</span>
        </a>
      </div>
      
      <p class="text-sm text-slate-400 mt-4">{{ deployResult.message }}</p>
    </div>

    <!-- Info Box -->
    <div class="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
      <h4 class="font-semibold text-blue-400 mb-2">💡 Tips</h4>
      <ul class="text-sm text-slate-300 space-y-1">
        <li>• ERC20: Standard fungible tokens (like USDT, LINK)</li>
        <li>• ERC721: Unique NFTs (like CryptoPunks)</li>
        <li>• ERC1155: Multi-token standard (gaming, semi-fungible)</li>
        <li>• Multisig: Shared wallet requiring multiple signatures</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.contract-type-btn {
  cursor: pointer;
}
</style>
