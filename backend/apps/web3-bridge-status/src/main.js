const express = require('express');
const { BridgeStatusService } = require('./bridge-status.service');

const app = express();
const PORT = 3032;

const bridgeService = new BridgeStatusService();

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Routes

// Get all bridge status
app.get('/api/web3/bridge-status', async (req, res) => {
  try {
    const status = await bridgeService.getAllBridgeStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get specific bridge status
app.get('/api/web3/bridge-status/:bridge', async (req, res) => {
  try {
    const { bridge } = req.params;
    const status = await bridgeService.getBridgeStatus(bridge);
    if (!status) {
      return res.status(404).json({ success: false, error: 'Bridge not found' });
    }
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get bridge chains
app.get('/api/web3/bridge-status/:bridge/chains', async (req, res) => {
  try {
    const { bridge } = req.params;
    const chains = await bridgeService.getBridgeChains(bridge);
    res.json({ success: true, data: chains });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get recommended bridges
app.get('/api/web3/bridge-status/recommend/route', async (req, res) => {
  try {
    const { from, to, amount } = req.query;
    if (!from || !to) {
      return res.status(400).json({ success: false, error: 'from and to query params required' });
    }
    const recommendations = await bridgeService.getRecommendedBridges(
      from,
      to,
      amount ? parseFloat(amount) : undefined,
    );
    res.json({ success: true, data: recommendations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get bridge stats
app.get('/api/web3/bridge-status/stats/overview', async (req, res) => {
  try {
    const stats = await bridgeService.getBridgeStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get bridge history
app.get('/api/web3/bridge-status/:bridge/history', async (req, res) => {
  try {
    const { bridge } = req.params;
    const { days } = req.query;
    const history = await bridgeService.getBridgeHistory(
      bridge,
      days ? parseInt(days) : 7,
    );
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get current volume
app.get('/api/web3/bridge-status/volume/current', async (req, res) => {
  try {
    const volume = await bridgeService.getCurrentVolume();
    res.json({ success: true, data: volume });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get chain connectivity
app.get('/api/web3/bridge-status/chains/connectivity', async (req, res) => {
  try {
    const connectivity = await bridgeService.getChainConnectivity();
    res.json({ success: true, data: connectivity });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
🌉 Cross-Chain Bridge Status API running on port ${PORT}
   - GET /api/web3/bridge-status - All bridge status
   - GET /api/web3/bridge-status/:bridge - Specific bridge
   - GET /api/web3/bridge-status/:bridge/chains - Supported chains
   - GET /api/web3/bridge-status/recommend/route?from=ethereum&to=arbitrum - Recommendations
   - GET /api/web3/bridge-status/stats/overview - Statistics
   - GET /api/web3/bridge-status/:bridge/history?days=7 - History
   - GET /api/web3/bridge-status/volume/current - Current volume
   - GET /api/web3/bridge-status/chains/connectivity - Chain connectivity
  `);
});
