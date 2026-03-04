import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Tabs, Input, Select, Button, Row, Col, Statistic, Progress, Space, Spin, Alert, Divider, List, Badge, Empty, Modal, Form, message } from 'antd';
import { LineChartOutlined, LineOutlined, SwapOutlined, WalletOutlined, ThunderboltOutlined, ExclamationCircleOutlined, PlusOutlined, ExportOutlined, TrophyOutlined, WarningOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import type { TabsProps } from 'antd';
import ReactECharts from 'echarts-for-react';

const { Option } = Select;
const { Search } = Input;

type TradeType = 'swap' | 'add_liquidity' | 'remove_liquidity';
type TradeStatus = 'pending' | 'confirmed' | 'failed';
type TimeRange = '24h' | '7d' | '30d' | '90d' | '1y';

interface DexTrade {
  id: string;
  txHash: string;
  walletAddress: string;
  tradeType: TradeType;
  fromToken: string;
  fromAmount: number;
  toToken: string;
  toAmount: number;
  price: number;
  gasFee: number;
  totalCost: number;
  chain: string;
  dex: string;
  slippage: number;
  status: TradeStatus;
  timestamp: string;
  notes?: string;
}

interface DexTradingStats {
  totalTrades: number;
  confirmedTrades: number;
  failedTrades: number;
  totalVolume: number;
  totalGasFees: number;
  avgSlippage: number;
  profitLoss: number;
  bestTrade: DexTrade;
  worstTrade: DexTrade;
  mostUsedDex: string;
  mostTradedChain: string;
}

interface DexTradingSummary {
  period: TimeRange;
  stats: DexTradingStats;
  volumeByChain: { chain: string; volume: number; trades: number }[];
  volumeByDex: { dex: string; volume: number; trades: number }[];
  topTokens: { token: string; volume: number; trades: number }[];
  dailyVolume: { date: string; volume: number; trades: number }[];
}

interface DexTradeAnalysis {
  tradeFrequency: number;
  avgTradeSize: number;
  preferredDex: string;
  preferredChain: string;
  tradingStyle: string;
  riskScore: number;
  gasEfficiency: number;
  slippagePerformance: string;
  recommendations: string[];
}

const DexTradingJournal: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState('0x742d35Cc6634C0532925a3b844Bc9e7595f1234');
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [trades, setTrades] = useState<DexTrade[]>([]);
  const [summary, setSummary] = useState<DexTradingSummary | null>(null);
  const [analysis, setAnalysis] = useState<DexTradeAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState('trades');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const chains = ['Ethereum', 'Polygon', 'Arbitrum', 'Optimism', 'BSC', 'Base', 'Avalanche'];
  const dexes = ['Uniswap V3', 'Uniswap V2', 'SushiSwap', 'Curve', 'Balancer', 'PancakeSwap', 'QuickSwap', 'Aerodrome'];
  const tokens = ['ETH', 'USDC', 'USDT', 'WBTC', 'DAI', 'LINK', 'UNI', 'AAVE', 'MKR', 'CRV', 'LDO', 'ARB', 'OP', 'SOL', 'BNB', 'AVAX'];

  useEffect(() => {
    if (walletAddress) {
      fetchTrades();
      fetchSummary();
      fetchAnalysis();
    }
  }, [walletAddress, timeRange]);

  const fetchTrades = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/trades?address=${walletAddress}&timeRange=${timeRange}&page=1&limit=20`);
      const data = await response.json();
      setTrades(data.trades || []);
    } catch (error) {
      console.error('Failed to fetch trades:', error);
      // Mock data for demo
      setTrades(generateMockTrades(20));
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await fetch(`http://localhost:3000/summary?address=${walletAddress}&timeRange=${timeRange}`);
      const data = await response.json();
      setSummary(data);
    } catch (error) {
      console.error('Failed to fetch summary:', error);
      setSummary(generateMockSummary());
    }
  };

  const fetchAnalysis = async () => {
    try {
      const response = await fetch(`http://localhost:3000/analysis?address=${walletAddress}`);
      const data = await response.json();
      setAnalysis(data);
    } catch (error) {
      console.error('Failed to fetch analysis:', error);
      setAnalysis(generateMockAnalysis());
    }
  };

  const generateMockTrades = (count: number): DexTrade[] => {
    const mockTrades: DexTrade[] = [];
    const now = Date.now();
    
    for (let i = 0; i < count; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const timestamp = now - daysAgo * 24 * 60 * 60 * 1000;
      const fromToken = tokens[Math.floor(Math.random() * tokens.length)];
      let toToken = tokens[Math.floor(Math.random() * tokens.length)];
      while (toToken === fromToken) {
        toToken = tokens[Math.floor(Math.random() * tokens.length)];
      }
      
      const fromAmount = Math.random() * 10 + 0.1;
      const price = Math.random() * 1000 + 10;
      const toAmount = fromAmount * price * (1 + (Math.random() - 0.5) * 0.1);
      const gasFee = Math.random() * 50 + 1;
      const slippage = Math.random() * 5;
      
      mockTrades.push({
        id: `trade_${i}_${timestamp}`,
        txHash: `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`,
        walletAddress,
        tradeType: 'swap',
        fromToken,
        fromAmount: parseFloat(fromAmount.toFixed(4)),
        toToken,
        toAmount: parseFloat(toAmount.toFixed(4)),
        price,
        gasFee: parseFloat(gasFee.toFixed(2)),
        totalCost: parseFloat((fromAmount * price + gasFee).toFixed(2)),
        chain: chains[Math.floor(Math.random() * chains.length)],
        dex: dexes[Math.floor(Math.random() * dexes.length)],
        slippage: parseFloat(slippage.toFixed(2)),
        status: Math.random() > 0.1 ? 'confirmed' : 'failed',
        timestamp: new Date(timestamp).toISOString(),
        notes: Math.random() > 0.7 ? 'Manual entry' : undefined,
      });
    }
    
    return mockTrades.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const generateMockSummary = (): DexTradingSummary => ({
    period: timeRange,
    stats: {
      totalTrades: 156,
      confirmedTrades: 142,
      failedTrades: 14,
      totalVolume: 285420.50,
      totalGasFees: 3250.75,
      avgSlippage: 0.85,
      profitLoss: 14271.02,
      bestTrade: trades[0] || generateMockTrades(1)[0],
      worstTrade: trades[trades.length - 1] || generateMockTrades(1)[0],
      mostUsedDex: 'Uniswap V3',
      mostTradedChain: 'Ethereum',
    },
    volumeByChain: [
      { chain: 'Ethereum', volume: 145000, trades: 75 },
      { chain: 'Arbitrum', volume: 65000, trades: 38 },
      { chain: 'Optimism', volume: 45000, trades: 28 },
      { chain: 'Polygon', volume: 30420, trades: 15 },
    ],
    volumeByDex: [
      { dex: 'Uniswap V3', volume: 125000, trades: 68 },
      { dex: 'SushiSwap', volume: 75000, trades: 42 },
      { dex: 'Curve', volume: 55000, trades: 22 },
      { dex: 'Balancer', volume: 30420, trades: 10 },
    ],
    topTokens: [
      { token: 'ETH', volume: 95000, trades: 45 },
      { token: 'USDC', volume: 75000, trades: 52 },
      { token: 'WBTC', volume: 45000, trades: 18 },
      { token: 'UNI', volume: 35000, trades: 22 },
    ],
    dailyVolume: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      volume: Math.random() * 15000 + 5000,
      trades: Math.floor(Math.random() * 15 + 3),
    })),
  });

  const generateMockAnalysis = (): DexTradeAnalysis => ({
    tradeFrequency: 142,
    avgTradeSize: 2009.72,
    preferredDex: 'Uniswap V3',
    preferredChain: 'Ethereum',
    tradingStyle: 'Active Day Trader',
    riskScore: 32,
    gasEfficiency: 78.5,
    slippagePerformance: 'Good',
    recommendations: [
      'Consider using lower slippage settings to reduce slippage losses',
      'Try trading during off-peak hours to reduce gas fees',
      'Explore other chains for potentially better rates',
    ],
  });

  const handleAddTrade = async (values: any) => {
    try {
      const response = await fetch('http://localhost:3000/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (response.ok) {
        message.success('Trade added successfully');
        setIsModalOpen(false);
        form.resetFields();
        fetchTrades();
        fetchSummary();
        fetchAnalysis();
      }
    } catch (error) {
      message.success('Trade added (demo mode)');
      setIsModalOpen(false);
      form.resetFields();
      fetchTrades();
      fetchSummary();
    }
  };

  const getStatusColor = (status: TradeStatus) => {
    switch (status) {
      case 'confirmed': return 'success';
      case 'failed': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: TradeStatus) => {
    switch (status) {
      case 'confirmed': return <CheckCircleOutlined />;
      case 'failed': return <CloseCircleOutlined />;
      case 'pending': return <ClockCircleOutlined />;
      default: return null;
    }
  };

  const getChainColor = (chain: string) => {
    const colors: { [key: string]: string } = {
      'Ethereum': '#627EEA',
      'Polygon': '#8247E5',
      'Arbitrum': '#28A0F0',
      'Optimism': '#FF0420',
      'BSC': '#F3BA2F',
      'Base': '#0052FF',
      'Avalanche': '#E84142',
    };
    return colors[chain] || '#888';
  };

  const volumeChartOption = summary ? {
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: summary.dailyVolume.map(d => d.date),
    },
    yAxis: {
      type: 'value',
      name: 'Volume (USD)',
    },
    series: [{
      data: summary.dailyVolume.map(d => d.volume),
      type: 'line',
      smooth: true,
      areaStyle: { opacity: 0.3 },
      itemStyle: { color: '#1890ff' },
    }],
  } : {};

  const chainDistributionOption = summary ? {
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      data: summary.volumeByChain.map((c, i) => ({
        name: c.chain,
        value: c.volume,
        itemStyle: { color: getChainColor(c.chain) },
      })),
    }],
  } : {};

  const dexDistributionOption = summary ? {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: { type: 'value', name: 'Volume (USD)' },
    yAxis: { type: 'category', data: summary.volumeByDex.map(d => d.dex) },
    series: [{
      type: 'bar',
      data: summary.volumeByDex.map(d => d.volume),
      itemStyle: { color: '#52c41a' },
    }],
  } : {};

  const tradeColumns = [
    {
      title: 'Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (text: string) => new Date(text).toLocaleString(),
      width: 180,
    },
    {
      title: 'Trade',
      key: 'trade',
      render: (_: any, record: DexTrade) => (
        <Space>
          <Tag color="blue">{record.fromToken}</Tag>
          <SwapOutlined />
          <Tag color="green">{record.toToken}</Tag>
        </Space>
      ),
    },
    {
      title: 'Amount',
      key: 'amount',
      render: (_: any, record: DexTrade) => (
        <div>
          <div>{record.fromAmount} {record.fromToken}</div>
          <div style={{ fontSize: '12px', color: '#888' }}>→ {record.toAmount} {record.toToken}</div>
        </div>
      ),
    },
    {
      title: 'Chain',
      dataIndex: 'chain',
      key: 'chain',
      render: (chain: string) => (
        <Tag color={getChainColor(chain)}>{chain}</Tag>
      ),
    },
    {
      title: 'DEX',
      dataIndex: 'dex',
      key: 'dex',
    },
    {
      title: 'Volume',
      dataIndex: 'totalCost',
      key: 'totalCost',
      render: (val: number) => `$${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
    },
    {
      title: 'Gas',
      dataIndex: 'gasFee',
      key: 'gasFee',
      render: (val: number) => `$${val.toFixed(2)}`,
    },
    {
      title: 'Slippage',
      dataIndex: 'slippage',
      key: 'slippage',
      render: (val: number) => (
        <Tag color={val > 2 ? 'red' : val > 1 ? 'orange' : 'green'}>
          {val.toFixed(2)}%
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: TradeStatus) => (
        <Tag icon={getStatusIcon(status)} color={getStatusColor(status)}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
  ];

  const tabItems: TabsProps['items'] = [
    {
      key: 'trades',
      label: 'Trade History',
      children: (
        <Table
          dataSource={trades}
          columns={tradeColumns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          loading={loading}
          scroll={{ x: 1000 }}
        />
      ),
    },
    {
      key: 'summary',
      label: 'Summary',
      children: summary && (
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Row gutter={16}>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Total Trades"
                    value={summary.stats.totalTrades}
                    prefix={<SwapOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Total Volume"
                    value={summary.stats.totalVolume}
                    precision={2}
                    prefix="$"
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Gas Fees"
                    value={summary.stats.totalGasFees}
                    precision={2}
                    prefix="$"
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="P&L"
                    value={summary.stats.profitLoss}
                    precision={2}
                    prefix="$"
                    valueStyle={{ color: summary.stats.profitLoss >= 0 ? '#3f8600' : '#cf1322' }}
                  />
                </Card>
              </Col>
            </Row>
          </Col>
          <Col span={12}>
            <Card title="Volume Trend">
              <ReactECharts option={volumeChartOption} style={{ height: 300 }} />
            </Card>
          </Col>
          <Col span={12}>
            <Card title="Chain Distribution">
              <ReactECharts option={chainDistributionOption} style={{ height: 300 }} />
            </Card>
          </Col>
          <Col span={12}>
            <Card title="DEX Distribution">
              <ReactECharts option={dexDistributionOption} style={{ height: 300 }} />
            </Card>
          </Col>
          <Col span={12}>
            <Card title="Top Tokens">
              <List
                dataSource={summary.topTokens.slice(0, 6)}
                renderItem={(item) => (
                  <List.Item>
                    <Space>
                      <Tag>{item.token}</Tag>
                      <span>${item.volume.toLocaleString()}</span>
                      <Badge count={item.trades} style={{ backgroundColor: '#1890ff' }} />
                    </Space>
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'analysis',
      label: 'Analysis',
      children: analysis && (
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Row gutter={16}>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Trading Style"
                    value={analysis.tradingStyle}
                    prefix={<TrophyOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Avg Trade Size"
                    value={analysis.avgTradeSize}
                    precision={2}
                    prefix="$"
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Risk Score"
                    value={analysis.riskScore}
                    suffix="/100"
                    valueStyle={{ color: analysis.riskScore < 30 ? '#3f8600' : analysis.riskScore < 60 ? '#faad14' : '#cf1322' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Gas Efficiency"
                    value={analysis.gasEfficiency}
                    suffix="%"
                    prefix={<ThunderboltOutlined />}
                  />
                </Card>
              </Col>
            </Row>
          </Col>
          <Col span={12}>
            <Card title="Performance Metrics">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <strong>Preferred DEX:</strong> {analysis.preferredDex}
                </div>
                <div>
                  <strong>Preferred Chain:</strong> <Tag color={getChainColor(analysis.preferredChain)}>{analysis.preferredChain}</Tag>
                </div>
                <div>
                  <strong>Slippage Performance:</strong> <Tag color={analysis.slippagePerformance === 'Excellent' ? 'green' : analysis.slippagePerformance === 'Good' ? 'blue' : 'orange'}>{analysis.slippagePerformance}</Tag>
                </div>
                <Divider />
                <Alert
                  type="info"
                  icon={<ExclamationCircleOutlined />}
                  message="Recommendations"
                  description={
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      {analysis.recommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  }
                />
              </Space>
            </Card>
          </Col>
          <Col span={12}>
            <Card title="Risk Assessment">
              <Progress
                percent={100 - analysis.riskScore}
                status={analysis.riskScore < 30 ? 'success' : analysis.riskScore < 60 ? 'normal' : 'exception'}
                format={(percent) => `${percent}% Safe`}
              />
              <Divider />
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <strong>Risk Level:</strong>{' '}
                  <Tag color={analysis.riskScore < 30 ? 'green' : analysis.riskScore < 60 ? 'orange' : 'red'}>
                    {analysis.riskScore < 30 ? 'LOW' : analysis.riskScore < 60 ? 'MEDIUM' : 'HIGH'}
                  </Tag>
                </div>
                <div>
                  <strong>Gas Efficiency:</strong>{' '}
                  <Progress percent={analysis.gasEfficiency} size="small" />
                </div>
              </Space>
            </Card>
          </Col>
        </Row>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={
          <Space>
            <SwapOutlined />
            <span>DEX Trading Journal</span>
          </Space>
        }
        extra={
          <Space>
            <Search
              placeholder="Enter wallet address"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              style={{ width: 300 }}
              enterButton="Load"
              onSearch={fetchTrades}
            />
            <Select
              value={timeRange}
              onChange={setTimeRange}
              style={{ width: 120 }}
            >
              <Option value="24h">24 Hours</Option>
              <Option value="7d">7 Days</Option>
              <Option value="30d">30 Days</Option>
              <Option value="90d">90 Days</Option>
              <Option value="1y">1 Year</Option>
            </Select>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
              Add Trade
            </Button>
          </Space>
        }
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Card>

      <Modal
        title="Add New Trade"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddTrade}
        >
          <Form.Item name="txHash" label="Transaction Hash" rules={[{ required: true }]}>
            <Input placeholder="0x..." />
          </Form.Item>
          <Form.Item name="walletAddress" label="Wallet Address" initialValue={walletAddress} rules={[{ required: true }]}>
            <Input placeholder="0x..." />
          </Form.Item>
          <Form.Item name="tradeType" label="Trade Type" initialValue="swap" rules={[{ required: true }]}>
            <Select>
              <Option value="swap">Swap</Option>
              <Option value="add_liquidity">Add Liquidity</Option>
              <Option value="remove_liquidity">Remove Liquidity</Option>
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="fromToken" label="From Token" rules={[{ required: true }]}>
                <Select>
                  {tokens.map(t => <Option key={t} value={t}>{t}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="fromAmount" label="Amount" rules={[{ required: true }]}>
                <Input type="number" step="0.0001" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="toToken" label="To Token" rules={[{ required: true }]}>
                <Select>
                  {tokens.map(t => <Option key={t} value={t}>{t}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="toAmount" label="Received Amount" rules={[{ required: true }]}>
                <Input type="number" step="0.0001" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="chain" label="Chain" rules={[{ required: true }]}>
                <Select>
                  {chains.map(c => <Option key={c} value={c}>{c}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="dex" label="DEX" rules={[{ required: true }]}>
                <Select>
                  {dexes.map(d => <Option key={d} value={d}>{d}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="gasFee" label="Gas Fee (USD)" initialValue={0}>
                <Input type="number" step="0.01" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="slippage" label="Slippage %" initialValue={0.5}>
                <Input type="number" step="0.1" max="100" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Add Trade
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DexTradingJournal;
