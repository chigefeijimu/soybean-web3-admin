import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Tabs, Input, Select, Button, Row, Col, Statistic, Progress, Space, Spin, Alert, Divider, List, Badge, Empty, Slider, Modal, Form, message } from 'antd';
import { LineChartOutlined, SwapOutlined, SearchOutlined, ArrowUpOutlined, ArrowDownOutlined, WalletOutlined, GlobalOutlined, ThunderboltOutlined, FireOutlined, FilterOutlined, SyncOutlined, DollarOutlined, PercentageOutlined, BankOutlined } from '@ant-design/icons';
import type { TabsProps } from 'antd';
import ReactECharts from 'echarts-for-react';

const { Option } = Select;
const { Search } = Input;

interface PoolDetail {
  address: string;
  chain: string;
  dex: string;
  tokenPair: string;
  token0: string;
  token1: string;
  tvl: number;
  volume24h: number;
  fees24h: number;
  apy: number;
  token0Price: number;
  token1Price: number;
  token0Reserves: string;
  token1Reserves: string;
  liquidityScore: number;
  change24h: number;
  createdAt: number;
}

interface TrendingPool {
  address: string;
  tokenPair: string;
  chain: string;
  dex: string;
  tvl: number;
  volumeChange: number;
  apy: number;
  trendingScore: number;
}

interface PoolStats {
  totalPools: number;
  totalTvl: number;
  totalVolume24h: number;
  totalFees24h: number;
  avgApy: number;
  chainDistribution: Record<string, number>;
  dexDistribution: Record<string, number>;
  topTokens: string[];
}

interface ImpermanentLoss {
  impermanentLoss: number;
  impermanentLossPercent: number;
  severity: string;
  currentValue: number;
  hodlValue: number;
}

