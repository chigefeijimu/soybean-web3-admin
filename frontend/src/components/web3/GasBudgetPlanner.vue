<template>
  <div class="gas-budget-container">
    <n-card title="⛽ Gas Budget Planner" :bordered="false" class="budget-card">
      <n-space vertical>
        <!-- Tab Navigation -->
        <n-tabs type="line" animated>
          <!-- Tab: Single Transaction Calculator -->
          <n-tab-pane name="calculator" tab="🧮 Budget Calculator">
            <n-space vertical :size="16">
              <n-grid :cols="3" :x-gap="16" :y-gap="16">
                <n-gi>
                  <n-form-item label="Select Chain">
                    <n-select
                      v-model:value="calculatorForm.chainId"
                      :options="chainOptions"
                      @update:value="onChainChange"
                    />
                  </n-form-item>
                </n-gi>
                <n-gi>
                  <n-form-item label="Transaction Type">
                    <n-select
                      v-model:value="calculatorForm.transactionType"
                      :options="transactionTypeOptions"
                    />
                  </n-form-item>
                </n-gi>
                <n-gi>
                  <n-form-item label="Count">
                    <n-input-number v-model:value="calculatorForm.count" :min="1" :max="100" />
                  </n-form-item>
                </n-gi>
              </n-grid>
              
              <n-button type="primary" @click="calculateBudget" :loading="calculating" block>
                Calculate Budget
              </n-button>

              <!-- Calculation Result -->
              <n-card v-if="budgetResult" title="💰 Budget Estimate" size="small">
                <n-grid :cols="2" :x-gap="16" :y-gap="16">
                  <n-gi>
                    <n-statistic label="Gas Limit" :value="budgetResult.gasLimit" />
                  </n-gi>
                  <n-gi>
                    <n-statistic label="Gas Price" :value="budgetResult.gasPrice" :suffix="budgetResult.gasPriceUnit" />
                  </n-gi>
                  <n-gi>
                    <n-statistic label="Total Gas (Gwei)" :value="budgetResult.estimatedGas" />
                  </n-gi>
                  <n-gi>
                    <n-statistic label="Estimated Cost (USD)" :value="'$' + budgetResult.estimatedUsd.toFixed(2)" />
                  </n-gi>
                </n-grid>
              </n-card>
            </n-space>
          </n-tab-pane>

          <!-- Tab: Chain Comparison -->
          <n-tab-pane name="comparison" tab="⚖️ Chain Comparison">
            <n-space vertical :size="16">
              <n-grid :cols="3" :x-gap="16" :y-gap="16">
                <n-gi>
                  <n-form-item label="Transaction Type">
                    <n-select
                      v-model:value="comparisonForm.transactionType"
                      :options="transactionTypeOptions"
                    />
                  </n-form-item>
                </n-gi>
                <n-gi>
                  <n-form-item label="Count">
                    <n-input-number v-model:value="comparisonForm.count" :min="1" :max="100" />
                  </n-form-item>
                </n-gi>
                <n-gi>
                  <n-form-item label=" ">
                    <n-button type="primary" @click="compareChains" :loading="comparing" block>
                      Compare Chains
                    </n-button>
                  </n-form-item>
                </n-gi>
              </n-grid>

              <!-- Comparison Results -->
              <n-card v-if="chainComparison" title="🌐 Chain Cost Comparison" size="small">
                <n-alert v-if="chainComparison.recommended" type="success" show-icon>
                  <template #header>💡 Recommended Chain</template>
                  Use {{ chainComparison.recommended.chain }} to save approximately ${{ chainComparison.recommended.savings.toFixed(2) }}!
                </n-alert>
                
                <n-data-table
                  :columns="comparisonColumns"
                  :data="chainComparison.comparisons"
                  :bordered="false"
                  :pagination="false"
                  style="margin-top: 16px"
                />
              </n-card>
            </n-space>
          </n-tab-pane>

          <!-- Tab: Monthly Budget -->
          <n-tab-pane name="monthly" tab="📅 Monthly Budget">
            <n-space vertical :size="16">
              <n-grid :cols="2" :x-gap="16" :y-gap="16">
                <n-gi>
                  <n-form-item label="Select Chain">
                    <n-select
                      v-model:value="monthlyForm.chainId"
                      :options="chainOptions"
                    />
                  </n-form-item>
                </n-gi>
                <n-gi>
                  <n-form-item label="Add Transaction">
                    <n-space>
                      <n-select
                        v-model:value="monthlyForm.newTxType"
                        :options="transactionTypeOptions"
                        placeholder="Select type"
                        style="width: 150px"
                      />
                      <n-input-number
                        v-model:value="monthlyForm.newTxCount"
                        :min="1"
                        placeholder="Count"
                        style="width: 100px"
                      />
                      <n-button @click="addTransaction">Add</n-button>
                    </n-space>
                  </n-form-item>
                </n-gi>
              </n-grid>

              <!-- Transaction List -->
              <n-card v-if="monthlyForm.transactions.length > 0" title="Transaction Plan" size="small">
                <n-space vertical>
                  <n-list hoverable clickable>
                    <n-list-item v-for="(tx, index) in monthlyForm.transactions" :key="index">
                      <n-space justify="space-between">
                        <span>{{ tx.name }}</span>
                        <span>× {{ tx.count }}</span>
                        <n-button size="small" @click="removeTransaction(index)">Remove</n-button>
                      </n-space>
                    </n-list-item>
                  </n-list>
                  
                  <n-button type="primary" @click="calculateMonthlyBudget" :loading="calculatingMonthly" block>
                    Calculate Monthly Budget
                  </n-button>
                </n-space>
              </n-card>

              <!-- Monthly Result -->
              <n-card v-if="monthlyResult" title="💵 Monthly Budget Estimate" size="small">
                <n-grid :cols="2" :x-gap="16" :y-gap="16">
                  <n-gi>
                    <n-statistic label="Monthly Cost (USD)" :value="'$' + monthlyResult.monthlyBudget.estimatedUsd.toFixed(2)" />
                  </n-gi>
                  <n-gi>
                    <n-statistic label="Monthly Cost (ETH)" :value="monthlyResult.monthlyBudget.estimatedEth.toFixed(4)" />
                  </n-gi>
                  <n-gi>
                    <n-statistic label="Yearly Cost (USD)" :value="'$' + monthlyResult.yearlyBudget.estimatedUsd.toFixed(2)" />
                  </n-gi>
                  <n-gi>
                    <n-statistic label="Yearly Cost (ETH)" :value="monthlyResult.yearlyBudget.estimatedEth.toFixed(4)" />
                  </n-gi>
                </n-grid>

                <!-- Breakdown Chart -->
                <div v-if="monthlyResult.monthlyBudget.breakdown.length > 0" style="margin-top: 16px">
                  <h4>Transaction Breakdown</h4>
                  <n-list>
                    <n-list-item v-for="(item, idx) in monthlyResult.monthlyBudget.breakdown" :key="idx">
                      <n-space justify="space-between">
                        <span>{{ item.name }} ({{ item.type }})</span>
                        <span>${{ item.estimatedUsd.toFixed(2) }} ({{ item.percentage.toFixed(1) }}%)</span>
                      </n-space>
                    </n-list-item>
                  </n-list>
                </div>

                <!-- Recommendations -->
                <n-space vertical v-if="monthlyResult.recommendations.length > 0" style="margin-top: 16px">
                  <n-alert v-for="(rec, idx) in monthlyResult.recommendations" :key="idx" type="info" show-icon>
                    {{ rec }}
                  </n-alert>
                </n-space>
              </n-card>
            </n-space>
          </n-tab-pane>

          <!-- Tab: Saving Tips -->
          <n-tab-pane name="tips" tab="💡 Saving Tips">
            <n-space vertical>
              <n-alert v-if="savingTips.length > 0" type="success" show-icon>
                <template #header>Gas Saving Strategies</template>
                Use these tips to reduce your Gas expenses!
              </n-alert>
              
              <n-grid :cols="2" :x-gap="16" :y-gap="16">
                <n-gi v-for="(tip, idx) in savingTips" :key="idx">
                  <n-card :title="tip.title" size="small">
                    <n-space vertical>
                      <n-tag type="info">{{ tip.category }}</n-tag>
                      <p>{{ tip.description }}</p>
                      <n-statistic label="Potential Savings" :value="tip.potentialSavings" />
                    </n-space>
                  </n-card>
                </n-gi>
              </n-grid>
            </n-space>
          </n-tab-pane>
        </n-tabs>
      </n-space>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { 
  NSelect, NButton, NCard, NSpace, NGrid, NGi, NTabs, NTabPane,
  NFormItem, NInputNumber, NStatistic, NAlert, NDataTable, NList,
  NListItem, NTag
} from 'naive-ui'
import { 
  getBudgetChains, getBudgetTransactionTypes, calculateBudget as apiCalculateBudget,
  compareBudgetChains, getGasSavingTips, calculateMonthlyBudget as apiCalculateMonthlyBudget,
  type BudgetChain, type TransactionType, type BudgetCalculation, type ChainComparison,
  type SavingTip
} from '@/service/api/web3'

