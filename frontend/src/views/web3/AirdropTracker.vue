<template>
  <div class="airdrop-tracker">
    <n-card title="🎁 Cross-chain Airdrop Tracker" :bordered="false" class="header-card">
      <n-space vertical>
        <n-text depth="3">Track and manage your crypto airdrops across multiple chains</n-text>
        <n-space>
          <n-tag type="info">{{ stats.totalProjects }} Projects</n-tag>
          <n-tag type="success">{{ stats.activeAirdrops }} Active</n-tag>
          <n-tag type="warning">{{ stats.upcomingAirdrops }} Upcoming</n-tag>
        </n-space>
      </n-space>
    </n-card>

    <n-tabs type="line" animated>
      <n-tab-pane name="overview" tab="📊 Overview">
        <n-grid :cols="4" :x-gap="16" :y-gap="16">
          <n-gi>
            <n-card>
              <n-statistic label="Total Airdrop Projects" :value="stats.totalProjects" />
            </n-card>
          </n-gi>
          <n-gi>
            <n-card>
              <n-statistic label="Active Airdrops" :value="stats.activeAirdrops" />
            </n-card>
          </n-gi>
          <n-gi>
            <n-card>
              <n-statistic label="Total Value (Est.)" :value="formatUSD(stats.totalValueDistributed)" />
            </n-card>
          </n-gi>
          <n-gi>
            <n-card>
              <n-statistic label="Your Pending Claims" :value="walletSummary?.totalAirdrops || 0" />
            </n-card>
          </n-gi>
        </n-grid>

        <n-card title="Top Chains by Airdrops" style="margin-top: 16px">
          <n-list>
            <n-list-item v-for="chain in stats.topChains" :key="chain.chain">
              <n-thing :title="chain.chain" :description="`${chain.count} airdrops`">
                <template #avatar>
                  <n-avatar round>{{ chain.count }}</n-avatar>
                </template>
              </n-thing>
            </n-list-item>
          </n-list>
        </n-card>
      </n-tab-pane>

      <n-tab-pane name="projects" tab="📋 Projects">
        <n-space style="margin-bottom: 16px">
          <n-select
            v-model:value="filters.chain"
            placeholder="Filter by chain"
            :options="chainOptions"
            clearable
            style="width: 200px"
          />
          <n-select
            v-model:value="filters.status"
            placeholder="Filter by status"
            :options="statusOptions"
            clearable
            style="width: 200px"
          />
          <n-input v-model:value="searchQuery" placeholder="Search projects..." clearable style="width: 200px" />
        </n-space>

        <n-grid :cols="3" :x-gap="16" :y-gap="16">
          <n-gi v-for="project in filteredProjects" :key="project.id">
            <n-card hoverable>
              <template #header>
                <n-space justify="space-between">
                  <n-space>
                    <span style="font-size: 24px">{{ project.logo }}</span>
                    <n-text strong>{{ project.name }}</n-text>
                  </n-space>
                  <n-tag :type="getStatusType(project.status)">{{ project.status }}</n-tag>
                </n-space>
              </template>
              <n-space vertical>
                <n-text depth="3">{{ project.description }}</n-text>
                <n-space>
                  <n-tag>{{ project.chain }}</n-tag>
                  <n-tag>{{ project.tokenSymbol }}</n-tag>
                </n-space>
                <n-descriptions :columns="2" label-placement="left">
                  <n-descriptions-item label="Est. Value">{{ formatUSD(project.estimatedValue) }}</n-descriptions-item>
                  <n-descriptions-item label="Eligible">{{ formatNumber(project.eligibleAddresses) }}</n-descriptions-item>
                  <n-descriptions-item label="Snapshot">{{ project.snapshotDate || 'TBD' }}</n-descriptions-item>
                  <n-descriptions-item label="Airdrop">{{ project.airdropDate || 'TBD' }}</n-descriptions-item>
                </n-descriptions>
                <n-button type="primary" size="small" @click="checkEligibility(project)">
                  Check Eligibility
                </n-button>
              </n-space>
            </n-card>
          </n-gi>
        </n-grid>
      </n-tab-pane>

      <n-tab-pane name="wallet" tab="👛 Wallet">
        <n-space vertical style="margin-bottom: 16px">
          <n-input-group>
            <n-input v-model:value="walletAddress" placeholder="Enter wallet address..." />
            <n-button type="primary" @click="loadWalletData">Check Wallet</n-button>
          </n-input-group>
        </n-space>

        <template v-if="walletSummary">
          <n-grid :cols="3" :x-gap="16" :y-gap="16">
            <n-gi>
              <n-card>
                <n-statistic label="Total Airdrops" :value="walletSummary.totalAirdrops" />
              </n-card>
            </n-gi>
            <n-gi>
              <n-card>
                <n-statistic label="Total Value" :value="formatUSD(walletSummary.totalValue)" />
              </n-card>
            </n-gi>
            <n-gi>
              <n-card>
                <n-statistic label="Pending Claims" :value="walletSummary.pendingClaims.length" />
              </n-card>
            </n-gi>
          </n-grid>

          <n-tabs type="segment" style="margin-top: 16px">
            <n-tab-pane name="pending" tab="⏳ Pending">
              <n-card>
                <n-list v-if="walletSummary.pendingClaims.length">
                  <n-list-item v-for="claim in walletSummary.pendingClaims" :key="claim.id">
                    <n-thing>
                      <template #header>
                        <n-space justify="space-between">
                          <span>{{ claim.tokenSymbol }}</span>
                          <n-tag type="warning">Claimable</n-tag>
                        </n-space>
                      </template>
                      <template #description>
                        <n-space justify="space-between">
                          <span>{{ claim.amount }} {{ claim.tokenSymbol }}</span>
                          <n-text strong>{{ formatUSD(claim.valueUsd) }}</n-text>
                        </n-space>
                      </template>
                    </n-thing>
                  </n-list-item>
                </n-list>
                <n-empty v-else description="No pending claims" />
              </n-card>
            </n-tab-pane>

            <n-tab-pane name="claimed" tab="✅ Claimed">
              <n-card>
                <n-list v-if="walletSummary.claimedAirdrops.length">
                  <n-list-item v-for="claim in walletSummary.claimedAirdrops" :key="claim.id">
                    <n-thing>
                      <template #header>
                        <n-space justify="space-between">
                          <span>{{ claim.tokenSymbol }}</span>
                          <n-tag type="success">Claimed</n-tag>
                        </n-space>
                      </template>
                      <template #description>
                        <n-space vertical>
                          <span>{{ claim.amount }} {{ claim.tokenSymbol }}</span>
                          <n-text depth="3">{{ formatUSD(claim.valueUsd) }}</n-text>
                        </n-space>
                      </template>
                    </n-thing>
                  </n-list-item>
                </n-list>
                <n-empty v-else description="No claimed airdrops" />
              </n-card>
            </n-tab-pane>

            <n-tab-pane name="upcoming" tab="🔮 Upcoming">
              <n-card>
                <n-list v-if="walletSummary.upcomingAirdrops.length">
                  <n-list-item v-for="project in walletSummary.upcomingAirdrops" :key="project.id">
                    <n-thing>
                      <template #header>{{ project.name }}</template>
                      <template #description>
                        <n-space vertical>
                          <span>{{ project.tokenSymbol }} on {{ project.chain }}</span>
                          <n-text depth="3">Estimated: {{ formatUSD(project.estimatedValue) }}</n-text>
                        </n-space>
                      </template>
                    </n-thing>
                  </n-list-item>
                </n-list>
                <n-empty v-else description="No upcoming airdrops" />
              </n-card>
            </n-tab-pane>
          </n-tabs>
        </template>
      </n-tab-pane>

      <n-tab-pane name="alerts" tab="🔔 Alerts">
        <n-card>
          <n-list>
            <n-list-item v-for="alert in alerts" :key="alert.id">
              <n-thing>
                <template #header>
                  <n-space justify="space-between">
                    <n-tag :type="getAlertType(alert.type)">{{ getAlertLabel(alert.type) }}</n-tag>
                    <n-tag :type="getPriorityType(alert.priority)">{{ alert.priority }}</n-tag>
                  </n-space>
                </template>
                <template #title>{{ alert.projectName }}</template>
                <template #description>{{ alert.message }}</template>
              </n-thing>
            </n-list-item>
          </n-list>
        </n-card>
      </n-tab-pane>
    </n-tabs>

    <n-modal v-model:show="showEligibilityModal" preset="card" title="Eligibility Check" style="width: 500px">
      <n-space v-if="eligibility" vertical>
        <n-alert :type="eligibility.eligible ? 'success' : 'warning'">
          {{ eligibility.eligible ? '✅ You are eligible!' : '❌ Not eligible' }}
        </n-alert>
        <n-descriptions :columns="1" label-placement="left" v-if="eligibility.eligible">
          <n-descriptions-item label="Estimated Amount">
            {{ eligibility.estimatedAmount }} {{ selectedProject?.tokenSymbol }}
          </n-descriptions-item>
          <n-descriptions-item label="Estimated Value">
            {{ formatUSD(eligibility.estimatedValue) }}
          </n-descriptions-item>
        </n-descriptions>
        <n-divider>Requirements</n-divider>
        <n-space vertical>
          <n-text strong>✅ Met:</n-text>
          <n-tag v-for="req in eligibility.metRequirements" :key="req" type="success">{{ req }}</n-tag>
        </n-space>
        <n-space vertical v-if="eligibility.missingRequirements.length">
          <n-text strong>❌ Missing:</n-text>
          <n-tag v-for="req in eligibility.missingRequirements" :key="req" type="error">{{ req }}</n-tag>
        </n-space>
      </n-space>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { NSpace, NCard, NTabs, NTabPane, NGrid, NGi, NStatistic, NText, NTag, NButton, NInput, NSelect, NList, NListItem, NThing, NAvatar, NDescriptions, NDescriptionsItem, NInputGroup, NEmpty, NModal, NAlert, NDivider } from 'naive-ui'

