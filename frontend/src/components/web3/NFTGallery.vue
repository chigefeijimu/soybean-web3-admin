<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useWeb3 } from '@/composables/web3/useWeb3';
import { getNFTDetails, getNFTMetadata } from '@/service/api/web3';

interface NFT {
  id: string;
  tokenId: string;
  contract: string;
  name: string;
  description: string;
  image: string;
  collection: string;
  attributes?: Array<{ trait_type: string; value: string }>;
}

const { account, chainId } = useWeb3();

const nfts = ref<NFT[]>([]);
const isLoading = ref(false);
const selectedNFT = ref<NFT | null>(null);
const filter = ref<'all' | 'image' | 'video'>('all');

// Form inputs for fetching NFTs
const contractAddress = ref('0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D'); // BAYC contract
const tokenIds = ref('7804,1234');
const nftChainId = ref(1);

// Mock NFT data (fallback)
const mockNFTs: NFT[] = [
  {
    id: '1',
    tokenId: '7804',
    contract: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
    name: 'Bored Ape #7804',
    description: 'A rare Bored Ape with golden fur and laser eyes.',
    image: 'https://ipfs.io/ipfs/QmRRPWG96cmgTn2qSzjwr2qvfNEuhunv6FNeMFGa9bx6mQ',
    collection: 'Bored Ape Yacht Club',
    attributes: [
      { trait_type: 'Background', value: 'Orange' },
      { trait_type: 'Fur', value: 'Golden' },
      { trait_type: 'Eyes', value: 'Laser' },
      { trait_type: 'Clothes', value: 'Black Suit' }
    ]
  },
  {
    id: '2',
    tokenId: '1234',
    contract: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
    name: 'Bored Ape #1234',
    description: 'A cool Bored Ape with rainbow fur.',
    image: 'https://ipfs.io/ipfs/QmRRPWG96cmgTn2qSzjwr2qvfNEuhunv6FNeMFGa9bx6mQ',
    collection: 'Bored Ape Yacht Club',
    attributes: [
      { trait_type: 'Background', value: 'Blue' },
      { trait_type: 'Fur', value: 'Rainbow' },
      { trait_type: 'Eyes', value: 'Bored' }
    ]
  },
  {
    id: '3',
    tokenId: '5678',
    contract: '0x23581767a106ae21c074b2276D25e5C3e136a68b',
    name: 'Moonbird #5678',
    description: 'A celestial Moonbird with cosmic wings.',
    image: 'https://ipfs.io/ipfs/QmRRPWG96cmgTn2qSzjwr2qvfNEuhunv6FNeMFGa9bx6mQ',
    collection: 'Moonbirds',
    attributes: [
      { trait_type: 'Background', value: 'Cosmic' },
      { trait_type: 'Wings', value: 'Celestial' }
    ]
  },
  {
    id: '4',
    tokenId: '9012',
    contract: '0x49cF6f5d44E70224e2E23fDcdd2C053F30aDA28B',
    name: 'Clone X #9012',
    description: 'A futuristic Clone X with neon features.',
    image: 'https://ipfs.io/ipfs/QmRRPWG96cmgTn2qSzjwr2qvfNEuhunv6FNeMFGa9bx6mQ',
    collection: 'CLONE X',
    attributes: [
      { trait_type: 'DNA', value: 'Human' },
      { trait_type: 'Eye Color', value: 'Neon Blue' }
    ]
  }
];

const loadNFTs = async () => {
  if (!account.value) return;

  isLoading.value = true;
  try {
    // Try to fetch from backend API
    const tokenIdList = tokenIds.value.split(',').map(t => t.trim()).filter(t => t);
    
    if (contractAddress.value && tokenIdList.length > 0) {
      const response = await getNFTDetails(contractAddress.value, tokenIdList, nftChainId.value);
      
      if (response.data?.success && response.data?.data?.nfts) {
        nfts.value = response.data.data.nfts.map((nft: any, index: number) => ({
          id: String(index + 1),
          tokenId: nft.token_id || tokenIdList[index],
          contract: contractAddress.value,
          name: nft.metadata?.name || `NFT #${tokenIdList[index]}`,
          description: nft.metadata?.description || '',
          image: nft.metadata?.image || nft.metadata?.image_url || '',
          collection: nft.metadata?.collection?.name || '',
          attributes: nft.metadata?.attributes
        }));
      } else {
        // API call succeeded but no data, use mock
        console.log('No NFT data from API, using mock data');
        nfts.value = mockNFTs;
      }
    } else {
      nfts.value = mockNFTs;
    }
  } catch (e) {
    console.error('Failed to load NFTs from API:', e);
    // Fallback to mock data on error
    nfts.value = mockNFTs;
  } finally {
    isLoading.value = false;
  }
};

