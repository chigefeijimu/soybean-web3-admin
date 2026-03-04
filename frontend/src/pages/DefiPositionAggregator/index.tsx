import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Tabs, Input, Select, Button, Row, Col, Statistic, Progress, Space, Spin, Alert, Divider, List, Badge, Empty, Tooltip, Timeline, Radio, message } from 'antd';
import { LineChartOutlined, WalletOutlined, GlobalOutlined, ThunderboltOutlined, SafetyCertificateOutlined, BankOutlined, SwapOutlined, DollarOutlined, PieChartOutlined, BarChartOutlined, ArrowUpOutlined, ArrowDownOutlined, CheckCircleOutlined, WarningOutlined, StarOutlined, CrownOutlined, TrophyOutlined, FireOutlined } from '@ant-design/icons';
import type { TabsProps } from 'antd';
import ReactECharts from 'echarts-for-react';
import { defiPositionAggregator, DefiPosition, AggregatedPositions, PositionHealth, PositionComparison } from '@/service/defiPositionAggregator';

const { Option } = Select;
const { Search } = Input;

const chainOptions = [
  { value: 'ethereum', label: 'Ethereum', icon: '⟐' },
  { value: 'polygon', label: 'Polygon', icon: '⬡' },
  { value: 'arbitrum', label: 'Arbitrum', icon: '◆' },
  { value: 'optimism', label: 'Optimism', icon: '⬤' },
  { value: 'bsc', label: 'BSC', icon: '⬡' },
  { value: 'base', label: 'Base', icon: '🔵' },
  { value: 'avalanche', label: 'Avalanche', icon: '🔺' },
];

const typeColors: Record<string, string> = {
  lending: 'blue',
  liquidity: 'purple',
  staking: 'green',
  farming: 'orange',
  borrow: 'red',
  vesting: 'gold',
};

const typeIcons: Record<string, React.ReactNode> = {
  lending: <BankOutlined />,
  liquidity: <SwapOutlined />,
  staking: <SafetyCertificateOutlined />,
  farming: <FireOutlined />,
  borrow: <DollarOutlined />,
  vesting: <ClockCircleOutlined />,
};

