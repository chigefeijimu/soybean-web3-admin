import express from 'express';
import axios from 'axios';

interface Trade {
  type: 'buy' | 'sell';
  price: number;
  amount: number;
  timestamp: number;
  value: number;
}

interface BacktestResult {
  strategy: string;
  symbol: string;
  period: { start: string; end: string };
  initialCapital: number;
  finalCapital: number;
  totalReturn: number;
  totalReturnPercent: number;
  maxDrawdown: number;
  winRate: number;
  totalTrades: number;
  profitableTrades: number;
  losingTrades: number;
  avgProfit: number;
  avgLoss: number;
  profitFactor: number;
  sharpeRatio: number;
  trades: Trade[];
  equityCurve: { timestamp: number; value: number }[];
}

// Generate realistic price data with trends
function generatePriceData(days: number, trend: 'bull' | 'bear' | 'sideways' | 'volatile'): number[] {
  const prices: number[] = [];
  let price = 100 + Math.random() * 100;
  
  for (let i = 0; i < days * 24; i++) {
    let change = (Math.random() - 0.5) * 2;
    
    if (trend === 'bull') change += 0.05;
    else if (trend === 'bear') change -= 0.05;
    else if (trend === 'volatile') change *= 2;
    
    price = price * (1 + change / 100);
    prices.push(Math.max(price, 1));
  }
  
  return prices;
}

// Grid Trading Strategy
function gridTrading(prices: number[], config: { gridLevels: number; investmentPerGrid: number }): BacktestResult {
  const trades: Trade[] = [];
  const gridLevels = config.gridLevels || 10;
  const investmentPerGrid = config.investmentPerGrid || 100;
  
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const gridSize = (maxPrice - minPrice) / gridLevels;
  
  const grids: { price: number; filled: 'buy' | 'sell' | null }[] = [];
  for (let i = 0; i < gridLevels; i++) {
    grids.push({ price: minPrice + i * gridSize, filled: null });
  }
  
  let capital = 10000;
  let holdings = 0;
  const equityCurve: { timestamp: number; value: number }[] = [];
  
  for (let i = 0; i < prices.length; i++) {
    const price = prices[i];
    
    for (const grid of grids) {
      if (grid.filled === null) {
        if (price <= grid.price) {
          const amount = investmentPerGrid / price;
          holdings += amount;
          capital -= investmentPerGrid;
          trades.push({ type: 'buy', price, amount, timestamp: i, value: investmentPerGrid });
          grid.filled = 'buy';
        }
      } else if (grid.filled === 'buy') {
        if (price >= grid.price * 1.02) {
          const value = holdings * (grid.price * 1.02) / price;
          capital += value;
          trades.push({ type: 'sell', price: price * 1.02, amount: holdings, timestamp: i, value });
          holdings = 0;
          grid.filled = 'sell';
        }
      }
    }
    
    const equity = capital + holdings * price;
    equityCurve.push({ timestamp: i, value: equity });
  }
  
  const finalCapital = capital + holdings * prices[prices.length - 1];
  return calculateMetrics('Grid Trading', 'ETH/USDT', prices, trades, 10000, finalCapital, equityCurve);
}

// DCA Strategy
function dcaStrategy(prices: number[], config: { amount: number; interval: number }): BacktestResult {
  const amount = config.amount || 100;
  const interval = config.interval || 24;
  
  const trades: Trade[] = [];
  let capital = 10000;
  let holdings = 0;
  const equityCurve: { timestamp: number; value: number }[] = [];
  
  for (let i = 0; i < prices.length; i++) {
    if (i % interval === 0 && capital >= amount) {
      const buyAmount = Math.min(amount, capital);
      const tokenAmount = buyAmount / prices[i];
      holdings += tokenAmount;
      capital -= buyAmount;
      trades.push({ type: 'buy', price: prices[i], amount: tokenAmount, timestamp: i, value: buyAmount });
    }
    
    const equity = capital + holdings * prices[i];
    equityCurve.push({ timestamp: i, value: equity });
  }
  
  const finalCapital = capital + holdings * prices[prices.length - 1];
  return calculateMetrics('DCA', 'ETH/USDT', prices, trades, 10000, finalCapital, equityCurve);
}

