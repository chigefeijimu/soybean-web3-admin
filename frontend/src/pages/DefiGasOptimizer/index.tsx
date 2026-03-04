import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Tabs, Input, Select, Button, Row, Col, Statistic, Progress, Space, Spin, Alert, Divider, List, Badge, Empty, Tooltip, Timeline, Radio, InputNumber, message } from 'antd';
import { LineChartOutlined, LineOutlined, SwapOutlined, SafetyCertificateOutlined, SearchOutlined, ArrowUpOutlined, ArrowDownOutlined, WalletOutlined, GlobalOutlined, ThunderboltOutlined, ExclamationCircleOutlined, ClockCircleOutlined, DollarOutlined, RiseOutlined, FallOutlined, CarOutlined, RocketOutlined, BankOutlined, FireOutlined, CheckCircleOutlined, WarningOutlined } from '@ant-design/icons';
import type { TabsProps } from 'antd';
import ReactECharts from 'echarts-for-react';
import { defiGasOptimizer, OptimalGasResult, GasHistoryPoint, TimeSlotRecommendation, GasStrategy, GasComparison } from '@/service/defiGasOptimizer';

const { Option } = Select;
const { Search } = Input;

const chainOptions = [
  { value: '1', label: 'Ethereum', icon: '⟐' },
  { value: '137', label: 'Polygon', icon: '⬡' },
  { value: '42161', label: 'Arbitrum', icon: '◆' },
  { value: '10', label: 'Optimism', icon: '⬤' },
  { value: '56', label: 'BSC', icon: '⬡' },
  { value: '8453', label: 'Base', icon: '🔵' },
  { value: '43114', label: 'Avalanche', icon: '🔺' },
];

const actionOptions = [
  { value: 'swap', label: 'Token Swap', icon: <SwapOutlined /> },
  { value: 'add_liquidity', label: 'Add Liquidity', icon: <LineChartOutlined /> },
  { value: 'remove_liquidity', label: 'Remove Liquidity', icon: <LineOutlined /> },
  { value: 'supply', label: 'Supply (Lending)', icon: <BankOutlined /> },
  { value: 'borrow', label: 'Borrow', icon: <WalletOutlined /> },
  { value: 'stake', label: 'Stake', icon: <SafetyCertificateOutlined /> },
  { value: 'unstake', label: 'Unstake', icon: <SafetyCertificateOutlined /> },
  { value: 'claim', label: 'Claim Rewards', icon: <DollarOutlined /> },
  { value: 'transfer', label: 'Transfer', icon: <ArrowUpOutlined /> },
  { value: 'approve', label: 'Approve', icon: <CheckCircleOutlined /> },
  { value: 'nft_transfer', label: 'NFT Transfer', icon: <FireOutlined /> },
  { value: 'contract_deploy', label: 'Deploy Contract', icon: <RocketOutlined /> },
];

