import { Injectable } from '@nestjs/common';

export interface BacktestConfig {
  strategy: string;
  token: string;
  chain: string;
  initialCapital: number;
  startDate: string;
  endDate: string;
  parameters: {
    // Grid strategy
    gridLevels?: number;
    gridSpacing?: number;
    // DCA strategy
    dcaAmount?: number;
    dcaFrequency?: 'hourly' | 'daily' | 'weekly';
    // RSI strategy
    rsiPeriod?: number;
    rsiOverbought?: number;
    rsiOversold?: number;
    // MACD strategy
    macdFast?: number;
    macdSlow?: number;
    macdSignal?: number;
    // Bollinger Bands
    bbPeriod?: number;
    bbStdDev?: number;
    // Momentum
    momentumPeriod?: number;
    momentumThreshold?: number;
    // Mean Reversion
    meanReversionPeriod?: number;
    meanReversionStdDev?: number;
  };
}

export interface BacktestResult {
  strategy: string;
  token: string;
  chain: string;
  period: { start: string; end: string };
  initialCapital: number;
  finalCapital: number;
  totalReturn: number;
  totalReturnPercent: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  sharpeRatio: number;
  winRate: number;
  totalTrades: number;
  profitableTrades: number;
  losingTrades: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  calmarRatio: number;
  sortinoRatio: number;
  volatility: number;
  beta: number;
  alpha: number;
  marketReturn: number;
  avgHoldingPeriod: number;
  tradeHistory: Trade[];
  equityCurve: EquityPoint[];
  monthlyReturns: MonthlyReturn[];
  riskMetrics: RiskMetrics;
  aiInsights: AIInsight[];
}

export interface Trade {
  id: number;
  date: string;
  type: 'BUY' | 'SELL';
  price: number;
  amount: number;
  value: number;
  fees: number;
  pnl: number;
  pnlPercent: number;
  reason: string;
}

export interface EquityPoint {
  date: string;
  equity: number;
  benchmark: number;
}

export interface MonthlyReturn {
  month: string;
  return: number;
  trades: number;
}

export interface RiskMetrics {
  valueAtRisk: number;
  conditionalValueAtRisk: number;
  downsideDeviation: number;
  upsideDeviation: number;
  trackingError: number;
  informationRatio: number;
  treynorRatio: number;
  omegaRatio: number;
}

export interface AIInsight {
  type: 'strength' | 'weakness' | 'recommendation' | 'warning';
  title: string;
  description: string;
  confidence: number;
}

@Injectable()
export class BacktesterService {
  private readonly strategies = [
    'grid',
    'dca',
    'rsi',
    'macd',
    'bollinger',
    'momentum',
    'mean_reversion',
    'breakout',
    'moving_average_crossover',
    'dual_moving_average',
  ];

  private readonly tokens = [
    'BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'AVAX', 'DOGE', 'LINK', 'UNI',
    'AAVE', 'MKR', 'CRV', 'LDO', 'ARB', 'OP', 'APT', 'MATIC', 'DOT', 'ATOM'
  ];

  private readonly chains = [
    'ethereum', 'polygon', 'arbitrum', 'optimism', 'bsc', 'base', 'avalanche'
  ];

  async runBacktest(config: BacktestConfig): Promise<BacktestResult> {
    const { strategy, token, chain, initialCapital, startDate, endDate, parameters } = config;
    
    // Generate historical price data simulation
    const priceData = this.generatePriceData(token, startDate, endDate);
    
    // Run the selected strategy
    let trades: Trade[] = [];
    let equity: number = initialCapital;
    let position = 0;
    let entryPrice = 0;
    
    switch (strategy) {
      case 'grid':
        trades = this.runGridStrategy(priceData, initialCapital, parameters);
        break;
      case 'dca':
        trades = this.runDCAStrategy(priceData, initialCapital, parameters);
        break;
      case 'rsi':
        ({ trades, position, entryPrice } = this.runRSIStrategy(priceData, initialCapital, parameters));
        break;
      case 'macd':
        ({ trades, position, entryPrice } = this.runMACDStrategy(priceData, initialCapital, parameters));
        break;
      case 'bollinger':
        ({ trades, position, entryPrice } = this.runBollingerStrategy(priceData, initialCapital, parameters));
        break;
      case 'momentum':
        ({ trades, position, entryPrice } = this.runMomentumStrategy(priceData, initialCapital, parameters));
        break;
      case 'mean_reversion':
        ({ trades, position, entryPrice } = this.runMeanReversionStrategy(priceData, initialCapital, parameters));
        break;
      case 'breakout':
        ({ trades, position, entryPrice } = this.runBreakoutStrategy(priceData, initialCapital, parameters));
        break;
      case 'moving_average_crossover':
        ({ trades, position, entryPrice } = this.runMACrossoverStrategy(priceData, initialCapital, parameters));
        break;
      case 'dual_moving_average':
        ({ trades, position, entryPrice } = this.runDualMAStrategy(priceData, initialCapital, parameters));
        break;
      default:
        trades = this.runBuyAndHold(priceData, initialCapital);
    }
    
    // Close any open position
    if (position > 0) {
      const lastPrice = priceData[priceData.length - 1].price;
      const lastTrade = trades[trades.length - 1];
      const closeValue = position * lastPrice;
      const fees = closeValue * 0.003;
      trades.push({
        id: trades.length + 1,
        date: endDate,
        type: 'SELL',
        price: lastPrice,
        amount: position,
        value: closeValue,
        fees,
        pnl: (closeValue - fees) - (entryPrice * position),
        pnlPercent: ((closeValue - fees) / (entryPrice * position) - 1) * 100,
        reason: 'Strategy end - close position'
      });
    }
    
    // Calculate final capital
    const finalCapital = this.calculateFinalCapital(trades, initialCapital);
    
    // Generate equity curve
    const equityCurve = this.generateEquityCurve(priceData, trades, initialCapital);
    
    // Calculate metrics
    const metrics = this.calculateMetrics(trades, initialCapital, finalCapital, equityCurve);
    
    // Generate AI insights
    const aiInsights = this.generateAIInsights(metrics, strategy, token);
    
    return {
      strategy,
      token,
      chain,
      period: { start: startDate, end: endDate },
      initialCapital,
      finalCapital,
      ...metrics,
      tradeHistory: trades,
      equityCurve,
      monthlyReturns: this.generateMonthlyReturns(trades),
      riskMetrics: this.calculateRiskMetrics(trades, initialCapital),
      aiInsights
    };
  }

