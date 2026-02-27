<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAccount, useBalance, useReadContract } from 'wagmi'
import { NCard, NStatistic, NGrid, NGridItem, NSpace, NTag, NButton, NEmpty } from 'naive-ui'
import { WalletOutlined, DollarOutlined, BankOutlined, SwapOutlined } from '@vicons/antd'
import { formatEther } from 'viem'
import { getChainConfig, getExplorerAddressUrl, formatAddress } from '@/hooks/useChain'
import { POPULAR_TOKENS } from '@/constants/tokens'

const { address, isConnected, chainId } = useAccount()

// Get native token balance
const { data: balance, refetch: refetchBalance } = useBalance({
  address: address,
  chainId: chainId
})

const chainConfig = computed(() => chainId.value ? getChainConfig(chainId.value) : null)

const formattedBalance = computed(() => {
  if (!balance.value) return '0'
  return parseFloat(formatEther(balance.value.value)).toFixed(4)
})

const tokens = ref([
  { name: 'USDT', balance: '0.00', value: '$0.00' },
  { name: 'USDC', balance: '0.00', value: '$0.00' },
  { name: 'ETH', balance: formattedBalance.value, value: `$${(parseFloat(formattedBalance.value) * 3000).toFixed(2)}` }
])

const refreshData = () => {
  refetchBalance()
}

const openExplorer = () => {
  if (address.value && chainConfig.value) {
    window.open(getExplorerAddressUrl(chainConfig.value.id, address.value), '_blank')
  }
}

onMounted(() => {
  // Load token balances
})

watch(chainId, () => {
  refreshData()
})
</script>

<template>
  <div class="portfolio-dashboard">
    <NGrid :cols="3" :x-gap="16" :y-gap="16">
      <!-- Wallet Balance -->
      <NGridItem>
        <NCard hoverable>
          <template #header>
            <NSpace align="center" :size="8">
              <WalletOutlined style="font-size: 20px; color: #1890ff;" />
              <span>Wallet Balance</span>
            </NSpace>
          </template>
          <NStatistic :label="chainConfig?.symbol || 'Native Token'">
            <template #default>
              {{ formattedBalance }}
            </template>
          </NStatistic>
          <div v-if="isConnected" class="wallet-address">
            {{ formatAddress(address!, 8, 6) }}
          </div>
        </NCard>
      </NGridItem>

      <!-- Total Value -->
      <NGridItem>
        <NCard hoverable>
          <template #header>
            <NSpace align="center" :size="8">
              <DollarOutlined style="font-size: 20px; color: #52c41a;" />
              <span>Total Value</span>
            </NSpace>
          </template>
          <NStatistic label="USD">
            <template #default>
              ${{ (parseFloat(formattedBalance) * 3000).toFixed(2) }}
            </template>
          </NStatistic>
        </NCard>
      </NGridItem>

      <!-- Network -->
      <NGridItem>
        <NCard hoverable>
          <template #header>
            <NSpace align="center" :size="8">
              <BankOutlined style="font-size: 20px; color: #722ed1;" />
              <span>Network</span>
            </NSpace>
          </template>
          <div class="network-info">
            <NTag :color="chainConfig?.color || '#666'" size="large">
              {{ chainConfig?.name || 'Unknown' }}
            </NTag>
            <div class="chain-id">Chain ID: {{ chainId }}</div>
          </div>
        </NCard>
      </NGridItem>
    </NGrid>

    <!-- Quick Actions -->
    <div class="actions" style="margin-top: 16px;">
      <NSpace>
        <NButton @click="refreshData">
          <template #icon>🔄</template>
          Refresh
        </NButton>
        <NButton v-if="isConnected" type="primary" @click="openExplorer">
          View on Explorer
        </NButton>
      </NSpace>
    </div>

    <!-- Not Connected -->
    <div v-if="!isConnected" class="connect-prompt">
      <NEmpty description="Connect your wallet to view portfolio">
        <template #extra>
          <span style="color: #999;">Use the "Connect Wallet" button in the header</span>
        </template>
      </NEmpty>
    </div>
  </div>
</template>

<style scoped>
.portfolio-dashboard {
  padding: 16px 0;
}

.wallet-address {
  margin-top: 8px;
  font-size: 12px;
  color: #999;
  font-family: monospace;
}

.network-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chain-id {
  font-size: 12px;
  color: #999;
}

.connect-prompt {
  margin-top: 32px;
  text-align: center;
}
</style>
