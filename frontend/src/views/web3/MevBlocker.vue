<template>
  <div class="mev-blocker-dashboard">
    <n-card title="🛡️ Cross-chain MEV Blocker" :bordered="false">
      <n-tabs type="line" animated>
        <n-tab-pane name="overview" tab="Overview">
          <n-grid :cols="4" :x-gap="16" :y-gap="16">
            <n-gi>
              <n-statistic label="Total Protected" :value="stats.totalProtected?.toLocaleString() || '0'" />
            </n-gi>
            <n-gi>
              <n-statistic label="Total Gas Saved" :value="stats.totalGasSaved?.toLocaleString() || '0'" />
            </n-gi>
            <n-gi>
              <n-statistic label="Success Rate" :value="(stats.successRate * 100).toFixed(1) + '%'" />
            </n-gi>
            <n-gi>
              <n-statistic label="Avg Protection Time" :value="(stats.avgProtectionTime || 0).toFixed(1) + 's'" />
            </n-gi>
          </n-grid>
          
          <n-divider />
          
          <n-card title="Protection Statistics">
            <n-grid :cols="2" :x-gap="16" v-if="stats.protectionTypes">
              <n-gi>
                <n-statistic label="FrontRun Prevented" :value="stats.protectionTypes.frontRun?.toLocaleString() || 0" />
              </n-gi>
              <n-gi>
                <n-statistic label="Sandwich Attacks Blocked" :value="stats.protectionTypes.sandwich?.toLocaleString() || 0" />
              </n-gi>
              <n-gi>
                <n-statistic label="BackRun Protection" :value="stats.protectionTypes.backRun?.toLocaleString() || 0" />
              </n-gi>
              <n-gi>
                <n-statistic label="Liquidation Protection" :value="stats.protectionTypes.liquidation?.toLocaleString() || 0" />
              </n-gi>
            </n-grid>
          </n-card>
          
          <n-divider />
          
          <n-card title="Available MEV Relays">
            <n-data-table :columns="relayColumns" :data="relays" :pagination="false" />
          </n-card>
        </n-tab-pane>
        
        <n-tab-pane name="submit" tab="Submit Transaction">
          <n-space vertical>
            <n-space>
              <n-select v-model:value="submitForm.chain" :options="chainOptions" placeholder="Select Chain" style="width: 200px" />
              <n-select v-model:value="submitForm.protectionLevel" :options="protectionLevelOptions" placeholder="Protection Level" style="width: 180px" />
            </n-space>
            
            <n-space>
              <n-input v-model:value="submitForm.from" placeholder="From Address (0x...)" style="width: 400px" />
            </n-space>
            
            <n-space>
              <n-input v-model:value="submitForm.to" placeholder="To Address (0x...)" style="width: 400px" />
            </n-space>
            
            <n-space>
              <n-input v-model:value="submitForm.value" placeholder="Value (e.g., 1.5)" style="width: 150px" />
              <n-input v-model:value="submitForm.data" placeholder="Data (optional)" style="width: 250px" />
            </n-space>
            
            <n-button type="primary" @click="submitTransaction" :loading="submitting">
              Submit Protected Transaction
            </n-button>
            
            <n-card v-if="submittedTx" title="Transaction Submitted">
              <n-descriptions :column="2" label-placement="left">
                <n-descriptions-item label="ID">{{ submittedTx.id }}</n-descriptions-item>
                <n-descriptions-item label="Relay">{{ submittedTx.relay }}</n-descriptions-item>
                <n-descriptions-item label="Status">
                  <n-tag :type="getStatusType(submittedTx.status)">{{ submittedTx.status }}</n-tag>
                </n-descriptions-item>
                <n-descriptions-item label="Protection Level">{{ submittedTx.protectionLevel }}</n-descriptions-item>
                <n-descriptions-item label="FrontRun Prevention">
                  <n-tag :type="submittedTx.frontRunPrevention ? 'success' : 'warning'" size="small">
                    {{ submittedTx.frontRunPrevention ? 'Enabled' : 'Disabled' }}
                  </n-tag>
                </n-descriptions-item>
                <n-descriptions-item label="Sandwich Prevention">
                  <n-tag :type="submittedTx.sandwichPrevention ? 'success' : 'warning'" size="small">
                    {{ submittedTx.sandwichPrevention ? 'Enabled' : 'Disabled' }}
                  </n-tag>
                </n-descriptions-item>
                <n-descriptions-item label="Gas Saved">{{ submittedTx.gasSaved }} units</n-descriptions-item>
                <n-descriptions-item label="Privacy">
                  <n-tag :type="submittedTx.privacyEnabled ? 'success' : 'warning'" size="small">
                    {{ submittedTx.privacyEnabled ? 'Enabled' : 'Disabled' }}
                  </n-tag>
                </n-descriptions-item>
              </n-descriptions>
            </n-card>
          </n-space>
        </n-tab-pane>
        
        <n-tab-pane name="history" tab="Transaction History">
          <n-space vertical>
            <n-space>
              <n-select v-model:value="historyChain" :options="chainOptions" placeholder="Filter by Chain" clearable style="width: 200px" />
              <n-button @click="loadHistory">Refresh</n-button>
            </n-space>
            
            <n-data-table :columns="historyColumns" :data="history" :pagination="false" />
          </n-space>
        </n-tab-pane>
        
        <n-tab-pane name="detect" tab="Sandwich Detection">
          <n-space vertical>
            <n-space>
              <n-input v-model:value="detectTxHash" placeholder="Transaction Hash (0x...)" style="width: 500px" />
              <n-select v-model:value="detectChain" :options="chainOptions" placeholder="Chain" style="width: 150px" />
              <n-button type="primary" @click="detectSandwich" :loading="detecting">Detect</n-button>
            </n-space>
            
            <n-card v-if="sandwichResult" title="Detection Result">
              <n-alert :type="sandwichResult.detected ? 'error' : 'success'" style="margin-bottom: 16px">
                {{ sandwichResult.detected ? '⚠️ Sandwich Attack Detected' : '✅ No Sandwich Attack Detected' }}
              </n-alert>
              
              <n-descriptions :column="2" label-placement="left">
                <n-descriptions-item label="Confidence">{{ (sandwichResult.confidence * 100).toFixed(1) }}%</n-descriptions-item>
                <n-descriptions-item label="Severity">
                  <n-tag :type="getSeverityType(sandwichResult.severity)">{{ sandwichResult.severity }}</n-tag>
                </n-descriptions-item>
                <n-descriptions-item label="Attacked">{{ sandwichResult.attacked ? 'Yes' : 'No' }}</n-descriptions-item>
              </n-descriptions>
              
              <n-divider v-if="sandwichResult.attackDetails" />
              
              <n-card v-if="sandwichResult.attackDetails" title="Attack Details" size="small">
                <n-descriptions :column="2" label-placement="left">
                  <n-descriptions-item label="Attacker">{{ sandwichResult.attackDetails.attacker }}</n-descriptions-item>
                  <n-descriptions-item label="Profit">{{ sandwichResult.attackDetails.profit }} ETH</n-descriptions-item>
                  <n-descriptions-item label="Victim Loss">{{ sandwichResult.attackDetails.victimLoss }} ETH</n-descriptions-item>
                  <n-descriptions-item label="Tokens">{{ sandwichResult.attackDetails.tokens?.join(', ') }}</n-descriptions-item>
                </n-descriptions>
              </n-card>
              
              <n-divider />
              
              <n-card title="Recommendations" size="small">
                <n-ul>
                  <n-li v-for="(rec, idx) in sandwichResult.recommendations" :key="idx">
                    {{ rec }}
                  </n-li>
                </n-ul>
              </n-card>
            </n-card>
          </n-space>
        </n-tab-pane>
        
        <n-tab-pane name="privacy" tab="Privacy Analysis">
          <n-space vertical>
            <n-space>
              <n-input v-model:value="privacyTxHash" placeholder="Transaction Hash (0x...)" style="width: 500px" />
              <n-select v-model:value="privacyChain" :options="chainOptions" placeholder="Chain" style="width: 150px" />
              <n-button type="primary" @click="analyzePrivacy" :loading="analyzingPrivacy">Analyze</n-button>
            </n-space>
            
            <n-card v-if="privacyResult" title="Privacy Analysis">
              <n-grid :cols="3" :x-gap="16" :y-gap="16">
                <n-gi>
                  <n-statistic label="Privacy Score">
                    <template #default>
                      <span :style="{ color: getScoreColor(privacyResult.score) }">{{ privacyResult.score }}</span>
                    </template>
                    <template #suffix>/ 100</template>
                  </n-statistic>
                </n-gi>
                <n-gi>
                  <n-statistic label="Privacy Level">
                    <n-tag :type="getPrivacyTagType(privacyResult.privacyLevel)">
                      {{ privacyResult.privacyLevel?.toUpperCase() }}
                    </n-tag>
                  </n-statistic>
                </n-gi>
                <n-gi>
                  <n-statistic label="Exposure Count" :value="Object.values(privacyResult.exposure || {}).filter(v => v).length" />
                </n-gi>
              </n-grid>
              
              <n-divider />
              
              <n-card title="Exposure Details" size="small">
                <n-space vertical>
                  <n-space justify="space-between">
                    <span>Transaction Value</span>
                    <n-tag :type="privacyResult.exposure?.transactionValue ? 'warning' : 'success'">
                      {{ privacyResult.exposure?.transactionValue ? 'Exposed' : 'Hidden' }}
                    </n-tag>
                  </n-space>
                  <n-space justify="space-between">
                    <span>Transaction Timing</span>
                    <n-tag :type="privacyResult.exposure?.transactionTiming ? 'warning' : 'success'">
                      {{ privacyResult.exposure?.transactionTiming ? 'Exposed' : 'Hidden' }}
                    </n-tag>
                  </n-space>
                  <n-space justify="space-between">
                    <span>Wallet Address</span>
                    <n-tag :type="privacyResult.exposure?.walletAddress ? 'warning' : 'success'">
                      {{ privacyResult.exposure?.walletAddress ? 'Exposed' : 'Hidden' }}
                    </n-tag>
                  </n-space>
                  <n-space justify="space-between">
                    <span>Token Addresses</span>
                    <n-tag :type="privacyResult.exposure?.tokenAddresses ? 'warning' : 'success'">
                      {{ privacyResult.exposure?.tokenAddresses ? 'Exposed' : 'Hidden' }}
                    </n-tag>
                  </n-space>
                </n-space>
              </n-card>
              
              <n-divider />
              
              <n-card title="Recommendations" size="small">
                <n-ul>
                  <n-li v-for="(rec, idx) in privacyResult.recommendations" :key="idx">
                    {{ rec }}
                  </n-li>
                </n-ul>
              </n-card>
            </n-card>
          </n-space>
        </n-tab-pane>
        
        <n-tab-pane name="simulator" tab="Simulator">
          <n-space vertical>
            <n-space>
              <n-select v-model:value="simChain" :options="chainOptions" placeholder="Chain" style="width: 180px" />
              <n-select v-model:value="simLevel" :options="protectionLevelOptions" placeholder="Protection Level" style="width: 180px" />
              <n-button type="primary" @click="runSimulation">Simulate</n-button>
            </n-space>
            
            <n-card v-if="simulation" title="Simulation Results">
              <n-grid :cols="2" :x-gap="16">
                <n-gi>
                  <n-card title="Without Protection" segmentated>
                    <n-statistic label="Gas Cost" :value="simulation.withoutProtection?.gasCost?.toFixed(4)" />
                    <n-statistic label="Slippage" :value="simulation.withoutProtection?.slippage?.toFixed(2) + '%'" />
                    <n-statistic label="Risk Level">
                      <n-tag :type="getRiskType(simulation.withoutProtection?.risk)">
                        {{ simulation.withoutProtection?.risk }}
                      </n-tag>
                    </n-statistic>
                  </n-card>
                </n-gi>
                <n-gi>
                  <n-card title="With Protection" segmentated>
                    <n-statistic label="Gas Cost" :value="simulation.withProtection?.gasCost?.toFixed(4)" />
                    <n-statistic label="Slippage" :value="simulation.withProtection?.slippage?.toFixed(2) + '%'" />
                    <n-statistic label="Risk Level">
                      <n-tag type="success">{{ simulation.withProtection?.risk }}</n-tag>
                    </n-statistic>
                  </n-card>
                </n-gi>
              </n-grid>
              
              <n-divider />
              
              <n-card title="Savings">
                <n-grid :cols="3" :x-gap="16">
                  <n-gi>
                    <n-statistic label="Gas Saved" :value="simulation.savings?.gas?.toFixed(4)" />
                  </n-gi>
                  <n-gi>
                    <n-statistic label="Slippage Saved" :value="simulation.savings?.slippage?.toFixed(2) + '%'" />
                  </n-gi>
                  <n-gi>
                    <n-statistic label="Total Savings" :value="simulation.savings?.total?.toFixed(4)" />
                  </n-gi>
                </n-grid>
              </n-card>
              
              <n-alert type="info" style="margin-top: 16px">
                💡 {{ simulation.recommendation }}
              </n-alert>
            </n-card>
          </n-space>
        </n-tab-pane>
      </n-tabs>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NCard, NTabs, NTabPane, NStatistic, NGrid, NGi, NDivider, NDataTable, NButton, NSpace, NSelect, NInput, NTag, NDescriptions, NDescriptionsItem, NAlert, NUl, NLi, NInputNumber } from 'naive-ui'

