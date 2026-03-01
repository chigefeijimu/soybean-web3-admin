<template>
  <div class="voting-tracker">
    <!-- Header -->
    <div class="header">
      <h2>🗳️ DAO Voting Tracker</h2>
      <div class="header-stats">
        <div class="stat-card">
          <span class="stat-value">{{ stats.totalProposals }}</span>
          <span class="stat-label">Total</span>
        </div>
        <div class="stat-card active">
          <span class="stat-value">{{ stats.activeProposals }}</span>
          <span class="stat-label">Active</span>
        </div>
        <div class="stat-card passed">
          <span class="stat-value">{{ stats.passedProposals }}</span>
          <span class="stat-label">Passed</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ stats.averageParticipation }}</span>
          <span class="stat-label">Participation</span>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters">
      <select v-model="selectedNetwork" @change="loadProposals">
        <option value="">All Networks</option>
        <option value="ethereum">Ethereum</option>
        <option value="optimism">Optimism</option>
        <option value="arbitrum">Arbitrum</option>
        <option value="polygon">Polygon</option>
      </select>
      <select v-model="selectedStatus" @change="loadProposals">
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="passed">Passed</option>
        <option value="rejected">Rejected</option>
        <option value="executed">Executed</option>
      </select>
      <input 
        type="text" 
        v-model="searchQuery" 
        placeholder="Search proposals..."
        @input="filterProposals"
      />
    </div>

    <!-- DAOs -->
    <div class="daos-section">
      <h3>Popular DAOs</h3>
      <div class="daos-grid">
        <div 
          v-for="dao in daos" 
          :key="dao.contractAddress" 
          class="dao-card"
          @click="selectDao(dao)"
        >
          <span class="dao-logo">{{ dao.logo }}</span>
          <div class="dao-info">
            <span class="dao-name">{{ dao.name }}</span>
            <span class="dao-symbol">{{ dao.symbol }}</span>
          </div>
          <div class="dao-stats">
            <span>{{ dao.activeProposals }} active</span>
            <span>{{ dao.totalProposals }} total</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Proposals List -->
    <div class="proposals-section">
      <h3>Proposals</h3>
      <div class="proposals-list">
        <div 
          v-for="proposal in filteredProposals" 
          :key="proposal.id" 
          class="proposal-card"
          :class="{ active: proposal.status === 'active' }"
          @click="selectProposal(proposal)"
        >
          <div class="proposal-header">
            <span class="proposal-id">#{{ proposal.id.slice(0, 8) }}</span>
            <span class="proposal-status" :class="proposal.status">
              {{ proposal.status }}
            </span>
            <span class="proposal-network">{{ proposal.network }}</span>
          </div>
          <h4 class="proposal-title">{{ proposal.title }}</h4>
          <p class="proposal-desc">{{ truncate(proposal.description, 120) }}</p>
          <div class="proposal-votes">
            <div class="vote-bar">
              <div 
                class="vote-for" 
                :style="{ width: getForPercent(proposal) + '%' }"
              ></div>
              <div 
                class="vote-against" 
                :style="{ width: getAgainstPercent(proposal) + '%' }"
              ></div>
            </div>
            <div class="vote-stats">
              <span class="for">✓ {{ formatVotes(proposal.votesFor) }}</span>
              <span class="against">✗ {{ formatVotes(proposal.votesAgainst) }}</span>
              <span class="abstain">○ {{ formatVotes(proposal.votesAbstain) }}</span>
            </div>
          </div>
          <div class="proposal-footer">
            <span class="time-remaining" v-if="proposal.status === 'active'">
              ⏰ Ends in {{ getTimeRemaining(proposal.endTime) }}
            </span>
            <span class="time-passed" v-else>
              {{ formatDate(proposal.endTime) }}
            </span>
            <span class="quorum">Quorum: {{ formatVotes(proposal.quorum) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Proposal Detail Modal -->
    <div v-if="selectedProposal" class="modal" @click.self="selectedProposal = null">
      <div class="modal-content">
        <button class="close-btn" @click="selectedProposal = null">×</button>
        <div class="proposal-detail">
          <div class="detail-header">
            <span class="proposal-status" :class="selectedProposal.status">
              {{ selectedProposal.status }}
            </span>
            <span class="proposal-network">{{ selectedProposal.network }}</span>
          </div>
          <h2>{{ selectedProposal.title }}</h2>
          <p class="detail-desc">{{ selectedProposal.description }}</p>
          
          <div class="detail-votes">
            <div class="vote-row">
              <span class="vote-label">For</span>
              <div class="vote-progress">
                <div 
                  class="vote-bar-for" 
                  :style="{ width: getForPercent(selectedProposal) + '%' }"
                ></div>
              </div>
              <span class="vote-value">{{ formatVotes(selectedProposal.votesFor) }}</span>
              <span class="vote-percent">{{ getForPercent(selectedProposal) }}%</span>
            </div>
            <div class="vote-row">
              <span class="vote-label">Against</span>
              <div class="vote-progress">
                <div 
                  class="vote-bar-against" 
                  :style="{ width: getAgainstPercent(selectedProposal) + '%' }"
                ></div>
              </div>
              <span class="vote-value">{{ formatVotes(selectedProposal.votesAgainst) }}</span>
              <span class="vote-percent">{{ getAgainstPercent(selectedProposal) }}%</span>
            </div>
            <div class="vote-row">
              <span class="vote-label">Abstain</span>
              <div class="vote-progress">
                <div 
                  class="vote-bar-abstain" 
                  :style="{ width: getAbstainPercent(selectedProposal) + '%' }"
                ></div>
              </div>
              <span class="vote-value">{{ formatVotes(selectedProposal.votesAbstain) }}</span>
              <span class="vote-percent">{{ getAbstainPercent(selectedProposal) }}%</span>
            </div>
          </div>

          <div class="detail-info">
            <div class="info-row">
              <span class="info-label">Proposer</span>
              <span class="info-value">{{ shortAddress(selectedProposal.proposer) }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Contract</span>
              <span class="info-value">{{ shortAddress(selectedProposal.contractAddress) }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Quorum Required</span>
              <span class="info-value">{{ formatVotes(selectedProposal.quorum) }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Total Votes</span>
              <span class="info-value">{{ formatVotes(selectedProposal.totalVotes) }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Start Time</span>
              <span class="info-value">{{ formatDate(selectedProposal.startTime) }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">End Time</span>
              <span class="info-value">{{ formatDate(selectedProposal.endTime) }}</span>
            </div>
          </div>

          <!-- Votes List -->
          <div class="votes-section">
            <h4>Recent Votes</h4>
            <div class="votes-list">
              <div 
                v-for="vote in proposalVotes" 
                :key="vote.id" 
                class="vote-item"
              >
                <span class="vote-support" :class="vote.support">
                  {{ vote.support === 'for' ? '✓ For' : vote.support === 'against' ? '✗ Against' : '○ Abstain' }}
                </span>
                <span class="vote-voter">{{ shortAddress(vote.voter) }}</span>
                <span class="vote-weight">{{ formatVotes(vote.weight) }}</span>
                <span class="vote-reason" v-if="vote.reason">{{ vote.reason }}</span>
                <span class="vote-time">{{ formatDate(vote.timestamp * 1000) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Address Lookup -->
    <div class="address-lookup">
      <h3>Address Voting History</h3>
      <div class="lookup-form">
        <input 
          type="text" 
          v-model="lookupAddress" 
          placeholder="Enter wallet address..."
        />
        <button @click="lookupVotingHistory">Search</button>
      </div>
      <div v-if="votingHistory.length > 0" class="history-list">
        <div 
          v-for="item in votingHistory" 
          :key="item.id" 
          class="history-item"
        >
          <span class="history-support" :class="item.support">
            {{ item.support }}
          </span>
          <span class="history-proposal">{{ item.proposalTitle }}</span>
          <span class="history-status" :class="item.proposalStatus">
            {{ item.proposalStatus }}
          </span>
          <span class="history-weight">{{ formatVotes(item.weight) }}</span>
          <span class="history-time">{{ formatDate(item.timestamp * 1000) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { 
  getProposals, 
  getProposal, 
  getProposalVotes,
  getVotingHistory,
  getDaos,
  getVotingStats,
  type Proposal,
  type Vote,
  type VotingHistory,
  type DaoInfo,
  type VotingStats
} from '@/service/api/web3';

const proposals = ref<Proposal[]>([]);
const daos = ref<DaoInfo[]>([]);
const stats = ref<VotingStats>({
  totalProposals: 0,
  activeProposals: 0,
  passedProposals: 0,
  rejectedProposals: 0,
  totalVotes: '0',
  averageParticipation: '0%'
});

const selectedNetwork = ref('');
const selectedStatus = ref('');
const searchQuery = ref('');
const filteredProposals = ref<Proposal[]>([]);

const selectedProposal = ref<Proposal | null>(null);
const proposalVotes = ref<Vote[]>([]);

const lookupAddress = ref('');
const votingHistory = ref<VotingHistory[]>([]);

onMounted(async () => {
  await loadStats();
  await loadDaos();
  await loadProposals();
});

async function loadStats() {
  try {
    const res = await getVotingStats();
    stats.value = res;
  } catch (e) {
    console.error('Failed to load stats:', e);
  }
}

async function loadDaos() {
  try {
    const res = await getDaos();
    daos.value = res;
  } catch (e) {
    console.error('Failed to load DAOs:', e);
  }
}

async function loadProposals() {
  try {
    const res = await getProposals({
      network: selectedNetwork.value || undefined,
      status: selectedStatus.value || undefined,
      limit: 50
    });
    proposals.value = res.proposals;
    filterProposals();
  } catch (e) {
    console.error('Failed to load proposals:', e);
  }
}

function filterProposals() {
  let result = [...proposals.value];
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(p => 
      p.title.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query)
    );
  }
  
  filteredProposals.value = result;
}

async function selectProposal(proposal: Proposal) {
  selectedProposal.value = proposal;
  try {
    const res = await getProposalVotes(proposal.id);
    proposalVotes.value = res;
  } catch (e) {
    console.error('Failed to load votes:', e);
    proposalVotes.value = [];
  }
}

function selectDao(dao: DaoInfo) {
  selectedNetwork.value = dao.network;
  loadProposals();
}

async function lookupVotingHistory() {
  if (!lookupAddress.value) return;
  
  try {
    const res = await getVotingHistory(lookupAddress.value);
    votingHistory.value = res;
  } catch (e) {
    console.error('Failed to load voting history:', e);
    votingHistory.value = [];
  }
}

function getForPercent(proposal: Proposal): number {
  const total = parseInt(proposal.totalVotes) || 1;
  return Math.round((parseInt(proposal.votesFor) / total) * 100);
}

function getAgainstPercent(proposal: Proposal): number {
  const total = parseInt(proposal.totalVotes) || 1;
  return Math.round((parseInt(proposal.votesAgainst) / total) * 100);
}

function getAbstainPercent(proposal: Proposal): number {
  const total = parseInt(proposal.totalVotes) || 1;
  return Math.round((parseInt(proposal.votesAbstain) / total) * 100);
}

function formatVotes(votes: string): string {
  const num = parseInt(votes);
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getTimeRemaining(endTime: number): string {
  const now = Date.now();
  const diff = endTime - now;
  
  if (diff <= 0) return 'Ended';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
}

function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

function shortAddress(address: string): string {
  return address.slice(0, 6) + '...' + address.slice(-4);
}
</script>

<style scoped>
.voting-tracker {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  margin-bottom: 24px;
}

.header h2 {
  margin: 0 0 16px 0;
  font-size: 24px;
}

.header-stats {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.stat-card {
  background: #1a1a2e;
  border: 1px solid #2a2a4e;
  border-radius: 8px;
  padding: 12px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-card.active {
  border-color: #00ff88;
}

.stat-card.passed {
  border-color: #4a9eff;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
}

.stat-label {
  font-size: 12px;
  color: #888;
  margin-top: 4px;
}

.filters {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.filters select,
.filters input {
  padding: 10px 14px;
  border: 1px solid #2a2a4e;
  border-radius: 6px;
  background: #1a1a2e;
  color: #fff;
  font-size: 14px;
}

.filters input {
  flex: 1;
  min-width: 200px;
}

.daos-section {
  margin-bottom: 32px;
}

.daos-section h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
}

.daos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.dao-card {
  background: #1a1a2e;
  border: 1px solid #2a2a4e;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.dao-card:hover {
  border-color: #4a9eff;
  transform: translateY(-2px);
}

.dao-logo {
  font-size: 32px;
}

.dao-info {
  margin-top: 8px;
}

.dao-name {
  font-weight: bold;
  display: block;
}

.dao-symbol {
  font-size: 12px;
  color: #888;
}

.dao-stats {
  margin-top: 8px;
  font-size: 12px;
  color: #888;
  display: flex;
  justify-content: space-between;
}

.proposals-section h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
}

.proposals-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.proposal-card {
  background: #1a1a2e;
  border: 1px solid #2a2a4e;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.proposal-card:hover {
  border-color: #4a9eff;
}

.proposal-card.active {
  border-color: #00ff88;
}

.proposal-header {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}

.proposal-id {
  font-size: 12px;
  color: #888;
}

.proposal-status {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  text-transform: uppercase;
}

.proposal-status.active {
  background: #00ff8820;
  color: #00ff88;
}

.proposal-status.passed {
  background: #4a9eff20;
  color: #4a9eff;
}

.proposal-status.rejected {
  background: #ff4a4a20;
  color: #ff4a4a;
}

.proposal-status.executed {
  background: #9a4aff20;
  color: #9a4aff;
}

.proposal-network {
  font-size: 12px;
  color: #888;
}

.proposal-title {
  margin: 0 0 8px 0;
  font-size: 16px;
}

.proposal-desc {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #aaa;
}

.proposal-votes {
  margin-bottom: 12px;
}

.vote-bar {
  height: 8px;
  background: #2a2a4e;
  border-radius: 4px;
  display: flex;
  overflow: hidden;
  margin-bottom: 8px;
}

.vote-for {
  background: #00ff88;
}

.vote-against {
  background: #ff4a4a;
}

.vote-stats {
  display: flex;
  gap: 16px;
  font-size: 13px;
}

.vote-stats .for {
  color: #00ff88;
}

.vote-stats .against {
  color: #ff4a4a;
}

.vote-stats .abstain {
  color: #888;
}

.proposal-footer {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #888;
}

.time-remaining {
  color: #00ff88;
}

/* Modal */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #1a1a2e;
  border-radius: 12px;
  max-width: 700px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  padding: 24px;
  position: relative;
}

.close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  background: none;
  border: none;
  color: #888;
  font-size: 24px;
  cursor: pointer;
}

.proposal-detail h2 {
  margin: 16px 0;
}

.detail-desc {
  color: #aaa;
  line-height: 1.6;
}

.detail-votes {
  margin: 24px 0;
}

.vote-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.vote-label {
  width: 70px;
  font-size: 14px;
}

.vote-progress {
  flex: 1;
  height: 24px;
  background: #2a2a4e;
  border-radius: 4px;
  overflow: hidden;
}

.vote-bar-for {
  height: 100%;
  background: #00ff88;
}

.vote-bar-against {
  height: 100%;
  background: #ff4a4a;
}

.vote-bar-abstain {
  height: 100%;
  background: #888;
}

.vote-value {
  width: 80px;
  text-align: right;
  font-size: 14px;
}

.vote-percent {
  width: 50px;
  font-size: 14px;
  color: #888;
}

.detail-info {
  background: #0a0a1e;
  border-radius: 8px;
  padding: 16px;
  margin: 24px 0;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #2a2a4e;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  color: #888;
}

.info-value {
  font-family: monospace;
}

.votes-section h4 {
  margin: 0 0 12px 0;
}

.votes-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.vote-item {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px;
  background: #0a0a1e;
  border-radius: 6px;
  font-size: 13px;
}

.vote-support {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  min-width: 60px;
}

.vote-support.for {
  background: #00ff8820;
  color: #00ff88;
}

.vote-support.against {
  background: #ff4a4a20;
  color: #ff4a4a;
}

.vote-support.abstain {
  background: #88888820;
  color: #888;
}

.vote-voter {
  font-family: monospace;
}

.vote-weight {
  margin-left: auto;
}

.vote-time {
  color: #888;
  font-size: 12px;
}

/* Address Lookup */
.address-lookup {
  margin-top: 32px;
}

.address-lookup h3 {
  margin: 0 0 16px 0;
}

.lookup-form {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.lookup-form input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid #2a2a4e;
  border-radius: 6px;
  background: #1a1a2e;
  color: #fff;
  font-size: 14px;
}

.lookup-form button {
  padding: 10px 24px;
  background: #4a9eff;
  border: none;
  border-radius: 6px;
  color: #fff;
  cursor: pointer;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px;
  background: #1a1a2e;
  border-radius: 6px;
  font-size: 13px;
}

.history-support {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.history-support.for {
  background: #00ff8820;
  color: #00ff88;
}

.history-support.against {
  background: #ff4a4a20;
  color: #ff4a4a;
}

.history-support.abstain {
  background: #88888820;
  color: #888;
}

.history-proposal {
  flex: 1;
  font-weight: 500;
}

.history-status {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
}

.history-status.active {
  background: #00ff8820;
  color: #00ff88;
}

.history-status.passed {
  background: #4a9eff20;
  color: #4a9eff;
}

.history-status.rejected {
  background: #ff4a4a20;
  color: #ff4a4a;
}

.history-weight {
  font-family: monospace;
}

.history-time {
  color: #888;
  font-size: 12px;
}
</style>
