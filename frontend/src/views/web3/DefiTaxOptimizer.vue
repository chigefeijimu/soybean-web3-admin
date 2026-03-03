<template>
  <div class="defi-tax-optimizer">
    <div class="header">
      <h2>🧾 DeFi Tax Optimizer</h2>
      <div class="header-actions">
        <select v-model="selectedChain" class="chain-select">
          <option value="">All Chains</option>
          <option value="ethereum">Ethereum</option>
          <option value="polygon">Polygon</option>
          <option value="arbitrum">Arbitrum</option>
          <option value="optimism">Optimism</option>
          <option value="bsc">BSC</option>
          <option value="base">Base</option>
          <option value="avalanche">Avalanche</option>
        </select>
        <input 
          v-model="walletAddress" 
          placeholder="Enter wallet address..." 
          class="address-input"
          @keyup.enter="analyzeAddress"
        />
        <button @click="analyzeAddress" :disabled="loading" class="btn-primary">
          {{ loading ? 'Analyzing...' : 'Analyze' }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Analyzing DeFi tax position...</p>
    </div>

    <div v-else-if="analysisResult" class="analysis-content">
      <!-- Summary Cards -->
      <div class="summary-grid">
        <div class="summary-card tvl">
          <div class="card-icon">💵</div>
          <div class="card-content">
            <span class="card-label">Total Value Locked</span>
            <span class="card-value">${{ formatNumber(analysisResult.totalValueLocked) }}</span>
            <span class="card-sub">Across {{ analysisResult.chainBreakdown.length }} chains</span>
          </div>
        </div>

        <div class="summary-card gains">
          <div class="card-icon">📈</div>
          <div class="card-content">
            <span class="card-label">Unrealized Gains</span>
            <span class="card-value positive">${{ formatNumber(analysisResult.totalUnrealizedGains) }}</span>
            <span class="card-sub">Long-term + Short-term</span>
          </div>
        </div>

        <div class="summary-card losses">
          <div class="card-icon">📉</div>
          <div class="card-content">
            <span class="card-label">Unrealized Losses</span>
            <span class="card-value negative">${{ formatNumber(analysisResult.totalUnrealizedLosses) }}</span>
            <span class="card-sub">Harvest opportunity</span>
          </div>
        </div>

        <div class="summary-card net">
          <div class="card-icon">💹</div>
          <div class="card-content">
            <span class="card-label">Net Unrealized</span>
            <span class="card-value" :class="analysisResult.netUnrealized >= 0 ? 'positive' : 'negative'">
              {{ analysisResult.netUnrealized >= 0 ? '+' : '' }}${{ formatNumber(analysisResult.netUnrealized) }}
            </span>
            <span class="card-sub">Realized YTD: ${{ formatNumber(analysisResult.netRealizedYTD) }}</span>
          </div>
        </div>
      </div>

      <!-- Tax Liability -->
      <div class="section tax-liability">
        <h3>💰 Estimated Tax Liability</h3>
        <div class="liability-grid">
          <div class="liability-card">
            <span class="liability-label">Short-term Gains</span>
            <span class="liability-value">${{ formatNumber(taxLiability.shortTermGains) }}</span>
            <span class="liability-rate">@ 35% = ${{ formatNumber(taxLiability.shortTermGains * 0.35) }}</span>
          </div>
          <div class="liability-card">
            <span class="liability-label">Long-term Gains</span>
            <span class="liability-value">${{ formatNumber(taxLiability.longTermGains) }}</span>
            <span class="liability-rate">@ 20% = ${{ formatNumber(taxLiability.longTermGains * 0.2) }}</span>
          </div>
          <div class="liability-card">
            <span class="liability-label">Short-term Losses</span>
            <span class="liability-value negative">-${{ formatNumber(taxLiability.shortTermLosses) }}</span>
            <span class="liability-rate">Offset gains</span>
          </div>
          <div class="liability-card">
            <span class="liability-label">Long-term Losses</span>
            <span class="liability-value negative">-${{ formatNumber(taxLiability.longTermLosses) }}</span>
            <span class="liability-rate">Offset gains</span>
          </div>
          <div class="liability-card total">
            <span class="liability-label">Net Gain/Loss</span>
            <span class="liability-value" :class="taxLiability.netGainLoss >= 0 ? 'positive' : 'negative'">
              ${{ formatNumber(taxLiability.netGainLoss) }}
            </span>
          </div>
          <div class="liability-card estimated">
            <span class="liability-label">Estimated Tax</span>
            <span class="liability-value">${{ formatNumber(taxLiability.estimatedTax) }}</span>
            <span class="liability-rate">Effective rate: {{ taxLiability.effectiveTaxRate.toFixed(1) }}%</span>
          </div>
        </div>
      </div>

      <!-- Optimization Opportunities -->
      <div class="section optimization">
        <h3>🎯 Tax Optimization Opportunities</h3>
        <div class="opportunities-list">
          <div 
            v-for="opp in analysisResult.optimizationOpportunities" 
            :key="opp.id" 
            class="opportunity-card"
            :class="opp.type"
          >
            <div class="opp-header">
              <span class="opp-type">{{ formatOpportunityType(opp.type) }}</span>
              <span class="opp-risk" :class="opp.risk">{{ opp.risk.toUpperCase() }} RISK</span>
            </div>
            <p class="opp-description">{{ opp.description }}</p>
            <div class="opp-footer">
              <span v-if="opp.potentialSavings > 0" class="opp-savings">
                Potential Savings: <strong>${{ formatNumber(opp.potentialSavings) }}</strong>
              </span>
              <span v-if="opp.deadline" class="opp-deadline">
                Deadline: {{ opp.deadline }}
              </span>
              <span class="opp-confidence">Confidence: {{ (opp.confidence * 100).toFixed(0) }}%</span>
            </div>
            <div class="opp-action">
              <strong>Action:</strong> {{ opp.action }}
            </div>
          </div>
        </div>
        <div class="total-savings">
          <span>Total Potential Tax Savings: </span>
          <strong>${{ formatNumber(totalPotentialSavings) }}</strong>
        </div>
      </div>

      <!-- Chain Breakdown -->
      <div class="section chain-breakdown">
        <h3>⛓️ Chain Breakdown</h3>
        <div class="chain-grid">
          <div v-for="chain in analysisResult.chainBreakdown" :key="chain.chain" class="chain-card">
            <div class="chain-header">
              <span class="chain-name">{{ formatChainName(chain.chain) }}</span>
            </div>
            <div class="chain-stats">
              <div class="chain-stat">
                <span class="stat-label">Value</span>
                <span class="stat-value">${{ formatNumber(chain.value) }}</span>
              </div>
              <div class="chain-stat gains">
                <span class="stat-label">Gains</span>
                <span class="stat-value positive">+${{ formatNumber(chain.gains) }}</span>
              </div>
              <div class="chain-stat losses">
                <span class="stat-label">Losses</span>
                <span class="stat-value negative">-${{ formatNumber(chain.losses) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Protocol Breakdown -->
      <div class="section protocol-breakdown">
        <h3>🔗 Protocol Breakdown</h3>
        <div class="protocol-table">
          <table>
            <thead>
              <tr>
                <th>Protocol</th>
                <th>Value</th>
                <th>P&L</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="proto in analysisResult.protocolBreakdown" :key="proto.protocol">
                <td>{{ proto.protocol }}</td>
                <td>${{ formatNumber(proto.value) }}</td>
                <td :class="proto.pnl >= 0 ? 'positive' : 'negative'">
                  {{ proto.pnl >= 0 ? '+' : '' }}${{ formatNumber(proto.pnl) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tax Lots -->
      <div class="section tax-lots">
        <h3>📋 Tax Lots</h3>
        <div class="lots-table">
          <table>
            <thead>
              <tr>
                <th>Token</th>
                <th>Chain</th>
                <th>Amount</th>
                <th>Cost Basis</th>
                <th>Current Value</th>
                <th>Unrealized P&L</th>
                <th>Holding Period</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="lot in analysisResult.taxLots" :key="lot.token + lot.chain">
                <td>{{ lot.token }}</td>
                <td>{{ formatChainName(lot.chain) }}</td>
                <td>{{ lot.amount.toFixed(4) }}</td>
                <td>${{ formatNumber(lot.costBasis) }}</td>
                <td>${{ formatNumber(lot.currentValue) }}</td>
                <td :class="lot.unrealizedGain >= 0 ? 'positive' : 'negative'">
                  {{ lot.unrealizedGain >= 0 ? '+' : '' }}${{ formatNumber(lot.unrealizedGain) }}
                </td>
                <td>
                  <span class="holding-badge" :class="lot.holdingPeriod">
                    {{ lot.holdingPeriod.toUpperCase() }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Risk Assessment -->
      <div class="section risk-assessment">
        <h3>⚠️ Risk Assessment</h3>
        <div class="risk-grid">
          <div class="risk-item">
            <span class="risk-label">Wash Sale Risk</span>
            <span class="risk-value" :class="analysisResult.riskAssessment.washSaleRisk ? 'high' : 'low'">
              {{ analysisResult.riskAssessment.washSaleRisk ? '⚠️ YES' : '✅ No' }}
            </span>
          </div>
          <div class="risk-item">
            <span class="risk-label">Short-term Concentration</span>
            <div class="risk-bar">
              <div 
                class="bar-fill" 
                :style="{ width: analysisResult.riskAssessment.shortTermConcentration + '%' }"
                :class="analysisResult.riskAssessment.shortTermConcentration > 60 ? 'high' : 'low'"
              ></div>
            </div>
            <span class="risk-value">{{ analysisResult.riskAssessment.shortTermConcentration.toFixed(0) }}%</span>
          </div>
          <div class="risk-item">
            <span class="risk-label">Tax Loss Harvesting Potential</span>
            <div class="risk-bar">
              <div 
                class="bar-fill" 
                :style="{ width: analysisResult.riskAssessment.taxLossHarvestingPotential + '%' }"
                :class="analysisResult.riskAssessment.taxLossHarvestingPotential > 50 ? 'high' : 'low'"
              ></div>
            </div>
            <span class="risk-value">{{ analysisResult.riskAssessment.taxLossHarvestingPotential.toFixed(0) }}%</span>
          </div>
          <div class="risk-item">
            <span class="risk-label">Complexity</span>
            <span class="risk-value" :class="analysisResult.riskAssessment.complexity">
              {{ analysisResult.riskAssessment.complexity.toUpperCase() }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <div class="empty-icon">🧾</div>
      <h3>DeFi Tax Optimizer</h3>
      <p>Enter a wallet address to analyze your DeFi tax position and discover optimization opportunities.</p>
      <div class="features-list">
        <div class="feature">📊 Track unrealized gains/losses</div>
        <div class="feature">🎯 Identify tax loss harvesting opportunities</div>
        <div class="feature">💰 Calculate estimated tax liability</div>
        <div class="feature">⚠️ Assess wash sale and compliance risks</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const walletAddress = ref('')
const selectedChain = ref('')
const loading = ref(false)
const analysisResult = ref<any>(null)

const mockAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0fE5b'

const taxLiability = ref({
  shortTermGains: 12500,
  longTermGains: 8200,
  shortTermLosses: 3200,
  longTermLosses: 1500,
  netGainLoss: 16000,
  estimatedTax: 5755,
  effectiveTaxRate: 35.97
})

const totalPotentialSavings = computed(() => {
  if (!analysisResult.value) return 0
  return analysisResult.value.optimizationOpportunities
    .filter((o: any) => o.type !== 'wash_sale_risk')
    .reduce((sum: number, o: any) => sum + o.potentialSavings, 0)
})

const formatNumber = (num: number) => {
  return num?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'
}

const formatChainName = (chain: string) => {
  const names: Record<string, string> = {
    ethereum: 'Ethereum',
    polygon: 'Polygon',
    arbitrum: 'Arbitrum',
    optimism: 'Optimism',
    bsc: 'BSC',
    base: 'Base',
    avalanche: 'Avalanche',
    solana: 'Solana'
  }
  return names[chain] || chain
}

const formatOpportunityType = (type: string) => {
  const types: Record<string, string> = {
    harvest_loss: '🔻 Tax Loss Harvest',
    defer_gain: '⏰ Gain Deferral',
    rebalance: '⚖️ Portfolio Rebalance',
    wash_sale_risk: '⚠️ Wash Sale Risk',
    cost_basis_adjustment: '📝 Cost Basis Optimization'
  }
  return types[type] || type
}

const generateMockAnalysis = (address: string) => {
  const chains = ['ethereum', 'polygon', 'arbitrum', 'optimism', 'bsc']
  const protocols = ['Uniswap', 'Aave', 'Compound', 'Curve', 'SushiSwap', 'Lido', 'Yearn', 'GMX']
  const tokens = ['ETH', 'WBTC', 'USDC', 'UNI', 'AAVE', 'CRV', 'LDO', 'MKR']

  const chainBreakdown = chains.map(chain => ({
    chain,
    value: Math.random() * 50000 + 5000,
    gains: Math.random() * 10000,
    losses: Math.random() * 3000
  }))

  const protocolBreakdown = protocols.map(protocol => ({
    protocol,
    value: Math.random() * 30000 + 2000,
    pnl: Math.random() * 5000 - 1000
  }))

  const totalValue = chainBreakdown.reduce((sum, c) => sum + c.value, 0)
  const totalGains = chainBreakdown.reduce((sum, c) => sum + c.gains, 0)
  const totalLosses = chainBreakdown.reduce((sum, c) => sum + c.losses, 0)

  const taxLots = tokens.slice(0, 5).map(token => ({
    token,
    chain: chains[Math.floor(Math.random() * 4)],
    amount: Math.random() * 10 + 0.5,
    costBasis: Math.random() * 20000 + 1000,
    currentValue: Math.random() * 25000 + 1500,
    unrealizedGain: Math.random() * 5000 - 1000,
    holdingPeriod: Math.random() > 0.5 ? 'long' : 'short'
  }))

  const optimizationOpportunities = [
    {
      id: '1',
      type: 'harvest_loss',
      description: 'Unrealized loss in ETH liquidity position on Arbitrum',
      potentialSavings: Math.random() * 2000 + 500,
      risk: 'low',
      action: 'Consider harvesting this loss before year-end to offset realized gains',
      deadline: '2026-12-31',
      confidence: 0.85
    },
    {
      id: '2',
      type: 'defer_gain',
      description: 'Large unrealized gain in staked ETH position',
      potentialSavings: Math.random() * 1500 + 300,
      risk: 'low',
      action: 'Consider holding position until long-term capital gains treatment applies',
      deadline: '2026-08-15',
      confidence: 0.9
    },
    {
      id: '3',
      type: 'rebalance',
      description: 'Portfolio concentration in short-term gains (>60%)',
      potentialSavings: Math.random() * 1000 + 200,
      risk: 'medium',
      action: 'Rebalance to include more long-term positions to reduce tax burden',
      confidence: 0.75
    },
    {
      id: '4',
      type: 'wash_sale_risk',
      description: 'Recent loss harvest in similar position - potential wash sale',
      potentialSavings: 0,
      risk: 'high',
      action: 'Wait 30+ days before repurchasing same or substantially identical assets',
      confidence: 0.95
    },
    {
      id: '5',
      type: 'cost_basis_adjustment',
      description: 'Multiple small tax lots for UNI token can be consolidated',
      potentialSavings: Math.random() * 800 + 100,
      risk: 'low',
      action: 'Use specific identification method to optimize which lots to sell',
      confidence: 0.8
    }
  ]

  return {
    address,
    totalValueLocked: totalValue,
    totalUnrealizedGains: totalGains,
    totalUnrealizedLosses: totalLosses,
    netUnrealized: totalGains - totalLosses,
    realizedGainsYTD: Math.random() * 20000 + 5000,
    realizedLossesYTD: Math.random() * 8000 + 1000,
    netRealizedYTD: 0,
    pendingTaxableEvents: Math.floor(Math.random() * 10) + 1,
    taxLots,
    optimizationOpportunities,
    chainBreakdown,
    protocolBreakdown,
    riskAssessment: {
      washSaleRisk: Math.random() > 0.7,
      shortTermConcentration: Math.random() * 100,
      taxLossHarvestingPotential: Math.random() * 100,
      complexity: Math.random() > 0.6 ? 'high' : Math.random() > 0.3 ? 'medium' : 'low'
    }
  }
}

const analyzeAddress = async () => {
  const address = walletAddress.value.trim() || mockAddress
  loading.value = true
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  analysisResult.value = generateMockAnalysis(address)
  
  // Update tax liability based on analysis
  taxLiability.value = {
    shortTermGains: analysisResult.value.realizedGainsYTD * 0.6,
    longTermGains: analysisResult.value.realizedGainsYTD * 0.4,
    shortTermLosses: analysisResult.value.realizedLossesYTD * 0.7,
    longTermLosses: analysisResult.value.realizedLossesYTD * 0.3,
    netGainLoss: (analysisResult.value.realizedGainsYTD - analysisResult.value.realizedLossesYTD),
    estimatedTax: (analysisResult.value.realizedGainsYTD - analysisResult.value.realizedLossesYTD) * 0.35,
    effectiveTaxRate: 35
  }
  analysisResult.value.netRealizedYTD = taxLiability.value.netGainLoss
  
  loading.value = false
}

// Auto-analyze on mount with mock address
analyzeAddress()
</script>

<style scoped>
.defi-tax-optimizer {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.header h2 {
  margin: 0;
  font-size: 24px;
  color: #1a1a2e;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.chain-select {
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: white;
  font-size: 14px;
}

.address-input {
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  width: 300px;
  font-size: 14px;
}

.btn-primary {
  padding: 8px 20px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #4338ca;
}

.btn-primary:disabled {
  background: #a5a5a5;
  cursor: not-allowed;
}

.loading-state, .empty-state {
  text-align: center;
  padding: 60px 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #4f46e5;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-state h3 {
  margin: 0 0 8px;
  color: #1a1a2e;
}

.empty-state p {
  color: #666;
  margin-bottom: 24px;
}

.features-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
}

.feature {
  background: #f5f5f5;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  color: #444;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.summary-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.card-icon {
  font-size: 32px;
}

.card-content {
  display: flex;
  flex-direction: column;
}

.card-label {
  font-size: 12px;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.card-value {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a2e;
}

.card-value.positive {
  color: #10b981;
}

.card-value.negative {
  color: #ef4444;
}

.card-change, .card-sub {
  font-size: 12px;
  color: #666;
}

.card-change.positive {
  color: #10b981;
}

.card-change.negative {
  color: #ef4444;
}

.section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.section h3 {
  margin: 0 0 20px;
  font-size: 18px;
  color: #1a1a2e;
}

.liability-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.liability-card {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  text-align: center;
}

.liability-card.total {
  background: #e8f5e9;
}

.liability-card.estimated {
  background: #fff3e0;
}

.liability-label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.liability-value {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: #1a1a2e;
}

.liability-value.positive {
  color: #10b981;
}

.liability-value.negative {
  color: #ef4444;
}

.liability-rate {
  display: block;
  font-size: 11px;
  color: #888;
  margin-top: 4px;
}

.opportunities-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.opportunity-card {
  background: #f8f9fa;
  border-left: 4px solid #4f46e5;
  padding: 16px;
  border-radius: 8px;
}

.opportunity-card.harvest_loss {
  border-left-color: #10b981;
}

.opportunity-card.defer_gain {
  border-left-color: #3b82f6;
}

.opportunity-card.wash_sale_risk {
  border-left-color: #ef4444;
  background: #fef2f2;
}

.opp-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.opp-type {
  font-weight: 600;
  color: #1a1a2e;
}

.opp-risk {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
}

.opp-risk.low {
  background: #d1fae5;
  color: #065f46;
}

.opp-risk.medium {
  background: #fef3c7;
  color: #92400e;
}

.opp-risk.high {
  background: #fee2e2;
  color: #991b1b;
}

.opp-description {
  color: #444;
  margin: 8px 0;
}

.opp-footer {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}

.opp-savings {
  color: #10b981;
  font-weight: 600;
}

.opp-confidence {
  color: #888;
}

.opp-action {
  font-size: 13px;
  color: #444;
  background: white;
  padding: 8px;
  border-radius: 4px;
}

.total-savings {
  margin-top: 16px;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px;
  text-align: center;
  font-size: 16px;
}

.total-savings strong {
  font-size: 24px;
}

.chain-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.chain-card {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
}

.chain-header {
  margin-bottom: 12px;
}

.chain-name {
  font-weight: 600;
  color: #1a1a2e;
}

.chain-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chain-stat {
  display: flex;
  justify-content: space-between;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

.stat-value {
  font-weight: 600;
}

.stat-value.positive {
  color: #10b981;
}

.stat-value.negative {
  color: #ef4444;
}

.protocol-table, .lots-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

th {
  background: #f8f9fa;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  color: #666;
}

td.positive {
  color: #10b981;
}

td.negative {
  color: #ef4444;
}

.holding-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.holding-badge.short {
  background: #fef3c7;
  color: #92400e;
}

.holding-badge.long {
  background: #d1fae5;
  color: #065f46;
}

.risk-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.risk-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.risk-label {
  font-size: 13px;
  color: #666;
}

.risk-value {
  font-weight: 600;
  font-size: 14px;
}

.risk-value.low {
  color: #10b981;
}

.risk-value.medium {
  color: #f59e0b;
}

.risk-value.high {
  color: #ef4444;
}

.risk-bar {
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.risk-bar .bar-fill {
  height: 100%;
  background: #4f46e5;
  border-radius: 4px;
  transition: width 0.3s;
}

.risk-bar .bar-fill.high {
  background: #ef4444;
}

.risk-bar .bar-fill.low {
  background: #10b981;
}
</style>