const stats = ref<any>({})
const relays = ref<any[]>([])
const history = ref<any[]>([])
const submittedTx = ref<any>(null)
const sandwichResult = ref<any>(null)
const privacyResult = ref<any>(null)
const simulation = ref<any>(null)

const submitting = ref(false)
const detecting = ref(false)
const analyzingPrivacy = ref(false)

const chains = [
  { label: 'Ethereum', value: 'Ethereum' },
  { label: 'Base', value: 'Base' },
  { label: 'Arbitrum', value: 'Arbitrum' },
  { label: 'Optimism', value: 'Optimism' },
  { label: 'BSC', value: 'BSC' },
  { label: 'Polygon', value: 'Polygon' },
  { label: 'Avalanche', value: 'Avalanche' },
  { label: 'zkSync', value: 'zkSync' },
]

const chainOptions = chains

const protectionLevelOptions = [
  { label: 'Standard', value: 'standard' },
  { label: 'High', value: 'high' },
  { label: 'Maximum', value: 'maximum' },
]

const submitForm = ref({
  chain: 'Ethereum',
  protectionLevel: 'high',
  from: '',
  to: '',
  value: '',
  data: '',
})

const historyChain = ref<string | null>(null)
const detectTxHash = ref('')
const detectChain = ref('Ethereum')
const privacyTxHash = ref('')
const privacyChain = ref('Ethereum')
const simChain = ref('Ethereum')
const simLevel = ref('high')