// State
const loading = ref(false)
const calculating = ref(false)
const comparing = ref(false)
const calculatingMonthly = ref(false)

const chains = ref<BudgetChain[]>([])
const transactionTypes = ref<TransactionType[]>([])
const savingTips = ref<SavingTip[]>([])

// Calculator Form
const calculatorForm = ref({
  chainId: 1,
  transactionType: 'eth_transfer',
  count: 1
})

// Comparison Form
const comparisonForm = ref({
  transactionType: 'eth_transfer',
  count: 1
})

// Monthly Budget Form
const monthlyForm = ref({
  chainId: 1,
  newTxType: '',
  newTxCount: 1,
  transactions: [] as Array<{ name: string; type: string; count: number }>
})

// Results
const budgetResult = ref<BudgetCalculation | null>(null)
const chainComparison = ref<{
  comparisons: ChainComparison[];
  recommended: { chain: string; chainId: number; savings: number };
} | null>(null)
const monthlyResult = ref<any>(null)

// Options
const chainOptions = computed(() => 
  chains.value.map(c => ({ label: c.name, value: c.chainId }))
)

const transactionTypeOptions = computed(() => 
  transactionTypes.value.map(t => ({ label: `${t.description} (${t.gasLimit} gas)`, value: t.type }))
)

// Comparison Table Columns
const comparisonColumns = [
  { title: 'Rank', key: 'rank', width: 60 },
  { title: 'Chain', key: 'chain' },
  { title: 'Gas Price', key: 'gasPrice', render: (row: any) => `${row.gasPrice} ${row.gasPriceUnit}` },
  { title: 'Estimated Cost (USD)', key: 'estimatedUsd', render: (row: any) => `$${row.estimatedUsd.toFixed(2)}` }
]