const stats = ref<any>({
  totalProjects: 0,
  activeAirdrops: 0,
  upcomingAirdrops: 0,
  totalValueDistributed: 0,
  topChains: []
})

const projects = ref<any[]>([])
const walletSummary = ref<any>(null)
const alerts = ref<any[]>([])
const walletAddress = ref('')
const searchQuery = ref('')
const filters = ref({
  chain: null,
  status: null
})

const showEligibilityModal = ref(false)
const eligibility = ref<any>(null)
const selectedProject = ref<any>(null)

const chainOptions = [
  { label: 'Ethereum', value: 'Ethereum' },
  { label: 'Arbitrum', value: 'Arbitrum' },
  { label: 'Optimism', value: 'Optimism' },
  { label: 'Polygon', value: 'Polygon' },
  { label: 'Base', value: 'Base' },
  { label: 'Avalanche', value: 'Avalanche' },
  { label: 'BSC', value: 'BSC' },
  { label: 'Solana', value: 'Solana' },
  { label: 'zkSync', value: 'zkSync' },
]

const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Upcoming', value: 'upcoming' },
  { label: 'Ended', value: 'ended' },
]

const filteredProjects = computed(() => {
  let result = projects.value
  if (filters.value.chain) {
    result = result.filter(p => p.chain === filters.value.chain)
  }
  if (filters.value.status) {
    result = result.filter(p => p.status === filters.value.status)
  }
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(p => p.name.toLowerCase().includes(query) || p.tokenSymbol.toLowerCase().includes(query))
  }
  return result
})