// Momentum Strategy
function momentumStrategy(prices: number[], config: { lookback: number; threshold: number }): BacktestResult {
  const lookback = config.lookback || 20;
  const threshold = config.threshold || 0.05;
  
  const trades: Trade[] = [];
  let capital = 10000;
  let holdings = 0;
  let position = false;
  const equityCurve: { timestamp: number; value: number }[] = [];
  
  for (let i = lookback; i < prices.length; i++) {
    const recentPrices = prices.slice(i - lookback, i);
    const momentum = (prices[i] - recentPrices[0]) / recentPrices[0];
    
    if (!position && momentum > threshold) {
      const value = capital * 0.95;
      const amount = value / prices[i];
      holdings = amount;
      capital -= value;
      trades.push({ type: 'buy', price: prices[i], amount, timestamp: i, value });
      position = true;
    } else if (position && momentum < -threshold) {
      const value = holdings * prices[i];
      trades.push({ type: 'sell', price: prices[i], amount: holdings, timestamp: i, value });
      capital += value;
      holdings = 0;
      position = false;
    }
    
    const equity = capital + holdings * prices[i];
    equityCurve.push({ timestamp: i, value: equity });
  }
  
  if (holdings > 0) {
    const value = holdings * prices[prices.length - 1];
    trades.push({ type: 'sell', price: prices[prices.length - 1], amount: holdings, timestamp: prices.length - 1, value });
    capital += value;
    holdings = 0;
  }
  
  const finalCapital = capital;
  return calculateMetrics('Momentum', 'ETH/USDT', prices, trades, 10000, finalCapital, equityCurve);
}

// Mean Reversion Strategy
function meanReversion(prices: number[], config: { window: number; stdDev: number }): BacktestResult {
  const window = config.window || 20;
  const stdDev = config.stdDev || 2;
  
  const trades: Trade[] = [];
  let capital = 10000;
  let holdings = 0;
  let position = false;
  const equityCurve: { timestamp: number; value: number }[] = [];
  
  for (let i = window; i < prices.length; i++) {
    const windowPrices = prices.slice(i - window, i);
    const mean = windowPrices.reduce((a, b) => a + b, 0) / window;
    const variance = windowPrices.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / window;
    const std = Math.sqrt(variance);
    
    const zScore = (prices[i] - mean) / std;
    
    if (!position && zScore < -stdDev) {
      const value = capital * 0.95;
      const amount = value / prices[i];
      holdings = amount;
      capital -= value;
      trades.push({ type: 'buy', price: prices[i], amount, timestamp: i, value });
      position = true;
    } else if (position && zScore > stdDev) {
      const value = holdings * prices[i];
      trades.push({ type: 'sell', price: prices[i], amount: holdings, timestamp: i, value });
      capital += value;
      holdings = 0;
      position = false;
    }
    
    const equity = capital + holdings * prices[i];
    equityCurve.push({ timestamp: i, value: equity });
  }
  
  if (holdings > 0) {
    const value = holdings * prices[prices.length - 1];
    trades.push({ type: 'sell', price: prices[prices.length - 1], amount: holdings, timestamp: prices.length - 1, value });
    capital += value;
  }
  
  const finalCapital = capital;
  return calculateMetrics('Mean Reversion', 'ETH/USDT', prices, trades, 10000, finalCapital, equityCurve);
}

// RSI Strategy
function rsiStrategy(prices: number[], config: { period: number; oversold: number; overbought: number }): BacktestResult {
  const period = config.period || 14;
  const oversold = config.oversold || 30;
  const overbought = config.overbought || 70;
  
  const trades: Trade[] = [];
  let capital = 10000;
  let holdings = 0;
  let position = false;
  const equityCurve: { timestamp: number; value: number }[] = [];
  
  const rsiValues: number[] = [];
  for (let i = period; i < prices.length; i++) {
    let gains = 0, losses = 0;
    for (let j = i - period; j < i; j++) {
      const diff = prices[j + 1] - prices[j];
      if (diff > 0) gains += diff;
      else losses -= diff;
    }
    const rs = gains / (losses || 1);
    rsiValues.push(100 - 100 / (1 + rs));
  }
  
  for (let i = 0; i < rsiValues.length; i++) {
    const rsi = rsiValues[i];
    const priceIndex = i + period;
    
    if (!position && rsi < oversold) {
      const value = capital * 0.95;
      const amount = value / prices[priceIndex];
      holdings = amount;
      capital -= value;
      trades.push({ type: 'buy', price: prices[priceIndex], amount, timestamp: priceIndex, value });
      position = true;
    } else if (position && rsi > overbought) {
      const value = holdings * prices[priceIndex];
      trades.push({ type: 'sell', price: prices[priceIndex], amount: holdings, timestamp: priceIndex, value });
      capital += value;
      holdings = 0;
      position = false;
    }
    
    const equity = capital + holdings * prices[priceIndex];
    equityCurve.push({ timestamp: priceIndex, value: equity });
  }
  
  if (holdings > 0) {
    const value = holdings * prices[prices.length - 1];
    trades.push({ type: 'sell', price: prices[prices.length - 1], amount: holdings, timestamp: prices.length - 1, value });
    capital += value;
  }
  
  const finalCapital = capital;
  return calculateMetrics('RSI', 'ETH/USDT', prices, trades, 10000, finalCapital, equityCurve);
}