const DefiGasOptimizer: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('optimize');
  const [selectedChain, setSelectedChain] = useState('1');
  const [selectedAction, setSelectedAction] = useState('swap');
  const [strategyType, setStrategyType] = useState('balanced');
  const [timePreference, setTimePreference] = useState('normal');
  const [estimatedValue, setEstimatedValue] = useState<number>(1000);
  const [walletAddress, setWalletAddress] = useState('');
  
  const [optimizeResult, setOptimizeResult] = useState<OptimalGasResult | null>(null);
  const [gasHistory, setGasHistory] = useState<GasHistoryPoint[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlotRecommendation[]>([]);
  const [gasStrategy, setGasStrategy] = useState<GasStrategy | null>(null);
  const [gasComparison, setGasComparison] = useState<GasComparison | null>(null);
  const [historyDays, setHistoryDays] = useState(7);

  // Fetch optimize result
  const fetchOptimize = async () => {
    setLoading(true);
    try {
      const result = await defiGasOptimizer.optimizeGas({
        chainId: selectedChain,
        actionType: selectedAction,
        strategyType,
        timePreference,
        estimatedValue,
        walletAddress: walletAddress || undefined,
      });
      setOptimizeResult(result);
    } catch (error) {
      message.error('Failed to optimize gas');
    } finally {
      setLoading(false);
    }
  };

  // Fetch gas history
  const fetchHistory = async () => {
    setLoading(true);
    try {
      const result = await defiGasOptimizer.getGasHistory(selectedChain, historyDays);
      setGasHistory(result);
    } catch (error) {
      message.error('Failed to fetch gas history');
    } finally {
      setLoading(false);
    }
  };

  // Fetch optimal time
  const fetchOptimalTime = async () => {
    setLoading(true);
    try {
      const result = await defiGasOptimizer.getOptimalTime(selectedChain, 24);
      setTimeSlots(result);
    } catch (error) {
      message.error('Failed to fetch optimal time');
    } finally {
      setLoading(false);
    }
  };

  // Fetch gas strategy
  const fetchStrategy = async () => {
    if (!walletAddress) {
      message.warning('Please enter a wallet address');
      return;
    }
    setLoading(true);
    try {
      const result = await defiGasOptimizer.getGasStrategy(walletAddress, selectedChain);
      setGasStrategy(result);
    } catch (error) {
      message.error('Failed to fetch gas strategy');
    } finally {
      setLoading(false);
    }
  };

  // Fetch comparison
  const fetchComparison = async () => {
    setLoading(true);
    try {
      const result = await defiGasOptimizer.getGasComparison();
      setGasComparison(result);
    } catch (error) {
      message.error('Failed to fetch comparison');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'optimize') {
      fetchOptimize();
    } else if (activeTab === 'history') {
      fetchHistory();
    } else if (activeTab === 'time') {
      fetchOptimalTime();
    } else if (activeTab === 'strategy') {
      // Don't auto-fetch, wait for user input
    } else if (activeTab === 'compare') {
      fetchComparison();
    }
  }, [activeTab, selectedChain]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [historyDays]);

  // Chart options for gas history
  const getHistoryChartOption = () => {
    const times = gasHistory.map(h => new Date(h.timestamp).toLocaleString());
    const prices = gasHistory.map(h => h.avgGasPrice);

    return {
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: times, axisLabel: { fontSize: 10 } },
      yAxis: { type: 'value', name: 'Gas Price (Gwei)' },
      series: [{
        data: prices,
        type: 'line',
        smooth: true,
        areaStyle: { opacity: 0.3 },
        lineStyle: { color: '#1890ff' },
        itemStyle: { color: '#1890ff' },
      }],
    };
  };

  // Time slots table
  const timeSlotColumns = [
    {
      title: 'Hour (UTC)',
      dataIndex: 'hour',
      key: 'hour',
      render: (hour: number) => `${hour}:00`,
    },
    {
      title: 'Avg Gas Price',
      dataIndex: 'avgGasPrice',
      key: 'avgGasPrice',
      render: (price: number) => `${price.toFixed(3)} Gwei`,
    },
    {
      title: 'Recommendation',
      dataIndex: 'recommendation',
      key: 'recommendation',
      render: (rec: string) => {
        const color = rec === 'excellent' ? 'green' : rec === 'good' ? 'blue' : rec === 'fair' ? 'orange' : 'red';
        return <Tag color={color}>{rec.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Savings',
      dataIndex: 'savings',
      key: 'savings',
      render: (savings: number) => (
        <span style={{ color: savings > 0 ? '#52c41a' : '#ff4d4f' }}>
          {savings > 0 ? '+' : ''}{savings}%
        </span>
      ),
    },
  ];

  // Comparison table
  const comparisonColumns = [
    {
      title: 'Chain',
      dataIndex: 'chainName',
      key: 'chainName',
    },
    {
      title: 'Avg Gas Price',
      dataIndex: 'avgGasPrice',
      key: 'avgGasPrice',
      render: (price: number) => `${price} Gwei`,
    },
    {
      title: 'Swap Cost (USD)',
      dataIndex: 'costForSwap',
      key: 'costForSwap',
      render: (cost: number) => `$${cost.toFixed(4)}`,
    },
    {
      title: 'Recommendation',
      dataIndex: 'recommendation',
      key: 'recommendation',
      render: (rec: string) => {
        const color = rec.includes('Highly') ? 'green' : rec.includes('Recommended') ? 'blue' : rec.includes('Good') ? 'orange' : 'red';
        return <Tag color={color}>{rec}</Tag>;
      },
    },
  ];

  const tabItems: TabsProps['items'] = [
    {
      key: 'optimize',
      label: (
        <span>
          <ThunderboltOutlined /> Gas Optimizer
        </span>
      ),
      children: (
        <div>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Card title="Configuration" size="small">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <label>Chain</label>
                    <Select
                      value={selectedChain}
                      onChange={setSelectedChain}
                      style={{ width: '100%' }}
                    >
                      {chainOptions.map(c => (
                        <Option key={c.value} value={c.value}>
                          {c.icon} {c.label}
                        </Option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <label>Action Type</label>
                    <Select
                      value={selectedAction}
                      onChange={setSelectedAction}
                      style={{ width: '100%' }}
                    >
                      {actionOptions.map(a => (
                        <Option key={a.value} value={a.value}>
                          {a.icon} {a.label}
                        </Option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <label>Strategy</label>
                    <Radio.Group
                      value={strategyType}
                      onChange={e => setStrategyType(e.target.value)}
                      optionType="button"
                      buttonStyle="solid"
                    >
                      <Radio.Button value="conservative">Conservative</Radio.Button>
                      <Radio.Button value="balanced">Balanced</Radio.Button>
                      <Radio.Button value="aggressive">Aggressive</Radio.Button>
                    </Radio.Group>
                  </div>
                  <div>
                    <label>Time Preference</label>
                    <Radio.Group
                      value={timePreference}
                      onChange={e => setTimePreference(e.target.value)}
                      optionType="button"
                      buttonStyle="solid"
                    >
                      <Radio.Button value="urgent">Urgent</Radio.Button>
                      <Radio.Button value="normal">Normal</Radio.Button>
                      <Radio.Button value="flexible">Flexible</Radio.Button>
                    </Radio.Group>
                  </div>
                  <div>
                    <label>Estimated Value (USD)</label>
                    <InputNumber
                      value={estimatedValue}
                      onChange={v => setEstimatedValue(v || 1000)}
                      min={0}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label>Wallet Address (Optional)</label>
                    <Input
                      value={walletAddress}
                      onChange={e => setWalletAddress(e.target.value)}
                      placeholder="0x..."
                    />
                  </div>
                  <Button type="primary" onClick={fetchOptimize} loading={loading} block>
                    Optimize Gas
                  </Button>
                </Space>
              </Card>
            </Col>
            <Col xs={24} md={16}>
              {optimizeResult && (
                <Card title="Optimization Result" loading={loading}>
                  <Row gutter={[16, 16]}>
                    <Col xs={12} md={6}>
                      <Statistic
                        title="Recommended Gas Price"
                        value={optimizeResult.recommendedGasPrice}
                        suffix="Gwei"
                        prefix={<ThunderboltOutlined />}
                      />
                    </Col>
                    <Col xs={12} md={6}>
                      <Statistic
                        title="Est. Confirmation"
                        value={optimizeResult.estimatedConfirmationTime}
                        suffix="sec"
                        prefix={<ClockCircleOutlined />}
                      />
                    </Col>
                    <Col xs={12} md={6}>
                      <Statistic
                        title="Total Cost"
                        value={optimizeResult.totalCostUSD}
                        prefix="$"
                        precision={2}
                      />
                    </Col>
                    <Col xs={12} md={6}>
                      <Statistic
                        title="Potential Savings"
                        value={optimizeResult.savingsUSD}
                        prefix="$"
                        precision={2}
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </Col>
                  </Row>
                  <Divider />
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={8}>
                      <Statistic
                        title="Confidence"
                        value={optimizeResult.confidence}
                        suffix="%"
                        prefix={<SafetyCertificateOutlined />}
                      />
                    </Col>
                    <Col xs={24} md={8}>
                      <Tag color="blue" style={{ fontSize: 16, padding: '8px 16px' }}>
                        Strategy: {optimizeResult.strategy}
                      </Tag>
                    </Col>
                  </Row>
                  {optimizeResult.reasons.length > 0 && (
                    <>
                      <Divider>Reasons</Divider>
                      <List
                        size="small"
                        dataSource={optimizeResult.reasons}
                        renderItem={item => (
                          <List.Item>
                            <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                            {item}
                          </List.Item>
                        )}
                      />
                    </>
                  )}
                </Card>
              )}
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: 'history',
      label: (
        <span>
          <LineChartOutlined /> Gas History
        </span>
      ),
      children: (
        <div>
          <Card
            title="Gas Price History"
            extra={
              <Radio.Group
                value={historyDays}
                onChange={e => setHistoryDays(e.target.value)}
                size="small"
              >
                <Radio.Button value={7}>7D</Radio.Button>
                <Radio.Button value={14}>14D</Radio.Button>
                <Radio.Button value={30}>30D</Radio.Button>
              </Radio.Group>
            }
          >
            <ReactECharts option={getHistoryChartOption()} style={{ height: 300 }} />
          </Card>
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col xs={24} md={8}>
              <Card>
                <Statistic
                  title="Average Gas Price"
                  value={gasHistory.length > 0 
                    ? (gasHistory.reduce((a, b) => a + b.avgGasPrice, 0) / gasHistory.length).toFixed(2)
                    : 0}
                  suffix="Gwei"
                />
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card>
                <Statistic
                  title="Highest Gas Price"
                  value={gasHistory.length > 0 
                    ? Math.max(...gasHistory.map(h => h.avgGasPrice)).toFixed(2)
                    : 0}
                  suffix="Gwei"
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card>
                <Statistic
                  title="Lowest Gas Price"
                  value={gasHistory.length > 0 
                    ? Math.min(...gasHistory.map(h => h.avgGasPrice)).toFixed(2)
                    : 0}
                  suffix="Gwei"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: 'time',
      label: (
        <span>
          <ClockCircleOutlined /> Best Time
        </span>
      ),
      children: (
        <div>
          <Card title="Optimal Time Slots for Next 24 Hours">
            <Table
              dataSource={timeSlots}
              columns={timeSlotColumns}
              rowKey="hour"
              pagination={false}
              size="small"
            />
          </Card>
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={24}>
              <Card title="Time Recommendations">
                <Timeline
                  items={[
                    { color: 'green', children: 'Off-peak hours (UTC 0-6) typically have 30-50% lower gas prices' },
                    { color: 'blue', children: 'Peak hours (UTC 13-18) often see 2-3x higher gas prices' },
                    { color: 'orange', children: 'Weekends generally have lower gas prices than weekdays' },
                    { color: 'red', children: 'Avoid transactions during major market events or new token launches' },
                  ]}
                />
              </Card>
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: 'strategy',
      label: (
        <span>
          <WalletOutlined /> My Strategy
        </span>
      ),
      children: (
        <div>
          <Card>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <label>Wallet Address</label>
                <Input
                  value={walletAddress}
                  onChange={e => setWalletAddress(e.target.value)}
                  placeholder="Enter your wallet address"
                  addonAfter={
                    <Button type="link" onClick={fetchStrategy} style={{ padding: 0 }}>
                      Analyze
                    </Button>
                  }
                />
              </div>
            </Space>
          </Card>
          {gasStrategy && (
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              <Col xs={24} md={8}>
                <Card>
                  <Statistic
                    title="Recommended Strategy"
                    value={gasStrategy.recommendedStrategy}
                    prefix={<RocketOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card>
                  <Statistic
                    title="Avg Monthly Gas Spend"
                    value={gasStrategy.averageGasSpend}
                    prefix="$"
                    precision={2}
                  />
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card>
                  <Statistic
                    title="Projected Monthly Savings"
                    value={gasStrategy.projectedMonthlySavings}
                    prefix="$"
                    precision={2}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col xs={24}>
                <Card title="Personalized Tips">
                  <List
                    dataSource={gasStrategy.tips}
                    renderItem={(tip, index) => (
                      <List.Item>
                        <Badge count={index + 1} style={{ marginRight: 8 }} />
                        {tip}
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
            </Row>
          )}
        </div>
      ),
    },
    {
      key: 'compare',
      label: (
        <span>
          <GlobalOutlined /> Chain Compare
        </span>
      ),
      children: (
        <div>
          {gasComparison && (
            <>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Card>
                    <Statistic
                      title="Best Chain for Gas"
                      value={gasComparison.bestChain}
                      prefix={<RiseOutlined />}
                    />
                  </Card>
                </Col>
                <Col xs={24} md={12}>
                  <Card>
                    <Statistic
                      title="Potential Savings"
                      value={gasComparison.savings}
                      suffix="%"
                      prefix={<FallOutlined />}
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Card>
                </Col>
              </Row>
              <Card title="Chain Comparison" style={{ marginTop: 16 }}>
                <Table
                  dataSource={gasComparison.chains}
                  columns={comparisonColumns}
                  rowKey="chainId"
                  pagination={false}
                />
              </Card>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={
          <Space>
            <ThunderboltOutlined style={{ color: '#faad14' }} />
            DeFi Gas Optimizer
          </Space>
        }
        extra={
          <Select
            value={selectedChain}
            onChange={setSelectedChain}
            style={{ width: 150 }}
          >
            {chainOptions.map(c => (
              <Option key={c.value} value={c.value}>
                {c.icon} {c.label}
              </Option>
            ))}
          </Select>
        }
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
        />
      </Card>
    </div>
  );
};

export default DefiGasOptimizer;
