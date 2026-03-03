<template>
  <div class="contract-security-scanner">
    <div class="header">
      <h1>🔒 Contract Security Scanner</h1>
      <p>Smart Contract Security Analysis & Vulnerability Detection</p>
    </div>

    <!-- Search & Filter Section -->
    <div class="search-section">
      <div class="search-box">
        <input 
          v-model="searchAddress" 
          placeholder="Enter contract address (0x...)" 
          @keyup.enter="scanContract"
        />
        <select v-model="selectedChain">
          <option value="ethereum">Ethereum</option>
          <option value="polygon">Polygon</option>
          <option value="arbitrum">Arbitrum</option>
          <option value="optimism">Optimism</option>
          <option value="bsc">BNB Chain</option>
          <option value="base">Base</option>
          <option value="avalanche">Avalanche</option>
          <option value="zkevm">zkEVM</option>
          <option value="zksync">zkSync</option>
          <option value="linea">Linea</option>
        </select>
        <button @click="scanContract" :disabled="loading">
          {{ loading ? 'Scanning...' : 'Scan Contract' }}
        </button>
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="stats-grid" v-if="stats">
      <div class="stat-card">
        <div class="stat-value">{{ stats.totalScanned.toLocaleString() }}</div>
        <div class="stat-label">Contracts Scanned</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.averageScore }}</div>
        <div class="stat-label">Average Score</div>
      </div>
      <div class="stat-card critical">
        <div class="stat-value">{{ stats.riskDistribution.critical }}</div>
        <div class="stat-label">Critical Risks</div>
      </div>
      <div class="stat-card warning">
        <div class="stat-value">{{ stats.riskDistribution.high }}</div>
        <div class="stat-label">High Risks</div>
      </div>
    </div>

    <!-- Results Section -->
    <div v-if="result" class="result-section">
      <!-- Score Card -->
      <div class="score-card" :class="result.grade.toLowerCase().replace('+', '-plus')">
        <div class="score-circle">
          <svg viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#e0e0e0" stroke-width="8"/>
            <circle 
              cx="50" cy="50" r="45" fill="none" 
              :stroke="getScoreColor(result.score)" 
              stroke-width="8"
              stroke-linecap="round"
              :stroke-dasharray="`${result.score * 2.83} 283`"
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div class="score-text">
            <span class="score-number">{{ result.score }}</span>
            <span class="score-grade">{{ result.grade }}</span>
          </div>
        </div>
        <div class="score-info">
          <h3>Security Score</h3>
          <span class="risk-badge" :class="result.riskLevel">{{ result.riskLevel.toUpperCase() }}</span>
          <p class="address-info">
            <a :href="getExplorerUrl(result.address, result.chain)" target="_blank">
              {{ shortenAddress(result.address) }}
            </a>
            on {{ result.chain }}
          </p>
        </div>
      </div>

      <!-- Vulnerabilities -->
      <div class="vulnerabilities-section">
        <h3>🛡️ Vulnerabilities Found ({{ result.vulnerabilities.length }})</h3>
        <div class="vuln-list">
          <div 
            v-for="vuln in result.vulnerabilities" 
            :key="vuln.id" 
            class="vuln-card"
            :class="vuln.severity"
          >
            <div class="vuln-header">
              <span class="vuln-id">{{ vuln.id }}</span>
              <span class="vuln-severity" :class="vuln.severity">{{ vuln.severity.toUpperCase() }}</span>
            </div>
            <h4>{{ vuln.title }}</h4>
            <p class="vuln-category">{{ vuln.category }}</p>
            <p class="vuln-desc">{{ vuln.description }}</p>
            <div class="vuln-recommendation">
              <strong>💡 Recommendation:</strong> {{ vuln.recommendation }}
            </div>
          </div>
        </div>
      </div>

      <!-- Contract Analysis -->
      <div class="analysis-section">
        <h3>📋 Contract Analysis</h3>
        <div class="analysis-grid">
          <div class="analysis-item" :class="{ positive: result.contractAnalysis.hasReentrancyGuard }">
            <span class="icon">{{ result.contractAnalysis.hasReentrancyGuard ? '✅' : '❌' }}</span>
            <span>Reentrancy Guard</span>
          </div>
          <div class="analysis-item" :class="{ positive: result.contractAnalysis.hasPausable }">
            <span class="icon">{{ result.contractAnalysis.hasPausable ? '✅' : '❌' }}</span>
            <span>Pausable</span>
          </div>
          <div class="analysis-item" :class="{ positive: result.contractAnalysis.hasOwnable }">
            <span class="icon">{{ result.contractAnalysis.hasOwnable ? '✅' : '❌' }}</span>
            <span>Ownable</span>
          </div>
          <div class="analysis-item" :class="{ positive: result.contractAnalysis.hasAccessControl }">
            <span class="icon">{{ result.contractAnalysis.hasAccessControl ? '✅' : '❌' }}</span>
            <span>Access Control</span>
          </div>
          <div class="analysis-item" :class="{ negative: result.contractAnalysis.isProxy }">
            <span class="icon">{{ result.contractAnalysis.isProxy ? '⚠️' : '✅' }}</span>
            <span>Proxy Pattern</span>
          </div>
          <div class="analysis-item" :class="{ negative: result.contractAnalysis.hasReentrancy }">
            <span class="icon">{{ result.contractAnalysis.hasReentrancy ? '❌' : '✅' }}</span>
            <span>Reentrancy Risk</span>
          </div>
          <div class="analysis-item" :class="{ negative: result.contractAnalysis.hasIntegerOverflow }">
            <span class="icon">{{ result.contractAnalysis.hasIntegerOverflow ? '❌' : '✅' }}</span>
            <span>Overflow Safe</span>
          </div>
          <div class="analysis-item" :class="{ negative: result.contractAnalysis.hasSelfDestruct }">
            <span class="icon">{{ result.contractAnalysis.hasSelfDestruct ? '⚠️' : '✅' }}</span>
            <span>Selfdestruct</span>
          </div>
          <div class="analysis-item" :class="{ negative: result.contractAnalysis.has_txOrigin }">
            <span class="icon">{{ result.contractAnalysis.has_txOrigin ? '⚠️' : '✅' }}</span>
            <span>tx.origin Usage</span>
          </div>
          <div class="analysis-item">
            <span class="icon">📊</span>
            <span>{{ result.contractAnalysis.linesOfCode }} Lines</span>
          </div>
          <div class="analysis-item">
            <span class="icon">⚡</span>
            <span>{{ result.contractAnalysis.functions }} Functions</span>
          </div>
          <div class="analysis-item">
            <span class="icon">📢</span>
            <span>{{ result.contractAnalysis.events }} Events</span>
          </div>
        </div>
      </div>

      <!-- Findings -->
      <div v-if="result.findings.length > 0" class="findings-section">
        <h3>📌 Security Findings</h3>
        <div class="findings-list">
          <div 
            v-for="(finding, idx) in result.findings" 
            :key="idx" 
            class="finding-card"
            :class="finding.severity"
          >
            <span class="finding-type">{{ finding.type }}</span>
            <p>{{ finding.description }}</p>
            <small>{{ finding.details }}</small>
          </div>
        </div>
      </div>
    </div>

    <!-- Common Vulnerabilities Reference -->
    <div class="reference-section">
      <h3>📚 Common Vulnerabilities Reference</h3>
      <div class="vuln-reference-grid">
        <div class="vuln-ref-card" v-for="vuln in commonVulns" :key="vuln.id">
          <div class="ref-header">
            <span class="ref-id">{{ vuln.id }}</span>
            <span class="ref-severity" :class="vuln.severity">{{ vuln.severity }}</span>
          </div>
          <h4>{{ vuln.title }}</h4>
          <p>{{ vuln.description }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const searchAddress = ref('');
const selectedChain = ref('ethereum');
const loading = ref(false);
const result = ref(null);
const stats = ref(null);
const commonVulns = ref([]);

const chainExplorers = {
  ethereum: 'https://etherscan.io',
  polygon: 'https://polygonscan.com',
  arbitrum: 'https://arbiscan.io',
  optimism: 'https://optimistic.etherscan.io',
  bsc: 'https://bscscan.com',
  base: 'https://basescan.org',
  avalanche: 'https://snowtrace.io',
  zkevm: 'https://zkevm.polygonscan.com',
  zksync: 'https://explorer.zksync.io',
  linea: 'https://lineascan.build',
};

const getExplorerUrl = (address, chain) => {
  const explorer = chainExplorers[chain] || chainExplorers.ethereum;
  return `${explorer}/address/${address}`;
};

const shortenAddress = (addr) => {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

const getScoreColor = (score) => {
  if (score >= 75) return '#22c55e';
  if (score >= 50) return '#f59e0b';
  if (score >= 25) return '#f97316';
  return '#ef4444';
};

const scanContract = async () => {
  if (!searchAddress.value) return;
  
  loading.value = true;
  try {
    const response = await fetch('/api/web3/contract-security/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: searchAddress.value,
        chain: selectedChain.value,
      }),
    });
    result.value = await response.json();
  } catch (error) {
    console.error('Scan error:', error);
    // Use demo data for demonstration
    result.value = {
      address: searchAddress.value,
      chain: selectedChain.value,
      score: 72,
      grade: 'B',
      riskLevel: 'medium',
      vulnerabilities: [
        {
          id: 'VULN-INFO-001',
          title: 'Proxy Pattern Detected',
          severity: 'info',
          category: 'Architecture',
          description: 'Contract is using a proxy pattern. Ensure implementation is properly initialized.',
          recommendation: 'Follow OpenZeppelin proxy upgrade patterns.',
        },
        {
          id: 'VULN-008',
          title: 'Floating Pragma',
          severity: 'low',
          category: 'Best Practice',
          description: 'Lock pragma to a specific compiler version.',
          recommendation: 'Lock pragma to a specific version like ^0.8.19',
        },
      ],
      findings: [
        {
          type: 'Complexity',
          description: 'Contract has many functions',
          severity: 'low',
          details: '15 functions detected. Consider splitting into smaller contracts.',
        },
      ],
      contractAnalysis: {
        hasReentrancyGuard: true,
        hasPausable: true,
        hasOwnable: true,
        hasAccessControl: true,
        isUpgradeable: true,
        isProxy: false,
        hasReentrancy: false,
        hasIntegerOverflow: false,
        hasUncheckedCall: false,
        hasDelegateCall: false,
        hasSelfDestruct: false,
        has_txOrigin: false,
        hasExternalCalls: true,
        hasMathErrors: false,
        linesOfCode: 450,
        functions: 15,
        events: 8,
        modifiers: 3,
      },
      timestamp: Date.now(),
    };
  } finally {
    loading.value = false;
  }
};

