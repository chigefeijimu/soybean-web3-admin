import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Tabs, Input, Select, Button, Row, Col, Statistic, Space, Spin, Progress, List, Badge, Avatar, Tooltip, Typography } from 'antd';
import { DollarOutlined, TeamOutlined, FileTextOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, RiseOutlined, FallOutlined, CrownOutlined, StarOutlined, TrophyOutlined, BankOutlined } from '@ant-design/icons';
import type { TabsProps } from 'antd';

const { Text, Title } = Typography;
const { Option } = Select;
const { Search } = Input;

interface DAO {
  id: string;
  name: string;
  chain: string;
  tokenSymbol: string;
  tokenAddress: string;
  treasuryValue: number;
  memberCount: number;
  proposalCount: number;
  activeProposals: number;
  passedProposals: number;
  failedProposals: number;
  participationRate: number;
  averageVoteDuration: number;
  quorum: number;
  logo: string;
}

interface Proposal {
  id: string;
  daoId: string;
  daoName: string;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'passed' | 'failed' | 'executed' | 'cancelled';
  category: 'treasury' | 'parameter' | 'upgrade' | 'governance' | 'grant' | 'security' | 'other';
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  totalVotes: number;
  quorum: number;
  startTime: string;
  endTime: string;
  proposer: string;
}

interface Delegate {
  id: string;
  address: string;
  daoId: string;
  daoName: string;
  votingPower: number;
  votingPowerPercentage: number;
  delegators: number;
  proposalsVoted: number;
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  participationRate: number;
  rank: number;
  reputation: 'legend' | 'veteran' | 'expert' | 'trusted' | 'new';
}

interface DashboardMetrics {
  totalDAOs: number;
  totalProposals: number;
  activeProposals: number;
  totalTreasury: number;
  averageParticipation: number;
  chainDistribution: { chain: string; count: number; treasury: number }[];
  categoryDistribution: { category: string; count: number }[];
  topDAOs: DAO[];
  recentProposals: Proposal[];
  topDelegates: Delegate[];
}

const chainColors: Record<string, string> = {
  ethereum: '#627EEA',
  arbitrum: '#28A0F0',
  optimism: '#FF0420',
  polygon: '#8247E5',
  base: '#0052FF',
  avalanche: '#E84142',
  bsc: '#F3BA2F',
};

const statusColors: Record<string, string> = {
  pending: 'default',
  active: 'processing',
  passed: 'success',
  failed: 'error',
  executed: 'green',
  cancelled: 'default',
};

const categoryColors: Record<string, string> = {
  treasury: 'gold',
  parameter: 'blue',
  upgrade: 'purple',
  governance: 'cyan',
  grant: 'green',
  security: 'red',
  other: 'default',
};

const reputationColors: Record<string, string> = {
  legend: 'gold',
  veteran: 'purple',
  expert: 'blue',
  trusted: 'green',
  new: 'default',
};