  private generatePriceData(token: string, startDate: string, endDate: string): { date: string; price: number; volume: number }[] {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    // Base prices for different tokens
    const basePrices: { [key: string]: number } = {
      'BTC': 45000, 'ETH': 2500, 'SOL': 100, 'BNB': 300, 'XRP': 0.6,
      'ADA': 0.5, 'AVAX': 35, 'DOGE': 0.08, 'LINK': 15, 'UNI': 7,
      'AAVE': 100, 'MKR': 1500, 'CRV': 0.5, 'LDO': 2.5, 'ARB': 1.2,
      'OP': 2.5, 'APT': 10, 'MATIC': 0.8, 'DOT': 7, 'ATOM': 9
    };
    
    const basePrice = basePrices[token] || 100;
    const data: { date: string; price: number; volume: number }[] = [];
    let price = basePrice;
    
    // Generate random walk with trend
    for (let i = 0; i < days; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      
      // Random walk with volatility
      const change = (Math.random() - 0.48) * 0.04; // Slight upward bias
      price = price * (1 + change);
      price = Math.max(price, basePrice * 0.5); // Floor
      price = Math.min(price, basePrice * 2); // Ceiling
      
      data.push({
        date: date.toISOString().split('T')[0],
        price: parseFloat(price.toFixed(2)),
        volume: Math.random() * 1000000000
      });
    }
    
    return data;
  }

  private runGridStrategy(priceData: { date: string; price: number; volume: number }[], capital: number, params: any): Trade[] {
    const trades: Trade[] = [];
    const levels = params.gridLevels || 10;
    const spacing = params.gridSpacing || 0.02;
    
    const minPrice = Math.min(...priceData.map(d => d.price));
    const maxPrice = Math.max(...priceData.map(d => d.price));
    const priceRange = maxPrice - minPrice;
    const gridStep = priceRange / levels;
    
    const gridPrices: number[] = [];
    for (let i = 0; i <= levels; i++) {
      gridPrices.push(minPrice + i * gridStep);
    }
    
    let currentLevel = Math.floor(levels / 2);
    let balance = capital;
    const tradeSize = capital / (levels + 1);
    
    priceData.forEach((data, idx) => {
      const targetLevel = Math.min(Math.floor((data.price - minPrice) / gridStep), levels);
      
      while (currentLevel < targetLevel && currentLevel < levels) {
        // Buy at grid level
        const amount = tradeSize / data.price;
        const fees = tradeSize * 0.003;
        balance -= (tradeSize + fees);
        
        trades.push({
          id: trades.length + 1,
          date: data.date,
          type: 'BUY',
          price: data.price,
          amount,
          value: tradeSize,
          fees,
          pnl: 0,
          pnlPercent: 0,
          reason: `Grid level ${currentLevel} -> ${currentLevel + 1}`
        });
        currentLevel++;
      }
      
      while (currentLevel > targetLevel && currentLevel > 0) {
        // Sell at grid level
        const prevTrade = trades.filter(t => t.type === 'BUY').slice(-1)[0];
        if (prevTrade) {
          const sellValue = prevTrade.amount * data.price;
          const fees = sellValue * 0.003;
          balance += (sellValue - fees);
          
          trades.push({
            id: trades.length + 1,
            date: data.date,
            type: 'SELL',
            price: data.price,
            amount: prevTrade.amount,
            value: sellValue,
            fees,
            pnl: sellValue - fees - prevTrade.value,
            pnlPercent: ((sellValue - fees) / prevTrade.value - 1) * 100,
            reason: `Grid level ${currentLevel} -> ${currentLevel - 1}`
          });
        }
        currentLevel--;
      }
    });
    
    return trades;
  }

  private runDCAStrategy(priceData: { date: string; price: number }[], capital: number, params: any): Trade[] {
    const trades: Trade[] = [];
    const amount = params.dcaAmount || (capital / 20);
    const frequency = params.dcaFrequency || 'daily';
    
    let totalInvested = 0;
    let totalAmount = 0;
    
    let interval = 1; // daily
    if (frequency === 'weekly') interval = 7;
    if (frequency === 'hourly') interval = 1/24;
    
    for (let i = 0; i < priceData.length; i += interval) {
      const data = priceData[Math.floor(i)];
      if (!data) continue;
      
      const tokenAmount = amount / data.price;
      const fees = amount * 0.003;
      
      totalInvested += amount + fees;
      totalAmount += tokenAmount;
      
      trades.push({
        id: trades.length + 1,
        date: data.date,
        type: 'BUY',
        price: data.price,
        amount: tokenAmount,
        value: amount,
        fees,
        pnl: 0,
        pnlPercent: 0,
        reason: `DCA ${frequency} purchase`
      });
      
      if (totalInvested >= capital * 1.5) break;
    }
    
    return trades;
  }