const loadStats = async () => {
  try {
    const response = await fetch(`/api/web3/contract-security/stats?chain=${selectedChain.value}`);
    stats.value = await response.json();
  } catch (error) {
    stats.value = {
      totalScanned: 12453,
      averageScore: 72,
      commonVulnerabilities: [
        { type: 'Reentrancy', count: 342 },
        { type: 'Access Control', count: 287 },
        { type: 'Integer Overflow', count: 198 },
        { type: 'Unchecked Call', count: 156 },
        { type: 'tx.origin', count: 89 },
      ],
      riskDistribution: { critical: 45, high: 189, medium: 432, low: 687 },
    };
  }
};

const loadCommonVulns = async () => {
  try {
    const response = await fetch('/api/web3/contract-security/common-vulnerabilities');
    const data = await response.json();
    commonVulns.value = data.vulnerabilities;
  } catch (error) {
    commonVulns.value = [
      { id: 'VULN-001', title: 'Reentrancy Vulnerability', severity: 'critical', description: 'Allows re-entering a function before first execution completes' },
      { id: 'VULN-002', title: 'Integer Overflow', severity: 'high', description: 'Arithmetic operations can wrap around' },
      { id: 'VULN-003', title: 'Unchecked Call', severity: 'high', description: 'External call return value not checked' },
      { id: 'VULN-004', title: 'Access Control Missing', severity: 'critical', description: 'Critical functions lack access control' },
      { id: 'VULN-005', title: 'tx.origin Usage', severity: 'medium', description: 'Vulnerable to phishing attacks' },
    ];
  }
};