const LiquidityPoolScanner: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [pools, setPools] = useState<PoolDetail[]>([]);
  const [trendingPools, setTrendingPools] = useState<TrendingPool[]>([]);
  const [poolStats, setPoolStats] = useState<PoolStats | null>(null);
  const [selectedChain, setSelectedChain] = useState<string>('all');
  const [selectedDex, setSelectedDex] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('tvl');
  const [minTvl, setMinTvl] = useState<number>(0);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPool, setSelectedPool] = useState<PoolDetail | null>(null);
  const [ilModalVisible, setIlModalVisible] = useState(false);
  const [ilResult, setIlResult] = useState<ImpermanentLoss | null>(null);
  const [ilForm] = Form.useForm();

  const chains = ['all', 'ethereum', 'polygon', 'arbitrum', 'optimism', 'bsc', 'base', 'avalanche'];
  const dexes = ['all', 'uniswap-v3', 'uniswap-v2', 'sushiswap', 'curve', 'balancer', 'pancakeswap', 'quickswap', 'aerodrome', 'velodrome'];

  useEffect(() => {
    fetchPools();
    fetchTrendingPools();
    fetchPoolStats();
  }, [selectedChain, selectedDex, sortBy, minTvl, page]);

  const fetchPools = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedChain !== 'all') params.append('chain', selectedChain);
      if (selectedDex !== 'all') params.append('dex', selectedDex);
      params.append('sortBy', sortBy);
      params.append('minTvl', minTvl.toString());
      params.append('page', page.toString());
      params.append('limit', '20');
      
      // Mock data
      const mockPools: PoolDetail[] = generateMockPools(20);
      setPools(mockPools);
      setTotal(500);
    } catch (error) {
      message.error('Failed to fetch pools');
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendingPools = async () => {
    const mockTrending: TrendingPool[] = [
      { address: '0x1234', tokenPair: 'ARB/ETH', chain: 'arbitrum', dex: 'uniswap-v3', tvl: 8500000, volumeChange: 15.5, apy: 45.2, trendingScore: 95 },
      { address: '0x2345', tokenPair: 'OP/ETH', chain: 'optimism', dex: 'velodrome', tvl: 12000000, volumeChange: 12.3, apy: 38.5, trendingScore: 88 },
      { address: '0x3456', tokenPair: 'LDO/ETH', chain: 'ethereum', dex: 'uniswap-v3', tvl: 45000000, volumeChange: 8.7, apy: 22.1, trendingScore: 82 },
      { address: '0x4567', tokenPair: 'UNI/ETH', chain: 'ethereum', dex: 'uniswap-v3', tvl: 28000000, volumeChange: -5.2, apy: 18.5, trendingScore: 75 },
      { address: '0x5678', tokenPair: 'MATIC/ETH', chain: 'polygon', dex: 'quickswap', tvl: 6200000, volumeChange: 22.1, apy: 52.3, trendingScore: 92 },
    ];
    setTrendingPools(mockTrending);
  };

  const fetchPoolStats = async () => {
    const mockStats: PoolStats = {
      totalPools: 15234,
      totalTvl: 125000000000,
      totalVolume24h: 8500000000,
      totalFees24h: 25500000,
      avgApy: 28.5,
      chainDistribution: { ethereum: 45, arbitrum: 18, optimism: 12, polygon: 10, base: 8, avalanche: 4, bsc: 3 },
      dexDistribution: { uniswapv3: 35, sushiswap: 20, curves: 12, pancakeswap: 10, quickswap: 8, balancer: 6, aerodrome: 5, velodrome: 4 },
      topTokens: ['ETH', 'USDC', 'USDT', 'WBTC', 'UNI', 'LINK', 'AAVE', 'CRV', 'MATIC', 'LDO'],
    };
    setPoolStats(mockStats);
  };

  const generateMockPools = (count: number): PoolDetail[] => {
    const tokenPairs = [
      { pair: 'ETH/USDC', t0: 'ETH', t1: 'USDC' },
      { pair: 'ETH/USDT', t0: 'ETH', t1: 'USDT' },
      { pair: 'WBTC/USDC', t0: 'WBTC', t1: 'USDC' },
      { pair: 'USDC/USDT', t0: 'USDC', t1: 'USDT' },
      { pair: 'ETH/WBTC', t0: 'ETH', t1: 'WBTC' },
      { pair: 'UNI/ETH', t0: 'UNI', t1: 'ETH' },
      { pair: 'LINK/ETH', t0: 'LINK', t1: 'ETH' },
      { pair: 'AAVE/ETH', t0: 'AAVE', t1: 'ETH' },
    ];
    
    return Array.from({ length: count }, (_, i) => {
      const token = tokenPairs[i % tokenPairs.length];
      const chain = chains[Math.floor(Math.random() * 7) + 1];
      const dex = dexes[Math.floor(Math.random() * 10) + 1];
      const tvl = Math.random() * 50000000 + 100000;
      const volume = tvl * (Math.random() * 0.3 + 0.05);
      const fees = volume * 0.003;
      const apy = (fees * 365 / tvl) * 100 * (Math.random() * 3 + 1);
      
      return {
        address: `0x${(i + 1000).toString(16).padStart(40, '0')}`,
        chain,
        dex,
        tokenPair: token.pair,
        token0: token.t0,
        token1: token.t1,
        tvl: Math.round(tvl * 100) / 100,
        volume24h: Math.round(volume * 100) / 100,
        fees24h: Math.round(fees * 100) / 100,
        apy: Math.round(apy * 100) / 100,
        token0Price: Math.random() * 100 + 1,
        token1Price: Math.random() * 10000 + 1,
        token0Reserves: Math.random() * 1000000 + 1000 + '',
        token1Reserves: Math.random() * 10000000 + 10000 + '',
        liquidityScore: Math.round(Math.random() * 30 + 70),
        change24h: Math.round((Math.random() * 20 - 10) * 100) / 100,
        createdAt: Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000),
      };
    });
  };

  const searchPools = async (query: string) => {
    if (!query) return;
    setLoading(true);
    try {
      const mockResults: PoolDetail[] = generateMockPools(5).map(p => ({ ...p, tokenPair: `${query.toUpperCase()}/USDC` }));
      setPools(mockResults);
    } finally {
      setLoading(false);
    }
  };

  const calculateIL = async (values: any) => {
    const { token0Amount, token1Amount, initialPrice, currentPrice } = values;
    // Mock IL calculation
    const priceRatio = currentPrice / initialPrice;
    const sqrtPriceRatio = Math.sqrt(priceRatio);
    const IL = (2 * sqrtPriceRatio / (1 + priceRatio)) - 1;
    const ILPercent = IL * 100;
    const hodlValue = token0Amount * initialPrice + token1Amount;
    const currentValue = token0Amount * currentPrice + token1Amount;
    
    let severity = 'none';
    if (Math.abs(ILPercent) > 50) severity = 'extreme';
    else if (Math.abs(ILPercent) > 25) severity = 'high';
    else if (Math.abs(ILPercent) > 10) severity = 'medium';
    else if (Math.abs(ILPercent) > 3) severity = 'low';
    
    setIlResult({
      impermanentLoss: Math.round(IL * 10000) / 100,
      impermanentLossPercent: Math.round(ILPercent * 100) / 100,
      severity,
      currentValue: Math.round(currentValue * 100) / 100,
      hodlValue: Math.round(hodlValue * 100) / 100,
    });
  };

  const getChainColor = (chain: string) => {
    const colors: Record<string, string> = {
      ethereum: '#627EEA',
      polygon: '#8247E5',
      arbitrum: '#28A0F0',
      optimism: '#FF0420',
      bsc: '#F3BA2F',
      base: '#0052FF',
      avalanche: '#E84142',
      solana: '#9945FF',
    };
    return colors[chain] || '#888';
  };

  const getDexColor = (dex: string) => {
    const colors: Record<string, string> = {
      'uniswap-v3': '#FF007A',
      'uniswap-v2': '#FF007A',
      sushiswap: '#FA52A0',
      curve: '#FF6F61',
      balancer: '#1E1E1E',
      pancakeswap: '#F0B90B',
      quickswap: '#5942D6',
      aerodrome: '#3A3A3A',
      velodrome: '#5C5CFF',
    };
    return colors[dex] || '#888';
  };

  const columns = [
    {
      title: 'Pool',
      dataIndex: 'tokenPair',
      key: 'tokenPair',
      render: (text: string, record: PoolDetail) => (
        <Space>
          <SwapOutlined />
          <span style={{ fontWeight: 600 }}>{text}</span>
        </Space>
      ),
    },
    {
      title: 'Chain',
      dataIndex: 'chain',
      key: 'chain',
      render: (chain: string) => (
        <Tag color={getChainColor(chain)}>{chain.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'DEX',
      dataIndex: 'dex',
      key: 'dex',
      render: (dex: string) => (
        <Tag style={{ background: getDexColor(dex), color: '#fff' }}>{dex}</Tag>
      ),
    },
    {
      title: 'TVL',
      dataIndex: 'tvl',
      key: 'tvl',
      render: (tvl: number) => (
        <span style={{ fontWeight: 600 }}>${tvl.toLocaleString()}</span>
      ),
      sorter: (a: PoolDetail, b: PoolDetail) => a.tvl - b.tvl,
    },
    {
      title: 'Volume 24h',
      dataIndex: 'volume24h',
      key: 'volume24h',
      render: (vol: number) => `$${vol.toLocaleString()}`,
    },
    {
      title: 'APY',
      dataIndex: 'apy',
      key: 'apy',
      render: (apy: number) => (
        <Tag color={apy > 30 ? 'green' : apy > 15 ? 'blue' : 'default'}>
          {apy.toFixed(2)}%
        </Tag>
      ),
      sorter: (a: PoolDetail, b: PoolDetail) => a.apy - b.apy,
    },
    {
      title: 'Fees 24h',
      dataIndex: 'fees24h',
      key: 'fees24h',
      render: (fees: number) => `$${fees.toLocaleString()}`,
    },
    {
      title: '24h Change',
      dataIndex: 'change24h',
      key: 'change24h',
      render: (change: number) => (
        <span style={{ color: change >= 0 ? '#52c41a' : '#ff4d4f' }}>
          {change >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {Math.abs(change).toFixed(2)}%
        </span>
      ),
    },
    {
      title: 'Score',
      dataIndex: 'liquidityScore',
      key: 'liquidityScore',
      render: (score: number) => (
        <Progress 
          percent={score} 
          size="small" 
          status={score >= 80 ? 'success' : score >= 60 ? 'normal' : 'exception'}
          strokeColor={score >= 80 ? '#52c41a' : score >= 60 ? '#1890ff' : '#ff4d4f'}
        />
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: PoolDetail) => (
        <Button type="link" onClick={() => setSelectedPool(record)}>
          Details
        </Button>
      ),
    },
  ];

  const chainChartOption = {
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      data: poolStats ? Object.entries(poolStats.chainDistribution).map(([name, value]) => ({
        name: name.toUpperCase(),
        value
      })) : [],
    }],
  };

  const dexChartOption = {
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      data: poolStats ? Object.entries(poolStats.dexDistribution).map(([name, value]) => ({
        name: name.toUpperCase(),
        value
      })) : [],
    }],
  };

  const tabItems: TabsProps['items'] = [
    {
      key: 'pools',
      label: (
        <span>
          <SwapOutlined /> Pool List
        </span>
      ),
      children: (
        <div>
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={8}>
              <Select
                style={{ width: '100%' }}
                value={selectedChain}
                onChange={setSelectedChain}
                placeholder="Select Chain"
              >
                {chains.map(chain => (
                  <Option key={chain} value={chain}>
                    {chain === 'all' ? 'All Chains' : chain.toUpperCase()}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={8}>
              <Select
                style={{ width: '100%' }}
                value={selectedDex}
                onChange={setSelectedDex}
                placeholder="Select DEX"
              >
                {dexes.map(dex => (
                  <Option key={dex} value={dex}>
                    {dex === 'all' ? 'All DEXes' : dex}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={8}>
              <Select
                style={{ width: '100%' }}
                value={sortBy}
                onChange={setSortBy}
              >
                <Option value="tvl">Sort by TVL</Option>
                <Option value="volume">Sort by Volume</Option>
                <Option value="apy">Sort by APY</Option>
                <Option value="fees">Sort by Fees</Option>
              </Select>
            </Col>
          </Row>
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24}>
              <Search
                placeholder="Search by token pair or address"
                enterButton={<><SearchOutlined /> Search</>}
                onSearch={searchPools}
                style={{ maxWidth: 500 }}
              />
            </Col>
          </Row>
          <Table
            columns={columns}
            dataSource={pools}
            rowKey="address"
            loading={loading}
            pagination={{
              current: page,
              pageSize: 20,
              total: total,
              onChange: (p) => setPage(p),
              showSizeChanger: false,
            }}
            scroll={{ x: 1000 }}
          />
        </div>
      ),
    },
    {
      key: 'trending',
      label: (
        <span>
          <FireOutlined /> Trending Pools
        </span>
      ),
      children: (
        <List
          grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4 }}
          dataSource={trendingPools}
          renderItem={(item) => (
            <List.Item>
              <Card 
                hoverable
                actions={[
                  <Button type="link" onClick={() => setSelectedPool(item as any)}>View Details</Button>,
                ]}
              >
                <Card.Meta
                  title={
                    <Space>
                      <SwapOutlined /> {item.tokenPair}
                    </Space>
                  }
                  description={
                    <div>
                      <Tag color={getChainColor(item.chain)}>{item.chain.toUpperCase()}</Tag>
                      <Tag style={{ background: getDexColor(item.dex), color: '#fff' }}>{item.dex}</Tag>
                      <Divider style={{ margin: '8px 0' }} />
                      <Row>
                        <Col span={12}>
                          <Statistic 
                            title="TVL" 
                            value={item.tvl} 
                            prefix="$" 
                            valueStyle={{ fontSize: 16 }}
                          />
                        </Col>
                        <Col span={12}>
                          <Statistic 
                            title="APY" 
                            value={item.apy} 
                            suffix="%" 
                            valueStyle={{ fontSize: 16, color: '#52c41a' }}
                          />
                        </Col>
                      </Row>
                      <Divider style={{ margin: '8px 0' }} />
                      <Space>
                        <span style={{ color: item.volumeChange >= 0 ? '#52c41a' : '#ff4d4f' }}>
                          {item.volumeChange >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />} 
                          {' '}{Math.abs(item.volumeChange).toFixed(1)}%
                        </span>
                        <Badge 
                          count={item.trendingScore} 
                          style={{ backgroundColor: '#f5222d' }}
                          title="Trending Score"
                        />
                      </Space>
                    </div>
                  }
                />
              </Card>
            </List.Item>
          )}
        />
      ),
    },
    {
      key: 'stats',
      label: (
        <span>
          <LineChartOutlined /> Statistics
        </span>
      ),
      children: poolStats && (
        <div>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Total Pools"
                  value={poolStats.totalPools}
                  prefix={<BankOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Total TVL"
                  value={poolStats.totalTvl}
                  prefix="$"
                  precision={0}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="24h Volume"
                  value={poolStats.totalVolume24h}
                  prefix="$"
                  precision={0}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Average APY"
                  value={poolStats.avgApy}
                  suffix="%"
                  prefix={<PercentageOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
          </Row>
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} md={12}>
              <Card title="Chain Distribution">
                <ReactECharts option={chainChartOption} style={{ height: 300 }} />
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card title="DEX Distribution">
                <ReactECharts option={dexChartOption} style={{ height: 300 }} />
              </Card>
            </Col>
          </Row>
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24}>
              <Card title="Top Tokens by TVL">
                <Space wrap>
                  {poolStats.topTokens.map(token => (
                    <Tag key={token} color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>
                      {token}
                    </Tag>
                  ))}
                </Space>
              </Card>
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: 'tools',
      label: (
        <span>
          <ThunderboltOutlined /> Tools
        </span>
      ),
      children: (
        <div>
          <Card title="Impermanent Loss Calculator" style={{ maxWidth: 600 }}>
            <Form
              form={ilForm}
              layout="vertical"
              onFinish={calculateIL}
            >
              <Form.Item
                label="Token0 Amount"
                name="token0Amount"
                rules={[{ required: true, message: 'Please enter token0 amount' }]}
              >
                <Input type="number" placeholder="e.g., 1" />
              </Form.Item>
              <Form.Item
                label="Token1 Amount (USD)"
                name="token1Amount"
                rules={[{ required: true, message: 'Please enter token1 amount' }]}
              >
                <Input type="number" placeholder="e.g., 3000" />
              </Form.Item>
              <Form.Item
                label="Initial Price (USD)"
                name="initialPrice"
                rules={[{ required: true, message: 'Please enter initial price' }]}
              >
                <Input type="number" placeholder="e.g., 3000" />
              </Form.Item>
              <Form.Item
                label="Current Price (USD)"
                name="currentPrice"
                rules={[{ required: true, message: 'Please enter current price' }]}
              >
                <Input type="number" placeholder="e.g., 3500" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" icon={<CalculatorOutlined />}>
                  Calculate
                </Button>
              </Form.Item>
            </Form>
            {ilResult && (
              <div style={{ marginTop: 16 }}>
                <Alert
                  type={ilResult.severity === 'none' ? 'success' : ilResult.severity === 'low' ? 'info' : 'warning'}
                  message={`Impermanent Loss: ${ilResult.impermanentLossPercent.toFixed(2)}%`}
                  description={
                    <div>
                      <p>Severity: <Tag color={ilResult.severity === 'none' ? 'green' : ilResult.severity === 'low' ? 'blue' : 'orange'}>
                        {ilResult.severity.toUpperCase()}
                      </Tag></p>
                      <p>HODL Value: ${ilResult.hodlValue.toLocaleString()}</p>
                      <p>LP Value: ${ilResult.currentValue.toLocaleString()}</p>
                    </div>
                  }
                />
              </div>
            )}
          </Card>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={
          <Space>
            <SwapOutlined style={{ fontSize: 24, color: '#1890ff' }} />
            <span style={{ fontSize: 20, fontWeight: 600 }}>Cross-chain Liquidity Pool Scanner</span>
          </Space>
        }
        extra={
          <Space>
            <Button icon={<SyncOutlined />} onClick={() => { fetchPools(); fetchTrendingPools(); fetchPoolStats(); }}>
              Refresh
            </Button>
          </Space>
        }
      >
        <Spin spinning={loading}>
          <Tabs items={tabItems} />
        </Spin>
      </Card>

      <Modal
        title="Pool Details"
        open={!!selectedPool}
        onCancel={() => setSelectedPool(null)}
        footer={null}
        width={700}
      >
        {selectedPool && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic title="Token Pair" value={selectedPool.tokenPair} />
              </Col>
              <Col span={12}>
                <Statistic title="Liquidity Score" value={selectedPool.liquidityScore} suffix="/100" />
              </Col>
              <Col span={12}>
                <Statistic title="TVL" value={selectedPool.tvl} prefix="$" />
              </Col>
              <Col span={12}>
                <Statistic title="24h Volume" value={selectedPool.volume24h} prefix="$" />
              </Col>
              <Col span={12}>
                <Statistic title="24h Fees" value={selectedPool.fees24h} prefix="$" />
              </Col>
              <Col span={12}>
                <Statistic title="APY" value={selectedPool.apy} suffix="%" valueStyle={{ color: '#52c41a' }} />
              </Col>
            </Row>
            <Divider />
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <strong>Token0:</strong> {selectedPool.token0} (${selectedPool.token0Price})
              </div>
              <div>
                <strong>Token1:</strong> {selectedPool.token1} (${selectedPool.token1Price})
              </div>
              <div>
                <strong>Chain:</strong> <Tag color={getChainColor(selectedPool.chain)}>{selectedPool.chain.toUpperCase()}</Tag>
              </div>
              <div>
                <strong>DEX:</strong> <Tag style={{ background: getDexColor(selectedPool.dex), color: '#fff' }}>{selectedPool.dex}</Tag>
              </div>
              <div>
                <strong>Address:</strong> <code>{selectedPool.address}</code>
              </div>
            </Space>
          </div>
        )}
      </Modal>
    </div>
  );
};

const CalculatorOutlined: React.FC = () => <span>🔢</span>;

export default LiquidityPoolScanner;
