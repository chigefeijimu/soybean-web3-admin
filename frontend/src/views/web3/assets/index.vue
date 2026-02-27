<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAccount } from 'wagmi'
import { NCard, NGrid, NGridItem, NTabs, NTabPane, NButton, NSpace, NTag, NEmpty, useMessage } from 'naive-ui'
import { WalletOutlined, FileTextOutlined, SwapOutlined, PictureOutlined } from '@vicons/antd'
import { getContractList, createContract } from '@/service/api/web3'
import { POPULAR_TOKENS } from '@/constants/tokens'
import { POPULAR_NFTS, ERC721_ABI } from '@/constants/nfts'
import WalletConnect from '@/components/web3/WalletConnect.vue'

const { address, isConnected, chainId } = useAccount()
const message = useMessage()

// Token 状态
const tokens = ref<any[]>([])
const nfts = ref<any[]>([])
const activeTab = ref('tokens')

// 加载代币
const loadTokens = async () => {
  try {
    const res = await getContractList()
    tokens.value = (res.data.data || []).filter((c: any) => 
      c.name?.includes('Token') || c.name?.includes('USDT') || c.name?.includes('USDC')
    )
  } catch (e) {
    console.error(e)
  }
}

// 加载 NFT
const loadNFTs = async () => {
  try {
    const res = await getContractList()
    nfts.value = (res.data.data || []).filter((c: any) => 
      c.name?.includes('NFT') || c.name?.includes('BAYC') || c.name?.includes('AZUKI')
    )
  } catch (e) {
    console.error(e)
  }
}

// 添加代币
const addToken = async (token: typeof POPULAR_TOKENS.USDT) => {
  try {
    await createContract({
      name: `${token.symbol} (Token)`,
      contractAddress: token.address,
      chainId: token.chainId,
      abi: JSON.stringify(POPULAR_TOKENS),
      description: `Popular ${token.symbol} token`
    })
    message.success(`${token.symbol} added!`)
    loadTokens()
  } catch (e: any) {
    message.error(e.message || 'Failed to add')
  }
}

// 添加 NFT
const addNFT = async (nft: typeof POPULAR_NFTS.BAYC) => {
  try {
    await createContract({
      name: `${nft.symbol} (${nft.type})`,
      contractAddress: nft.address,
      chainId: nft.chainId,
      abi: JSON.stringify(ERC721_ABI),
      description: `Popular ${nft.type} collection`
    })
    message.success(`${nft.symbol} added!`)
    loadNFTs()
  } catch (e: any) {
    message.error(e.message || 'Failed to add')
  }
}

const chainNames: Record<number, string> = {
  1: 'ETH',
  56: 'BSC',
  137: 'Polygon'
}

onMounted(() => {
  loadTokens()
  loadNFTs()
})
</script>

<template>
  <div class="assets-page">
    <NCard title="Digital Assets" :bordered="false">
      <template #header-extra>
        <WalletConnect />
      </template>

      <NTabs v-model:value="activeTab" type="line">
        <!-- Tokens Tab -->
        <NTabPane name="tokens" tab="Tokens">
          <div class="section">
            <div class="section-header">
              <h4>Popular Tokens</h4>
              <NSpace>
                <NButton 
                  v-for="token in Object.values(POPULAR_TOKENS)" 
                  :key="token.address"
                  size="small"
                  @click="addToken(token)"
                >
                  + {{ token.symbol }}
                </NButton>
              </NSpace>
            </div>
            
            <NEmpty v-if="tokens.length === 0" description="No tokens added yet">
              <template #extra>
                Click buttons above to add popular tokens
              </template>
            </NEmpty>
            
            <NGrid v-else :cols="3" :x-gap="12" :y-gap="12">
              <NGridItem v-for="token in tokens" :key="token.id">
                <NCard size="small" hoverable>
                  <div class="asset-item">
                    <div class="asset-name">{{ token.name }}</div>
                    <div class="asset-address">{{ token.contractAddress?.slice(0, 10) }}...</div>
                    <NTag size="small">{{ chainNames[token.chainId] }}</NTag>
                  </div>
                </NCard>
              </NGridItem>
            </NGrid>
          </div>
        </NTabPane>
        
        <!-- NFTs Tab -->
        <NTabPane name="nfts" tab="NFTs">
          <div class="section">
            <div class="section-header">
              <h4>Popular NFT Collections</h4>
              <NSpace>
                <NButton 
                  v-for="nft in Object.values(POPULAR_NFTS)" 
                  :key="nft.address"
                  size="small"
                  @click="addNFT(nft)"
                >
                  + {{ nft.symbol }}
                </NButton>
              </NSpace>
            </div>
            
            <NEmpty v-if="nfts.length === 0" description="No NFTs added yet">
              <template #extra>
                Click buttons above to add popular NFT collections
              </template>
            </NEmpty>
            
            <NGrid v-else :cols="3" :x-gap="12" :y-gap="12">
              <NGridItem v-for="nft in nfts" :key="nft.id">
                <NCard size="small" hoverable>
                  <div class="asset-item">
                    <PictureOutlined style="font-size: 24px; margin-bottom: 8px;" />
                    <div class="asset-name">{{ nft.name }}</div>
                    <div class="asset-address">{{ nft.contractAddress?.slice(0, 10) }}...</div>
                    <NTag size="small" type="success">{{ nft.chainId === 1 ? 'ERC721' : 'ERC1155' }}</NTag>
                  </div>
                </NCard>
              </NGridItem>
            </NGrid>
          </div>
        </NTabPane>
      </NTabs>
    </NCard>
  </div>
</template>

<style scoped>
.assets-page {
  padding: 16px;
}

.section {
  padding: 16px 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h4 {
  margin: 0;
}

.asset-item {
  text-align: center;
  padding: 8px;
}

.asset-name {
  font-weight: 500;
  margin-bottom: 4px;
}

.asset-address {
  font-size: 12px;
  color: #999;
  font-family: monospace;
  margin-bottom: 8px;
}
</style>