// MACD Strategy
function macdStrategy(prices: number[], config: { fast: number; slow: number; signal: number }): BacktestResult {
  const fast = config.fast || 12;
  const slow = config.slow || 26;
  const signalPeriod = config.signal || 9;
  
  const trades: Trade[] = [];
  let capital = 10000;
  let holdings = 0;
  let position = false;
  const equityCurve: { timestamp: number; value: number }[] = [];
  
  const ema = (arr: number[], period: number) => {
    const k = 2 / (period + 1);
    const emaArr: number[] = [arr[0]];
    for (let i = 1; i < arr.length; i++) {
      emaArr.push(arr[i] * k + emaArr[i - 1] * (1 - k));
    }
    return emaArr;
  };
  
  const fastEMA = ema(prices, fast);
  const slowEMA = ema(prices, slow);
  const macdLine = fastEMA.map((v, i) => v - slowEMA[i]);
  const signalLine = ema(macdLine, signalPeriod);
  
  for (let i = signalPeriod; i < prices.length; i++) {
    const macd = macdLine[i];
    const signal = signalLine[i];
    const prevMacd = macdLine[i - 1];
    const prevSignal = signalLine[i - 1];
    
    if (!position && prevMacd < prevSignal && macd > signal) {
      const value = capital * 0.95;
      const amount = value / prices[i];
      holdings = amount;
      capital -= value;
      trades.push({ type: 'buy', price: prices[i], amount, timestamp: i, value });
      position = true;
    } else if (position && prevMacd > prevSignal && macd < signal) {
      const value = holdings * prices[i];
      trades.push({ type: 'sell', price: prices[i], amount: holdings, timestamp: i, value });
      capital += value;
      holdings = 0;
      position = false;
    }
    
    const equity = capital + holdings * prices[i];
    equityCurve.push({ timestamp: i, value: equity });
  }
  
  if (holdings > 0) {
    const value = holdings * prices[prices.length - 1];
    trades.push({ type: 'sell', price: prices[prices.length - 1], amount: holdings, timestamp: prices.length - 1, value });
    capital += value;
  }
  
  const finalCapital = capital;
  return calculateMetrics('MACD', 'ETH/USDT', prices, trades, 10000, finalCapital, equityCurve);
}

// Calculate performance metrics
function calculateMetrics(
  strategy: string,
  symbol: string,
  prices: number[],
  trades: Trade[],
  initialCapital: number,
  finalCapital: number,
  equityCurve: { timestamp: number; value: number }[]
): BacktestResult {
  const totalReturn = finalCapital - initialCapital;
  const totalReturnPercent = (totalReturn / initialCapital) * 100;
  
  let maxDrawdown = 0;
  let peak = initialCapital;
  for (const point of equityCurve) {
    if (point.value > peak) peak = point.value;
    const drawdown = (peak - point.value) / peak;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }
  maxDrawdown *= 100;
  
  let profitable = 0;
  let losing = 0;
  let totalProfit = 0;
  let totalLoss = 0;
  
  const buyTrades: Trade[] = [];
  const sellTrades: Trade[] = [];
  
  for (const trade of trades) {
    if (trade.type === 'buy') buyTrades.push(trade);
    else sellTrades.push(trade);
  }
  
  for (let i = 0; i < Math.min(buyTrades.length, sellTrades.length); i++) {
    const buyPrice = buyTrades[i].price;
    const sellPrice = sellTrades[i].price;
    const profit = (sellPrice - buyPrice) / buyPrice * 100;
    
    if (profit > 0) {
      profitable++;
      totalProfit += profit;
    } else {
      losing++;
      totalLoss += profit;
    }
  }
  
  const totalTrades = profitable + losing;
  const winRate = totalTrades > 0 ? (profitable / totalTrades) * 100 : 0;
  const avgProfit = profitable > 0 ? totalProfit / profitable : 0;
  const avgLoss = losing > 0 ? totalLoss / losing : 0;
  const profitFactor = Math.abs(totalLoss) > 0 ? totalProfit / Math.abs(totalLoss) : totalProfit > 0 ? 999 : 0;
  
  const returns: number[] = [];
  for (let i = 1; i < equityCurve.length; i++) {
    returns.push((equityCurve[i].value - equityCurve[i - 1].value) / equityCurve[i - 1].value);
  }
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const stdReturn = Math.sqrt(returns.reduce((a, b) => a + Math.pow(b - avgReturn, 2), 0) / returns.length);
  const sharpeRatio = stdReturn > 0 ? (avgReturn / stdReturn) * Math.sqrt(365) : 0;
  
  const now = new Date();
  const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  return {
    strategy,
    symbol,
    period: {
      start: startDate.toISOString().split('T')[0],
      end: now.toISOString().split('T')[0]
    },
    initialCapital,
    finalCapital,
    totalReturn,
    totalReturnPercent,
    maxDrawdown,
    winRate,
    totalTrades,
    profitableTrades: profitable,
    losingTrades: losing,
    avgProfit,
    avgLoss,
    profitFactor,
    sharpeRatio,
    trades,
    equityCurve
  };
}