const relayColumns = [
  { title: 'Relay', key: 'name' },
  { title: 'Chain', key: 'chain' },
  { title: 'Status', key: 'status', render: (row: any) => h(NTag, { type: row.status === 'online' ? 'success' : 'warning', size: 'small' }, () => row.status) },
  { title: 'Avg Time (s)', key: 'avgInclusionTime' },
  { title: 'Success Rate', key: 'successRate', render: (row: any) => `${(row.successRate * 100).toFixed(1)}%` },
  { title: 'Fee (ETH)', key: 'fee' },
  { title: 'Features', key: 'features', render: (row: any) => row.features?.join(', ') },
]

const historyColumns = [
  { title: 'ID', key: 'id', width: 180 },
  { title: 'Status', key: 'status', render: (row: any) => h(NTag, { type: getStatusType(row.status), size: 'small' }, () => row.status) },
  { title: 'Relay', key: 'relay' },
  { title: 'Protection', key: 'protectionLevel' },
  { title: 'Gas Saved', key: 'gasSaved' },
  { title: 'Submitted', key: 'submittedAt', render: (row: any) => new Date(row.submittedAt).toLocaleString() },
]

import { h } from 'vue'

function getStatusType(status: string) {
  const map: Record<string, any> = { included: 'success', pending: 'warning', failed: 'error', cancelled: 'error' }
  return map[status] || 'default'
}

