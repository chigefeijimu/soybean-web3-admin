<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useWeb3 } from '@/composables/web3/useWeb3'

interface NFT {
  id: string
  tokenId: string
  contract: string
  name: string
  description: string
  image: string
  collection: string
  attributes?: Array<{ trait_type: string; value: string }>
}

const { account, chainId } = useWeb3()

const nfts = ref<NFT[]>([])
const isLoading = ref(false)
const selectedNFT = ref<NFT | null>(null)
const filter = ref<'all' | 'image' | 'video'>('all')

// Mock NFT data
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
      { trait_type: 'Clothes', value: 'Black Suit' },
    ],
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
      { trait_type: 'Eyes', value: 'Bored' },
    ],
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
      { trait_type: 'Wings', value: 'Celestial' },
    ],
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
      { trait_type: 'Eye Color', value: 'Neon Blue' },
    ],
  },
]

const loadNFTs = async () => {
  if (!account.value) return
  
  isLoading.value = true
  try {
    // In production, fetch from:
    // 1. OpenSea/Alchemy API
    // 2. Direct blockchain queries
    // 3. Moralis/Rarify APIs
    
    await new Promise(resolve => setTimeout(resolve, 800))
    nfts.value = mockNFTs
  } catch (e) {
    console.error('Failed to load NFTs:', e)
  } finally {
    isLoading.value = false
  }
}

const openNFT = (nft: NFT) => {
  selectedNFT.value = nft
}

const closeModal = () => {
  selectedNFT.value = null
}

const getTraitColor = (value: string): string => {
  const colors: Record<string, string> = {
    'Orange': 'bg-orange-500/20 text-orange-400',
    'Blue': 'bg-blue-500/20 text-blue-400',
    'Golden': 'bg-yellow-500/20 text-yellow-400',
    'Rainbow': 'bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent',
    'Cosmic': 'bg-purple-500/20 text-purple-400',
    'Neon Blue': 'bg-cyan-500/20 text-cyan-400',
  }
  return colors[value] || 'bg-slate-500/20 text-slate-400'
}

onMounted(() => {
  if (account.value) {
    loadNFTs()
  }
})
</script>

<template>
  <div class="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-semibold">NFT Gallery</h2>
      <button 
        @click="loadNFTs"
        :disabled="isLoading || !account"
        class="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 rounded-lg text-sm transition-colors"
      >
        {{ isLoading ? 'Loading...' : '↻ Refresh' }}
      </button>
    </div>

    <!-- Filter Tabs -->
    <div class="flex gap-2 mb-6">
      <button 
        v-for="f in ['all', 'image', 'video']" 
        :key="f"
        @click="filter = f as any"
        :class="[
          'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
          filter === f 
            ? 'bg-purple-500/20 text-purple-400' 
            : 'bg-slate-700/50 text-slate-400 hover:text-white'
        ]"
      >
        {{ f.charAt(0).toUpperCase() + f.slice(1) }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="text-center py-12">
      <div class="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
      <p class="text-slate-400 mt-4">Loading your NFTs...</p>
    </div>

    <!-- No Account -->
    <div v-else-if="!account" class="text-center py-12 text-slate-400">
      <div class="text-5xl mb-4">🖼️</div>
      <p>Connect wallet to view NFTs</p>
    </div>

    <!-- NFT Grid -->
    <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <div
        v-for="nft in nfts"
        :key="nft.id"
        @click="openNFT(nft)"
        class="bg-slate-900/50 rounded-xl overflow-hidden hover:scale-105 transition-transform cursor-pointer group"
      >
        <!-- NFT Image -->
        <div class="aspect-square bg-slate-800 relative">
          <img 
            :src="nft.image" 
            :alt="nft.name"
            class="w-full h-full object-cover"
            @error="($event.target as HTMLImageElement).src = 'https://via.placeholder.com/300?text=NFT'"
          />
          <!-- Overlay on hover -->
          <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span class="px-4 py-2 bg-white/20 rounded-lg text-sm">View</span>
          </div>
        </div>
        
        <!-- NFT Info -->
        <div class="p-3">
          <p class="font-medium text-sm truncate">{{ nft.collection }}</p>
          <p class="text-xs text-slate-400 truncate">#{{ nft.tokenId }}</p>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!isLoading && account && nfts.length === 0" class="text-center py-12 text-slate-400">
      <div class="text-5xl mb-4">📭</div>
      <p>No NFTs found</p>
      <p class="text-sm mt-1">Your NFT collection will appear here</p>
    </div>

    <!-- NFT Detail Modal -->
    <Teleport to="body">
      <div 
        v-if="selectedNFT"
        class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        @click.self="closeModal"
      >
        <div class="bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700">
          <!-- Modal Header -->
          <div class="flex items-center justify-between p-6 border-b border-slate-700">
            <h3 class="text-xl font-semibold">{{ selectedNFT.name }}</h3>
            <button 
              @click="closeModal"
              class="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>

          <!-- Modal Content -->
          <div class="p-6">
            <!-- Image -->
            <div class="aspect-square bg-slate-900 rounded-xl overflow-hidden mb-6">
              <img 
                :src="selectedNFT.image" 
                :alt="selectedNFT.name"
                class="w-full h-full object-contain"
              />
            </div>

            <!-- Collection -->
            <p class="text-purple-400 font-medium mb-2">{{ selectedNFT.collection }}</p>
            
            <!-- Description -->
            <p class="text-slate-300 mb-6">{{ selectedNFT.description }}</p>

            <!-- Attributes -->
            <div v-if="selectedNFT.attributes?.length" class="mb-6">
              <h4 class="text-sm font-medium text-slate-400 mb-3">Attributes</h4>
              <div class="grid grid-cols-2 gap-2">
                <div 
                  v-for="attr in selectedNFT.attributes"
                  :key="attr.trait_type"
                  class="p-3 bg-slate-900/50 rounded-lg"
                >
                  <p class="text-xs text-slate-500">{{ attr.trait_type }}</p>
                  <p :class="['font-medium mt-1', getTraitColor(attr.value)]">
                    {{ attr.value }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Contract Address -->
            <div class="p-3 bg-slate-900/50 rounded-lg">
              <p class="text-xs text-slate-500 mb-1">Contract</p>
              <p class="font-mono text-sm text-slate-400 truncate">
                {{ selectedNFT.contract }}
              </p>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="p-6 border-t border-slate-700 flex gap-3">
            <a 
              :href="`https://opensea.io/assets/${selectedNFT.contract}/${selectedNFT.tokenId}`"
              target="_blank"
              class="flex-1 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl text-center font-medium transition-colors"
            >
              View on OpenSea
            </a>
            <a 
              :href="`https://etherscan.io/token/${selectedNFT.contract}?a=${selectedNFT.tokenId}`"
              target="_blank"
              class="flex-1 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-center font-medium transition-colors"
            >
              View on Etherscan
            </a>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