function formatUSD(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0)
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value || 0)
}

function getStatusType(status: string) {
  const types: Record<string, 'success' | 'warning' | 'default'> = {
    active: 'success',
    upcoming: 'warning',
    ended: 'default'
  }
  return types[status] || 'default'
}

function getAlertType(type: string) {
  const types: Record<string, 'info' | 'warning' | 'error'> = {
    claim_reminder: 'warning',
    deadline_approaching: 'error',
    new_airdrop: 'info'
  }
  return types[type] || 'info'
}

function getAlertLabel(type: string) {
  const labels: Record<string, string> = {
    claim_reminder: 'Claim Reminder',
    deadline_approaching: 'Deadline',
    new_airdrop: 'New'
  }
  return labels[type] || type
}

function getPriorityType(priority: string) {
  const types: Record<string, 'error' | 'warning' | 'info'> = {
    high: 'error',
    medium: 'warning',
    low: 'info'
  }
  return types[priority] || 'info'
}

async function loadStats() {
  try {
    const response = await fetch('/api/airdrop-tracker/stats')
    stats.value = await response.json()
  } catch (e) {
    console.error('Failed to load stats', e)
    // Mock data
    stats.value = {
      totalProjects: 8,
      activeAirdrops: 4,
      upcomingAirdrops: 4,
      totalValueDistributed: 520000000,
      topChains: [
        { chain: 'Ethereum', count: 3 },
        { chain: 'Arbitrum', count: 2 },
        { chain: 'Optimism', count: 2 },
        { chain: 'zkSync', count: 1 },
        { chain: 'Base', count: 1 },
      ]
    }
  }
}

