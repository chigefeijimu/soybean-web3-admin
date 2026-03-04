import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Tabs, Input, Select, Button, Row, Col, Statistic, Space, Spin, Progress, List, Badge, Avatar, Tooltip, Typography, Modal, Drawer, Descriptions, Timeline, Segmented, Empty } from 'antd';
import { 
  DollarOutlined, 
  TeamOutlined, 
  ClockCircleOutlined, 
  RiseOutlined, 
  FallOutlined, 
  StarOutlined, 
  TrophyOutlined, 
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import type { TabsProps } from 'antd';
import { 
  getValidators, 
  getValidatorPerformance, 
  getSupportedChains,
  Validator,
  ChainStats,
  ValidatorPerformance
} from '../service/stakingValidatorPerformance';

const { Text, Title, Paragraph } = Typography;
const { Option } = Select;
const { Search } = Input;

const chainColors: Record<string, string> = {
  'Ethereum 2.0': '#627EEA',
  'Cosmos': '#2E86AB',
  'Polkadot': '#E6007A',
  'Solana': '#14F195',
  'Cardano': '#0033AD',
  'Avalanche': '#E84142',
  'Polygon': '#8247E5',
  'NEAR': '#00C08B',
};

const statusColors: Record<string, string> = {
  active: 'success',
  inactive: 'default',
  slashed: 'error',
  pending: 'processing',
};

const statusLabels: Record<string, string> = {
  active: 'Active',
  inactive: 'Inactive',
  slashed: 'Slashed',
  pending: 'Pending',
};

const StakingValidatorPerformance: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [validators, setValidators] = useState<Validator[]>([]);
  const [chainStats, setChainStats] = useState<ChainStats[]>([]);
  const [chains, setChains] = useState<{ id: string; name: string }[]>([]);
  const [totalValidators, setTotalValidators] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedChain, setSelectedChain] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('staked');
  const [selectedValidator, setSelectedValidator] = useState<Validator | null>(null);
  const [validatorPerformance, setValidatorPerformance] = useState<ValidatorPerformance | null>(null);
  const [performanceLoading, setPerformanceLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('validators');

  useEffect(() => {
    loadChains();
  }, []);

  useEffect(() => {
    loadValidators();
  }, [page, pageSize, selectedChain, selectedStatus, sortBy]);

  const loadChains = async () => {
    try {
      const res = await getSupportedChains();
      if (res.data?.success) {
        setChains(res.data.data);
      }
    } catch (error) {
      console.error('Failed to load chains:', error);
    }
  };

  const loadValidators = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        pageSize,
        sortBy,
      };
      if (selectedChain !== 'all') {
        params.chain = selectedChain;
      }
      if (selectedStatus !== 'all') {
        params.status = selectedStatus;
      }
      const res = await getValidators(params);
      if (res.data?.success) {
        setValidators(res.data.data.validators);
        setChainStats(res.data.data.chainStats);
        setTotalValidators(res.data.data.totalValidators);
        setTotalPages(res.data.data.totalPages);
      }
    } catch (error) {
      console.error('Failed to load validators:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadValidatorPerformance = async (validatorId: string) => {
    setPerformanceLoading(true);
    try {
      const res = await getValidatorPerformance(validatorId);
      if (res.data?.success) {
        setValidatorPerformance(res.data.data);
      }
    } catch (error) {
      console.error('Failed to load validator performance:', error);
    } finally {
      setPerformanceLoading(false);
    }
  };

  const handleValidatorClick = (validator: Validator) => {
    setSelectedValidator(validator);
    setDrawerVisible(true);
    loadValidatorPerformance(validator.id);
  };

  const columns = [
    {
      title: 'Rank',
      dataIndex: 'rank',
      key: 'rank',
      width: 60,
      render: (rank: number) => (
        <Badge 
          count={rank} 
          style={{ 
            backgroundColor: rank <= 3 ? '#FFD700' : rank <= 10 ? '#C0C0C0' : '#CD7F32',
            fontSize: rank <= 3 ? 14 : 12
          }} 
        />
      ),
    },
    {
      title: 'Validator',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Validator) => (
        <Space>
          <Avatar 
            style={{ backgroundColor: chainColors[record.chain] || '#1890ff' }}
            icon={<StarOutlined />}
          />
          <div>
            <Text strong>{name}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.address.slice(0, 6)}...{record.address.slice(-4)}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Chain',
      dataIndex: 'chain',
      key: 'chain',
      width: 120,
      render: (chain: string) => (
        <Tag color={chainColors[chain]}>{chain}</Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>
      ),
    },
    {
      title: 'Uptime',
      dataIndex: 'uptime',
      key: 'uptime',
      width: 100,
      render: (uptime: number) => (
        <Progress 
          percent={uptime} 
          size="small" 
          status={uptime >= 99 ? 'success' : uptime >= 95 ? 'normal' : 'exception'}
          format={(p) => `${p?.toFixed(1)}%`}
        />
      ),
    },
    {
      title: 'APR',
      dataIndex: 'apr',
      key: 'apr',
      width: 100,
      render: (apr: number) => (
        <Text style={{ color: apr > 5 ? '#52c41a' : apr > 3 ? '#1890ff' : '#faad14' }}>
          {apr.toFixed(2)}%
        </Text>
      ),
    },
    {
      title: 'Total Staked',
      dataIndex: 'totalStaked',
      key: 'totalStaked',
      width: 130,
      render: (value: number) => (
        <Text strong>${value.toLocaleString()}</Text>
      ),
    },
    {
      title: 'Delegators',
      dataIndex: 'delegators',
      key: 'delegators',
      width: 100,
      render: (count: number) => (
        <Space>
          <TeamOutlined />
          {count.toLocaleString()}
        </Space>
      ),
    },
    {
      title: 'Commission',
      dataIndex: 'commission',
      key: 'commission',
      width: 100,
      render: (value: number) => (
        <Text>{value}%</Text>
      ),
    },
  ];

  const statsCards = [
    {
      title: 'Total Validators',
      value: totalValidators,
      icon: <TrophyOutlined />,
      color: '#1890ff',
    },
    {
      title: 'Total Staked',
      value: `$${chainStats.reduce((sum, c) => sum + c.totalStaked, 0).toLocaleString()}`,
      icon: <DollarOutlined />,
      color: '#52c41a',
    },
    {
      title: 'Avg APR',
      value: `${(chainStats.reduce((sum, c) => sum + c.avgApr, 0) / (chainStats.length || 1)).toFixed(2)}%`,
      icon: <RiseOutlined />,
      color: '#faad14',
    },
    {
      title: 'Avg Uptime',
      value: `${(chainStats.reduce((sum, c) => sum + c.avgUptime, 0) / (chainStats.length || 1)).toFixed(1)}%`,
      icon: <ClockCircleOutlined />,
      color: '#722ed1',
    },
  ];

  const chainStatsColumns = [
    {
      title: 'Chain',
      dataIndex: 'chain',
      key: 'chain',
      render: (chain: string) => (
        <Tag color={chainColors[chain]} style={{ fontWeight: 500 }}>{chain}</Tag>
      ),
    },
    {
      title: 'Validators',
      dataIndex: 'totalValidators',
      key: 'totalValidators',
      render: (count: number, record: ChainStats) => (
        <Space>
          <Badge count={count} showZero style={{ backgroundColor: '#1890ff' }} />
          {record.activeValidators > 0 && (
            <Badge count={`${record.activeValidators} active`} style={{ backgroundColor: '#52c41a' }} />
          )}
        </Space>
      ),
    },
    {
      title: 'Total Staked',
      dataIndex: 'totalStaked',
      key: 'totalStaked',
      render: (value: number) => (
        <Text strong>${value.toLocaleString()}</Text>
      ),
    },
    {
      title: 'Avg APR',
      dataIndex: 'avgApr',
      key: 'avgApr',
      render: (apr: number) => (
        <Text style={{ color: apr > 5 ? '#52c41a' : '#1890ff' }}>
          {apr.toFixed(2)}%
        </Text>
      ),
    },
    {
      title: 'Avg Uptime',
      dataIndex: 'avgUptime',
      key: 'avgUptime',
      render: (uptime: number) => (
        <Progress 
          percent={uptime} 
          size="small" 
          status={uptime >= 99 ? 'success' : 'normal'}
          style={{ width: 100 }}
        />
      ),
    },
    {
      title: 'Slashed',
      dataIndex: 'slashedValidators',
      key: 'slashedValidators',
      render: (count: number) => (
        count > 0 ? <Tag color="error">{count}</Tag> : <Tag>0</Tag>
      ),
    },
  ];

  const tabItems: TabsProps['items'] = [
    {
      key: 'validators',
      label: (
        <Space>
          <TrophyOutlined />
          Validator List
        </Space>
      ),
      children: (
        <Table
          dataSource={validators}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: totalValidators,
            showSizeChanger: true,
            showQuickJumper: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
          onRow={(record) => ({
            onClick: () => handleValidatorClick(record),
            style: { cursor: 'pointer' },
          })}
          scroll={{ x: 1200 }}
          size="middle"
        />
      ),
    },
    {
      key: 'chains',
      label: (
        <Space>
          <ThunderboltOutlined />
          Chain Stats
        </Space>
      ),
      children: (
        <Table
          dataSource={chainStats}
          columns={chainStatsColumns}
          rowKey="chain"
          pagination={false}
          scroll={{ x: 800 }}
        />
      ),
    },
    {
      key: 'performance',
      label: (
        <Space>
          <SafetyCertificateOutlined />
          Performance
        </Space>
      ),
      children: (
        <Row gutter={[16, 16]}>
          {validators.slice(0, 6).map((validator) => (
            <Col xs={24} sm={12} md={8} lg={8} key={validator.id}>
              <Card
                hoverable
                onClick={() => handleValidatorClick(validator)}
                actions={[
                  <Tooltip title="APR">
                    <RiseOutlined /> {validator.apr.toFixed(2)}%
                  </Tooltip>,
                  <Tooltip title="Uptime">
                    <ClockCircleOutlined /> {validator.uptime.toFixed(1)}%
                  </Tooltip>,
                  <Tooltip title="Delegators">
                    <TeamOutlined /> {validator.delegators.toLocaleString()}
                  </Tooltip>,
                ]}
              >
                <Card.Meta
                  avatar={
                    <Avatar 
                      style={{ backgroundColor: chainColors[validator.chain] }}
                      icon={<StarOutlined />}
                    />
                  }
                  title={validator.name}
                  description={
                    <Space direction="vertical" size={0}>
                      <Tag color={chainColors[validator.chain]}>{validator.chain}</Tag>
                      <Tag color={statusColors[validator.status]}>{statusLabels[validator.status]}</Tag>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        ${validator.totalStaked.toLocaleString()} staked
                      </Text>
                    </Space>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={3} style={{ marginBottom: 24 }}>
        <ThunderboltOutlined style={{ marginRight: 8 }} />
        Cross-chain Staking Validator Performance
      </Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statsCards.map((stat, index) => (
          <Col xs={12} sm={12} md={6} key={index}>
            <Card>
              <Statistic
                title={stat.title}
                value={stat.value}
                prefix={stat.icon}
                valueStyle={{ color: stat.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Select
              style={{ width: '100%' }}
              value={selectedChain}
              onChange={setSelectedChain}
              placeholder="Select Chain"
            >
              <Option value="all">All Chains</Option>
              {chains.map((chain) => (
                <Option key={chain.id} value={chain.id}>
                  {chain.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              style={{ width: '100%' }}
              value={selectedStatus}
              onChange={setSelectedStatus}
            >
              <Option value="all">All Status</Option>
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
              <Option value="slashed">Slashed</Option>
              <Option value="pending">Pending</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              style={{ width: '100%' }}
              value={sortBy}
              onChange={setSortBy}
            >
              <Option value="staked">Sort by Staked</Option>
              <Option value="apr">Sort by APR</Option>
              <Option value="uptime">Sort by Uptime</Option>
              <Option value="delegators">Sort by Delegators</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Space>
              <Button 
                type="primary" 
                icon={<ReloadOutlined />} 
                onClick={() => loadValidators()}
              >
                Refresh
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
        <Spin spinning={loading} indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}>
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            items={tabItems}
          />
        </Spin>
      </Card>

      <Drawer
        title={selectedValidator?.name || 'Validator Details'}
        placement="right"
        width={600}
        open={drawerVisible}
        onClose={() => {
          setDrawerVisible(false);
          setSelectedValidator(null);
          setValidatorPerformance(null);
        }}
      >
        {selectedValidator && (
          <>
            <Card style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title="Total Staked"
                    value={selectedValidator.totalStaked}
                    prefix="$"
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="APR"
                    value={selectedValidator.apr}
                    precision={2}
                    suffix="%"
                    valueStyle={{ color: selectedValidator.apr > 5 ? '#52c41a' : '#1890ff' }}
                  />
                </Col>
              </Row>
            </Card>

            <Descriptions bordered column={1} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Chain">
                <Tag color={chainColors[selectedValidator.chain]}>{selectedValidator.chain}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={statusColors[selectedValidator.status]}>
                  {statusLabels[selectedValidator.status]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Uptime">
                <Progress 
                  percent={selectedValidator.uptime} 
                  size="small" 
                  status={selectedValidator.uptime >= 99 ? 'success' : 'normal'}
                />
              </Descriptions.Item>
              <Descriptions.Item label="Delegators">
                {selectedValidator.delegators.toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Commission">
                {selectedValidator.commission}%
              </Descriptions.Item>
              <Descriptions.Item label="Address">
                <Text copyable code style={{ fontSize: 12 }}>
                  {selectedValidator.address}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="First Seen">
                {selectedValidator.firstSeen}
              </Descriptions.Item>
              <Descriptions.Item label="Last Reward">
                {selectedValidator.lastReward}
              </Descriptions.Item>
            </Descriptions>

            {validatorPerformance && (
              <>
                <Card 
                  title="Performance History" 
                  style={{ marginBottom: 16 }}
                  extra={
                    <Tag color={validatorPerformance.riskScore >= 80 ? 'success' : validatorPerformance.riskScore >= 60 ? 'processing' : 'error'}>
                      Risk Score: {validatorPerformance.riskScore}
                    </Tag>
                  }
                >
                  <Row gutter={16}>
                    <Col span={12}>
                      <Statistic
                        title="Estimated Annual Reward"
                        value={validatorPerformance.estimatedAnnualReward}
                        prefix="$"
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="Slash Count"
                        value={selectedValidator.slashHistory.count}
                        valueStyle={{ color: selectedValidator.slashHistory.count > 0 ? '#ff4d4f' : '#52c41a' }}
                      />
                    </Col>
                  </Row>
                </Card>

                <Card title="Performance Metrics">
                  <Timeline
                    items={[
                      {
                        color: 'green',
                        children: `Daily: ${selectedValidator.performance.daily >= 0 ? '+' : ''}${selectedValidator.performance.daily.toFixed(2)}%`,
                      },
                      {
                        color: 'blue',
                        children: `Weekly: ${selectedValidator.performance.weekly >= 0 ? '+' : ''}${selectedValidator.performance.weekly.toFixed(2)}%`,
                      },
                      {
                        color: 'purple',
                        children: `Monthly: ${selectedValidator.performance.monthly >= 0 ? '+' : ''}${selectedValidator.performance.monthly.toFixed(2)}%`,
                      },
                      {
                        color: 'orange',
                        children: `Yearly: ${selectedValidator.performance.yearly >= 0 ? '+' : ''}${selectedValidator.performance.yearly.toFixed(2)}%`,
                      },
                    ]}
                  />
                </Card>
              </>
            )}
          </>
        )}
      </Drawer>
    </div>
  );
};

// Add missing import
import { ReloadOutlined } from '@ant-design/icons';

export default StakingValidatorPerformance;
