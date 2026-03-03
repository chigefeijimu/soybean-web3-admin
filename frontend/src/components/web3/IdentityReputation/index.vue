<template>
  <div class="identity-reputation">
    <div class="page-header">
      <h1>🆔 Web3 Identity & Reputation</h1>
      <p class="subtitle">Verify your identity and build your on-chain reputation</p>
    </div>

    <!-- Platform Stats -->
    <div class="stats-grid" v-if="platformStats">
      <div class="stat-card">
        <div class="stat-value">{{ platformStats.totalIdentities }}</div>
        <div class="stat-label">Total Identities</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ platformStats.verifiedIdentities }}</div>
        <div class="stat-label">Verified</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ platformStats.averageReputation?.toFixed(1) || 0 }}</div>
        <div class="stat-label">Avg Reputation</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ platformStats.levelDistribution?.legend || 0 }}</div>
        <div class="stat-label">Legends</div>
      </div>
    </div>

    <div class="main-content">
      <!-- Left Panel: Identity Verification -->
      <div class="panel">
        <h2>🔐 Identity Verification</h2>
        
        <div class="form-group">
          <label>Wallet Address</label>
          <input 
            v-model="walletAddress" 
            placeholder="0x..."
            class="input"
            @blur="loadProfile"
          />
        </div>

        <div class="form-group">
          <label>Display Name</label>
          <input 
            v-model="displayName" 
            placeholder="Your name"
            class="input"
          />
        </div>

        <div class="form-group">
          <label>Bio (optional)</label>
          <textarea 
            v-model="bio" 
            placeholder="Tell us about yourself..."
            class="textarea"
          ></textarea>
        </div>

        <div class="form-group">
          <label>Social Links</label>
          <div class="social-inputs">
            <input v-model="socialLinks.twitter" placeholder="Twitter handle" class="input" />
            <input v-model="socialLinks.github" placeholder="GitHub username" class="input" />
          </div>
        </div>

        <button @click="createProfile" class="btn btn-primary">
          Create Profile
        </button>

        <div class="verification-section" v-if="currentProfile">
          <h3>Verify Your Identity</h3>
          <p class="info-text">Sign a message to verify you own this wallet address.</p>
          
          <div class="verification-message">
            <code>{{ verificationMessage }}</code>
          </div>
          
          <button @click="generateMessage" class="btn btn-secondary">
            Generate New Message
          </button>
          
          <div class="form-group" style="margin-top: 1rem;">
            <label>Signature</label>
            <input 
              v-model="signature" 
              placeholder="Paste your signature here..."
              class="input"
            />
          </div>
          
          <button @click="verifyIdentity" class="btn btn-success" :disabled="!signature">
            Verify Identity
          </button>
        </div>
      </div>

      <!-- Right Panel: Profile Display -->
      <div class="panel">
        <h2>👤 Your Profile</h2>
        
        <div v-if="currentProfile" class="profile-card">
          <div class="profile-header">
            <div class="avatar">{{ currentProfile.displayName?.charAt(0).toUpperCase() || '?' }}</div>
            <div class="profile-info">
              <h3>{{ currentProfile.displayName }}</h3>
              <p class="address">{{ formatAddress(currentProfile.address) }}</p>
              <span class="badge" :class="currentProfile.reputationLevel">
                {{ currentProfile.reputationLevel }}
              </span>
              <span class="badge verified" v-if="currentProfile.verified">✓ Verified</span>
            </div>
          </div>
          
          <div class="profile-stats">
            <div class="stat">
              <span class="stat-num">{{ currentProfile.reputationScore }}</span>
              <span class="stat-text">Reputation</span>
            </div>
            <div class="stat">
              <span class="stat-num">{{ currentProfile.totalInteractions }}</span>
              <span class="stat-text">Interactions</span>
            </div>
            <div class="stat">
              <span class="stat-num">{{ currentProfile.badges?.length || 0 }}</span>
              <span class="stat-text">Badges</span>
            </div>
          </div>

          <div class="badges-section" v-if="currentProfile.badges?.length">
            <h4>🏆 Badges</h4>
            <div class="badges-list">
              <span v-for="badge in currentProfile.badges" :key="badge" class="badge-item">
                {{ badge }}
              </span>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <p>No profile found. Create one to get started!</p>
        </div>

        <!-- Reputation History -->
        <div class="reputation-history" v-if="reputationHistory.length">
          <h3>📈 Reputation History</h3>
          <div class="history-list">
            <div v-for="(item, idx) in reputationHistory.slice(0, 10)" :key="idx" class="history-item">
              <span class="history-reason">{{ item.reason }}</span>
              <span class="history-change" :class="item.change >= 0 ? 'positive' : 'negative'">
                {{ item.change >= 0 ? '+' : '' }}{{ item.change }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Top Identities -->
    <div class="panel top-identities">
      <h2>🏅 Top Identities</h2>
      <div class="identities-grid">
        <div v-for="(identity, idx) in topIdentities" :key="identity.address" class="identity-card">
          <div class="rank">#{{ idx + 1 }}</div>
          <div class="identity-info">
            <div class="identity-name">{{ identity.displayName }}</div>
            <div class="identity-address">{{ formatAddress(identity.address) }}</div>
          </div>
          <div class="identity-score">{{ identity.reputationScore }}</div>
          <span class="badge" :class="identity.reputationLevel">{{ identity.reputationLevel }}</span>
        </div>
      </div>
    </div>

    <!-- Cross-Chain Section -->
    <div class="panel cross-chain" v-if="currentProfile">
      <h2>⛓️ Cross-Chain Identities</h2>
      <div class="chain-inputs">
        <select v-model="selectedChain" class="select">
          <option value="">Select Chain</option>
          <option value="ethereum">Ethereum</option>
          <option value="polygon">Polygon</option>
          <option value="arbitrum">Arbitrum</option>
          <option value="optimism">Optimism</option>
          <option value="bsc">BNB Chain</option>
          <option value="base">Base</option>
          <option value="avalanche">Avalanche</option>
        </select>
        <input v-model="txCount" type="number" placeholder="Tx count" class="input" />
        <button @click="addChainIdentity" class="btn btn-secondary">Add</button>
      </div>
      <div class="chains-list" v-if="crossChainIdentities.length">
        <div v-for="chain in crossChainIdentities" :key="chain.chain" class="chain-item">
          <span class="chain-name">{{ chain.chain }}</span>
          <span class="chain-tx">{{ chain.transactionCount }} txs</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import * as api from '../../service/api/identityReputation';

const walletAddress = ref('');
const displayName = ref('');
const bio = ref('');
const socialLinks = ref({ twitter: '', github: '', website: '' });
const signature = ref('');
const verificationMessage = ref('');
const currentProfile = ref<any>(null);
const reputationHistory = ref<any[]>([]);
const topIdentities = ref<any[]>([]);
const platformStats = ref<any>(null);
const crossChainIdentities = ref<any[]>([]);
const selectedChain = ref('');
const txCount = ref(0);

const generateMessage = async () => {
  try {
    const result = await api.getVerificationMessage('sign', 'Web3 Identity Platform');
    verificationMessage.value = result.message;
  } catch (e) {
    console.error('Failed to generate message:', e);
  }
};

const createProfile = async () => {
  if (!walletAddress.value || !displayName.value) return;
  try {
    const profile = await api.createProfile(walletAddress.value, displayName.value, bio.value, socialLinks.value);
    currentProfile.value = profile;
    await loadProfile();
  } catch (e) {
    console.error('Failed to create profile:', e);
  }
};

const verifyIdentity = async () => {
  if (!walletAddress.value || !signature.value) return;
  try {
    const result = await api.verifyIdentity(walletAddress.value, signature.value, verificationMessage.value);
    if (result.success) {
      currentProfile.value = result.profile;
      alert('Identity verified successfully!');
    }
  } catch (e) {
    console.error('Verification failed:', e);
    alert('Verification failed. Please check your signature.');
  }
};

const loadProfile = async () => {
  if (!walletAddress.value) return;
  try {
    currentProfile.value = await api.getProfile(walletAddress.value);
    if (currentProfile.value) {
      verificationMessage.value = await api.getVerificationMessage('sign', 'Web3 Identity Platform').then(r => r.message);
      reputationHistory.value = await api.getReputationHistory(walletAddress.value);
      crossChainIdentities.value = await api.getCrossChainIdentities(walletAddress.value);
    }
  } catch (e) {
    console.error('Failed to load profile:', e);
  }
};

const addChainIdentity = async () => {
  if (!walletAddress.value || !selectedChain.value || !txCount.value) return;
  try {
    await api.addCrossChainIdentity(walletAddress.value, selectedChain.value, txCount.value);
    crossChainIdentities.value = await api.getCrossChainIdentities(walletAddress.value);
  } catch (e) {
    console.error('Failed to add chain identity:', e);
  }
};

const loadTopIdentities = async () => {
  try {
    topIdentities.value = await api.getTopIdentities(10);
  } catch (e) {
    console.error('Failed to load top identities:', e);
  }
};

const loadStats = async () => {
  try {
    platformStats.value = await api.getIdentityStats();
  } catch (e) {
    console.error('Failed to load stats:', e);
  }
};

const formatAddress = (addr: string) => {
  if (!addr) return '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

onMounted(async () => {
  await loadStats();
  await loadTopIdentities();
});
</script>

<style scoped>
.identity-reputation { padding: 1.5rem; max-width: 1400px; margin: 0 auto; }
.page-header { text-align: center; margin-bottom: 2rem; }
.page-header h1 { font-size: 2rem; margin-bottom: 0.5rem; }
.subtitle { color: #666; font-size: 1.1rem; }

.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem; }
.stat-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 1.5rem; text-align: center; color: white; }
.stat-value { font-size: 2rem; font-weight: bold; }
.stat-label { font-size: 0.9rem; opacity: 0.9; }

.main-content { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem; }
.panel { background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.panel h2 { margin-bottom: 1.5rem; font-size: 1.3rem; }

.form-group { margin-bottom: 1rem; }
.form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; color: #333; }
.input, .textarea, .select { width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem; }
.textarea { min-height: 80px; resize: vertical; }
.social-inputs { display: flex; flex-direction: column; gap: 0.5rem; }

.btn { padding: 0.75rem 1.5rem; border: none; border-radius: 8px; font-size: 1rem; cursor: pointer; transition: all 0.2s; }
.btn-primary { background: #667eea; color: white; width: 100%; }
.btn-secondary { background: #e0e7ff; color: #667eea; }
.btn-success { background: #10b981; color: white; width: 100%; margin-top: 1rem; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }

.verification-section { margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #eee; }
.verification-message { background: #f5f5f5; padding: 1rem; border-radius: 8px; margin: 1rem 0; font-size: 0.9rem; word-break: break-all; }

.profile-card { background: #f9fafb; border-radius: 12px; padding: 1.5rem; }
.profile-header { display: flex; gap: 1rem; margin-bottom: 1.5rem; }
.avatar { width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #667eea, #764ba2); display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5rem; font-weight: bold; }
.profile-info h3 { margin: 0 0 0.25rem; }
.address { color: #666; font-size: 0.85rem; font-family: monospace; margin: 0 0 0.5rem; }

.badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 500; margin-right: 0.5rem; background: #e5e7eb; color: #666; }
.badge.verified { background: #d1fae5; color: #059669; }
.badge.newbie { background: #e5e7eb; color: #666; }
.badge.trusted { background: #dbeafe; color: #2563eb; }
.badge.expert { background: #fef3c7; color: #d97706; }
.badge.veteran { background: #fce7f3; color: #db2777; }
.badge.legend { background: linear-gradient(135deg, #fbbf24, #f59e0b); color: white; }

.profile-stats { display: flex; gap: 1rem; margin-bottom: 1.5rem; }
.stat { flex: 1; text-align: center; padding: 1rem; background: white; border-radius: 8px; }
.stat-num { display: block; font-size: 1.5rem; font-weight: bold; color: #333; }
.stat-text { font-size: 0.8rem; color: #666; }

.badges-section { margin-bottom: 1rem; }
.badges-section h4 { margin-bottom: 0.5rem; font-size: 0.9rem; }
.badges-list { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.badge-item { background: #fef3c7; color: #d97706; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.8rem; }

.empty-state { text-align: center; padding: 2rem; color: #666; }
.reputation-history { margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #eee; }
.reputation-history h3 { margin-bottom: 1rem; }
.history-list { max-height: 300px; overflow-y: auto; }
.history-item { display: flex; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid #f0f0f0; }
.history-reason { flex: 1; font-size: 0.9rem; }
.history-change { font-weight: bold; margin: 0 1rem; }
.history-change.positive { color: #10b981; }
.history-change.negative { color: #ef4444; }

.top-identities { margin-bottom: 2rem; }
.identities-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
.identity-card { display: flex; align-items: center; gap: 1rem; padding: 1rem; background: #f9fafb; border-radius: 8px; }
.rank { font-size: 1.5rem; font-weight: bold; color: #667eea; width: 40px; }
.identity-info { flex: 1; }
.identity-name { font-weight: 500; }
.identity-address { font-size: 0.8rem; color: #666; font-family: monospace; }
.identity-score { font-size: 1.25rem; font-weight: bold; color: #667eea; }

.cross-chain .chain-inputs { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
.cross-chain .select, .cross-chain .input { flex: 1; }
.chains-list { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.chain-item { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: #e0e7ff; border-radius: 20px; font-size: 0.9rem; }
.chain-name { text-transform: capitalize; font-weight: 500; }
.chain-tx { color: #666; }
.info-text { color: #666; font-size: 0.9rem; margin-bottom: 1rem; }
</style>