const DefiPositionAggregator: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('positions');
  const [walletAddress, setWalletAddress] = useState('');
  const [selectedChains, setSelectedChains] = useState<string[]>([]);
  
  const [positions, setPositions] = useState<AggregatedPositions | null>(null);
  const [health, setHealth] = useState<PositionHealth | null>(null);
  const [comparison, setComparison] = useState<PositionComparison | null>(null);
  const [compareAddresses, setCompareAddresses] = useState('');
  const [topPositions, setTopPositions] = useState<DefiPosition[]>([]);
  const [supportedChains, setSupportedChains] = useState<string[]>([]);

  // Fetch supported chains on mount
  useEffect(() => {
    fetchSupportedChains();
  }, []);

  // Fetch positions
  const fetchPositions = async () => {
    if (!walletAddress) {
      message.warning('Please enter a wallet address');
      return;
    }
    setLoading(true);
    try {
      const chains = selectedChains.length > 0 ? selectedChains.join(',') : undefined;
      const result = await defiPositionAggregator.getPositions(walletAddress, chains);
      setPositions(result);
      
      // Also fetch health
      const healthResult = await defiPositionAggregator.getAddressHealth(walletAddress, chains);
      setHealth(healthResult);
    } catch (error) {
      message.error('Failed to fetch positions');
    } finally {
      setLoading(false);
    }
  };

  // Fetch supported chains
  const fetchSupportedChains = async () => {
    try {
      const result = await defiPositionAggregator.getSupportedChains();
      setSupportedChains(result);
    } catch (error) {
      console.error('Failed to fetch supported chains');
    }
  };

  // Fetch comparison
  const fetchComparison = async () => {
    if (!compareAddresses) {
      message.warning('Please enter wallet addresses to compare');
      return;
    }
    setLoading(true);
    try {
      const chains = selectedChains.length > 0 ? selectedChains.join(',') : undefined;
      const result = await defiPositionAggregator.comparePositions(compareAddresses, chains);
      setComparison(result);
    } catch (error) {
      message.error('Failed to fetch comparison');
    } finally {
      setLoading(false);
    }
  };

  // Fetch top positions
  const fetchTopPositions = async () => {
    setLoading(true);
    try {
      const result = await defiPositionAggregator.getTopPositions(20);
      setTopPositions(result);
    } catch (error) {
      message.error('Failed to fetch top positions');
    } finally {
      setLoading(false);
    }
  };

  // Chain distribution chart option
  const getChainChartOption = () => {
    if (!positions?.chainDistribution) return {};
    const data = Object.entries(positions.chainDistribution).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
    return {
      tooltip: { trigger: 'item', formatter: '${b}: ${c} ({d}%)' },
      legend: { orient: 'vertical', left: 'left' },
      series: [{
        name: 'Chain Distribution',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        label: { show: false, position: 'center' },
        emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
        labelLine: { show: false },
        data,
      }],
    };
  };

  // Type distribution chart option
  const getTypeChartOption = () => {
    if (!positions?.typeDistribution) return {};
    const data = Object.entries(positions.typeDistribution).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      xAxis: { type: 'category', data: data.map(d => d.name) },
      yAxis: { type: 'value' },
      series: [{
        data: data.map(d => d.value),
        type: 'bar',
        itemStyle: { color: '#1890ff' },
      }],
    };
  };

  // Position table columns
  const positionColumns = [
    {
      title: 'Protocol',
      dataIndex: 'protocol',
      key: 'protocol',
      render: (text: string, record: DefiPosition) => (
        <Space>
          <img src={record.protocolLogo} alt={text} style={{ width: 24, height: 24, borderRadius: '50%' }} />
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: 'Chain',
      dataIndex: 'chain',
      key: 'chain',
      render: (text: string) => (
        <Tag color="blue">{text.charAt(0).toUpperCase() + text.slice(1)}</Tag>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (text: string) => (
        <Tag color={typeColors[text]}>{text.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Tokens',
      key: 'tokens',
      render: (_: any, record: DefiPosition) => (
        <Space direction="vertical" size={0}>
          {record.token0 && <span>{record.token0}: {parseFloat(record.token0Amount).toFixed(4)}</span>}
          {record.token1 && <span>{record.token1}: {parseFloat(record.token1Amount || '0').toFixed(4)}</span>}
        </Space>
      ),
    },
    {
      title: 'Value',
      dataIndex: 'usdValue',
      key: 'usdValue',
      render: (value: number) => (
        <span style={{ fontWeight: 600 }}>${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
      ),
    },
    {
      title: 'APY',
      dataIndex: 'apy',
      key: 'apy',
      render: (value: number) => (
        <Tag color={value > 20 ? 'green' : value > 10 ? 'orange' : 'default'}>
          {value.toFixed(2)}%
        </Tag>
      ),
    },
    {
      title: 'Health',
      dataIndex: 'healthFactor',
      key: 'healthFactor',
      render: (value?: number) => value ? (
        <Tag color={value > 1.5 ? 'green' : value > 1 ? 'orange' : 'red'}>
          {value.toFixed(2)}
        </Tag>
      ) : <span>-</span>,
    },
  ];

  // Tab items
  const tabItems: TabsProps['items'] = [
    {
      key: 'positions',
      label: (
        <span><WalletOutlined /> My Positions</span>
      ),
      children: (
        <div>
          <Card style={{ marginBottom: 16 }}>
            <Row gutter={16} align="middle">
              <Col flex="auto">
                <Space>
                  <Input
                    placeholder="Enter wallet address"
                    value={walletAddress}
                    onChange={e => setWalletAddress(e.target.value)}
                    style={{ width: 400 }}
                    onPressEnter={fetchPositions}
                  />
                  <Select
                    mode="multiple"
                    placeholder="Filter by chains"
                    style={{ minWidth: 200 }}
                    value={selectedChains}
                    onChange={setSelectedChains}
                    allowClear
                  >
                    {chainOptions.map(c => (
                      <Option key={c.value} value={c.value}>{c.icon} {c.label}</Option>
                    ))}
                  </Select>
                  <Button type="primary" icon={<SearchOutlined />} onClick={fetchPositions} loading={loading}>
                    Search
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>

          {positions && (
            <>
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={6}>
                  <Card>
                    <Statistic
                      title="Total Value"
                      value={positions.totalValue}
                      precision={2}
                      prefix="$"
                      valueStyle={{ color: '#3f8600' }}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic
                      title="Total APY"
                      value={positions.totalApy}
                      precision={2}
                      suffix="%"
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic
                      title="Position Count"
                      value={positions.positions.length}
                      prefix={<WalletOutlined />}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic
                      title="Chains Used"
                      value={Object.keys(positions.chainDistribution).length}
                      prefix={<GlobalOutlined />}
                    />
                  </Card>
                </Col>
              </Row>

              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={12}>
                  <Card title="Chain Distribution">
                    <ReactECharts option={getChainChartOption()} style={{ height: 300 }} />
                  </Card>
                </Col>
                <Col span={12}>
                  <Card title="Type Distribution">
                    <ReactECharts option={getTypeChartOption()} style={{ height: 300 }} />
                  </Card>
                </Col>
              </Row>

              <Card title="All Positions">
                <Table
                  dataSource={positions.positions}
                  columns={positionColumns}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                  expandable={{
                    expandedRowRender: record => (
                      <div style={{ padding: '8px 0' }}>
                        <p><strong>Last Updated:</strong> {new Date(record.lastUpdated).toLocaleString()}</p>
                        {record.rewards && record.rewards.length > 0 && (
                          <div>
                            <strong>Rewards:</strong>
                            <List
                              size="small"
                              dataSource={record.rewards}
                              renderItem={item => (
                                <List.Item>
                                  {item.token}: {item.amount} (${item.usdValue.toFixed(2)})
                                </List.Item>
                              )}
                            />
                          </div>
                        )}
                      </div>
                    ),
                  }}
                />
              </Card>
            </>
          )}
        </div>
      ),
    },
    {
      key: 'health',
      label: (
        <span><SafetyCertificateOutlined /> Health Score</span>
      ),
      children: (
        <div>
          {health ? (
            <>
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={8}>
                  <Card>
                    <Statistic
                      title="Health Score"
                      value={health.score}
                      suffix="/ 100"
                      valueStyle={{
                        color: health.level === 'excellent' ? '#52c41a' :
                               health.level === 'good' ? '#1890ff' :
                               health.level === 'fair' ? '#faad14' : '#f5222d',
                        fontSize: 48
                      }}
                      prefix={health.level === 'excellent' ? <CrownOutlined /> :
                             health.level === 'good' ? <StarOutlined /> :
                             health.level === 'fair' ? <WarningOutlined /> : <WarningOutlined />}
                    />
                    <div style={{ textAlign: 'center', marginTop: 8 }}>
                      <Tag color={health.level === 'excellent' ? 'green' :
                                  health.level === 'good' ? 'blue' :
                                  health.level === 'fair' ? 'orange' : 'red'}
                           style={{ fontSize: 16, padding: '4px 12px' }}>
                        {health.level.toUpperCase()}
                      </Tag>
                    </div>
                  </Card>
                </Col>
                <Col span={16}>
                  <Card title="Health Factors">
                    <List
                      dataSource={health.factors}
                      renderItem={item => (
                        <List.Item>
                          <div style={{ width: '100%' }}>
                            <Space>
                              <span>{item.name}:</span>
                              <strong>{item.value.toFixed(2)}</strong>
                              <Progress
                                percent={item.score}
                                size="small"
                                style={{ width: 200 }}
                                strokeColor={item.score >= 80 ? '#52c41a' :
                                            item.score >= 60 ? '#1890ff' :
                                            item.score >= 40 ? '#faad14' : '#f5222d'}
                              />
                            </Space>
                          </div>
                        </List.Item>
                      )}
                    />
                  </Card>
                </Col>
              </Row>

              <Card title="Recommendations">
                <List
                  dataSource={health.recommendations}
                  renderItem={(item, index) => (
                    <List.Item>
                      <Tag color="blue">{index + 1}</Tag>
                      {item}
                    </List.Item>
                  )}
                />
              </Card>
            </>
          ) : (
            <Empty description="Search for a wallet address to see health score" />
          )}
        </div>
      ),
    },
    {
      key: 'compare',
      label: (
        <span><BarChartOutlined /> Compare</span>
      ),
      children: (
        <div>
          <Card style={{ marginBottom: 16 }}>
            <Space>
              <Input
                placeholder="Enter wallet addresses (comma separated)"
                value={compareAddresses}
                onChange={e => setCompareAddresses(e.target.value)}
                style={{ width: 500 }}
                onPressEnter={fetchComparison}
              />
              <Select
                mode="multiple"
                placeholder="Filter by chains"
                style={{ minWidth: 200 }}
                value={selectedChains}
                onChange={setSelectedChains}
                allowClear
              >
                {chainOptions.map(c => (
                  <Option key={c.value} value={c.value}>{c.icon} {c.label}</Option>
                ))}
              </Select>
              <Button type="primary" icon={<BarChartOutlined />} onClick={fetchComparison} loading={loading}>
                Compare
              </Button>
            </Space>
          </Card>

          {comparison && (
            <Card>
              <Table
                dataSource={comparison.comparisons}
                rowKey="address"
                pagination={false}
                columns={[
                  {
                    title: 'Address',
                    dataIndex: 'address',
                    key: 'address',
                    render: (text: string) => (
                      <span style={{ fontFamily: 'monospace' }}>
                        {text.slice(0, 6)}...{text.slice(-4)}
                      </span>
                    ),
                  },
                  {
                    title: 'Total Value',
                    dataIndex: 'totalValue',
                    key: 'totalValue',
                    render: (value: number) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
                  },
                  {
                    title: 'Positions',
                    dataIndex: 'positionCount',
                    key: 'positionCount',
                  },
                  {
                    title: 'Chains',
                    dataIndex: 'chains',
                    key: 'chains',
                    render: (chains: string[]) => (
                      <Space wrap>
                        {chains.map(c => (
                          <Tag key={c} color="blue">{c}</Tag>
                        ))}
                      </Space>
                    ),
                  },
                  {
                    title: 'Protocols',
                    dataIndex: 'protocols',
                    key: 'protocols',
                    render: (protocols: string[]) => (
                      <Space wrap>
                        {protocols.slice(0, 3).map(p => (
                          <Tag key={p} color="purple">{p}</Tag>
                        ))}
                        {protocols.length > 3 && <Tag>+{protocols.length - 3} more</Tag>}
                      </Space>
                    ),
                  },
                ]}
              />
            </Card>
          )}
        </div>
      ),
    },
    {
      key: 'top',
      label: (
        <span><TrophyOutlined /> Top Positions</span>
      ),
      children: (
        <div>
          <Button
            type="primary"
            icon={<TrophyOutlined />}
            onClick={fetchTopPositions}
            loading={loading}
            style={{ marginBottom: 16 }}
          >
            Refresh Top Positions
          </Button>

          {topPositions.length > 0 && (
            <Card>
              <Table
                dataSource={topPositions}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                columns={positionColumns}
              />
            </Card>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ marginBottom: 24 }}>
        <WalletOutlined style={{ marginRight: 8 }} />
        DeFi Position Aggregator
      </h1>

      <Spin spinning={loading}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
        />
      </Spin>
    </div>
  );
};

export default DefiPositionAggregator;
