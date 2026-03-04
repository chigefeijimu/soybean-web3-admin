import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Tabs, Input, Select, Button, Row, Col, Statistic, Progress, Space, Spin, Alert, Divider, List, Badge, Empty, Tooltip, Timeline, Radio, message, Modal, Form, DatePicker, Slider, Switch, Typography } from 'antd';
import { LineChartOutlined, WalletOutlined, GlobalOutlined, ThunderboltOutlined, SafetyCertificateOutlined, BankOutlined, SwapOutlined, DollarOutlined, PieChartOutlined, BarChartOutlined, ArrowUpOutlined, ArrowDownOutlined, CheckCircleOutlined, WarningOutlined, StarOutlined, CrownOutlined, TrophyOutlined, FireOutlined, ClockCircleOutlined, PlayCircleOutlined, PauseCircleOutlined, DeleteOutlined, PlusOutlined, CalculatorOutlined, ThunderboltOutlined as ZapOutlined, ArrowRightOutlined } from '@ant-design/icons';
import type { TabsProps } from 'antd';

const { Text, Title } = Typography;
import ReactECharts from 'echarts-for-react';
import { dcaBot, DcaStrategy, DcaPosition, DcaOpportunity, DcaStatistics, CreateStrategyDto } from '@/service/dcaBot';

const { Option } = Select;
const { Search } = Input;
const { RangePicker } = DatePicker;

const chainOptions = [
  { value: 'ethereum', label: 'Ethereum', icon: '⟐' },
  { value: 'polygon', label: 'Polygon', icon: '⬡' },
  { value: 'arbitrum', label: 'Arbitrum', icon: '◆' },
  { value: 'optimism', label: 'Optimism', icon: '⬤' },
  { value: 'bsc', label: 'BSC', icon: '⬡' },
  { value: 'base', label: 'Base', icon: '🔵' },
  { value: 'avalanche', label: 'Avalanche', icon: '🔺' },
];

