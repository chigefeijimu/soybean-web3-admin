import http from 'http';
import { URL } from 'url';

const service = {
  generateMockSnapshots(timeRange: string, startValue: number) {
    const now = Date.now();
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    const snapshots = [];
    let currentValue = startValue;

    for (let i = days; i >= 0; i--) {
      const timestamp = now - i * 24 * 60 * 60 * 1000;
      const dailyChange = (Math.random() - 0.48) * 0.08;
      currentValue = currentValue * (1 + dailyChange);
      const prevValue = snapshots.length > 0 ? snapshots[snapshots.length - 1].balanceUsd : currentValue;
      const change24h = currentValue - prevValue;
      const changePercent24h = prevValue > 0 ? (change24h / prevValue) * 100 : 0;

      snapshots.push({
        timestamp,
        date: new Date(timestamp).toISOString().split('T')[0],
        balance: currentValue.toString(),
        balanceUsd: Math.round(currentValue * 100) / 100,
        change24h: Math.round(change24h * 100) / 100,
        changePercent24h: Math.round(changePercent24h * 100) / 100,
      });
    }
    return snapshots;
  },

  async getDashboard(address: string, chains?: string[]) {
    const chainList = chains && chains.length > 0 ? chains : ['1', '137', '42161', '10', '56', '8453', '43114'];
    const snapshots = this.generateMockSnapshots('30d', 60000);
    const latestValue = snapshots[snapshots.length - 1]?.balanceUsd || 60000;
    const prevValue = snapshots[snapshots.length - 2]?.balanceUsd || latestValue;
    const change24h = latestValue - prevValue;
    const changePercent24h = prevValue > 0 ? (change24h / prevValue) * 100 : 0;

    const chainDistribution = chainList.map(chainId => ({
      chainId,
      value: Math.round(Math.random() * 20000),
      percent: 0,
    }));

    const totalChainValue = chainDistribution.reduce((sum, c) => sum + c.value, 0);
    chainDistribution.forEach(c => {
      c.percent = Math.round((c.value / totalChainValue) * 100);
    });

    const tokenDistribution = [
      { token: 'ETH', value: Math.round(Math.random() * 15000), percent: 0 },
      { token: 'USDC', value: Math.round(Math.random() * 10000), percent: 0 },
      { token: 'WBTC', value: Math.round(Math.random() * 8000), percent: 0 },
      { token: 'USDT', value: Math.round(Math.random() * 7000), percent: 0 },
      { token: 'AAVE', value: Math.round(Math.random() * 5000), percent: 0 },
      { token: 'UNI', value: Math.round(Math.random() * 4000), percent: 0 },
    ];

    const totalTokenValue = tokenDistribution.reduce((sum, t) => sum + t.value, 0);
    tokenDistribution.forEach(t => {
      t.percent = Math.round((t.value / totalTokenValue) * 100);
    });

    const changes = [];
    for (let i = 0; i < 5; i++) {
      const changePercent = (Math.random() - 0.3) * 50;
      const previousBalance = (Math.random() * 50 + 10).toFixed(4);
      const currentBalance = (parseFloat(previousBalance) * (1 + changePercent / 100)).toFixed(4);
      changes.push({
        tokenAddress: `0x${Math.random().toString(16).slice(2, 42)}`,
        symbol: ['ETH', 'USDC', 'WBTC', 'AAVE', 'UNI'][Math.floor(Math.random() * 5)],
        chainId: chainList[Math.floor(Math.random() * chainList.length)],
        previousBalance,
        currentBalance,
        changePercent: Math.round(changePercent * 100) / 100,
        changeUsd: Math.round((parseFloat(currentBalance) - parseFloat(previousBalance)) * 100),
        timestamp: Date.now() - i * 3600000,
      });
    }

    return {
      summary: {
        totalValue: latestValue,
        change24h: Math.round(change24h * 100) / 100,
        changePercent24h: Math.round(changePercent24h * 100) / 100,
        topChain: chainDistribution.sort((a, b) => b.value - a.value)[0]?.chainId || '1',
        topToken: tokenDistribution.sort((a, b) => b.value - a.value)[0]?.token || 'ETH',
      },
      portfolioSnapshots: snapshots,
      balanceChanges: changes,
      chainDistribution,
      tokenDistribution,
    };
  },

  async getPortfolioSnapshots(address: string, chains?: string[], timeRange: string = '30d') {
    const chainList = chains && chains.length > 0 ? chains : ['1', '137', '42161'];
    const snapshots = this.generateMockSnapshots(timeRange, 75000);
    return {
      address,
      chains: chainList,
      timeRange,
      snapshots,
      totalValue: snapshots[snapshots.length - 1]?.balanceUsd || 0,
      highValue: Math.max(...snapshots.map(s => s.balanceUsd)),
      lowValue: Math.min(...snapshots.map(s => s.balanceUsd)),
      avgValue: snapshots.reduce((sum, s) => sum + s.balanceUsd, 0) / snapshots.length,
    };
  }
};

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname;
    const params = Object.fromEntries(url.searchParams);

    if (path === '/api/token-balance-history/dashboard') {
      const chainList = params.chains ? params.chains.split(',') : undefined;
      const data = await service.getDashboard(params.address, chainList);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
      return;
    }

    if (path === '/api/token-balance-history/portfolio-snapshots') {
      const chainList = params.chains ? params.chains.split(',') : undefined;
      const data = await service.getPortfolioSnapshots(params.address, chainList, params.timeRange || '30d');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
      return;
    }

    if (path === '/api/token-balance-history/balance') {
      const snapshots = service.generateMockSnapshots(params.timeRange || '30d', 50000);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        address: params.address,
        timeRange: params.timeRange || '30d',
        snapshots,
        lastUpdated: new Date().toISOString(),
      }));
      return;
    }

    if (path === '/api/token-balance-history/statistics') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        address: params.address,
        statistics: {
          totalBalanceUsd: Math.round(Math.random() * 100000 + 10000),
          totalTokens: Math.floor(Math.random() * 15) + 5,
          chains: ['1', '137', '42161'],
          avgHoldingDuration: Math.floor(Math.random() * 180) + 30,
        }
      }));
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  } catch (e: any) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: e.message }));
  }
});

const PORT = process.env.PORT || 3035;
server.listen(PORT, () => {
  console.log(`Token Balance History service running on port ${PORT}`);
});
