<template>
  <div class="contract-verifier">
    <div class="header">
      <h2>📜 Smart Contract Source Code Verifier</h2>
      <p>Verify that deployed contract bytecode matches source code</p>
    </div>

    <!-- Chain Selection -->
    <div class="form-section">
      <label>Select Chain</label>
      <select v-model="selectedChain" @change="onChainChange">
        <option v-for="chain in chains" :key="chain.chainId" :value="chain.chainId">
          {{ chain.name }}
        </option>
      </select>
    </div>

    <!-- Contract Address -->
    <div class="form-section">
      <label>Contract Address</label>
      <input 
        v-model="contractAddress" 
        placeholder="0x..."
        @blur="checkVerificationStatus"
      />
      <span v-if="verificationStatus" :class="['status-badge', verificationStatus.verified ? 'verified' : 'unverified']">
        {{ verificationStatus.verified ? '✓ Verified on Explorer' : 'Not Verified on Explorer' }}
      </span>
    </div>

    <!-- Compiler Version -->
    <div class="form-section">
      <label>Compiler Version</label>
      <select v-model="compilerVersion">
        <option v-for="version in compilerVersions" :key="version" :value="version">
          {{ version }}
        </option>
      </select>
    </div>

    <!-- Contract Name -->
    <div class="form-section">
      <label>Contract Name</label>
      <input v-model="contractName" placeholder="MyContract" />
    </div>

    <!-- Optimization -->
    <div class="form-row">
      <div class="form-section checkbox">
        <label>
          <input type="checkbox" v-model="optimization" />
          Enable Optimization
        </label>
      </div>
      <div class="form-section" v-if="optimization">
        <label>Runs</label>
        <input type="number" v-model.number="runs" min="0" max="1000" />
      </div>
    </div>

    <!-- Source Code -->
    <div class="form-section">
      <label>Source Code (Solidity)</label>
      <textarea 
        v-model="sourceCode" 
        placeholder="// SPDX-License-Identifier: MIT&#10;pragma solidity ^0.8.0;..."
        rows="15"
      ></textarea>
    </div>

    <!-- Constructor Args -->
    <div class="form-section">
      <label>Constructor Arguments (optional, hex)</label>
      <input v-model="constructorArgs" placeholder="0x000000..." />
    </div>

    <!-- Submit Button -->
    <button @click="verifyContract" :disabled="loading" class="verify-btn">
      {{ loading ? 'Verifying...' : 'Verify Contract' }}
    </button>

    <!-- Results -->
    <div v-if="result" class="result-section">
      <div :class="['result-header', result.verified ? 'verified' : 'failed']">
        <span class="icon">{{ result.verified ? '✓' : '✗' }}</span>
        <span>{{ result.verified ? 'Contract Verified!' : 'Verification Failed' }}</span>
        <span class="match-score">{{ result.matchScore }}% Match</span>
      </div>

      <!-- Compilation Info -->
      <div class="result-card">
        <h4>📦 Compilation Info</h4>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">Status:</span>
            <span :class="['value', result.compilationInfo.status]">
              {{ result.compilationInfo.status.toUpperCase() }}
            </span>
          </div>
          <div class="info-item">
            <span class="label">Compiler:</span>
            <span class="value">{{ result.compilerVersion }}</span>
          </div>
          <div class="info-item">
            <span class="label">Optimization:</span>
            <span class="value">{{ result.optimizationUsed ? `Yes (${result.runs} runs)` : 'No' }}</span>
          </div>
          <div class="info-item">
            <span class="label">License:</span>
            <span class="value">{{ result.licenseType }}</span>
          </div>
        </div>
      </div>

      <!-- Issues -->
      <div v-if="result.issues.length > 0" class="result-card">
        <h4>⚠️ Issues Found ({{ result.issues.length }})</h4>
        <div class="issues-list">
          <div 
            v-for="(issue, index) in result.issues" 
            :key="index"
            :class="['issue-item', issue.type, issue.severity]"
          >
            <span class="issue-type">{{ issue.type.toUpperCase() }}</span>
            <span class="issue-severity">{{ issue.severity }}</span>
            <span class="issue-message">{{ issue.message }}</span>
          </div>
        </div>
      </div>

      <!-- Contract Details -->
      <div class="result-card">
        <h4>🔗 Contract Details</h4>
        <div class="info-grid">
          <div class="info-item full">
            <span class="label">Address:</span>
            <span class="value address">{{ result.address }}</span>
          </div>
          <div class="info-item">
            <span class="label">Chain:</span>
            <span class="value">{{ result.chainName }}</span>
          </div>
          <div class="info-item">
            <span class="label">Source Hash:</span>
            <span class="value">{{ result.sourceCodeHash }}</span>
          </div>
          <div class="info-item">
            <span class="label">Bytecode Hash:</span>
            <span class="value">{{ result.bytecodeHash }}</span>
          </div>
        </div>
      </div>

      <!-- Timestamp -->
      <div class="timestamp">
        Verified at: {{ formatTimestamp(result.timestamp) }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';

interface ChainInfo {
  chainId: number;
  name: string;
}

interface VerificationStatus {
  verified: boolean;
  timestamp?: string;
}

interface Issue {
  type: string;
  message: string;
  severity: string;
}

interface CompilationInfo {
  status: string;
  errorMessage?: string;
  warningCount: number;
  compiledSuccessfully: boolean;
}

interface VerificationResult {
  address: string;
  chainId: number;
  chainName: string;
  verified: boolean;
  matchScore: number;
  compilationInfo: CompilationInfo;
  sourceCodeHash: string;
  bytecodeHash: string;
  constructorArgs: string;
  compilerVersion: string;
  optimizationUsed: boolean;
  runs: number;
  licenseType: string;
  issues: Issue[];
  timestamp: string;
}

const chains = ref<ChainInfo[]>([]);
const compilerVersions = ref<string[]>([]);
const selectedChain = ref(1);
const contractAddress = ref('');
const compilerVersion = ref('v0.8.26+commit.8a97fa7a');
const contractName = ref('');
const optimization = ref(true);
const runs = ref(200);
const sourceCode = ref('');
const constructorArgs = ref('');
const loading = ref(false);
const result = ref<VerificationResult | null>(null);
const verificationStatus = ref<VerificationStatus | null>(null);

onMounted(async () => {
  await loadChains();
  await loadCompilerVersions();
});

async function loadChains() {
  try {
    const response = await axios.get('/api/web3/contract-verifier/chains');
    chains.value = response.data;
  } catch (error) {
    console.error('Failed to load chains:', error);
    chains.value = [
      { chainId: 1, name: 'Ethereum Mainnet' },
      { chainId: 56, name: 'BSC Mainnet' },
      { chainId: 137, name: 'Polygon' },
      { chainId: 42161, name: 'Arbitrum One' },
      { chainId: 10, name: 'Optimism' },
    ];
  }
}

async function loadCompilerVersions() {
  try {
    const response = await axios.get('/api/web3/contract-verifier/compiler-versions');
    compilerVersions.value = response.data;
  } catch (error) {
    console.error('Failed to load compiler versions:', error);
    compilerVersions.value = [
      'v0.8.26+commit.8a97fa7a',
      'v0.8.25+commit.2d4f4a88',
      'v0.8.24+commit.e112f5f9',
    ];
  }
}

async function checkVerificationStatus() {
  if (!contractAddress.value || !/^0x[a-fA-F0-9]{40}$/.test(contractAddress.value)) {
    verificationStatus.value = null;
    return;
  }
  
  try {
    const response = await axios.get(
      `/api/web3/contract-verifier/status/${selectedChain.value}/${contractAddress.value}`
    );
    verificationStatus.value = response.data;
  } catch (error) {
    verificationStatus.value = null;
  }
}

function onChainChange() {
  verificationStatus.value = null;
}

async function verifyContract() {
  if (!contractAddress.value || !sourceCode.value || !contractName.value) {
    alert('Please fill in all required fields');
    return;
  }

  loading.value = true;
  result.value = null;

  try {
    const response = await axios.post('/api/web3/contract-verifier/verify', {
      contractAddress: contractAddress.value,
      chainId: selectedChain.value,
      sourceCode: sourceCode.value,
      compilerVersion: compilerVersion.value,
      contractName: contractName.value,
      optimization: optimization.value,
      runs: runs.value,
      constructorArgs: constructorArgs.value || undefined,
    });
    result.value = response.data;
  } catch (error: any) {
    alert(error.response?.data?.message || 'Verification failed');
  } finally {
    loading.value = false;
  }
}

function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleString();
}
</script>