const frequencyOptions = [
  { value: 'hourly', label: 'Hourly' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
];

const riskColors: Record<string, string> = {
  low: 'green',
  medium: 'orange',
  high: 'red',
};

const trendColors: Record<string, string> = {
  bullish: 'green',
  bearish: 'red',
  neutral: 'default',
};

const statusColors: Record<string, string> = {
  active: 'green',
  paused: 'orange',
  completed: 'blue',
  cancelled: 'red',
};

const DcaBot: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [walletAddress, setWalletAddress] = useState('');
  const [selectedChain, setSelectedChain] = useState<string>('ethereum');
  
  const [strategies, setStrategies] = useState<DcaStrategy[]>([]);
  const [positions, setPositions] = useState<DcaPosition[]>([]);
  const [opportunities, setOpportunities] = useState<DcaOpportunity[]>([]);
  const [statistics, setStatistics] = useState<DcaStatistics | null>(null);
  const [supportedChains, setSupportedChains] = useState<string[]>([]);
  const [supportedTokens, setSupportedTokens] = useState<Record<string, string[]>>({});
  
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createForm] = Form.useForm();
  const [analyzeModalVisible, setAnalyzeModalVisible] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<DcaOpportunity | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  useEffect(() => {
    fetchSupportedData();
  }, []);

  useEffect(() => {
    if (walletAddress) {
      fetchDashboardData();
    }
  }, [walletAddress]);

  const fetchSupportedData = async () => {
    try {
      const chains = await dcaBot.getSupportedChains();
      setSupportedChains(chains);
      
      const tokens = await dcaBot.getSupportedTokens();
      setSupportedTokens(tokens);
    } catch (error) {
      console.error('Failed to fetch supported data');
    }
  };

  const fetchDashboardData = async () => {
    if (!walletAddress) return;
    setLoading(true);
    try {
      const [strategiesRes, positionsRes, statsRes] = await Promise.all([
        dcaBot.getStrategies(walletAddress),
        dcaBot.getPositions(walletAddress),
        dcaBot.getStatistics(walletAddress),
      ]);
      setStrategies(strategiesRes.strategies);
      setPositions(positionsRes.positions);
      setStatistics(statsRes);
    } catch (error) {
      console.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      const result = await dcaBot.getOpportunities(selectedChain, 20);
      setOpportunities(result.opportunities);
    } catch (error) {
      message.error('Failed to fetch opportunities');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStrategy = async (values: any) => {
    try {
      const dto: CreateStrategyDto = {
        userAddress: walletAddress,
        fromToken: values.fromToken,
        toToken: values.toToken,
        chain: values.chain,
        amountPerPurchase: values.amountPerPurchase,
        frequency: values.frequency,
        totalPurchases: values.totalPurchases,
        startDate: values.startDate.format('YYYY-MM-DD'),
      };
      await dcaBot.createStrategy(dto);
      message.success('Strategy created successfully');
      setCreateModalVisible(false);
      createForm.resetFields();
      fetchDashboardData();
    } catch (error) {
      message.error('Failed to create strategy');
    }
  };

  const handlePauseStrategy = async (id: string) => {
    try {
      await dcaBot.pauseStrategy(id);
      message.success('Strategy paused');
      fetchDashboardData();
    } catch (error) {
      message.error('Failed to pause strategy');
    }
  };

  const handleResumeStrategy = async (id: string) => {
    try {
      await dcaBot.resumeStrategy(id);
      message.success('Strategy resumed');
      fetchDashboardData();
    } catch (error) {
      message.error('Failed to resume strategy');
    }
  };

  const handleDeleteStrategy = async (id: string) => {
    try {
      await dcaBot.deleteStrategy(id);
      message.success('Strategy deleted');
      fetchDashboardData();
    } catch (error) {
      message.error('Failed to delete strategy');
    }
  };

  const handleAnalyzeOpportunity = async (opp: DcaOpportunity) => {
    setSelectedOpportunity(opp);
    setAnalyzeModalVisible(true);
    setLoading(true);
    try {
      const result = await dcaBot.analyzeOpportunity(opp.fromToken, opp.toToken, opp.chain);
      setAnalysisResult(result);
    } catch (error) {
      message.error('Failed to analyze opportunity');
    } finally {
      setLoading(false);
    }
  };

  const strategyColumns = [
    {
      title: 'Strategy',
      dataIndex: 'id',
      key: 'strategy',
      render: (_: any, record: DcaStrategy) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.fromToken} → {record.toToken}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.chain}</Text>
        </Space>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amountPerPurchase',
      key: 'amount',
      render: (amount: number, record: DcaStrategy) => (
        <Text>${amount} {record.frequency}</Text>
      ),
    },
    {
      title: 'Progress',
      key: 'progress',
      render: (_: any, record: DcaStrategy) => (
        <Progress 
          percent={Math.round((record.completedPurchases / record.totalPurchases) * 100)} 
          size="small"
          format={(percent) => `${record.completedPurchases}/${record.totalPurchases}`}
        />
      ),
    },
    {
      title: 'Next Purchase',
      dataIndex: 'nextPurchaseTime',
      key: 'nextPurchase',
      render: (time: string) => new Date(time).toLocaleString(),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColors[status]}>{status.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: DcaStrategy) => (
        <Space>
          {record.status === 'active' && (
            <Button 
              type="text" 
              icon={<PauseCircleOutlined />} 
              onClick={() => handlePauseStrategy(record.id)}
            />
          )}
          {record.status === 'paused' && (
            <Button 
              type="text" 
              icon={<PlayCircleOutlined />} 
              onClick={() => handleResumeStrategy(record.id)}
            />
          )}
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDeleteStrategy(record.id)}
          />
        </Space>
      ),
    },
  ];

  const opportunityColumns = [
    {
      title: 'Pair',
      key: 'pair',
      render: (_: any, record: DcaOpportunity) => (
        <Space>
          <Text strong>{record.fromTokenSymbol}</Text>
          <ArrowRightOutlined />
          <Text>{record.toTokenSymbol}</Text>
        </Space>
      ),
    },
    {
      title: 'Chain',
      dataIndex: 'chain',
      key: 'chain',
      render: (chain: string) => <Tag>{chain}</Tag>,
    },
    {
      title: 'Current Price',
      dataIndex: 'currentPrice',
      key: 'currentPrice',
      render: (price: number) => `$${price.toFixed(2)}`,
    },
    {
      title: '7d Avg',
      dataIndex: 'avgPrice7d',
      key: 'avgPrice7d',
      render: (price: number) => `$${price.toFixed(2)}`,
    },
    {
      title: 'Trend',
      dataIndex: 'trend',
      key: 'trend',
      render: (trend: string) => (
        <Tag color={trendColors[trend]}>
          {trend === 'bullish' ? <ArrowUpOutlined /> : trend === 'bearish' ? <ArrowDownOutlined /> : null}
          {' '}{trend}
        </Tag>
      ),
    },
    {
      title: 'Volatility',
      dataIndex: 'volatility',
      key: 'volatility',
      render: (vol: number) => `${vol.toFixed(1)}%`,
    },
    {
      title: 'Est. APY',
      dataIndex: 'apy',
      key: 'apy',
      render: (apy: number) => <Text strong style={{ color: apy > 10 ? 'green' : undefined }}>{apy.toFixed(1)}%</Text>,
    },
    {
      title: 'Risk',
      dataIndex: 'risk',
      key: 'risk',
      render: (risk: string) => <Tag color={riskColors[risk]}>{risk}</Tag>,
    },
    {
      title: 'Confidence',
      dataIndex: 'confidence',
      key: 'confidence',
      render: (conf: number) => `${conf.toFixed(0)}%`,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: DcaOpportunity) => (
        <Button 
          type="link" 
          icon={<CalculatorOutlined />}
          onClick={() => handleAnalyzeOpportunity(record)}
        >
          Analyze
        </Button>
      ),
    },
  ];

  const { ArrowRightOutlined } = Icons;

  const dashboardTab: TabsProps['items'] = [
    {
      key: 'overview',
      label: 'Overview',
      children: (
        <Spin spinning={loading}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic 
                  title="Total Strategies" 
                  value={statistics?.totalStrategies || 0} 
                  prefix={<StarOutlined />} 
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic 
                  title="Active Strategies" 
                  value={statistics?.activeStrategies || 0} 
                  prefix={<PlayCircleOutlined />} 
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic 
                  title="Total Invested" 
                  value={statistics?.totalInvested || 0} 
                  prefix={<DollarOutlined />} 
                  precision={2}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic 
                  title="Total P&L" 
                  value={statistics?.totalPnL || 0} 
                  prefix={statistics?.totalPnL && statistics.totalPnL >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                  valueStyle={{ color: statistics && statistics.totalPnL >= 0 ? '#3f8600' : '#cf1322' }}
                  precision={2}
                />
              </Card>
            </Col>
          </Row>
          
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} lg={12}>
              <Card title="Chain Distribution">
                {statistics?.chainDistribution && Object.keys(statistics.chainDistribution).length > 0 ? (
                  <ReactECharts
                    option={{
                      tooltip: { trigger: 'item' },
                      series: [{
                        type: 'pie',
                        radius: '60%',
                        data: Object.entries(statistics.chainDistribution).map(([name, value]) => ({ name, value })),
                      }],
                    }}
                  />
                ) : (
                  <Empty description="No data" />
                )}
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="Token Distribution">
                {statistics?.tokenDistribution && Object.keys(statistics.tokenDistribution).length > 0 ? (
                  <ReactECharts
                    option={{
                      tooltip: { trigger: 'axis' },
                      xAxis: { type: 'category', data: Object.keys(statistics.tokenDistribution) },
                      yAxis: { type: 'value' },
                      series: [{
                        type: 'bar',
                        data: Object.values(statistics.tokenDistribution),
                      }],
                    }}
                  />
                ) : (
                  <Empty description="No data" />
                )}
              </Card>
            </Col>
          </Row>
        </Spin>
      ),
    },
    {
      key: 'strategies',
      label: 'Strategies',
      children: (
        <Spin spinning={loading}>
          <Card 
            extra={
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => setCreateModalVisible(true)}
              >
                Create Strategy
              </Button>
            }
          >
            <Table 
              columns={strategyColumns} 
              dataSource={strategies} 
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </Spin>
      ),
    },
    {
      key: 'positions',
      label: 'Positions',
      children: (
        <Spin spinning={loading}>
          <Card>
            <Table 
              columns={[
                {
                  title: 'Token',
                  dataIndex: 'token',
                  key: 'token',
                  render: (token: string, record: DcaPosition) => (
                    <Space direction="vertical" size={0}>
                      <Text strong>{token}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>{record.chain}</Text>
                    </Space>
                  ),
                },
                {
                  title: 'Total Amount',
                  dataIndex: 'totalAmount',
                  key: 'totalAmount',
                },
                {
                  title: 'Avg Price',
                  dataIndex: 'averagePrice',
                  key: 'averagePrice',
                  render: (price: number) => `$${price.toFixed(2)}`,
                },
                {
                  title: 'Current Price',
                  dataIndex: 'currentPrice',
                  key: 'currentPrice',
                  render: (price: number) => `$${price.toFixed(2)}`,
                },
                {
                  title: 'P&L',
                  key: 'pnl',
                  render: (_: any, record: DcaPosition) => (
                    <Space>
                      <Text style={{ color: record.pnl >= 0 ? '#3f8600' : '#cf1322' }}>
                        {record.pnl >= 0 ? '+' : ''}{record.pnl.toFixed(2)}
                      </Text>
                      <Text type="secondary">
                        ({record.pnlPercentage >= 0 ? '+' : ''}{record.pnlPercentage.toFixed(2)}%)
                      </Text>
                    </Space>
                  ),
                },
              ]}
              dataSource={positions}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </Spin>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Row gutter={[16, 16]} align="middle">
          <Col flex="auto">
            <Typography.Title level={3} style={{ margin: 0 }}>
              <ZapOutlined style={{ marginRight: 8 }} />
              DCA Bot
            </Typography.Title>
          </Col>
          <Col>
            <Space>
              <Input.Search
                placeholder="Enter wallet address"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                onSearch={fetchDashboardData}
                style={{ width: 300 }}
                enterButton="Load"
              />
            </Space>
          </Col>
        </Row>
      </Card>

      <Card style={{ marginTop: 16 }}>
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          items={dashboardTab}
        />
      </Card>

      <Card style={{ marginTop: 16 }} title="DCA Opportunities">
        <Row gutter={[16, 16]} align="middle">
          <Col>
            <Select
              value={selectedChain}
              onChange={setSelectedChain}
              style={{ width: 150 }}
            >
              {chainOptions.map(chain => (
                <Option key={chain.value} value={chain.value}>{chain.label}</Option>
              ))}
            </Select>
          </Col>
          <Col>
            <Button type="primary" onClick={fetchOpportunities}>
              Search Opportunities
            </Button>
          </Col>
        </Row>
        <Table 
          columns={opportunityColumns} 
          dataSource={opportunities} 
          rowKey={(record) => `${record.fromToken}-${record.toToken}-${record.chain}`}
          pagination={{ pageSize: 10 }}
          style={{ marginTop: 16 }}
        />
      </Card>

      <Modal
        title="Create DCA Strategy"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
      >
        <Form form={createForm} onFinish={handleCreateStrategy} layout="vertical">
          <Form.Item name="chain" label="Chain" rules={[{ required: true }]}>
            <Select>
              {chainOptions.map(chain => (
                <Option key={chain.value} value={chain.value}>{chain.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="fromToken" label="From Token" rules={[{ required: true }]}>
            <Input placeholder="e.g., USDC" />
          </Form.Item>
          <Form.Item name="toToken" label="To Token" rules={[{ required: true }]}>
            <Input placeholder="e.g., ETH" />
          </Form.Item>
          <Form.Item name="amountPerPurchase" label="Amount per Purchase" rules={[{ required: true }]}>
            <Input type="number" placeholder="e.g., 100" prefix="$" />
          </Form.Item>
          <Form.Item name="frequency" label="Frequency" rules={[{ required: true }]}>
            <Select>
              {frequencyOptions.map(freq => (
                <Option key={freq.value} value={freq.value}>{freq.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="totalPurchases" label="Total Purchases" rules={[{ required: true }]}>
            <Input type="number" placeholder="e.g., 30" />
          </Form.Item>
          <Form.Item name="startDate" label="Start Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Create Strategy
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Opportunity Analysis"
        open={analyzeModalVisible}
        onCancel={() => setAnalyzeModalVisible(false)}
        footer={null}
        width={700}
      >
        {selectedOpportunity && analysisResult && (
          <Spin spinning={loading}>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Alert
                  message={`${selectedOpportunity.fromToken} → ${selectedOpportunity.toToken} on ${selectedOpportunity.chain}`}
                  description={`Current Price: $${selectedOpportunity.currentPrice.toFixed(2)} | Trend: ${selectedOpportunity.trend} | Est. APY: ${selectedOpportunity.apy.toFixed(1)}%`}
                  type={selectedOpportunity.trend === 'bullish' ? 'success' : selectedOpportunity.trend === 'bearish' ? 'error' : 'info'}
                />
              </Col>
              <Col span={12}>
                <Card size="small" title="Historical Performance">
                  <Statistic 
                    title="Avg Price (7d)" 
                    value={analysisResult.historicalPerformance.avgPurchasePrice} 
                    prefix="$"
                    precision={2}
                  />
                  <Statistic 
                    title="Price Change" 
                    value={analysisResult.historicalPerformance.priceChange} 
                    prefix={analysisResult.historicalPerformance.priceChange >= 0 ? '+' : ''}
                    suffix="%"
                    valueStyle={{ color: analysisResult.historicalPerformance.priceChange >= 0 ? 'green' : 'red' }}
                  />
                  <Statistic 
                    title="Volatility" 
                    value={analysisResult.historicalPerformance.volatility} 
                    suffix="%"
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="Price Projections">
                  <Statistic title="Daily" value={analysisResult.projections.daily} prefix="$" precision={2} />
                  <Statistic title="Weekly" value={analysisResult.projections.weekly} prefix="$" precision={2} />
                  <Statistic title="Monthly" value={analysisResult.projections.monthly} prefix="$" precision={2} />
                  <Statistic title="Yearly" value={analysisResult.projections.yearly} prefix="$" precision={2} />
                </Card>
              </Col>
            </Row>
          </Spin>
        )}
      </Modal>
    </div>
  );
};

export default DcaBot;