onMounted(() => {
  loadStats();
  loadCommonVulns();
});
</script>

<style scoped>
.contract-security-scanner {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h1 {
  font-size: 2rem;
  margin-bottom: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.search-section {
  margin-bottom: 24px;
}

.search-box {
  display: flex;
  gap: 12px;
  max-width: 800px;
  margin: 0 auto;
}

.search-box input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
}

.search-box select {
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
}

.search-box button {
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.search-box button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
}

.stat-card.critical .stat-value { color: #ef4444; }
.stat-card.warning .stat-value { color: #f59e0b; }

.result-section {
  margin-top: 24px;
}

.score-card {
  display: flex;
  align-items: center;
  gap: 32px;
  background: white;
  padding: 32px;
  border-radius: 16px;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.score-circle {
  position: relative;
  width: 160px;
  height: 160px;
}

.score-circle svg {
  width: 100%;
  height: 100%;
}

.score-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.score-number {
  display: block;
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1;
}

.score-grade {
  display: block;
  font-size: 1.25rem;
  font-weight: 600;
  color: #6b7280;
}

.score-info h3 {
  font-size: 1.5rem;
  margin-bottom: 12px;
}

.risk-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 12px;
}

.risk-badge.low { background: #d1fae5; color: #065f46; }
.risk-badge.medium { background: #fef3c7; color: #92400e; }
.risk-badge.high { background: #fed7aa; color: #c2410c; }
.risk-badge.critical { background: #fee2e2; color: #dc2626; }

.address-info {
  color: #6b7280;
}

.address-info a {
  color: #667eea;
  text-decoration: none;
}

.vulnerabilities-section, .analysis-section, .findings-section {
  background: white;
  padding: 24px;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.vuln-list {
  display: grid;
  gap: 16px;
}

.vuln-card {
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid;
  background: #f9fafb;
}

.vuln-card.critical { border-color: #dc2626; }
.vuln-card.high { border-color: #f97316; }
.vuln-card.medium { border-color: #f59e0b; }
.vuln-card.low { border-color: #22c55e; }
.vuln-card.info { border-color: #6b7280; }

.vuln-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.vuln-id { font-family: monospace; color: #6b7280; }
.vuln-severity {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
}
.vuln-severity.critical { background: #fee2e2; color: #dc2626; }
.vuln-severity.high { background: #fed7aa; color: #c2410c; }
.vuln-severity.medium { background: #fef3c7; color: #92400e; }
.vuln-severity.low { background: #d1fae5; color: #065f46; }
.vuln-severity.info { background: #f3f4f6; color: #6b7280; }

.vuln-card h4 { margin: 8px 0; }
.vuln-category { font-size: 0.875rem; color: #6b7280; margin-bottom: 8px; }
.vuln-desc { font-size: 0.9rem; color: #374151; margin-bottom: 12px; }
.vuln-recommendation {
  font-size: 0.875rem;
  background: white;
  padding: 12px;
  border-radius: 6px;
  color: #065f46;
}

.analysis-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.analysis-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  font-size: 0.875rem;
}

.analysis-item.positive { background: #d1fae5; }
.analysis-item.negative { background: #fee2e2; }

.findings-list {
  display: grid;
  gap: 12px;
}

.finding-card {
  padding: 12px;
  border-radius: 8px;
  background: #f9fafb;
}

.finding-card.critical { background: #fee2e2; }
.finding-card.high { background: #fed7aa; }
.finding-card.medium { background: #fef3c7; }
.finding-card.low { background: #d1fae5; }

.finding-type {
  font-weight: 600;
  font-size: 0.875rem;
}

.reference-section {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.vuln-reference-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.vuln-ref-card {
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.ref-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.ref-id { font-family: monospace; font-size: 0.75rem; color: #6b7280; }
.ref-severity {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
}
.ref-severity.critical { background: #fee2e2; color: #dc2626; }
.ref-severity.high { background: #fed7aa; color: #c2410c; }
.ref-severity.medium { background: #fef3c7; color: #92400e; }
.ref-severity.low { background: #d1fae5; color: #065f46; }

.vuln-ref-card h4 { margin: 8px 0; font-size: 0.9rem; }
.vuln-ref-card p { font-size: 0.8rem; color: #6b7280; }
</style>
