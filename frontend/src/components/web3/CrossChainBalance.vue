<template>
  <div class="cross-chain-balance">
    <n-card title="🔗 Cross-chain Balance Aggregator" :bordered="false" class="card-gutter">
      <n-space vertical :size="16">
        <n-space align="center">
          <n-input-group>
            <n-input-group-label>Address</n-input-group-label>
            <n-input 
              v-model:value="address" 
              placeholder="0x..." 
              @keyup.enter="fetchBalance"
              style="width: 400px"
            />
          </n-input-group>
          <n-select
            v-model:value="selectedChains"
            multiple
            :options="chainOptions"
            placeholder="Select chains"
            style="width: 300px"
          />
          <n-button type="primary" @click="fetchBalance" :loading="loading">
            <template #icon>
              <n-icon><SearchOutline /></n-icon>
            </template>
           查询
          </n-button>
        </n-space>

        <n-alert v-if="error" type="error" :title="error" />

        <template v-if="result">
          <n-card title="📊 Total Balance" size="small">
            <n-statistic label="Total Value (USD)" :value="result.totalUsd">
              <template #prefix>$</template>
            </n-statistic>
            <n-progress 
              type="line" 
              :percentage="100" 
              :indicator-placement="'inside'"
              :color="'#18a058'"
            />
            <n-text depth="3">
              Checked {{ result.chainsChecked }} chains • {{ result.chainsSuccess }} successful • {{ result.chainsFailed }} failed
            </n-text>
          </n-card>

          <n-grid :cols="3" :x-gap="16" :y-gap="16">
            <n-gi v-for="balance in result.balances" :key="balance.chain">
              <n-card 
                :title="getChainIcon(balance.chain)" 
                size="small"
                :class="{ 'error-card': balance.error }"
              >
                <n-space vertical :size="8">
                  <n-statistic :label="getChainName(balance.chain)">
                    <template #prefix>$</template>
                    <template #default>{{ balance.totalUsd }}</template>
                  </n-statistic>
                  
                  <n-divider v-if="balance.nativeBalance" style="margin: 8px 0" />
                  
                  <template v-if="balance.nativeBalance">
                    <n-text depth="3">
                      �.native: {{ balance.nativeBalance }} {{ balance.nativeSymbol }} 
                      (~${{ balance.nativeUsd }})
                    </n-text>
                  </template>

                  <template v-if="balance.tokens?.length">
                    <n-text depth="3" v-for="token in balance.tokens" :key="token.symbol">
                      💰 {{ token.symbol }}: {{ token.balance }} (~${{ token.usdValue }})
                    </n-text>
                  </template>

                  <n-text v-if="balance.error" type="error" depth="3">
                    ⚠️ {{ balance.error }}
                  </n-text>
                </n-space>
              </n-card>
            </n-gi>
          </n-grid>

          <n-card title="📈 Balance Distribution" size="small">
            <n-chart
              type="pie"
              :data="chartData"
              :options="chartOptions"
              :height="300"
            />
          </n-card>
        </template>

        <template v-if="compareResult">
          <n-card title="⚖️ Address Comparison" size="small">
            <n-table :bordered="false" :single-line="false">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Address</th>
                  <th>Total USD</th>
                  <th>Chains</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in compareResult.ranking" :key="item.address">
                  <td>
                    <n-tag :type="idx === 0 ? 'success' : idx === 1 ? 'warning' : 'default'">
                      #{{ idx + 1 }}
                    </n-tag>
                  </td>
                  <td>
                    <n-text code>{{ shortAddress(item.address) }}</n-text>
                  </td>
                  <td>${{ item.totalUsd }}</td>
                  <td>{{ item.chainsCount }}</td>
                </tr>
              </tbody>
            </n-table>
          </n-card>
        </template>
      </n-space>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { 
  NCard, NButton, NInput, NSelect, NSpace, NIcon, NAlert, 
  NStatistic, NProgress, NText, NGrid, NGi, NDivider,
  NChart, NTable, NTag
} from 'naive-ui';
import { SearchOutline } from '@vicons/ionicons5';
import { getCrossChainBalance } from '@/service/api/web3';

const address = ref('0x742d35Cc6634C0532925a3b844Bc9e7595f0eB1E');
const selectedChains = ref(['ethereum', 'polygon', 'arbitrum', 'optimism', 'bsc']);
const loading = ref(false);
const error = ref('');
const result = ref<any>(null);
const compareResult = ref<any>(null);

const chainOptions = [
  { label: 'Ethereum', value: 'ethereum' },
  { label: 'Polygon', value: 'polygon' },
  { label: 'Arbitrum', value: 'arbitrum' },
  { label: 'Optimism', value: 'optimism' },
  { label: 'BSC', value: 'bsc' },
  { label: 'Avalanche', value: 'avalanche' },
  { label: 'Base', value: 'base' },
];

const getChainName = (chain: string) => {
  const names: Record<string, string> = {
    ethereum: 'Ethereum',
    polygon: 'Polygon',
    arbitrum: 'Arbitrum',
    optimism: 'Optimism',
    bsc: 'BNB Chain',
    avalanche: 'Avalanche',
    base: 'Base',
  };
  return names[chain] || chain;
};

const getChainIcon = (chain: string) => {
  const icons: Record<string, string> = {
    ethereum: '🔷',
    polygon: '🟣',
    arbitrum: '🔵',
    optimism: '🔴',
    bsc: '🟡',
    avalanche: '🔺',
    base: '🔵',
  };
  return icons[chain] || '⚪';
};

const shortAddress = (addr: string) => {
  return addr.slice(0, 6) + '...' + addr.slice(-4);
};

const fetchBalance = async () => {
  if (!address.value) {
    error.value = 'Please enter an address';
    return;
  }
  
  loading.value = true;
  error.value = '';
  result.value = null;
  
  try {
    const chains = selectedChains.value.join(',');
    const response = await getCrossChainBalance(address.value, chains);
    result.value = response;
  } catch (e: any) {
    error.value = e.message || 'Failed to fetch balance';
  } finally {
    loading.value = false;
  }
};

const chartData = computed(() => {
  if (!result.value?.balances) return [];
  
  return result.value.balances
    .filter((b: any) => !b.error && parseFloat(b.totalUsd) > 0)
    .map((b: any) => ({
      name: getChainName(b.chain),
      value: parseFloat(b.totalUsd),
    }));
});

const chartOptions = {
  radius: ['0%', '70%'],
  label: {
    show: true,
    formatter: '{b}: ${c} ({d}%)',
  },
};
</script>

<style scoped>
.cross-chain-balance {
  padding: 16px;
}

.card-gutter {
  margin-bottom: 16px;
}

.error-card {
  opacity: 0.7;
}

:deep(.n-card-header__main) {
  font-size: 14px;
}
</style>