const GovernanceAnalytics: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null);
  const [daoList, setDaoList] = useState<DAO[]>([]);
  const [selectedChain, setSelectedChain] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('treasury');
  const [selectedDao, setSelectedDao] = useState<string>('');
  const [daoProposals, setDaoProposals] = useState<Proposal[]>([]);
  const [daoDelegates, setDaoDelegates] = useState<Delegate[]>([]);
  const [proposalPagination, setProposalPagination] = useState({ page: 1, pageSize: 20, total: 0 });
  const [delegatePagination, setDelegatePagination] = useState({ page: 1, pageSize: 20, total: 0 });

  const chains = ['ethereum', 'arbitrum', 'optimism', 'polygon', 'base', 'avalanche', 'bsc'];

  useEffect(() => {
    fetchDashboardMetrics();
    fetchDAOList();
  }, []);

  useEffect(() => {
    if (selectedDao) {
      fetchDAOProposals(selectedDao);
      fetchDAODelegates(selectedDao);
    }
  }, [selectedDao]);

  const fetchDashboardMetrics = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/governance-analytics/dashboard');
      const data = await response.json();
      setDashboardMetrics(data);
    } catch (error) {
      console.error('Failed to fetch dashboard metrics:', error);
    }
    setLoading(false);
  };

  const fetchDAOList = async () => {
    try {
      const response = await fetch(`/api/governance-analytics/daos?chain=${selectedChain}&sortBy=${sortBy}`);
      const data = await response.json();
      setDaoList(data);
    } catch (error) {
      console.error('Failed to fetch DAO list:', error);
    }
  };

  const fetchDAOProposals = async (daoId: string) => {
    try {
      const response = await fetch(`/api/governance-analytics/daos/${daoId}/proposals?page=${proposalPagination.page}&pageSize=${proposalPagination.pageSize}`);
      const data = await response.json();
      setDaoProposals(data.proposals || []);
      setProposalPagination(prev => ({ ...prev, total: data.pagination?.total || 0 }));
    } catch (error) {
      console.error('Failed to fetch proposals:', error);
    }
  };

  const fetchDAODelegates = async (daoId: string) => {
    try {
      const response = await fetch(`/api/governance-analytics/daos/${daoId}/delegates?page=${delegatePagination.page}&pageSize=${delegatePagination.pageSize}`);
      const data = await response.json();
      setDaoDelegates(data.delegates || []);
      setDelegatePagination(prev => ({ ...prev, total: data.pagination?.total || 0 }));
    } catch (error) {
      console.error('Failed to fetch delegates:', error);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const formatVotes = (num: number): string => {
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toString();
  };

  const handleChainChange = (value: string) => {
    setSelectedChain(value);
    fetchDAOList();
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    fetchDAOList();
  };

  const renderDashboard = () => (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total DAOs"
              value={dashboardMetrics?.totalDAOs || 0}
              prefix={<BankOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Proposals"
              value={dashboardMetrics?.totalProposals || 0}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Proposals"
              value={dashboardMetrics?.activeProposals || 0}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Treasury"
              value={formatNumber(dashboardMetrics?.totalTreasury || 0)}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="Top DAOs by Treasury" bordered={false}>
            <List
              dataSource={dashboardMetrics?.topDAOs?.slice(0, 8) || []}
              renderItem={(dao: DAO) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar style={{ backgroundColor: chainColors[dao.chain] }}>{dao.logo}</Avatar>}
                    title={dao.name}
                    description={dao.tokenSymbol}
                  />
                  <div style={{ textAlign: 'right' }}>
                    <div>{formatNumber(dao.treasuryValue)}</div>
                    <Text type="secondary" style={{ fontSize: 12 }}>{dao.memberCount.toLocaleString()} members</Text>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Chain Distribution" bordered={false}>
            {dashboardMetrics?.chainDistribution?.map((item: any) => (
              <div key={item.chain} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Tag color={chainColors[item.chain]}>{item.chain.toUpperCase()}</Tag>
                  <span>{item.count} DAOs</span>
                  <span>{formatNumber(item.treasury)}</span>
                </div>
                <Progress 
                  percent={Math.min((item.treasury / (dashboardMetrics?.totalTreasury || 1)) * 100, 100)} 
                  showInfo={false}
                  strokeColor={chainColors[item.chain]}
                />
              </div>
            ))}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <Card title="Recent Proposals" bordered={false}>
            <Table
              dataSource={dashboardMetrics?.recentProposals?.slice(0, 10) || []}
              rowKey="id"
              pagination={false}
              size="small"
              columns={[
                {
                  title: 'DAO',
                  dataIndex: 'daoName',
                  key: 'daoName',
                  render: (text) => <Tag>{text}</Tag>,
                },
                {
                  title: 'Title',
                  dataIndex: 'title',
                  key: 'title',
                  ellipsis: true,
                },
                {
                  title: 'Category',
                  dataIndex: 'category',
                  key: 'category',
                  render: (cat: string) => <Tag color={categoryColors[cat]}>{cat}</Tag>,
                },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  key: 'status',
                  render: (status: string) => <Tag color={statusColors[status]}>{status}</Tag>,
                },
                {
                  title: 'Votes For',
                  dataIndex: 'votesFor',
                  key: 'votesFor',
                  render: (v: number) => formatVotes(v),
                },
                {
                  title: 'Votes Against',
                  dataIndex: 'votesAgainst',
                  key: 'votesAgainst',
                  render: (v: number) => formatVotes(v),
                },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );

  const renderDAOs = () => (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col>
          <Select 
            value={selectedChain} 
            onChange={handleChainChange} 
            style={{ width: 150 }}
          >
            <Option value="all">All Chains</Option>
            {chains.map(chain => (
              <Option key={chain} value={chain}>{chain.toUpperCase()}</Option>
            ))}
          </Select>
        </Col>
        <Col>
          <Select 
            value={sortBy} 
            onChange={handleSortChange} 
            style={{ width: 150 }}
          >
            <Option value="treasury">Sort by Treasury</Option>
            <Option value="members">Sort by Members</Option>
            <Option value="proposals">Sort by Proposals</Option>
            <Option value="participation">Sort by Participation</Option>
          </Select>
        </Col>
      </Row>
      
      <Table
        dataSource={daoList}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        columns={[
          {
            title: 'DAO',
            dataIndex: 'name',
            key: 'name',
            render: (text, record: DAO) => (
              <Space>
                <Avatar style={{ backgroundColor: chainColors[record.chain] }}>{record.logo}</Avatar>
                <span>{text}</span>
              </Space>
            ),
          },
          {
            title: 'Chain',
            dataIndex: 'chain',
            key: 'chain',
            render: (chain: string) => <Tag color={chainColors[chain]}>{chain.toUpperCase()}</Tag>,
          },
          {
            title: 'Treasury',
            dataIndex: 'treasuryValue',
            key: 'treasuryValue',
            render: (v: number) => formatNumber(v),
          },
          {
            title: 'Members',
            dataIndex: 'memberCount',
            key: 'memberCount',
            render: (v: number) => v.toLocaleString(),
          },
          {
            title: 'Proposals',
            dataIndex: 'proposalCount',
            key: 'proposalCount',
          },
          {
            title: 'Participation',
            dataIndex: 'participationRate',
            key: 'participationRate',
            render: (v: number) => <Progress percent={v} size="small" />,
          },
          {
            title: 'Action',
            key: 'action',
            render: (_, record: DAO) => (
              <Button type="link" onClick={() => setSelectedDao(record.id)}>View Details</Button>
            ),
          },
        ]}
      />
    </div>
  );

  const renderProposals = () => {
    if (!selectedDao) {
      return <Card><Empty description="Please select a DAO first" /></Card>;
    }

    return (
      <div>
        <Table
          dataSource={daoProposals}
          rowKey="id"
          pagination={{ 
            pageSize: proposalPagination.pageSize, 
            total: proposalPagination.total,
            onChange: (page) => setProposalPagination(prev => ({ ...prev, page })),
          }}
          columns={[
            {
              title: 'Title',
              dataIndex: 'title',
              key: 'title',
              ellipsis: true,
            },
            {
              title: 'Category',
              dataIndex: 'category',
              key: 'category',
              render: (cat: string) => <Tag color={categoryColors[cat]}>{cat}</Tag>,
            },
            {
              title: 'Status',
              dataIndex: 'status',
              key: 'status',
              render: (status: string) => <Tag color={statusColors[status]}>{status}</Tag>,
            },
            {
              title: 'For',
              dataIndex: 'votesFor',
              key: 'votesFor',
              render: (v: number) => <span style={{ color: '#52c41a' }}>{formatVotes(v)}</span>,
            },
            {
              title: 'Against',
              dataIndex: 'votesAgainst',
              key: 'votesAgainst',
              render: (v: number) => <span style={{ color: '#ff4d4f' }}>{formatVotes(v)}</span>,
            },
            {
              title: 'Total Votes',
              dataIndex: 'totalVotes',
              key: 'totalVotes',
              render: (v: number) => formatVotes(v),
            },
          ]}
        />
      </div>
    );
  };

  const renderDelegates = () => {
    if (!selectedDao) {
      return <Card><Empty description="Please select a DAO first" /></Card>;
    }

    return (
      <div>
        <Table
          dataSource={daoDelegates}
          rowKey="id"
          pagination={{ 
            pageSize: delegatePagination.pageSize, 
            total: delegatePagination.total,
            onChange: (page) => setDelegatePagination(prev => ({ ...prev, page })),
          }}
          columns={[
            {
              title: 'Rank',
              dataIndex: 'rank',
              key: 'rank',
              render: (rank: number) => {
                if (rank <= 3) return <CrownOutlined style={{ color: '#faad14', fontSize: 18 }} />;
                return rank;
              },
            },
            {
              title: 'Address',
              dataIndex: 'address',
              key: 'address',
              render: (addr: string) => (
                <Tooltip title={addr}>
                  {addr.slice(0, 6)}...{addr.slice(-4)}
                </Tooltip>
              ),
            },
            {
              title: 'Voting Power',
              dataIndex: 'votingPower',
              key: 'votingPower',
              render: (v: number, record: Delegate) => (
                <Space>
                  <span>{formatVotes(v)}</span>
                  <Text type="secondary">({record.votingPowerPercentage.toFixed(2)}%)</Text>
                </Space>
              ),
            },
            {
              title: 'Delegators',
              dataIndex: 'delegators',
              key: 'delegators',
            },
            {
              title: 'Proposals Voted',
              dataIndex: 'proposalsVoted',
              key: 'proposalsVoted',
            },
            {
              title: 'Reputation',
              dataIndex: 'reputation',
              key: 'reputation',
              render: (rep: string) => <Tag color={reputationColors[rep]}>{rep}</Tag>,
            },
            {
              title: 'Participation',
              dataIndex: 'participationRate',
              key: 'participationRate',
              render: (v: number) => <Progress percent={v} size="small" />,
            },
          ]}
        />
      </div>
    );
  };

  const tabItems: TabsProps['items'] = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      children: renderDashboard(),
    },
    {
      key: 'daos',
      label: 'DAO List',
      children: renderDAOs(),
    },
    {
      key: 'proposals',
      label: 'Proposals',
      children: renderProposals(),
    },
    {
      key: 'delegates',
      label: 'Delegates',
      children: renderDelegates(),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Governance Analytics Dashboard</Title>
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

const Empty = ({ description }: { description: string }) => (
  <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
    {description}
  </div>
);

export default GovernanceAnalytics;