// Buy and Hold baseline
function buyAndHold(prices: number[]): BacktestResult {
  const initialPrice = prices[0];
  const finalPrice = prices[prices.length - 1];
  const initialCapital = 10000;
  const finalCapital = (initialCapital / initialPrice) * finalPrice;
  
  const equityCurve = prices.map((p, i) => ({
    timestamp: i,
    value: (initialCapital / initialPrice) * p
  }));
  
  return calculateMetrics('Buy & Hold', 'ETH/USDT', prices, [], initialCapital, finalCapital, equityCurve);
}

const app = express();
app.use(express.json());

// Get available strategies
app.get('/trading-bot/strategies', (req, res) => {
  res.json({
    strategies: [
      {
        id: 'grid',
        name: 'Grid Trading',
        description: 'Place buy and sell orders at preset price levels to profit from volatility',
        params: [
          { name: 'gridLevels', type: 'number', default: 10, min: 5, max: 50, description: 'Number of grid levels' },
          { name: 'investmentPerGrid', type: 'number', default: 100, min: 10, max: 1000, description: 'Investment per grid (USD)' }
        ],
        risk: 'medium',
        bestFor: 'sideways markets'
      },
      {
        id: 'dca',
        name: 'Dollar Cost Averaging',
        description: 'Invest fixed amount at regular intervals to reduce timing risk',
        params: [
          { name: 'amount', type: 'number', default: 100, min: 10, max: 1000, description: 'Investment amount (USD)' },
          { name: 'interval', type: 'number', default: 24, min: 1, max: 168, description: 'Investment interval (hours)' }
        ],
        risk: 'low',
        bestFor: 'any market'
      },
      {
        id: 'momentum',
        name: 'Momentum Trading',
        description: 'Follow trends and buy assets with strong recent performance',
        params: [
          { name: 'lookback', type: 'number', default: 20, min: 5, max: 100, description: 'Lookback period (hours)' },
          { name: 'threshold', type: 'number', default: 0.05, min: 0.01, max: 0.2, description: 'Momentum threshold' }
        ],
        risk: 'high',
        bestFor: 'trending markets'
      },
      {
        id: 'mean-reversion',
        name: 'Mean Reversion',
        description: 'Buy oversold assets and sell overbought ones expecting price to return to average',
        params: [
          { name: 'window', type: 'number', default: 20, min: 5, max: 100, description: 'Moving average window' },
          { name: 'stdDev', type: 'number', default: 2, min: 1, max: 3, description: 'Standard deviations' }
        ],
        risk: 'medium',
        bestFor: 'volatile markets'
      },
      {
        id: 'rsi',
        name: 'RSI Strategy',
        description: 'Use Relative Strength Index to identify overbought and oversold conditions',
        params: [
          { name: 'period', type: 'number', default: 14, min: 5, max: 30, description: 'RSI period' },
          { name: 'oversold', type: 'number', default: 30, min: 10, max: 40, description: 'Oversold threshold' },
          { name: 'overbought', type: 'number', default: 70, min: 60, max: 90, description: 'Overbought threshold' }
        ],
        risk: 'medium',
        bestFor: 'range-bound markets'
      },
      {
        id: 'macd',
        name: 'MACD Strategy',
        description: 'Use Moving Average Convergence Divergence for trend signals',
        params: [
          { name: 'fast', type: 'number', default: 12, min: 5, max: 20, description: 'Fast EMA period' },
          { name: 'slow', type: 'number', default: 26, min: 15, max: 50, description: 'Slow EMA period' },
          { name: 'signal', type: 'number', default: 9, min: 5, max: 20, description: 'Signal line period' }
        ],
        risk: 'medium',
        bestFor: 'trending markets'
      }
    ]
  });
});

