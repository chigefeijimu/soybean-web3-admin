import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Tabs, Input, Select, Button, Row, Col, Statistic, Progress, Space, Spin, Alert, Divider, List, Badge, Empty } from 'antd';
import { LineChartOutlined, LineOutlined, SwapOutlined, SafetyCertificateOutlined, SearchOutlined, ArrowUpOutlined, ArrowDownOutlined, WalletOutlined, GlobalOutlined, ThunderboltOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import type { TabsProps } from 'antd';
import ReactECharts from 'echarts-for-react';

const { Option } = Select;
const { Search } = Input;

interface CrossChainMetrics {
  symbol: string;
  chain: string;
  price: number;
  change24h: number;
  volume24h: number;
  liquidity: number;
  marketCap: number;
  holders: number;
  transfers24h: number;
}

interface ArbitrageOpportunity {
  symbol: string;
  buyChain: string;
  sellChain: string;
  buyPrice: number;
  sellPrice: number;
  priceDiff: number;
  potentialProfit: number;
  confidence: number;
  riskLevel: string;
}

interface TokenHealth {
  symbol: string;
  overallScore: number;
  liquidityScore: number;
  volatilityScore: number;
  adoptionScore: number;
  securityScore: number;
  riskLevel: string;
  factors: {
    liquidity: string;
    volatility: string;
    holders: string;
    transfers: string;
  };
}

interface TokenMetrics {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  change7d: number;
  marketCap: number;
  volume24h: number;
  ath: number;
  atl: number;
  circulatingSupply: number;
  totalSupply: number;
  holders: number;
  crossChainMetrics: CrossChainMetrics[];
  arbitrageOpportunities: ArbitrageOpportunity[];
  healthScore: TokenHealth;
}

interface MarketOverview {
  totalMarketCap: number;
  volume24h: number;
  btcDominance: number;
  ethDominance: number;
  defiTvl: number;
  tokensTracked: number;
  activeArbitrageCount: number;
  topGainers: { symbol: string; change: number; price: number }[];
  topLosers: { symbol: string; change: number; price: number }[];
}

const TokenMetricsAggregator: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [selectedToken, setSelectedToken] = useState('ETH');
  const [selectedChain, setSelectedChain] = useState<string>('all');
  const [metrics, setMetrics] = useState<TokenMetrics | null>(null);
  const [marketOverview, setMarketOverview] = useState<MarketOverview | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ symbol: string; name: string; chain: string }[]>([]);

  const chains = ['Ethereum', 'Polygon', 'Arbitrum', 'Optimism', 'BSC', 'Base', 'Avalanche'];
  const popularTokens = ['ETH', 'BTC', 'USDC', 'USDT', 'UNI', 'LINK', 'AAVE', 'MKR', 'CRV', 'LDO', 'ARB', 'OP', 'MATIC', 'SOL', 'BNB', 'AVAX', 'GMX', 'JOE'];

  useEffect(() => {
    fetchMarketOverview();
  }, []);

  useEffect(() => {
    if (selectedToken) {
      fetchTokenMetrics();
    }
  }, [selectedToken, selectedChain]);

  const fetchMarketOverview = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/web3/token-metrics/market-overview');
      const data = await response.json();
      setMarketOverview(data);
    } catch (error) {
      console.error('Failed to fetch market overview:', error);
    }
    setLoading(false);
  };

  const fetchTokenMetrics = async () => {
    setLoading(true);
    try {
      const chainParam = selectedChain !== 'all' ? `&chain=${selectedChain}` : '';
      const response = await fetch(`/api/web3/token-metrics/metrics?symbol=${selectedToken}${chainParam}`);
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error('Failed to fetch token metrics:', error);
    }
    setLoading(false);
  };

  const handleSearch = async (value: string) => {
    if (!value) return;
    try {
      const response = await fetch('/api/web3/token-metrics/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: value, limit: 10 }),
      });
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const formatNumber = (num: number, decimals: number = 2): string => {
    if (num >= 1e12) return (num / 1e12).toFixed(decimals) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(decimals) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(decimals) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(decimals) + 'K';
    return num.toFixed(decimals);
  };

  const formatCurrency = (num: number): string => {
    if (num >= 1) return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return '$' + num.toFixed(6);
  };

  const getRiskColor = (level: string): string => {
    const colors: Record<string, string> = {
      low: 'green', medium: 'orange', high: 'red', critical: 'magenta',
    };
    return colors[level] || 'default';
  };

  const getScoreColor = (score: number): string => {
    if (score >= 70) return '#52c41a';
    if (score >= 50) return '#faad14';
    if (score >= 30) return '#fa541c';
    return '#f5222d';
  };

  const crossChainColumns = [
    { title: 'Chain', dataIndex: 'chain', key: 'chain', render: (text: string) => <Tag color="blue">{text}</Tag> },
    { title: 'Price', dataIndex: 'price', key: 'price', render: (v: number) => formatCurrency(v) },
    { title: '24h Change', dataIndex: 'change24h', key: 'change24h', render: (v: number) => (
      <span style={{ color: v >= 0 ? '#52c41a' : '#f5222d' }}>
        {v >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {v.toFixed(2)}%
      </span>
    )},
    { title: 'Volume 24h', dataIndex: 'volume24h', key: 'volume24h', render: (v: number) => formatCurrency(v) },
    { title: 'Liquidity', dataIndex: 'liquidity', key: 'liquidity', render: (v: number) => formatCurrency(v) },
    { title: 'Holders', dataIndex: 'holders', key: 'holders', render: (v: number) => formatNumber(v, 0) },
    { title: 'Transfers 24h', dataIndex: 'transfers24h', key: 'transfers24h', render: (v: number) => formatNumber(v, 0) },
  ];

  const arbitrageColumns = [
    { title: 'Buy On', dataIndex: 'buyChain', key: 'buyChain', render: (text: string) => <Tag color="green">{text}</Tag> },
    { title: 'Sell On', dataIndex: 'sellChain', key: 'sellChain', render: (text: string) => <Tag color="red">{text}</Tag> },
    { title: 'Buy Price', dataIndex: 'buyPrice', key: 'buyPrice', render: (v: number) => formatCurrency(v) },
    { title: 'Sell Price', dataIndex: 'sellPrice', key: 'sellPrice', render: (v: number) => formatCurrency(v) },
    { title: 'Diff %', dataIndex: 'priceDiff', key: 'priceDiff', render: (v: number) => <Tag color={v > 3 ? 'red' : v > 1 ? 'orange' : 'green'}>{v.toFixed(2)}%</Tag> },
    { title: 'Est. Profit', dataIndex: 'potentialProfit', key: 'potentialProfit', render: (v: number) => <span style={{ color: '#52c41a', fontWeight: 'bold' }}>{v.toFixed(2)}%</span> },
    { title: 'Confidence', dataIndex: 'confidence', key: 'confidence', render: (v: number) => <Progress percent={v} size="small" strokeColor={v > 70 ? '#52c41a' : v > 40 ? '#faad14' : '#f5222d'} /> },
    { title: 'Risk', dataIndex: 'riskLevel', key: 'riskLevel', render: (v: string) => <Tag color={getRiskColor(v)}>{v.toUpperCase()}</Tag> },
  ];

  const tabItems: TabsProps['items'] = [
    {
      key: 'overview',
      label: 'Overview',
      children: metrics && (
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Card title="Price Information" bordered={false}>
              <Statistic title="Current Price" value={metrics.price} prefix="$" precision={2} />
              <Divider />
              <Statistic title="24h Change" value={metrics.change24h} precision={2} prefix={metrics.change24h >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />} suffix="%" valueStyle={{ color: metrics.change24h >= 0 ? '#52c41a' : '#f5222d' }} />
              <Divider />
              <Statistic title="7d Change" value={metrics.change7d} precision={2} prefix={metrics.change7d >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />} suffix="%" valueStyle={{ color: metrics.change7d >= 0 ? '#52c41a' : '#f5222d' }} />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card title="Market Data" bordered={false}>
              <Statistic title="Market Cap" value={metrics.marketCap} prefix="$" formatter={(v) => formatNumber(v as number)} />
              <Divider />
              <Statistic title="Volume 24h" value={metrics.volume24h} prefix="$" formatter={(v) => formatNumber(v as number)} />
              <Divider />
              <Statistic title="Holders" value={metrics.holders} formatter={(v) => formatNumber(v as number, 0)} />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card title="Supply Info" bordered={false}>
              <Statistic title="Circulating Supply" value={metrics.circulatingSupply} formatter={(v) => formatNumber(v as number, 0)} />
              <Divider />
              <Statistic title="Total Supply" value={metrics.totalSupply} formatter={(v) => formatNumber(v as number, 0)} />
              <Divider />
              <Statistic title="ATH / ATL" value={metrics.ath} prefix="$" precision={2} />
              <p style={{ color: '#888', fontSize: 12 }}>ATL: {formatCurrency(metrics.atl)}</p>
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'cross-chain',
      label: 'Cross-Chain Metrics',
      children: metrics && (
        <Card title={`Cross-Chain Metrics for ${metrics.symbol}`} bordered={false}>
          <Table
            dataSource={metrics.crossChainMetrics}
            columns={crossChainColumns}
            rowKey="chain"
            pagination={false}
            size="small"
          />
        </Card>
      ),
    },
    {
      key: 'arbitrage',
      label: 'Arbitrage Opportunities',
      children: metrics && (
        <Card title={`Arbitrage Opportunities for ${metrics.symbol}`} bordered={false}>
          {metrics.arbitrageOpportunities.length > 0 ? (
            <Table
              dataSource={metrics.arbitrageOpportunities}
              columns={arbitrageColumns}
              rowKey={(r) => `${r.buyChain}-${r.sellChain}`}
              pagination={false}
              size="small"
            />
          ) : (
            <Empty description="No arbitrage opportunities found" />
          )}
        </Card>
      ),
    },
    {
      key: 'health',
      label: 'Health Score',
      children: metrics && (
        <Card title={`Health Score for ${metrics.symbol}`} bordered={false}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Card>
                <Statistic
                  title="Overall Health Score"
                  value={metrics.healthScore.overallScore}
                  suffix="/100"
                  valueStyle={{ color: getScoreColor(metrics.healthScore.overallScore), fontSize: 36 }}
                />
                <Tag color={getRiskColor(metrics.healthScore.riskLevel)} style={{ marginTop: 8 }}>
                  {metrics.healthScore.riskLevel.toUpperCase()} RISK
                </Tag>
              </Card>
            </Col>
            <Col xs={24} md={16}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <span>Liquidity Score: </span>
                  <Progress percent={metrics.healthScore.liquidityScore} strokeColor="#1890ff" />
                </div>
                <div>
                  <span>Volatility Score: </span>
                  <Progress percent={metrics.healthScore.volatilityScore} strokeColor="#52c41a" />
                </div>
                <div>
                  <span>Adoption Score: </span>
                  <Progress percent={metrics.healthScore.adoptionScore} strokeColor="#722ed1" />
                </div>
                <div>
                  <span>Security Score: </span>
                  <Progress percent={metrics.healthScore.securityScore} strokeColor="#13c2c2" />
                </div>
              </Space>
            </Col>
          </Row>
          <Divider>Health Factors</Divider>
          <List
            size="small"
            dataSource={Object.entries(metrics.healthScore.factors)}
            renderItem={([key, value]) => (
              <List.Item>
                <Tag color={value === 'Healthy' || value === 'Strong' || value === 'Active' || value === 'Stable' ? 'green' : 'orange'}>
                  {key.toUpperCase()}
                </Tag>
                {value}
              </List.Item>
            )}
          />
        </Card>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <h1 style={{ margin: 0 }}><GlobalOutlined /> Cross-chain Token Metrics Aggregator</h1>
          <p style={{ margin: 0, color: '#888' }}>Aggregate and analyze token metrics across multiple blockchain chains</p>
        </Col>
        <Col>
          <Button type="primary" icon={<SearchOutlined />} onClick={fetchMarketOverview}>
            Refresh Data
          </Button>
        </Col>
      </Row>

      {marketOverview && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} md={6}>
            <Card>
              <Statistic title="Total Market Cap" value={marketOverview.totalMarketCap} prefix="$" formatter={(v) => formatNumber(v as number)} />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card>
              <Statistic title="24h Volume" value={marketOverview.volume24h} prefix="$" formatter={(v) => formatNumber(v as number)} />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card>
              <Statistic title="BTC Dominance" value={marketOverview.btcDominance} suffix="%" />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card>
              <Statistic title="Active Arbitrage" value={marketOverview.activeArbitrageCount} prefix={<ThunderboltOutlined />} />
            </Card>
          </Col>
        </Row>
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}>
          <Card title="Select Token" bordered={false}>
            <Space>
              <Select
                value={selectedToken}
                onChange={setSelectedToken}
                style={{ width: 200 }}
                showSearch
              >
                {popularTokens.map(token => (
                  <Option key={token} value={token}>{token}</Option>
                ))}
              </Select>
              <Select
                value={selectedChain}
                onChange={setSelectedChain}
                style={{ width: 150 }}
              >
                <Option value="all">All Chains</Option>
                {chains.map(chain => (
                  <Option key={chain} value={chain}>{chain}</Option>
                ))}
              </Select>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Search Tokens" bordered={false}>
            <Search
              placeholder="Search by symbol or name"
              onSearch={handleSearch}
              enterButton={<SearchOutlined />}
              style={{ width: '100%' }}
            />
            {searchResults.length > 0 && (
              <div style={{ marginTop: 8 }}>
                {searchResults.slice(0, 5).map(result => (
                  <Tag
                    key={`${result.symbol}-${result.chain}`}
                    style={{ marginBottom: 4, cursor: 'pointer' }}
                    onClick={() => {
                      setSelectedToken(result.symbol);
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                  >
                    {result.symbol} - {result.chain}
                  </Tag>
                ))}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Spin spinning={loading}>
        {metrics ? (
          <Card bordered={false}>
            <Tabs items={tabItems} />
          </Card>
        ) : (
          <Card>
            <Empty description="Select a token to view metrics" />
          </Card>
        )}
      </Spin>
    </div>
  );
};

export default TokenMetricsAggregator;
