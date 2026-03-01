<template>
  <div class="dao-governance">
    <!-- Header Stats -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">{{ stats.totalProposals }}</div>
        <div class="stat-label">Total Proposals</div>
      </div>
      <div class="stat-card active">
        <div class="stat-value">{{ stats.activeProposals }}</div>
        <div class="stat-label">Active</div>
      </div>
      <div class="stat-card success">
        <div class="stat-value">{{ stats.passedProposals }}</div>
        <div class="stat-label">Passed</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ formatNumber(stats.treasuryValue) }}</div>
        <div class="stat-label">Treasury (USD)</div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="governance-content">
      <!-- Left: Proposals -->
      <div class="proposals-section">
        <div class="section-header">
          <h3>Proposals</h3>
          <div class="filter-tabs">
            <button 
              v-for="tab in proposalTabs" 
              :key="tab.value"
              :class="['tab-btn', { active: activeFilter === tab.value }]"
              @click="activeFilter = tab.value"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>

        <div class="proposals-list">
          <div 
            v-for="proposal in filteredProposals" 
            :key="proposal.id"
            :class="['proposal-card', proposal.status, { selected: selectedProposal?.id === proposal.id }]"
            @click="selectProposal(proposal)"
          >
            <div class="proposal-header">
              <span :class="['status-badge', proposal.status]">{{ proposal.status }}</span>
              <span class="category">{{ proposal.category }}</span>
            </div>
            <h4 class="proposal-title">{{ proposal.title }}</h4>
            <p class="proposal-desc">{{ truncate(proposal.description, 100) }}</p>
            <div class="proposal-stats">
              <div class="vote-stat for">
                <span class="label">For</span>
                <span class="value">{{ formatNumber(proposal.forVotes) }}</span>
                <div class="bar">
                  <div class="fill" :style="{ width: getForPercent(proposal) + '%' }"></div>
                </div>
              </div>
              <div class="vote-stat against">
                <span class="label">Against</span>
                <span class="value">{{ formatNumber(proposal.againstVotes) }}</span>
                <div class="bar">
                  <div class="fill" :style="{ width: getAgainstPercent(proposal) + '%' }"></div>
                </div>
              </div>
            </div>
            <div class="proposal-meta">
              <span>by {{ truncate(proposal.proposer, 8) }}</span>
              <span>{{ formatDate(proposal.createdAt) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Details Panel -->
      <div class="details-panel">
        <template v-if="selectedProposal">
          <div class="panel-header">
            <h3>{{ selectedProposal.title }}</h3>
            <span :class="['status-badge', selectedProposal.status]">{{ selectedProposal.status }}</span>
          </div>
          
          <div class="panel-content">
            <div class="info-row">
              <span class="label">Proposer</span>
              <span class="value address">{{ selectedProposal.proposer }}</span>
            </div>
            <div class="info-row">
              <span class="label">Category</span>
              <span class="value">{{ selectedProposal.category }}</span>
            </div>
            <div class="info-row">
              <span class="label">Quorum Required</span>
              <span class="value">{{ formatNumber(selectedProposal.quorum) }}</span>
            </div>
            
            <div class="vote-breakdown">
              <h4>Vote Breakdown</h4>
              <div class="vote-item for">
                <span>For</span>
                <span>{{ formatNumber(selectedProposal.forVotes) }}</span>
              </div>
              <div class="vote-item against">
                <span>Against</span>
                <span>{{ formatNumber(selectedProposal.againstVotes) }}</span>
              </div>
              <div class="vote-item abstain">
                <span>Abstain</span>
                <span>{{ formatNumber(selectedProposal.abstainVotes) }}</span>
              </div>
              <div class="vote-item total">
                <span>Total Votes</span>
                <span>{{ formatNumber(getTotalVotes(selectedProposal)) }}</span>
              </div>
            </div>

            <div class="voting-power">
              <h4>Your Voting Power</h4>
              <div class="power-input">
                <input type="text" v-model="voteWeight" placeholder="Enter vote weight" />
              </div>
            </div>

            <div class="vote-buttons">
              <button class="vote-btn for" @click="castVote('for')" :disabled="!isConnected">
                Vote For
              </button>
              <button class="vote-btn against" @click="castVote('against')" :disabled="!isConnected">
                Vote Against
              </button>
              <button class="vote-btn abstain" @click="castVote('abstain')" :disabled="!isConnected">
                Abstain
              </button>
            </div>

            <div v-if="!isConnected" class="connect-prompt">
              Connect wallet to vote
            </div>
          </div>
        </template>

        <template v-else>
          <div class="no-selection">
            <p>Select a proposal to view details</p>
          </div>
        </template>
      </div>
    </div>

    <!-- Treasury Section -->
    <div class="treasury-section">
      <h3>Treasury</h3>
      <div class="treasury-grid">
        <div class="treasury-card" v-for="token in treasury" :key="token.symbol">
          <div class="token-icon">{{ token.symbol }}</div>
          <div class="token-info">
            <span class="symbol">{{ token.symbol }}</span>
            <span class="balance">{{ formatNumber(token.balance) }}</span>
            <span class="value">${{ formatNumber(token.value) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useWeb3 } from '@/composables/web3/useWeb3';

interface DaoProposal {
  id: string;
  title: string;
  description: string;
  proposer: string;
  status: 'active' | 'passed' | 'rejected' | 'executed' | 'cancelled';
  forVotes: string;
  againstVotes: string;
  abstainVotes: string;
  quorum: string;
  startBlock: number;
  endBlock: number;
  createdAt: string;
  category: string;
}

interface DaoTreasury {
  symbol: string;
  address: string;
  balance: string;
  value: number;
}

const { isConnected, account } = useWeb3();

const proposals = ref<DaoProposal[]>([]);
const treasury = ref<DaoTreasury[]>([]);
const stats = ref({
  totalProposals: 0,
  activeProposals: 0,
  passedProposals: 0,
  treasuryValue: 0
});

const activeFilter = ref('all');
const selectedProposal = ref<DaoProposal | null>(null);
const voteWeight = ref('1000');

const proposalTabs = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Passed', value: 'passed' },
  { label: 'Rejected', value: 'rejected' }
];

const filteredProposals = computed(() => {
  if (activeFilter.value === 'all') {
    return proposals.value;
  }
  return proposals.value.filter(p => p.status === activeFilter.value);
});

const formatNumber = (num: string | number): string => {
  const n = typeof num === 'string' ? BigInt(num) : num;
  if (n >= 1000000000n) return (Number(n) / 1000000000).toFixed(1) + 'B';
  if (n >= 1000000n) return (Number(n) / 1000000).toFixed(1) + 'M';
  if (n >= 1000n) return (Number(n) / 1000).toFixed(1) + 'K';
  return n.toString();
};

const truncate = (str: string, len: number): string => {
  return str.length > len ? str.slice(0, len) + '...' : str;
};

const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getForPercent = (p: DaoProposal): number => {
  const total = BigInt(p.forVotes) + BigInt(p.againstVotes) + BigInt(p.abstainVotes);
  if (total === 0n) return 0;
  return Number((BigInt(p.forVotes) * 10000n) / total) / 100;
};

const getAgainstPercent = (p: DaoProposal): number => {
  const total = BigInt(p.forVotes) + BigInt(p.againstVotes) + BigInt(p.abstainVotes);
  if (total === 0n) return 0;
  return Number((BigInt(p.againstVotes) * 10000n) / total) / 100;
};

const getTotalVotes = (p: DaoProposal): string => {
  return (BigInt(p.forVotes) + BigInt(p.againstVotes) + BigInt(p.abstainVotes)).toString();
};

const selectProposal = (proposal: DaoProposal) => {
  selectedProposal.value = proposal;
};

const castVote = async (support: 'for' | 'against' | 'abstain') => {
  if (!selectedProposal.value || !account.value) return;
  
  try {
    const response = await fetch(`/api/web3/dao/proposals/${selectedProposal.value.id}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        voter: account.value,
        support,
        weight: voteWeight.value,
        reason: ''
      })
    });
    
    if (response.ok) {
      await fetchProposals();
    }
  } catch (error) {
    console.error('Vote failed:', error);
  }
};

const fetchProposals = async () => {
  try {
    const [proposalsRes, treasuryRes, statsRes] = await Promise.all([
      fetch('/api/web3/dao/proposals'),
      fetch('/api/web3/dao/treasury'),
      fetch('/api/web3/dao/stats')
    ]);
    
    proposals.value = await proposalsRes.json();
    const treasuryData = await treasuryRes.json();
    treasury.value = treasuryData.tokens;
    stats.value = await statsRes.json();
    
    if (proposals.value.length > 0 && !selectedProposal.value) {
      selectedProposal.value = proposals.value[0];
    }
  } catch (error) {
    console.error('Failed to fetch DAO data:', error);
  }
};

onMounted(() => {
  fetchProposals();
});
</script>

<style scoped>
.dao-governance {
  padding: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: var(--bg-secondary, #1a1a2e);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  border: 1px solid var(--border-color, #2d2d44);
}

.stat-card.active {
  border-color: #f59e0b;
}

.stat-card.success {
  border-color: #10b981;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #fff;
}

.stat-label {
  font-size: 14px;
  color: #888;
  margin-top: 4px;
}

.governance-content {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 20px;
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h3 {
  color: #fff;
  margin: 0;
}

.filter-tabs {
  display: flex;
  gap: 8px;
}

.tab-btn {
  padding: 8px 16px;
  border: 1px solid var(--border-color, #2d2d44);
  background: transparent;
  color: #888;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn.active {
  background: #6366f1;
  border-color: #6366f1;
  color: #fff;
}

.proposals-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.proposal-card {
  background: var(--bg-secondary, #1a1a2e);
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  border: 1px solid var(--border-color, #2d2d44);
  transition: all 0.2s;
}

.proposal-card:hover {
  border-color: #6366f1;
}

.proposal-card.selected {
  border-color: #6366f1;
  background: rgba(99, 102, 241, 0.1);
}

.proposal-card.passed {
  border-left: 3px solid #10b981;
}

.proposal-card.active {
  border-left: 3px solid #f59e0b;
}

.proposal-card.rejected {
  border-left: 3px solid #ef4444;
}

.proposal-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.active {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.status-badge.passed {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.status-badge.rejected {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.status-badge.executed {
  background: rgba(99, 102, 241, 0.2);
  color: #6366f1;
}

.category {
  color: #888;
  font-size: 12px;
}

.proposal-title {
  color: #fff;
  margin: 0 0 8px;
  font-size: 16px;
}

.proposal-desc {
  color: #888;
  font-size: 14px;
  margin: 0 0 12px;
}

.proposal-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.vote-stat {
  display: flex;
  align-items: center;
  gap: 8px;
}

.vote-stat .label {
  width: 60px;
  font-size: 12px;
  color: #888;
}

.vote-stat .value {
  width: 80px;
  font-size: 12px;
  color: #fff;
}

.vote-stat .bar {
  flex: 1;
  height: 4px;
  background: #2d2d44;
  border-radius: 2px;
  overflow: hidden;
}

.vote-stat .bar .fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s;
}

.vote-stat.for .bar .fill {
  background: #10b981;
}

.vote-stat.against .bar .fill {
  background: #ef4444;
}

.proposal-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #666;
}

.proposal-meta .address {
  font-family: monospace;
}

.details-panel {
  background: var(--bg-secondary, #1a1a2e);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid var(--border-color, #2d2d44);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.panel-header h3 {
  color: #fff;
  margin: 0;
  font-size: 18px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid var(--border-color, #2d2d44);
}

.info-row .label {
  color: #888;
}

.info-row .value {
  color: #fff;
}

.info-row .value.address {
  font-family: monospace;
  font-size: 12px;
}

.vote-breakdown {
  margin-top: 20px;
}

.vote-breakdown h4 {
  color: #fff;
  margin: 0 0 12px;
}

.vote-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  color: #888;
  font-size: 14px;
}

.vote-item.for { color: #10b981; }
.vote-item.against { color: #ef4444; }
.vote-item.abstain { color: #888; }
.vote-item.total { 
  color: #fff; 
  border-top: 1px solid var(--border-color, #2d2d44);
  margin-top: 8px;
  padding-top: 12px;
}

.voting-power {
  margin-top: 20px;
}

.voting-power h4 {
  color: #fff;
  margin: 0 0 12px;
}

.power-input input {
  width: 100%;
  padding: 10px;
  background: var(--bg-primary, #16162a);
  border: 1px solid var(--border-color, #2d2d44);
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
}

.vote-buttons {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 16px;
}

.vote-btn {
  padding: 10px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.vote-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.vote-btn.for {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.vote-btn.for:hover:not(:disabled) {
  background: #10b981;
  color: #fff;
}

.vote-btn.against {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.vote-btn.against:hover:not(:disabled) {
  background: #ef4444;
  color: #fff;
}

.vote-btn.abstain {
  background: rgba(136, 136, 136, 0.2);
  color: #888;
}

.vote-btn.abstain:hover:not(:disabled) {
  background: #666;
  color: #fff;
}

.connect-prompt {
  text-align: center;
  padding: 20px;
  color: #888;
  margin-top: 16px;
}

.no-selection {
  text-align: center;
  color: #888;
  padding: 40px;
}

.treasury-section {
  background: var(--bg-secondary, #1a1a2e);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid var(--border-color, #2d2d44);
}

.treasury-section h3 {
  color: #fff;
  margin: 0 0 16px;
}

.treasury-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.treasury-card {
  background: var(--bg-primary, #16162a);
  border-radius: 8px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.token-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #fff;
  font-size: 12px;
}

.token-info {
  display: flex;
  flex-direction: column;
}

.token-info .symbol {
  color: #fff;
  font-weight: 600;
}

.token-info .balance {
  color: #888;
  font-size: 12px;
}

.token-info .value {
  color: #10b981;
  font-size: 12px;
}
</style>