  private runRSIStrategy(priceData: { date: string; price: number }[], capital: number, params: any): { trades: Trade[]; position: number; entryPrice: number } {
    const trades: Trade[] = [];
    const period = params.rsiPeriod || 14;
    const overbought = params.rsiOverbought || 70;
    const oversold = params.rsiOversold || 30;
    
    let position = 0;
    let entryPrice = 0;
    let balance = capital;
    
    const rsiData = this.calculateRSI(priceData, period);
    
    priceData.forEach((data, idx) => {
      const rsi = rsiData[idx];
      if (rsi === null) return;
      
      if (rsi < oversold && position === 0) {
        // Buy signal
        const amount = (balance * 0.9) / data.price;
        const fees = balance * 0.003;
        balance -= (balance + fees);
        
        position = amount;
        entryPrice = data.price;
        
        trades.push({
          id: trades.length + 1,
          date: data.date,
          type: 'BUY',
          price: data.price,
          amount,
          value: balance * 0.9,
          fees,
          pnl: 0,
          pnlPercent: 0,
          reason: `RSI oversold (${rsi.toFixed(1)})`
        });
      } else if (rsi > overbought && position > 0) {
        // Sell signal
        const sellValue = position * data.price;
        const fees = sellValue * 0.003;
        const pnl = sellValue - fees - (position * entryPrice);
        
        trades.push({
          id: trades.length + 1,
          date: data.date,
          type: 'SELL',
          price: data.price,
          amount: position,
          value: sellValue,
          fees,
          pnl,
          pnlPercent: (pnl / (position * entryPrice)) * 100,
          reason: `RSI overbought (${rsi.toFixed(1)})`
        });
        
        balance += (sellValue - fees);
        position = 0;
        entryPrice = 0;
      }
    });
    
    return { trades, position, entryPrice };
  }

  private runMACDStrategy(priceData: { date: string; price: number }[], capital: number, params: any): { trades: Trade[]; position: number; entryPrice: number } {
    const trades: Trade[] = [];
    const fast = params.macdFast || 12;
    const slow = params.macdSlow || 26;
    const signal = params.macdSignal || 9;
    
    let position = 0;
    let entryPrice = 0;
    let balance = capital;
    
    const macdData = this.calculateMACD(priceData, fast, slow, signal);
    
    priceData.forEach((data, idx) => {
      const macd = macdData[idx];
      if (!macd || macd.macd === null) return;
      
      // Buy: MACD crosses above signal line
      if (idx > 0) {
        const prev = macdData[idx - 1];
          if (prev.macd !== null && prev.signal !== null && macd.macd !== null && macd.signal !== null && prev.macd < prev.signal && macd.macd > macd.signal && position === 0) {
            const amount = (balance * 0.9) / data.price;
            const fees = balance * 0.003;
            balance -= (balance * 0.9 + fees);
            
            position = amount;
            entryPrice = data.price;
            
            trades.push({
              id: trades.length + 1,
              date: data.date,
              type: 'BUY',
              price: data.price,
              amount,
              value: balance * 0.9,
              fees,
              pnl: 0,
              pnlPercent: 0,
              reason: `MACD golden cross (${macd.macd.toFixed(2)} > ${macd.signal.toFixed(2)})`
            });
          } else if (prev.macd !== null && prev.signal !== null && macd.macd !== null && macd.signal !== null && prev.macd > prev.signal && macd.macd < macd.signal && position > 0) {
            // Sell: MACD crosses below signal line
            const sellValue = position * data.price;
            const fees = sellValue * 0.003;
            const pnl = sellValue - fees - (position * entryPrice);
            
            trades.push({
              id: trades.length + 1,
              date: data.date,
              type: 'SELL',
              price: data.price,
              amount: position,
              value: sellValue,
              fees,
              pnl,
              pnlPercent: (pnl / (position * entryPrice)) * 100,
              reason: `MACD death cross (${macd.macd.toFixed(2)} < ${macd.signal.toFixed(2)})`
            });
            
            balance += (sellValue - fees);
            position = 0;
            entryPrice = 0;
          }
        }
      }
    });
    
