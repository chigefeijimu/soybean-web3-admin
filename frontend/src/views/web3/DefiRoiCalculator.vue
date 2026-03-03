<template>
  <n-card title="DeFi ROI Calculator" :bordered="false" class="defi-roi-card">
    <n-tabs type="line" animated>
      <n-tab-pane name="staking" tab="Staking">
        <n-form ref="stakingForm" :model="stakingForm" :rules="stakingRules">
          <n-form-item label="Token" path="token">
            <n-select v-model:value="stakingForm.token" :options="tokenOptions" />
          </n-form-item>
          <n-form-item label="Amount (USD)" path="amount">
            <n-input-number v-model:value="stakingForm.amount" :min="0" placeholder="Enter amount" style="width: 100%" />
          </n-form-item>
          <n-form-item label="APY (%)" path="apy">
            <n-input-number v-model:value="stakingForm.apy" :min="0" :max="100" placeholder="Enter APY" style="width: 100%" />
          </n-form-item>
          <n-form-item label="Duration (days)" path="durationDays">
            <n-input-number v-model:value="stakingForm.durationDays" :min="1" :max="3650" placeholder="Duration in days" style="width: 100%" />
          </n-form-item>
          <n-form-item label="Compound Frequency" path="compoundFrequency">
            <n-select v-model:value="stakingForm.compoundFrequency" :options="compoundOptions" />
          </n-form-item>
          <n-button type="primary" @click="calculateStaking" block :loading="loading">Calculate</n-button>
        </n-form>
      </n-tab-pane>

      <n-tab-pane name="lending" tab="Lending">
        <n-form ref="lendingForm" :model="lendingForm">
          <n-form-item label="Token" path="token">
            <n-select v-model:value="lendingForm.token" :options="tokenOptions" />
          </n-form-item>
          <n-form-item label="Amount (USD)" path="amount">
            <n-input-number v-model:value="lendingForm.amount" :min="0" placeholder="Enter amount" style="width: 100%" />
          </n-form-item>
          <n-form-item label="Supply APY (%)" path="supplyApy">
            <n-input-number v-model:value="lendingForm.supplyApy" :min="0" :max="100" placeholder="Enter supply APY" style="width: 100%" />
          </n-form-item>
          <n-form-item label="Duration (days)" path="durationDays">
            <n-input-number v-model:value="lendingForm.durationDays" :min="1" :max="3650" placeholder="Duration in days" style="width: 100%" />
          </n-form-item>
          <n-form-item label="Compound Frequency" path="compoundFrequency">
            <n-select v-model:value="lendingForm.compoundFrequency" :options="compoundOptions" />
          </n-form-item>
          <n-button type="primary" @click="calculateLending" block :loading="loading">Calculate</n-button>
        </n-form>
      </n-tab-pane>

      <n-tab-pane name="liquidity" tab="Liquidity Pool">
        <n-form ref="liquidityForm" :model="liquidityForm">
          <n-row :gutter="16">
            <n-col :span="12">
              <n-form-item label="Token 0" path="token0">
                <n-select v-model:value="liquidityForm.token0" :options="tokenOptions" />
              </n-form-item>
            </n-col>
            <n-col :span="12">
              <n-form-item label="Token 1" path="token1">
                <n-select v-model:value="liquidityForm.token1" :options="tokenOptions" />
              </n-form-item>
            </n-col>
          </n-row>
          <n-row :gutter="16">
            <n-col :span="12">
              <n-form-item label="Amount 0 (USD)" path="amount0">
                <n-input-number v-model:value="liquidityForm.amount0" :min="0" style="width: 100%" />
              </n-form-item>
            </n-col>
            <n-col :span="12">
              <n-form-item label="Amount 1 (USD)" path="amount1">
                <n-input-number v-model:value="liquidityForm.amount1" :min="0" style="width: 100%" />
              </n-form-item>
            </n-col>
          </n-row>
          <n-form-item label="Expected APY (%)" path="apy">
            <n-input-number v-model:value="liquidityForm.apy" :min="0" :max="500" style="width: 100%" />
          </n-form-item>
          <n-form-item label="Duration (days)" path="durationDays">
            <n-input-number v-model:value="liquidityForm.durationDays" :min="1" :max="3650" style="width: 100%" />
          </n-form-item>
          <n-form-item label="Expected Price Change (%)" path="expectedPriceChange">
            <n-input-number v-model:value="liquidityForm.expectedPriceChange" :min="-100" :max="100" style="width: 100%" />
            <template #feedback>
              <span class="help-text">Negative = price decrease, Positive = price increase</span>
            </template>
          </n-form-item>
          <n-button type="primary" @click="calculateLiquidity" block :loading="loading">Calculate</n-button>
        </n-form>
      </n-tab-pane>

      <n-tab-pane name="impermanent-loss" tab="Impermanent Loss">
        <n-form ref="ilForm" :model="ilForm">
          <n-row :gutter="16">
            <n-col :span="12">
              <n-form-item label="Token 0 Start Price" path="token0StartPrice">
                <n-input-number v-model:value="ilForm.token0StartPrice" :min="0" style="width: 100%" />
              </n-form-item>
            </n-col>
            <n-col :span="12">
              <n-form-item label="Token 0 End Price" path="token0EndPrice">
                <n-input-number v-model:value="ilForm.token0EndPrice" :min="0" style="width: 100%" />
              </n-form-item>
            </n-col>
          </n-row>
          <n-row :gutter="16">
            <n-col :span="12">
              <n-form-item label="Token 1 Start Price" path="token1StartPrice">
                <n-input-number v-model:value="ilForm.token1StartPrice" :min="0" style="width: 100%" />
              </n-form-item>
            </n-col>
            <n-col :span="12">
              <n-form-item label="Token 1 End Price" path="token1EndPrice">
                <n-input-number v-model:value="ilForm.token1EndPrice" :min="0" style="width: 100%" />
              </n-form-item>
            </n-col>
          </n-row>
          <n-button type="primary" @click="calculateIL" block :loading="loading">Calculate</n-button>
        </n-form>
      </n-tab-pane>

      <n-tab-pane name="rates" tab="Current Rates">
        <div v-if="rates">
          <n-collapse>
            <n-collapse-item title="Staking Rates" name="staking">
              <n-space vertical>
                <n-card v-for="rate in rates.staking" :key="rate.token" size="small">
                  <n-space justify="space-between">
                    <n-space vertical>
                      <n-text strong>{{ rate.protocol }} - {{ rate.token }}</n-text>
                      <n-text depth="3">{{ rate.chain }}</n-text>
                    </n-space>
                    <n-text type="success" strong>{{ rate.apy }}% APY</n-text>
                  </n-space>
                </n-card>
              </n-space>
            </n-collapse-item>
            <n-collapse-item title="Lending Rates" name="lending">
              <n-space vertical>
                <n-card v-for="rate in rates.lending" :key="rate.token" size="small">
                  <n-space justify="space-between">
                    <n-space vertical>
                      <n-text strong>{{ rate.protocol }} - {{ rate.token }}</n-text>
                      <n-text depth="3">{{ rate.chain }}</n-text>
                    </n-space>
                    <n-text type="success" strong>{{ rate.supplyApy }}% APY</n-text>
                  </n-space>
                </n-card>
              </n-space>
            </n-collapse-item>
            <n-collapse-item title="Liquidity Pool Rates" name="liquidity">
              <n-space vertical>
                <n-card v-for="rate in rates.liquidity" :key="rate.pair" size="small">
                  <n-space justify="space-between">
                    <n-space vertical>
                      <n-text strong>{{ rate.protocol }} - {{ rate.pair }}</n-text>
                      <n-text depth="3">{{ rate.chain }}</n-text>
                    </n-space>
                    <n-text type="success" strong>{{ rate.apy }}% APY</n-text>
                  </n-space>
                </n-card>
              </n-space>
            </n-collapse-item>
          </n-collapse>
        </div>
        <n-spin v-else />
      </n-tab-pane>
    </n-tabs>

    <!-- Results Display -->
    <n-modal v-model:show="showResult" preset="card" title="Calculation Result" style="width: 500px; max-width: 90vw">
      <n-space vertical v-if="result">
        <n-descriptions label-placement="top" :column="2" bordered>
          <n-descriptions-item label="Initial Investment">
            ${{ result.initialInvestment?.toFixed(2) || result.liquidityData?.initialValue?.toFixed(2) }}
          </n-descriptions-item>
          <n-descriptions-item label="Final Value">
            ${{ result.finalValue?.toFixed(2) || result.liquidityData?.finalValue?.toFixed(2) }}
          </n-descriptions-item>
          <n-descriptions-item label="Profit">
            <n-text type="success">${{ result.profit?.toFixed(2) || result.liquidityData?.netProfit?.toFixed(2) }}</n-text>
          </n-descriptions-item>
          <n-descriptions-item label="ROI">
            <n-text type="info">{{ result.roi?.toFixed(2) || result.liquidityData?.netRoi?.toFixed(2) }}%</n-text>
          </n-descriptions-item>
          <n-descriptions-item label="APY">
            {{ result.apy?.toFixed(2) || result.liquidityData?.totalRoi?.toFixed(2) }}%
          </n-descriptions-item>
          <n-descriptions-item label="Daily Yield">
            ${{ result.dailyYield?.toFixed(2) }}
          </n-descriptions-item>
        </n-descriptions>

        <div v-if="result.breakdown" class="breakdown">
          <n-hr />
          <n-text strong>Breakdown:</n-text>
          <n-ul>
            <n-li>Base Yield: ${{ result.breakdown.baseYield?.toFixed(2) }}</n-li>
            <n-li>Compound Bonus: ${{ result.breakdown.compoundBonus?.toFixed(2) }}</n-li>
            <n-li>Compounds: {{ result.compoundCount }}</n-li>
          </n-ul>
        </div>

        <div v-if="result.impermanentLossData" class="impermanent-loss">
          <n-hr />
          <n-text strong>Impermanent Loss Analysis:</n-text>
          <n-ul>
            <n-li>Impermanent Loss: <n-text type="warning">${{ result.impermanentLossData.impermanentLoss?.toFixed(2) }}</n-text></n-li>
            <n-li>IL Percentage: <n-text type="warning">{{ result.impermanentLossData.impermanentLossPercentage?.toFixed(2) }}%</n-text></n-li>
            <n-li>Trading Fees: ${{ result.liquidityData?.tradingFees?.toFixed(2) }}</n-li>
            <n-li>HODL Value: ${{ result.impermanentLossData.hodlValue?.toFixed(2) }}</n-li>
            <n-li>LP Value (after IL): ${{ result.impermanentLossData.finalValue?.toFixed(2) }}</n-li>
          </n-ul>
        </div>
      </n-space>
    </n-modal>
  </n-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { 
  NCard, NTabs, NTabPane, NForm, NFormItem, NInputNumber, NSelect, 
  NButton, NModal, NSpace, NText, NDescriptions, NDescriptionsItem,
  NCollapse, NCollapseItem, NRow, NCol, NSpin, NUl, NLi, NHr
} from 'naive-ui'