// Methods
const loadChains = async () => {
  try {
    loading.value = true
    chains.value = await getBudgetChains()
  } catch (e) {
    console.error('Failed to load chains:', e)
  } finally {
    loading.value = false
  }
}

const loadTransactionTypes = async () => {
  try {
    loading.value = true
    transactionTypes.value = await getBudgetTransactionTypes()
  } catch (e) {
    console.error('Failed to load transaction types:', e)
  } finally {
    loading.value = false
  }
}

const loadSavingTips = async () => {
  try {
    const result = await getGasSavingTips()
    savingTips.value = result.tips
  } catch (e) {
    console.error('Failed to load tips:', e)
  }
}

const onChainChange = () => {
  budgetResult.value = null
}

const calculateBudget = async () => {
  try {
    calculating.value = true
    budgetResult.value = await apiCalculateBudget({
      chainId: calculatorForm.value.chainId,
      transactionType: calculatorForm.value.transactionType,
      count: calculatorForm.value.count
    })
  } catch (e) {
    console.error('Failed to calculate budget:', e)
  } finally {
    calculating.value = false
  }
}

const compareChains = async () => {
  try {
    comparing.value = true
    chainComparison.value = await compareBudgetChains(
      comparisonForm.value.transactionType,
      comparisonForm.value.count
    )
  } catch (e) {
    console.error('Failed to compare chains:', e)
  } finally {
    comparing.value = false
  }
}

const addTransaction = () => {
  if (monthlyForm.value.newTxType && monthlyForm.value.newTxCount > 0) {
    const txType = transactionTypes.value.find(t => t.type === monthlyForm.value.newTxType)
    if (txType) {
      monthlyForm.value.transactions.push({
        name: txType.description,
        type: monthlyForm.value.newTxType,
        count: monthlyForm.value.newTxCount
      })
      monthlyForm.value.newTxType = ''
      monthlyForm.value.newTxCount = 1
    }
  }
}

const removeTransaction = (index: number) => {
  monthlyForm.value.transactions.splice(index, 1)
}

const calculateMonthlyBudget = async () => {
  try {
    calculatingMonthly.value = true
    monthlyResult.value = await apiCalculateMonthlyBudget({
      chainId: monthlyForm.value.chainId,
      monthlyTransactions: monthlyForm.value.transactions.map(tx => ({
        type: tx.type,
        countPerMonth: tx.count
      }))
    })
  } catch (e) {
    console.error('Failed to calculate monthly budget:', e)
  } finally {
    calculatingMonthly.value = false
  }
}

// Initialize
onMounted(async () => {
  await Promise.all([
    loadChains(),
    loadTransactionTypes(),
    loadSavingTips()
  ])
})
</script>

<style scoped>
.gas-budget-container {
  padding: 16px;
}

.budget-card {
  border-radius: 8px;
}
</style>