    return { trades, position, entryPrice };
  }

  private runBollingerStrategy(priceData: { date: string; price: number }[], capital: number, params: any): { trades: Trade[]; position: number; entryPrice: number } {
    const trades: Trade[] = [];
    const period = params.bbPeriod || 20;
    const stdDev = params.bbStdDev || 2;
    
    let position = 0;
    let entryPrice = 0;
    let balance = capital;
    
    const bbData = this.calculateBollingerBands(priceData, period, stdDev);
    
    priceData.forEach((data, idx) => {
      const bb = bbData[idx];
      if (!bb || bb.lower === null) return;
      
      // Buy at lower band
      if (bb.lower !== null && data.price <= bb.lower && position === 0) {
        const amount = (balance * 0.9) / data.price;
        const fees = balance * 0.003;
        balance -= (balance * 0.9 + fees);
        
        position = amount;
        entryPrice = data.price;
        
        trades.push({
          id: trades.length + 1,
          date: data.date,
          type: 'BUY',
          price: data.price,
          amount,
          value: balance * 0.9,
          fees,
          pnl: 0,
          pnlPercent: 0,
          reason: `Price at lower BB (${bb.lower.toFixed(2)})`
        });
      } else if (bb.upper !== null && data.price >= bb.upper && position > 0) {
        // Sell at upper band
        const sellValue = position * data.price;
        const fees = sellValue * 0.003;
        const pnl = sellValue - fees - (position * entryPrice);
        
        trades.push({
          id: trades.length + 1,
          date: data.date,
          type: 'SELL',
          price: data.price,
          amount: position,
          value: sellValue,
          fees,
          pnl,
          pnlPercent: (pnl / (position * entryPrice)) * 100,
          reason: `Price at upper BB (${bb.upper.toFixed(2)})`
        });
        
        balance += (sellValue - fees);
        position = 0;
        entryPrice = 0;
      }
    });
    
    return { trades, position, entryPrice };
  }

  private runMomentumStrategy(priceData: { date: string; price: number }[], capital: number, params: any): { trades: Trade[]; position: number; entryPrice: number } {
    const trades: Trade[] = [];
    const period = params.momentumPeriod || 10;
    const threshold = params.momentumThreshold || 0.05;
    
    let position = 0;
    let entryPrice = 0;
    let balance = capital;
    
    priceData.forEach((data, idx) => {
      if (idx < period) return;
      
      const pastPrice = priceData[idx - period].price;
      const momentum = (data.price - pastPrice) / pastPrice;
      
      if (momentum > threshold && position === 0) {
        const amount = (balance * 0.9) / data.price;
        const fees = balance * 0.003;
        balance -= (balance * 0.9 + fees);
        
        position = amount;
        entryPrice = data.price;
        
        trades.push({
          id: trades.length + 1,
          date: data.date,
          type: 'BUY',
          price: data.price,
          amount,
          value: balance * 0.9,
          fees,
          pnl: 0,
          pnlPercent: 0,
          reason: `Momentum positive (${(momentum * 100).toFixed(1)}%)`
        });
      } else if (momentum < -threshold && position > 0) {
        const sellValue = position * data.price;
        const fees = sellValue * 0.003;
        const pnl = sellValue - fees - (position * entryPrice);
        
        trades.push({
          id: trades.length + 1,
          date: data.date,
          type: 'SELL',
          price: data.price,
          amount: position,
          value: sellValue,
          fees,
          pnl,
          pnlPercent: (pnl / (position * entryPrice)) * 100,
          reason: `Momentum negative (${(momentum * 100).toFixed(1)}%)`
        });
        
        balance += (sellValue - fees);
        position = 0;
        entryPrice = 0;
      }
    });
    
    return { trades, position, entryPrice };
  }

  private runMeanReversionStrategy(priceData: { date: string; price: number }[], capital: number, params: any): { trades: Trade[]; position: number; entryPrice: number } {
    const trades: Trade[] = [];
    const period = params.meanReversionPeriod || 20;
    const stdDev = params.meanReversionStdDev || 2;
    
    let position = 0;
    let entryPrice = 0;
    let balance = capital;
    
    const maData = this.calculateSMA(priceData, period);
    const stdData = this.calculateStdDev(priceData, period);
    
    priceData.forEach((data, idx) => {
      if (idx < period || !maData[idx] || !stdData[idx]) return;
      
      const ma = maData[idx];
      const std = stdData[idx];
      const upper = ma + stdDev * std;
      const lower = ma - stdDev * std;
      
      if (data.price < lower && position === 0) {
        const amount = (balance * 0.9) / data.price;
        const fees = balance * 0.003;
        balance -= (balance * 0.9 + fees);
        
        position = amount;
        entryPrice = data.price;
        
        trades.push({
          id: trades.length + 1,
          date: data.date,
          type: 'BUY',
          price: data.price,
          amount,
          value: balance * 0.9,
          fees,
          pnl: 0,
          pnlPercent: 0,
          reason: `Mean reversion - below lower band`
        });
      } else if (data.price > upper && position > 0) {
        const sellValue = position * data.price;
        const fees = sellValue * 0.003;
        const pnl = sellValue - fees - (position * entryPrice);
        
        trades.push({
          id: trades.length + 1,
          date: data.date,
          type: 'SELL',
          price: data.price,
          amount: position,
          value: sellValue,
          fees,
          pnl,
          pnlPercent: (pnl / (position * entryPrice)) * 100,
          reason: `Mean reversion - above upper band`
        });
        
        balance += (sellValue - fees);
        position = 0;
        entryPrice = 0;
      }
    });
    
    return { trades, position, entryPrice };
  }

  private runBreakoutStrategy(priceData: { date: string; price: number }[], capital: number, params: any): { trades: Trade[]; position: number; entryPrice: number } {
    const trades: Trade[] = [];
    const lookback = 20;
    
    let position = 0;
    let entryPrice = 0;
    let balance = capital;
    let highest = 0;
    
    priceData.forEach((data, idx) => {
      if (idx < lookback) {
        highest = Math.max(highest, data.price);
        return;
      }
      
      const pastPrices = priceData.slice(idx - lookback, idx);
      const resistance = Math.max(...pastPrices.map(p => p.price));
      
      if (data.price > resistance * 1.02 && position === 0) {
        const amount = (balance * 0.9) / data.price;
        const fees = balance * 0.003;
        balance -= (balance * 0.9 + fees);
        
        position = amount;
        entryPrice = data.price;
        
        trades.push({
          id: trades.length + 1,
          date: data.date,
          type: 'BUY',
          price: data.price,
          amount,
          value: balance * 0.9,
          fees,
          pnl: 0,
          pnlPercent: 0,
          reason: `Breakout above resistance (${resistance.toFixed(2)})`
        });
      }
      
      highest = Math.max(highest, data.price);
      
      if (position > 0 && data.price < highest * 0.95) {
        const sellValue = position * data.price;
        const fees = sellValue * 0.003;
        const pnl = sellValue - fees - (position * entryPrice);
        
        trades.push({
          id: trades.length + 1,
          date: data.date,
          type: 'SELL',
          price: data.price,
          amount: position,
          value: sellValue,
          fees,
          pnl,
          pnlPercent: (pnl / (position * entryPrice)) * 100,
          reason: `Stop loss - breakout failed`
        });
        
        balance += (sellValue - fees);
        position = 0;
        entryPrice = 0;
        highest = 0;
      }
    });
    
    return { trades, position, entryPrice };
  }

  private runMACrossoverStrategy(priceData: { date: string; price: number }[], capital: number, params: any): { trades: Trade[]; position: number; entryPrice: number } {
    const trades: Trade[] = [];
    const fastPeriod = 10;
    const slowPeriod = 30;
    
    let position = 0;
    let entryPrice = 0;
    let balance = capital;
    
    const fastMA = this.calculateSMA(priceData, fastPeriod);
    const slowMA = this.calculateSMA(priceData, slowPeriod);
    
    priceData.forEach((data, idx) => {
      if (idx < slowPeriod || !fastMA[idx] || !slowMA[idx]) return;
      
      const prevFast = fastMA[idx - 1];
      const prevSlow = slowMA[idx - 1];
      
      if (prevFast !== null && prevSlow !== null && prevFast < prevSlow && fastMA[idx] > slowMA[idx] && position === 0) {
        const amount = (balance * 0.9) / data.price;
        const fees = balance * 0.003;
        balance -= (balance * 0.9 + fees);
        
        position = amount;
        entryPrice = data.price;
        
        trades.push({
          id: trades.length + 1,
          date: data.date,
          type: 'BUY',
          price: data.price,
          amount,
          value: balance * 0.9,
          fees,
          pnl: 0,
          pnlPercent: 0,
          reason: `MA Golden Cross`
        });
      } else if (prevFast !== null && prevSlow !== null && prevFast > prevSlow && fastMA[idx] < slowMA[idx] && position > 0) {
        const sellValue = position * data.price;
        const fees = sellValue * 0.003;
        const pnl = sellValue - fees - (position * entryPrice);
        
        trades.push({
          id: trades.length + 1,
          date: data.date,
          type: 'SELL',
          price: data.price,
          amount: position,
          value: sellValue,
          fees,
          pnl,
          pnlPercent: (pnl / (position * entryPrice)) * 100,
          reason: `MA Death Cross`
        });
        
        balance += (sellValue - fees);
        position = 0;
        entryPrice = 0;
      }
    });
    
    return { trades, position, entryPrice };
  }

  private runDualMAStrategy(priceData: { date: string; price: number }[], capital: number, params: any): { trades: Trade[]; position: number; entryPrice: number } {
    // Same as MACrossover but with custom periods
    return this.runMACrossoverStrategy(priceData, capital, params);
  }

  private runBuyAndHold(priceData: { date: string; price: number }[], capital: number): Trade[] {
    const trades: Trade[] = [];
    const firstPrice = priceData[0].price;
    const lastPrice = priceData[priceData.length - 1].price;
    
    const amount = capital / firstPrice;
    const fees = capital * 0.003;
    
    trades.push({
      id: 1,
      date: priceData[0].date,
      type: 'BUY',
      price: firstPrice,
      amount,
      value: capital,
      fees,
      pnl: 0,
      pnlPercent: 0,
      reason: 'Buy and Hold - Initial purchase'
    });
    
    return trades;
  }

  private calculateFinalCapital(trades: Trade[], initialCapital: number): number {
    let capital = initialCapital;
    trades.forEach(trade => {
      if (trade.type === 'BUY') {
        capital -= (trade.value + trade.fees);
      } else {
        capital += (trade.value - trade.fees);
      }
    });
    return capital;
  }

  private generateEquityCurve(priceData: { date: string; price: number }[], trades: Trade[], initialCapital: number): EquityPoint[] {
    const curve: EquityPoint[] = [];
    let position = 0;
    let costBasis = 0;
    
    priceData.forEach(data => {
      // Update position based on trades up to this date
      trades.forEach(trade => {
        if (trade.date <= data.date) {
          if (trade.type === 'BUY') {
            position += trade.amount;
            costBasis += trade.value + trade.fees;
          } else {
            position -= trade.amount;
            costBasis -= trade.value - trade.fees;
          }
        }
      });
      
      const equity = (position * data.price) + (initialCapital - costBasis);
      const benchmark = (data.price / priceData[0].price) * initialCapital;
      
      curve.push({
        date: data.date,
        equity: parseFloat(equity.toFixed(2)),
        benchmark: parseFloat(benchmark.toFixed(2))
      });
    });
    
    return curve;
  }

  private generateMonthlyReturns(trades: Trade[]): MonthlyReturn[] {
    const monthlyMap = new Map<string, { return: number; trades: number }>();
    
    trades.forEach(trade => {
      const month = trade.date.substring(0, 7);
      if (!monthlyMap.has(month)) {
        monthlyMap.set(month, { return: 0, trades: 0 });
      }
      const data = monthlyMap.get(month)!;
      if (trade.type === 'SELL') {
        data.return += trade.pnl;
      }
      data.trades++;
    });
    
    return Array.from(monthlyMap.entries()).map(([month, data]) => ({
      month,
      return: parseFloat(data.return.toFixed(2)),
      trades: data.trades
    })).sort((a, b) => a.month.localeCompare(b.month));
  }

  private calculateMetrics(trades: Trade[], initialCapital: number, finalCapital: number, equityCurve: EquityPoint[]) {
    const totalReturn = finalCapital - initialCapital;
    const totalReturnPercent = (totalReturn / initialCapital) * 100;
    
    const sellTrades = trades.filter(t => t.type === 'SELL');
    const profitableTrades = sellTrades.filter(t => t.pnl > 0);
    const losingTrades = sellTrades.filter(t => t.pnl <= 0);
    
    const winRate = sellTrades.length > 0 ? (profitableTrades.length / sellTrades.length) * 100 : 0;
    const avgWin = profitableTrades.length > 0 ? profitableTrades.reduce((sum, t) => sum + t.pnl, 0) / profitableTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length) : 1;
    
    const totalWins = profitableTrades.reduce((sum, t) => sum + t.pnl, 0);
    const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));
    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? 999 : 0;
    
    // Calculate max drawdown
    let maxDrawdown = 0;
    let peak = initialCapital;
    equityCurve.forEach(point => {
      if (point.equity > peak) peak = point.equity;
      const drawdown = peak - point.equity;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });
    const maxDrawdownPercent = (maxDrawdown / peak) * 100;
    
    // Calculate Sharpe Ratio (assuming risk-free rate of 5%)
    const returns = equityCurve.map((p, i) => i > 0 ? (p.equity - equityCurve[i-1].equity) / equityCurve[i-1].equity : 0);
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const stdReturn = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length);
    const sharpeRatio = stdReturn > 0 ? (avgReturn - 0.05/365) / stdReturn * Math.sqrt(365) : 0;
    
    // Calculate Volatility
    const volatility = stdReturn * Math.sqrt(365) * 100;
    
    // Beta and Alpha (vs benchmark)
    const benchmarkReturns = equityCurve.map((p, i) => i > 0 ? (p.benchmark - equityCurve[i-1].benchmark) / equityCurve[i-1].benchmark : 0);
    const avgBenchmarkReturn = benchmarkReturns.reduce((a, b) => a + b, 0) / benchmarkReturns.length;
    
    const covariance = returns.reduce((sum, r, i) => sum + (r - avgReturn) * (benchmarkReturns[i] - avgBenchmarkReturn), 0) / returns.length;
    const benchmarkVariance = benchmarkReturns.reduce((sum, r) => sum + Math.pow(r - avgBenchmarkReturn, 2), 0) / benchmarkReturns.length;
    const beta = benchmarkVariance > 0 ? covariance / benchmarkVariance : 1;
    const alpha = avgReturn - beta * avgBenchmarkReturn;
    
    // Calmar Ratio
    const years = equityCurve.length / 365;
    const calmarRatio = maxDrawdownPercent > 0 ? (totalReturnPercent / years) / maxDrawdownPercent : 0;
    
    // Sortino Ratio
    const downsideReturns = returns.filter(r => r < 0);
    const downsideDev = downsideReturns.length > 0 ? Math.sqrt(downsideReturns.reduce((sum, r) => sum + r * r, 0) / downsideReturns.length) : 0;
    const sortinoRatio = downsideDev > 0 ? (avgReturn - 0.05/365) / downsideDev * Math.sqrt(365) : 0;
    
    // Average holding period
    const holdingPeriods = sellTrades.map((_, i) => {
      const buyTrades = trades.filter(t => t.type === 'BUY');
      if (buyTrades.length > i) {
        const buy = new Date(buyTrades[i].date);
        const sell = new Date(sellTrades[i].date);
        return (sell.getTime() - buy.getTime()) / (1000 * 60 * 60 * 24);
      }
      return 0;
    }).filter(p => p > 0);
    const avgHoldingPeriod = holdingPeriods.length > 0 ? holdingPeriods.reduce((a, b) => a + b, 0) / holdingPeriods.length : 0;
    
    const marketReturn = ((equityCurve[equityCurve.length - 1].benchmark - initialCapital) / initialCapital) * 100;
    
    return {
      totalReturn,
      totalReturnPercent: parseFloat(totalReturnPercent.toFixed(2)),
      maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
      maxDrawdownPercent: parseFloat(maxDrawdownPercent.toFixed(2)),
      sharpeRatio: parseFloat(sharpeRatio.toFixed(2)),
      winRate: parseFloat(winRate.toFixed(2)),
      totalTrades: trades.length,
      profitableTrades: profitableTrades.length,
      losingTrades: losingTrades.length,
      avgWin: parseFloat(avgWin.toFixed(2)),
      avgLoss: parseFloat(avgLoss.toFixed(2)),
      profitFactor: parseFloat(profitFactor.toFixed(2)),
      calmarRatio: parseFloat(calmarRatio.toFixed(2)),
      sortinoRatio: parseFloat(sortinoRatio.toFixed(2)),
      volatility: parseFloat(volatility.toFixed(2)),
      beta: parseFloat(beta.toFixed(2)),
      alpha: parseFloat(alpha.toFixed(2)),
      marketReturn: parseFloat(marketReturn.toFixed(2)),
      avgHoldingPeriod: parseFloat(avgHoldingPeriod.toFixed(1))
    };
  }

  private calculateRiskMetrics(trades: Trade[], initialCapital: number): RiskMetrics {
    const sellTrades = trades.filter(t => t.type === 'SELL');
    const returns = sellTrades.map(t => t.pnlPercent / 100);
    
    if (returns.length === 0) {
      return {
        valueAtRisk: 0,
        conditionalValueAtRisk: 0,
        downsideDeviation: 0,
        upsideDeviation: 0,
        trackingError: 0,
        informationRatio: 0,
        treynorRatio: 0,
        omegaRatio: 1
      };
    }
    
    const sorted = [...returns].sort((a, b) => a - b);
    const varIndex = Math.floor(returns.length * 0.05);
    const valueAtRisk = sorted[varIndex] * initialCapital;
    const conditionalValueAtRisk = sorted.slice(0, varIndex).reduce((a, b) => a + b, 0) / varIndex * initialCapital;
    
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const downsideReturns = returns.filter(r => r < 0);
    const upsideReturns = returns.filter(r => r > 0);
    
    const downsideDev = Math.sqrt(downsideReturns.reduce((sum, r) => sum + Math.pow(r - 0, 2), 0) / returns.length);
    const upsideDev = Math.sqrt(upsideReturns.reduce((sum, r) => sum + Math.pow(r - 0, 2), 0) / returns.length);
    
    // Omega Ratio
    const threshold = 0;
    const omegaNumerator = returns.filter(r => r > threshold).reduce((sum, r) => sum + (r - threshold), 0);
    const omegaDenominator = Math.abs(returns.filter(r => r < threshold).reduce((sum, r) => sum + (r - threshold), 0));
    const omegaRatio = omegaDenominator > 0 ? omegaNumerator / omegaDenominator : omegaNumerator > 0 ? 999 : 0;
    
    return {
      valueAtRisk: parseFloat(valueAtRisk.toFixed(2)),
      conditionalValueAtRisk: parseFloat(conditionalValueAtRisk.toFixed(2)),
      downsideDeviation: parseFloat((downsideDev * 100).toFixed(2)),
      upsideDeviation: parseFloat((upsideDev * 100).toFixed(2)),
      trackingError: 0,
      informationRatio: 0,
      treynorRatio: 0,
      omegaRatio: parseFloat(omegaRatio.toFixed(2))
    };
  }

  private generateAIInsights(metrics: any, strategy: string, token: string): AIInsight[] {
    const insights: AIInsight[] = [];
    
    // Sharpe Ratio insights
    if (metrics.sharpeRatio > 1.5) {
      insights.push({
        type: 'strength',
        title: 'Excellent Risk-Adjusted Returns',
        description: `Sharpe ratio of ${metrics.sharpeRatio} indicates excellent risk-adjusted performance. The strategy effectively compensates for volatility.`,
        confidence: 92
      });
    } else if (metrics.sharpeRatio < 0.5) {
      insights.push({
        type: 'weakness',
        title: 'Poor Risk-Adjusted Returns',
        description: `Sharpe ratio of ${metrics.sharpeRatio} suggests the strategy doesn't adequately compensate for risk taken.`,
        confidence: 88
      });
    }
    
    // Win rate insights
    if (metrics.winRate > 60) {
      insights.push({
        type: 'strength',
        title: 'High Win Rate',
        description: `Win rate of ${metrics.winRate}% shows the strategy has strong entry signals.`,
        confidence: 90
      });
    } else if (metrics.winRate < 40) {
      insights.push({
        type: 'recommendation',
        title: 'Consider Position Sizing',
        description: `Win rate of ${metrics.winRate}% is relatively low. Consider larger position sizes on winning trades to improve overall profitability.`,
        confidence: 85
      });
    }
    
    // Drawdown insights
    if (metrics.maxDrawdownPercent > 30) {
      insights.push({
        type: 'warning',
        title: 'High Drawdown Risk',
        description: `Maximum drawdown of ${metrics.maxDrawdownPercent}% is quite high. Consider adding stop-losses or reducing position sizes.`,
        confidence: 87
      });
    }
    
    // Profit factor insights
    if (metrics.profitFactor > 2) {
      insights.push({
        type: 'strength',
        title: 'Strong Profit Factor',
        description: `Profit factor of ${metrics.profitFactor} indicates the strategy has good winning trade momentum.`,
        confidence: 89
      });
    }
    
    // Strategy-specific insights
    if (strategy === 'grid') {
      insights.push({
        type: 'recommendation',
        title: 'Grid Strategy Optimal for Range-Bound Markets',
        description: 'Grid strategies perform best in sideways markets. Consider switching to trend-following strategies during strong trends.',
        confidence: 82
      });
    } else if (strategy === 'dca') {
      insights.push({
        type: 'recommendation',
        title: 'DCA Benefits from Long-Term Trends',
        description: 'Dollar-cost averaging works well in bullish markets. Ensure you have sufficient capital for the full DCA schedule.',
        confidence: 80
      });
    } else if (['rsi', 'macd', 'bollinger'].includes(strategy)) {
      insights.push({
        type: 'recommendation',
        title: 'Technical Strategy Considerations',
        description: 'Technical indicators work best in liquid markets. Consider adding volume confirmation to reduce false signals.',
        confidence: 78
      });
    }
    
    // Alpha insights
    if (metrics.alpha > 0) {
      insights.push({
        type: 'strength',
        title: 'Positive Alpha Generation',
        description: `Alpha of ${metrics.alpha}% indicates the strategy outperforms the market benchmark.`,
        confidence: 75
      });
    }
    
    // Volatility insights
    if (metrics.volatility > 50) {
      insights.push({
        type: 'warning',
        title: 'High Volatility',
        description: `Annualized volatility of ${metrics.volatility}% is high. Consider hedging strategies or reducing exposure.`,
        confidence: 83
      });
    }
    
    // Sortino insight
    if (metrics.sortinoRatio > metrics.sharpeRatio) {
      insights.push({
        type: 'strength',
        title: 'Good Downside Protection',
        description: 'Sortino ratio exceeds Sharpe ratio, indicating good risk management on the downside.',
        confidence: 76
      });
    }
    
    return insights;
  }

  private calculateRSI(data: { price: number }[], period: number): (number | null)[] {
    const rsi: (number | null)[] = [];
    const gains: number[] = [];
    const losses: number[] = [];
    
    for (let i = 0; i < data.length; i++) {
      if (i === 0) {
        rsi.push(null);
        continue;
      }
      
      const change = data[i].price - data[i - 1].price;
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
      
      if (i < period) {
        rsi.push(null);
        continue;
      }
      
      const avgGain = gains.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
      const avgLoss = losses.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
      
      if (avgLoss === 0) {
        rsi.push(100);
      } else {
        const rs = avgGain / avgLoss;
        rsi.push(100 - (100 / (1 + rs)));
      }
    }
    
    return rsi;
  }

  private calculateMACD(data: { price: number }[], fast: number, slow: number, signal: number): { macd: number | null; signal: number | null }[] {
    const emaFast = this.calculateEMA(data, fast);
    const emaSlow = this.calculateEMA(data, slow);
    const macdLine = emaFast.map((f, i) => f && emaSlow[i] ? f - emaSlow[i] : null);
    
    const macd: { macd: number | null; signal: number | null }[] = [];
    let signalLine: number[] = [];
    
    for (let i = 0; i < macdLine.length; i++) {
      if (macdLine[i] === null) {
        macd.push({ macd: null, signal: null });
        continue;
      }
      
      signalLine.push(macdLine[i]!);
      if (signalLine.length < signal) {
        macd.push({ macd: macdLine[i], signal: null });
      } else {
        const ema = this.calculateSingleEMA(signalLine, signal);
        macd.push({ macd: macdLine[i], signal: ema });
      }
    }
    
    return macd;
  }

  private calculateBollingerBands(data: { price: number }[], period: number, stdDev: number): { upper: number | null; middle: number | null; lower: number | null }[] {
    const sma = this.calculateSMA(data, period);
    const std = this.calculateStdDev(data, period);
    
    return sma.map((m, i) => {
      if (m === null || std[i] === null) {
        return { upper: null, middle: null, lower: null };
      }
      return {
        middle: m,
        upper: m + stdDev * std[i]!,
        lower: m - stdDev * std[i]!
      };
    });
  }

  private calculateSMA(data: { price: number }[], period: number): (number | null)[] {
    return data.map((_, i) => {
      if (i < period - 1) return null;
      const slice = data.slice(i - period + 1, i + 1);
      return slice.reduce((sum, d) => sum + d.price, 0) / period;
    });
  }

  private calculateEMA(data: { price: number }[], period: number): (number | null)[] {
    const ema: (number | null)[] = [];
    const multiplier = 2 / (period + 1);
    
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        ema.push(null);
      } else if (i === period - 1) {
        const sma = data.slice(0, period).reduce((sum, d) => sum + d.price, 0) / period;
        ema.push(sma);
      } else {
        const prevEma = ema[i - 1];
        if (prevEma === null) {
          ema.push(null);
        } else {
          ema.push((data[i].price - prevEma) * multiplier + prevEma);
        }
      }
    }
    
    return ema;
  }

  private calculateSingleEMA(values: number[], period: number): number {
    const multiplier = 2 / (period + 1);
    let ema = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
    
    for (let i = period; i < values.length; i++) {
      ema = (values[i] - ema) * multiplier + ema;
    }
    
    return ema;
  }

  private calculateStdDev(data: { price: number }[], period: number): (number | null)[] {
    return data.map((_, i) => {
      if (i < period - 1) return null;
      const slice = data.slice(i - period + 1, i + 1);
      const mean = slice.reduce((sum, d) => sum + d.price, 0) / period;
      const variance = slice.reduce((sum, d) => sum + Math.pow(d.price - mean, 2), 0) / period;
      return Math.sqrt(variance);
    });
  }

  getAvailableStrategies() {
    return this.strategies;
  }

  getAvailableTokens() {
    return this.tokens;
  }

  getAvailableChains() {
    return this.chains;
  }
}