const loading = ref(false)
const showResult = ref(false)
const result = ref<any>(null)
const rates = ref<any>(null)

const tokenOptions = [
  { label: 'ETH', value: 'ETH' },
  { label: 'BTC', value: 'BTC' },
  { label: 'USDC', value: 'USDC' },
  { label: 'USDT', value: 'USDT' },
  { label: 'DAI', value: 'DAI' },
  { label: 'stETH', value: 'stETH' },
  { label: 'rETH', value: 'rETH' },
  { label: 'cbETH', value: 'cbETH' },
]

const compoundOptions = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Annually', value: 'annually' },
]

const stakingForm = ref({
  token: 'ETH',
  amount: 10000,
  apy: 5,
  durationDays: 365,
  compoundFrequency: 'daily'
})

const lendingForm = ref({
  token: 'USDC',
  amount: 10000,
  supplyApy: 4.5,
  durationDays: 365,
  compoundFrequency: 'daily'
})

const liquidityForm = ref({
  token0: 'ETH',
  token1: 'USDC',
  amount0: 5000,
  amount1: 5000,
  apy: 20,
  durationDays: 365,
  expectedPriceChange: 20
})

const ilForm = ref({
  token0StartPrice: 2000,
  token1StartPrice: 1,
  token0EndPrice: 2400,
  token1EndPrice: 1
})