<style scoped>
.contract-verifier {
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h2 {
  color: #2c3e50;
  margin-bottom: 10px;
}

.header p {
  color: #7f8c8d;
}

.form-section {
  margin-bottom: 20px;
}

.form-section label {
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
  color: #34495e;
}

.form-section input,
.form-section select,
.form-section textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  font-family: 'Monaco', 'Menlo', monospace;
}

.form-section textarea {
  resize: vertical;
  min-height: 200px;
}

.form-row {
  display: flex;
  gap: 20px;
}

.form-row .form-section {
  flex: 1;
}

.checkbox {
  display: flex;
  align-items: center;
}

.checkbox label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.status-badge {
  display: inline-block;
  margin-top: 8px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.status-badge.verified {
  background: #d4edda;
  color: #155724;
}

.status-badge.unverified {
  background: #fff3cd;
  color: #856404;
}

.verify-btn {
  width: 100%;
  padding: 15px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.verify-btn:hover:not(:disabled) {
  transform: translateY(-2px);
}

.verify-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.result-section {
  margin-top: 30px;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
}

.result-header.verified {
  background: #d4edda;
  color: #155724;
}

.result-header.failed {
  background: #f8d7da;
  color: #721c24;
}

.result-header .icon {
  font-size: 24px;
}

.match-score {
  margin-left: auto;
  font-size: 20px;
}

.result-card {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
}

.result-card h4 {
  margin: 0 0 15px 0;
  color: #2c3e50;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item.full {
  grid-column: 1 / -1;
}

.info-item .label {
  font-size: 12px;
  color: #7f8c8d;
  text-transform: uppercase;
}

.info-item .value {
  font-size: 14px;
  color: #2c3e50;
  font-weight: 500;
  font-family: 'Monaco', 'Menlo', monospace;
}

.info-item .value.address {
  word-break: break-all;
  font-size: 12px;
}

.info-item .value.success {
  color: #28a745;
}

.info-item .value.error {
  color: #dc3545;
}

.issues-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.issue-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: white;
  border-radius: 8px;
  border-left: 4px solid;
}

.issue-item.error {
  border-color: #dc3545;
}

.issue-item.warning {
  border-color: #ffc107;
}

.issue-item.info {
  border-color: #17a2b8;
}

.issue-type {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  background: #eee;
}

.issue-item.error .issue-type {
  background: #f8d7da;
  color: #dc3545;
}

.issue-item.warning .issue-type {
  background: #fff3cd;
  color: #856404;
}

.issue-item.info .issue-type {
  background: #d1ecf1;
  color: #0c5460;
}

.issue-severity {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
}

.issue-item.high .issue-severity {
  color: #dc3545;
}

.issue-item.medium .issue-severity {
  color: #ffc107;
}

.issue-item.low .issue-severity {
  color: #17a2b8;
}

.issue-message {
  flex: 1;
  font-size: 13px;
}

.timestamp {
  text-align: center;
  color: #7f8c8d;
  font-size: 12px;
}
</style>