// Also keep the mock load for quick testing
const loadMockNFTs = async () => {
  isLoading.value = true;
  await new Promise(resolve => setTimeout(resolve, 500));
  nfts.value = mockNFTs;
  isLoading.value = false;
};

const openNFT = (nft: NFT) => {
  selectedNFT.value = nft;
};

const closeModal = () => {
  selectedNFT.value = null;
};

const getTraitColor = (value: string): string => {
  const colors: Record<string, string> = {
    Orange: 'bg-orange-500/20 text-orange-400',
    Blue: 'bg-blue-500/20 text-blue-400',
    Golden: 'bg-yellow-500/20 text-yellow-400',
    Rainbow: 'bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent',
    Cosmic: 'bg-purple-500/20 text-purple-400',
    'Neon Blue': 'bg-cyan-500/20 text-cyan-400'
  };
  return colors[value] || 'bg-slate-500/20 text-slate-400';
};

onMounted(() => {
  if (account.value) {
    loadNFTs();
  }
});
</script>

<template>
  <div class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl">
    <div class="mb-6 flex items-center justify-between">
      <h2 class="text-xl font-semibold">NFT Gallery</h2>
      <div class="flex gap-2">
        <button
          :disabled="isLoading"
          class="rounded-lg bg-slate-700 px-4 py-2 text-sm transition-colors hover:bg-slate-600 disabled:opacity-50"
          @click="loadMockNFTs"
        >
          Load Demo
        </button>
        <button
          :disabled="isLoading || !account"
          class="rounded-lg bg-purple-500 px-4 py-2 text-sm transition-colors hover:bg-purple-600 disabled:opacity-50"
          @click="loadNFTs"
        >
          {{ isLoading ? 'Loading...' : '↻ Fetch from Chain' }}
        </button>
      </div>
    </div>

    <!-- NFT Config Form -->
    <div class="mb-6 grid grid-cols-1 gap-4 rounded-xl bg-slate-900/50 p-4 md:grid-cols-3">
      <div>
        <label class="mb-1 block text-xs text-slate-400">Contract Address</label>
        <input
          v-model="contractAddress"
          type="text"
          placeholder="0x..."
          class="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label class="mb-1 block text-xs text-slate-400">Token IDs (comma separated)</label>
        <input
          v-model="tokenIds"
          type="text"
          placeholder="1,2,3"
          class="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label class="mb-1 block text-xs text-slate-400">Chain ID</label>
        <select
          v-model="nftChainId"
          class="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm"
        >
          <option :value="1">Ethereum</option>
          <option :value="5">Goerli</option>
          <option :value="11155111">Sepolia</option>
          <option :value="137">Polygon</option>
          <option :value="42161">Arbitrum</option>
        </select>
      </div>
    </div>

    <!-- Filter Tabs -->
    <div class="mb-6 flex gap-2">
      <button
        v-for="f in ['all', 'image', 'video']"
        :key="f"
        class="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
        :class="[filter === f ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-700/50 text-slate-400 hover:text-white']"
        @click="filter = f as any"
      >
        {{ f.charAt(0).toUpperCase() + f.slice(1) }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="py-12 text-center">
      <div class="mx-auto h-12 w-12 animate-spin border-4 border-purple-500 border-t-transparent rounded-full"></div>
      <p class="mt-4 text-slate-400">Loading your NFTs...</p>
    </div>

    <!-- No Account -->
    <div v-else-if="!account" class="py-12 text-center text-slate-400">
      <div class="mb-4 text-5xl">🖼️</div>
      <p>Connect wallet to view NFTs</p>
    </div>

    <!-- NFT Grid -->
    <div v-else class="grid grid-cols-2 gap-4 lg:grid-cols-4 md:grid-cols-3">
      <div
        v-for="nft in nfts"
        :key="nft.id"
        class="group cursor-pointer overflow-hidden rounded-xl bg-slate-900/50 transition-transform hover:scale-105"
        @click="openNFT(nft)"
      >
        <!-- NFT Image -->
        <div class="relative aspect-square bg-slate-800">
          <img
            :src="nft.image"
            :alt="nft.name"
            class="h-full w-full object-cover"
            @error="($event.target as HTMLImageElement).src = 'https://via.placeholder.com/300?text=NFT'"
          />
          <!-- Overlay on hover -->
          <div
            class="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
          >
            <span class="rounded-lg bg-white/20 px-4 py-2 text-sm">View</span>
          </div>
        </div>

        <!-- NFT Info -->
        <div class="p-3">
          <p class="truncate text-sm font-medium">{{ nft.collection }}</p>
          <p class="truncate text-xs text-slate-400">#{{ nft.tokenId }}</p>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!isLoading && account && nfts.length === 0" class="py-12 text-center text-slate-400">
      <div class="mb-4 text-5xl">📭</div>
      <p>No NFTs found</p>
      <p class="mt-1 text-sm">Your NFT collection will appear here</p>
    </div>

    <!-- NFT Detail Modal -->
    <Teleport to="body">
      <div
        v-if="selectedNFT"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
        @click.self="closeModal"
      >
        <div class="max-h-[90vh] max-w-2xl w-full overflow-y-auto border border-slate-700 rounded-2xl bg-slate-800">
          <!-- Modal Header -->
          <div class="flex items-center justify-between border-b border-slate-700 p-6">
            <h3 class="text-xl font-semibold">{{ selectedNFT.name }}</h3>
            <button class="rounded-lg p-2 transition-colors hover:bg-slate-700" @click="closeModal">✕</button>
          </div>

          <!-- Modal Content -->
          <div class="p-6">
            <!-- Image -->
            <div class="mb-6 aspect-square overflow-hidden rounded-xl bg-slate-900">
              <img :src="selectedNFT.image" :alt="selectedNFT.name" class="h-full w-full object-contain" />
            </div>

            <!-- Collection -->
            <p class="mb-2 text-purple-400 font-medium">{{ selectedNFT.collection }}</p>

            <!-- Description -->
            <p class="mb-6 text-slate-300">{{ selectedNFT.description }}</p>

            <!-- Attributes -->
            <div v-if="selectedNFT.attributes?.length" class="mb-6">
              <h4 class="mb-3 text-sm text-slate-400 font-medium">Attributes</h4>
              <div class="grid grid-cols-2 gap-2">
                <div
                  v-for="attr in selectedNFT.attributes"
                  :key="attr.trait_type"
                  class="rounded-lg bg-slate-900/50 p-3"
                >
                  <p class="text-xs text-slate-500">{{ attr.trait_type }}</p>
                  <p class="mt-1 font-medium" :class="[getTraitColor(attr.value)]">
                    {{ attr.value }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Contract Address -->
            <div class="rounded-lg bg-slate-900/50 p-3">
              <p class="mb-1 text-xs text-slate-500">Contract</p>
              <p class="truncate text-sm text-slate-400 font-mono">
                {{ selectedNFT.contract }}
              </p>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="flex gap-3 border-t border-slate-700 p-6">
            <a
              :href="`https://opensea.io/assets/${selectedNFT.contract}/${selectedNFT.tokenId}`"
              target="_blank"
              class="flex-1 rounded-xl bg-blue-500 py-3 text-center font-medium transition-colors hover:bg-blue-600"
            >
              View on OpenSea
            </a>
            <a
              :href="`https://etherscan.io/token/${selectedNFT.contract}?a=${selectedNFT.tokenId}`"
              target="_blank"
              class="flex-1 rounded-xl bg-slate-700 py-3 text-center font-medium transition-colors hover:bg-slate-600"
            >
              View on Etherscan
            </a>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