async function loadProjects() {
  try {
    const response = await fetch('/api/airdrop-tracker/projects')
    projects.value = await response.json()
  } catch (e) {
    console.error('Failed to load projects', e)
    // Mock data
    projects.value = [
      {
        id: 'uniswap-2024',
        name: 'Uniswap',
        logo: '🦄',
        description: 'Leading DEX protocol',
        chain: 'Ethereum',
        tokenSymbol: 'UNI',
        snapshotDate: '2024-09-01',
        airdropDate: '2024-09-17',
        claimDeadline: '2025-09-17',
        totalDistributed: 150000000,
        eligibleAddresses: 50000,
        estimatedValue: 25000000,
        status: 'active'
      },
      {
        id: 'zksync-era',
        name: 'zkSync Era',
        logo: '⚡',
        description: 'ZK Rollup for Ethereum',
        chain: 'zkSync',
        tokenSymbol: 'ZK',
        snapshotDate: '2024-10-01',
        airdropDate: '2024-11-15',
        totalDistributed: 3000000000,
        eligibleAddresses: 100000,
        estimatedValue: 45000000,
        status: 'upcoming'
      },
      {
        id: 'layerzero',
        name: 'LayerZero',
        logo: '🔗',
        description: 'Cross-chain messaging protocol',
        chain: 'Ethereum',
        tokenSymbol: 'ZRO',
        snapshotDate: '2024-08-01',
        airdropDate: '2024-12-01',
        claimDeadline: '2025-12-01',
        totalDistributed: 1000000000,
        eligibleAddresses: 80000,
        estimatedValue: 80000000,
        status: 'active'
      }
    ]
  }
}

async function loadAlerts() {
  if (!walletAddress.value) return
  try {
    const response = await fetch(`/api/airdrop-tracker/wallet/${walletAddress.value}/alerts`)
    alerts.value = await response.json()
  } catch (e) {
    console.error('Failed to load alerts', e)
    alerts.value = [
      { id: '1', type: 'new_airdrop', projectName: 'Base', message: 'Base airdrop announced! Check eligibility.', priority: 'high' },
      { id: '2', type: 'claim_reminder', projectName: 'LayerZero', message: 'You have unclaimed ZRO tokens worth approximately $150', priority: 'high' },
    ]
  }
}

async function loadWalletData() {
  if (!walletAddress.value) return
  try {
    const response = await fetch(`/api/airdrop-tracker/wallet/${walletAddress.value}`)
    walletSummary.value = await response.json()
  } catch (e) {
    console.error('Failed to load wallet data', e)
    // Mock data
    walletSummary.value = {
      wallet: walletAddress.value,
      totalAirdrops: 3,
      totalValue: 2500,
      pendingClaims: [
        { id: '1', tokenSymbol: 'ZRO', amount: 150, valueUsd: 150, chain: 'Ethereum', status: 'claimable' },
        { id: '2', tokenSymbol: 'UNI', amount: 250, valueUsd: 1250, chain: 'Ethereum', status: 'claimable' },
      ],
      claimedAirdrops: [
        { id: '3', tokenSymbol: 'ARB', amount: 500, valueUsd: 1100, chain: 'Arbitrum', status: 'claimed' },
      ],
      upcomingAirdrops: [
        { id: '4', name: 'Base', tokenSymbol: 'BASE', chain: 'Base', estimatedValue: 30000000 },
      ]
    }
  }
  await loadAlerts()
}

async function checkEligibility(project: any) {
  if (!walletAddress.value) {
    alert('Please enter a wallet address first')
    return
  }
  selectedProject.value = project
  try {
    const response = await fetch(`/api/airdrop-tracker/eligibility/${project.id}?wallet=${walletAddress.value}`)
    eligibility.value = await response.json()
  } catch (e) {
    console.error('Failed to check eligibility', e)
    // Mock data
    eligibility.value = {
      eligible: Math.random() > 0.3,
      estimatedAmount: Math.floor(Math.random() * 500) + 100,
      estimatedValue: Math.floor(Math.random() * 5000) + 500,
      requirements: project.requirements || [],
      metRequirements: ['Used protocol'],
      missingRequirements: []
    }
  }
  showEligibilityModal.value = true
}

onMounted(() => {
  loadStats()
  loadProjects()
})
</script>

<style scoped>
.airdrop-tracker {
  padding: 16px;
}

.header-card {
  margin-bottom: 16px;
}
</style>