// Backtest endpoint
app.get('/trading-bot/backtest', (req, res) => {
  const strategy = req.query.strategy as string || 'dca';
  const symbol = req.query.symbol as string || 'ETH';
  const trend = (req.query.trend as 'bull' | 'bear' | 'sideways' | 'volatile') || 'volatile';
  const days = parseInt(req.query.days as string) || 30;
  const params = req.query.params ? JSON.parse(req.query.params as string) : {};
  
  const prices = generatePriceData(days, trend);
  
  let result: BacktestResult;
  
  switch (strategy) {
    case 'grid':
      result = gridTrading(prices, params);
      break;
    case 'dca':
      result = dcaStrategy(prices, params);
      break;
    case 'momentum':
      result = momentumStrategy(prices, params);
      break;
    case 'mean-reversion':
      result = meanReversion(prices, params);
      break;
    case 'rsi':
      result = rsiStrategy(prices, params);
      break;
    case 'macd':
      result = macdStrategy(prices, params);
      break;
    default:
      result = buyAndHold(prices);
  }
  
  const benchmark = buyAndHold(prices);
  
  res.json({
    ...result,
    benchmark: {
      strategy: 'Buy & Hold',
      totalReturn: benchmark.totalReturn,
      totalReturnPercent: benchmark.totalReturnPercent,
      maxDrawdown: benchmark.maxDrawdown
    },
    performance: {
      vsBenchmark: result.totalReturnPercent - benchmark.totalReturnPercent,
      rating: result.totalReturnPercent > benchmark.totalReturnPercent ? 'outperform' : 'underperform'
    }
  });
});

// Compare strategies endpoint
app.get('/trading-bot/compare', (req, res) => {
  const trend = (req.query.trend as 'bull' | 'bear' | 'sideways' | 'volatile') || 'volatile';
  const days = parseInt(req.query.days as string) || 30;
  
  const prices = generatePriceData(days, trend);
  
  const strategies = ['grid', 'dca', 'momentum', 'mean-reversion', 'rsi', 'macd'];
  const results: Array<{strategy: string; totalReturnPercent: number; maxDrawdown: number; winRate: number; sharpeRatio: number; totalTrades: number}> = [];
  
  for (const strategy of strategies) {
    let result: BacktestResult;
    switch (strategy) {
      case 'grid':
        result = gridTrading(prices, { gridLevels: 10, investmentPerGrid: 100 });
        break;
      case 'dca':
        result = dcaStrategy(prices, { amount: 100, interval: 24 });
        break;
      case 'momentum':
        result = momentumStrategy(prices, { lookback: 20, threshold: 0.05 });
        break;
      case 'mean-reversion':
        result = meanReversion(prices, { window: 20, stdDev: 2 });
        break;
      case 'rsi':
        result = rsiStrategy(prices, { period: 14, oversold: 30, overbought: 70 });
        break;
      case 'macd':
        result = macdStrategy(prices, { fast: 12, slow: 26, signal: 9 });
        break;
      default:
        result = buyAndHold(prices);
    }
    
    results.push({
      strategy,
      totalReturnPercent: result.totalReturnPercent,
      maxDrawdown: result.maxDrawdown,
      winRate: result.winRate,
      sharpeRatio: result.sharpeRatio,
      totalTrades: result.totalTrades
    });
  }
  
  const benchmark = buyAndHold(prices);
  
  res.json({
    marketCondition: trend,
    period: `${days} days`,
    benchmark: {
      strategy: 'Buy & Hold',
      totalReturnPercent: benchmark.totalReturnPercent
    },
    strategies: results.sort((a, b) => b.totalReturnPercent - a.totalReturnPercent)
  });
});