function getSeverityType(severity: string) {
  const map: Record<string, any> = { critical: 'error', high: 'warning', medium: 'info', low: 'success' }
  return map[severity] || 'default'
}

function getRiskType(risk: string) {
  const map: Record<string, any> = { high: 'error', medium: 'warning', low: 'success' }
  return map[risk] || 'default'
}

function getScoreColor(score: number) {
  if (score >= 80) return '#18a058'
  if (score >= 60) return '#f0a020'
  return '#d03050'
}

function getPrivacyTagType(level: string) {
  const map: Record<string, any> = { maximum: 'success', high: 'success', partial: 'warning', public: 'error' }
  return map[level] || 'default'
}

async function loadStats() {
  try {
    const res = await fetch('/api/v1/mev-blocker/stats/Ethereum')
    stats.value = await res.json()
  } catch (e) {
    console.error(e)
  }
}

async function loadRelays() {
  try {
    const res = await fetch('/api/v1/mev-blocker/relays/Ethereum')
    relays.value = await res.json()
  } catch (e) {
    console.error(e)
  }
}

async function loadHistory() {
  try {
    const res = await fetch('/api/v1/mev-blocker/history?userId=user123')
    history.value = await res.json()
  } catch (e) {
    console.error(e)
  }
}

async function submitTransaction() {
  submitting.value = true
  try {
    const res = await fetch('/api/v1/mev-blocker/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submitForm.value),
    })
    submittedTx.value = await res.json()
  } catch (e) {
    console.error(e)
  }
  submitting.value = false
}

async function detectSandwich() {
  detecting.value = true
  try {
    const res = await fetch(`/api/v1/mev-blocker/detect-sandwich/${detectTxHash.value}?chain=${detectChain.value}`)
    sandwichResult.value = await res.json()
  } catch (e) {
    console.error(e)
  }
  detecting.value = false
}

async function analyzePrivacy() {
  analyzingPrivacy.value = true
  try {
    const res = await fetch(`/api/v1/mev-blocker/privacy-analysis/${privacyTxHash.value}?chain=${privacyChain.value}`)
    privacyResult.value = await res.json()
  } catch (e) {
    console.error(e)
  }
  analyzingPrivacy.value = false
}

async function runSimulation() {
  try {
    const res = await fetch('/api/v1/mev-blocker/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chain: simChain.value,
        protectionLevel: simLevel.value,
        from: '0x1234',
        to: '0x5678',
        value: '1.0',
      }),
    })
    simulation.value = await res.json()
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  loadStats()
  loadRelays()
  loadHistory()
})
</script>

<style scoped>
.mev-blocker-dashboard {
  padding: 16px;
}
</style>