const apiBase = '/api/defi-roi'

async function calculateStaking() {
  loading.value = true
  try {
    const res = await fetch(`${apiBase}/staking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stakingForm.value)
    })
    const data = await res.json()
    result.value = { ...data.data, type: 'staking' }
    showResult.value = true
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function calculateLending() {
  loading.value = true
  try {
    const res = await fetch(`${apiBase}/lending`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lendingForm.value)
    })
    const data = await res.json()
    result.value = { ...data.data, type: 'lending' }
    showResult.value = true
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function calculateLiquidity() {
  loading.value = true
  try {
    const res = await fetch(`${apiBase}/liquidity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(liquidityForm.value)
    })
    const data = await res.json()
    result.value = { 
      liquidityData: data.data,
      impermanentLossData: data.data.impermanentLoss,
      type: 'liquidity' 
    }
    showResult.value = true
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function calculateIL() {
  loading.value = true
  try {
    const res = await fetch(`${apiBase}/impermanent-loss`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ilForm.value)
    })
    const data = await res.json()
    result.value = { 
      initialInvestment: ilForm.value.token0StartPrice + ilForm.value.token1StartPrice,
      finalValue: data.data.finalValue,
      profit: data.data.loss,
      roi: data.data.impermanentLossPercentage,
      type: 'impermanent-loss'
    }
    showResult.value = true
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function fetchRates() {
  try {
    const res = await fetch(`${apiBase}/rates`)
    const data = await res.json()
    rates.value = data.data
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  fetchRates()
})
</script>

<style scoped>
.defi-roi-card {
  height: 100%;
}

.help-text {
  font-size: 12px;
  color: #888;
}

.breakdown, .impermanent-loss {
  margin-top: 16px;
}
</style>