// Optimize strategy endpoint
app.get('/trading-bot/optimize', (req, res) => {
  const strategy = req.query.strategy as string || 'dca';
  const trend = (req.query.trend as 'bull' | 'bear' | 'sideways' | 'volatile') || 'volatile';
  const days = parseInt(req.query.days as string) || 30;
  
  const prices = generatePriceData(days, trend);
  
  const results: Array<{params: Record<string, number>; return: number; drawdown: number; sharpe: number}> = [];
  
  if (strategy === 'grid') {
    for (const levels of [5, 10, 15, 20, 30]) {
      for (const investment of [50, 100, 200, 500]) {
        const result = gridTrading(prices, { gridLevels: levels, investmentPerGrid: investment });
        results.push({
          params: { gridLevels: levels, investmentPerGrid: investment },
          return: result.totalReturnPercent,
          drawdown: result.maxDrawdown,
          sharpe: result.sharpeRatio
        });
      }
    }
  } else if (strategy === 'dca') {
    for (const amount of [50, 100, 200, 500]) {
      for (const interval of [6, 12, 24, 48, 72]) {
        const result = dcaStrategy(prices, { amount, interval });
        results.push({
          params: { amount, interval },
          return: result.totalReturnPercent,
          drawdown: result.maxDrawdown,
          sharpe: result.sharpeRatio
        });
      }
    }
  } else if (strategy === 'momentum') {
    for (const lookback of [10, 20, 30, 50]) {
      for (const threshold of [0.02, 0.05, 0.1, 0.15]) {
        const result = momentumStrategy(prices, { lookback, threshold });
        results.push({
          params: { lookback, threshold },
          return: result.totalReturnPercent,
          drawdown: result.maxDrawdown,
          sharpe: result.sharpeRatio
        });
      }
    }
  } else if (strategy === 'rsi') {
    for (const period of [7, 14, 21]) {
      for (const oversold of [20, 30, 40]) {
        for (const overbought of [60, 70, 80]) {
          if (oversold < overbought) {
            const result = rsiStrategy(prices, { period, oversold, overbought });
            results.push({
              params: { period, oversold, overbought },
              return: result.totalReturnPercent,
              drawdown: result.maxDrawdown,
              sharpe: result.sharpeRatio
            });
          }
        }
      }
    }
  }
  
  const sorted = results.sort((a, b) => b.return - a.return).slice(0, 5);
  
  res.json({
    strategy,
    marketCondition: trend,
    testedConfigs: results.length,
    topConfigs: sorted,
    recommendation: sorted[0]
  });
});

// Live signals endpoint
app.get('/trading-bot/live-signals', (req, res) => {
  const strategyFilter = req.query.strategy as string || 'all';
  
  const signals = [
    { symbol: 'ETH', price: 3250 + Math.random() * 100, signal: Math.random() > 0.5 ? 'buy' : 'sell', confidence: 60 + Math.random() * 30, strategy: 'RSI', timestamp: new Date().toISOString() },
    { symbol: 'BTC', price: 67500 + Math.random() * 1000, signal: Math.random() > 0.5 ? 'buy' : 'sell', confidence: 60 + Math.random() * 30, strategy: 'MACD', timestamp: new Date().toISOString() },
    { symbol: 'SOL', price: 145 + Math.random() * 10, signal: Math.random() > 0.5 ? 'buy' : 'sell', confidence: 60 + Math.random() * 30, strategy: 'Momentum', timestamp: new Date().toISOString() },
    { symbol: 'ARB', price: 1.85 + Math.random() * 0.1, signal: Math.random() > 0.5 ? 'buy' : 'sell', confidence: 60 + Math.random() * 30, strategy: 'Mean Reversion', timestamp: new Date().toISOString() },
    { symbol: 'OP', price: 3.2 + Math.random() * 0.2, signal: Math.random() > 0.5 ? 'buy' : 'sell', confidence: 60 + Math.random() * 30, strategy: 'RSI', timestamp: new Date().toISOString() }
  ];
  
  const filtered = strategyFilter === 'all' ? signals : signals.filter(s => s.strategy.toLowerCase() === strategyFilter.toLowerCase());
  
  res.json({
    signals: filtered,
    updatedAt: new Date().toISOString()
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🔬 Trading Bot Simulator running on http://localhost:${PORT}`);
  console.log(`   - GET /trading-bot/strategies - List available strategies`);
  console.log(`   - GET /trading-bot/backtest - Run backtest`);
  console.log(`   - GET /trading-bot/compare - Compare strategies`);
  console.log(`   - GET /trading-bot/optimize - Optimize strategy parameters`);
  console.log(`   - GET /trading-bot/live-signals - Get live trading signals`);
});
