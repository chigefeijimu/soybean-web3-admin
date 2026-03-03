import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Tabs, Input, Select, Button, Row, Col, Statistic, Space, Spin, Alert, Divider, List, Badge, Modal, Form, Switch, message } from 'antd';
import { BellOutlined, PlusOutlined, DeleteOutlined, EditOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, WarningOutlined, ReloadOutlined, SettingOutlined } from '@ant-design/icons';
import type { TabsProps } from 'antd';

const { Option } = Select;
const { Search } = Input;

interface Dao {
  name: string;
  chain: string;
  address: string;
}

interface DaoProposal {
  id: string;
  dao: string;
  title: string;
  description: string;
  status: 'active' | 'passed' | 'failed' | 'executing' | 'canceled' | 'pending';
  votesFor: number;
  votesAgainst: number;
  startBlock: number;
  endBlock: number;
  proposer: string;
  chain: string;
  createdAt: number;
  updatedAt: number;
}

interface Alert {
  id: string;
  userId: string;
  dao: string;
  alertType: 'new_proposal' | 'proposal_passed' | 'proposal_failed' | 'vote_started' | 'vote_ending';
  threshold: number;
  enabled: boolean;
  webhookUrl?: string;
  email?: string;
  createdAt: number;
}

interface AlertHistory {
  id: string;
  alertId: string;
  proposalId: string;
  dao: string;
  triggeredAt: number;
  notified: boolean;
  notificationMethod: string;
}

interface DaoStats {
  totalProposals: number;
  activeProposals: number;
  passedProposals: number;
  failedProposals: number;
  pendingProposals: number;
  byChain: Record<string, number>;
  byDao: Record<string, number>;
}

const DaoProposalAlert: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [daos, setDaos] = useState<Dao[]>([]);
  const [proposals, setProposals] = useState<DaoProposal[]>([]);
  const [stats, setStats] = useState<DaoStats | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertHistory, setAlertHistory] = useState<AlertHistory[]>([]);
  const [selectedDao, setSelectedDao] = useState<string>('');
  const [selectedChain, setSelectedChain] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [currentUserId] = useState('user-001');
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  const alertTypes = [
    { value: 'new_proposal', label: 'New Proposal', description: 'When a new proposal is created' },
    { value: 'vote_started', label: 'Vote Started', description: 'When voting begins on a proposal' },
    { value: 'vote_ending', label: 'Vote Ending Soon', description: 'When a vote is about to end' },
    { value: 'proposal_passed', label: 'Proposal Passed', description: 'When a proposal passes' },
    { value: 'proposal_failed', label: 'Proposal Failed', description: 'When a proposal fails' },
  ];

  const chains = ['Ethereum', 'Polygon', 'Arbitrum', 'Optimism', 'Base', 'Avalanche', 'BSC'];
  const daoNames = ['Uniswap', 'Aave', 'MakerDAO', 'Compound', 'Curve', 'Lido', 'ENS', 'Optimism', 'Arbitrum', 'Polygon'];

  useEffect(() => {
    fetchDaos();
    fetchProposals();
    fetchStats();
    fetchAlerts();
  }, []);

  const fetchDaos = async () => {
    try {
      const response = await fetch('/api/dao-proposal-alert/daos');
      const data = await response.json();
      if (data.success) {
        setDaos(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch DAOs:', error);
    }
  };

  const fetchProposals = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedDao) params.append('dao', selectedDao);
      if (selectedChain) params.append('chain', selectedChain);
      if (selectedStatus) params.append('status', selectedStatus);
      
      const response = await fetch(`/api/dao-proposal-alert/proposals?${params}`);
      const data = await response.json();
      if (data.success) {
        setProposals(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch proposals:', error);
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/dao-proposal-alert/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await fetch(`/api/dao-proposal-alert/alerts/${currentUserId}`);
      const data = await response.json();
      if (data.success) {
        setAlerts(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    }
  };

  const fetchAlertHistory = async () => {
    try {
      const response = await fetch(`/api/dao-proposal-alert/alerts/${currentUserId}/history`);
      const data = await response.json();
      if (data.success) {
        setAlertHistory(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch alert history:', error);
    }
  };

  const handleCreateAlert = async (values: any) => {
    try {
      const response = await fetch('/api/dao-proposal-alert/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          dao: values.dao,
          alertType: values.alertType,
          threshold: values.threshold || 1000,
          enabled: values.enabled ?? true,
          webhookUrl: values.webhookUrl,
          email: values.email,
        }),
      });
      const data = await response.json();
      if (data.success) {
        message.success('Alert created successfully');
        setModalVisible(false);
        form.resetFields();
        fetchAlerts();
      }
    } catch (error) {
      message.error('Failed to create alert');
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/dao-proposal-alert/alerts/${currentUserId}/${alertId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        message.success('Alert deleted');
        fetchAlerts();
      }
    } catch (error) {
      message.error('Failed to delete alert');
    }
  };

  const handleToggleAlert = async (alertId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/dao-proposal-alert/alerts/${currentUserId}/${alertId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      const data = await response.json();
      if (data.success) {
        fetchAlerts();
      }
    } catch (error) {
      message.error('Failed to update alert');
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toLocaleString();
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      active: 'green',
      passed: 'blue',
      failed: 'red',
      pending: 'orange',
      executing: 'purple',
      canceled: 'default',
    };
    return colors[status] || 'default';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <ClockCircleOutlined />;
      case 'passed': return <CheckCircleOutlined />;
      case 'failed': return <CloseCircleOutlined />;
      case 'pending': return <WarningOutlined />;
      default: return null;
    }
  };

  const proposalColumns = [
    { title: 'DAO', dataIndex: 'dao', key: 'dao', render: (text: string) => <Tag color="blue">{text}</Tag> },
    { title: 'Title', dataIndex: 'title', key: 'title', width: 300, render: (text: string) => <span style={{ fontWeight: 500 }}>{text}</span> },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (status: string) => (
      <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
        {status.toUpperCase()}
      </Tag>
    )},
    { title: 'Votes For', dataIndex: 'votesFor', key: 'votesFor', render: (v: number) => formatNumber(v) },
    { title: 'Votes Against', dataIndex: 'votesAgainst', key: 'votesAgainst', render: (v: number) => formatNumber(v) },
    { title: 'Chain', dataIndex: 'chain', key: 'chain', render: (text: string) => <Tag>{text}</Tag> },
    { title: 'Created', dataIndex: 'createdAt', key: 'createdAt', render: (t: number) => formatDate(t) },
  ];

  const alertColumns = [
    { title: 'DAO', dataIndex: 'dao', key: 'dao', render: (text: string) => <Tag color="purple">{text === '*' ? 'All DAOs' : text}</Tag> },
    { title: 'Alert Type', dataIndex: 'alertType', key: 'alertType', render: (type: string) => (
      <Tag color="cyan">{type.replace(/_/g, ' ').toUpperCase()}</Tag>
    )},
    { title: 'Threshold', dataIndex: 'threshold', key: 'threshold', render: (v: number) => v.toLocaleString() },
    { title: 'Enabled', dataIndex: 'enabled', key: 'enabled', render: (enabled: boolean, record: Alert) => (
      <Switch checked={enabled} onChange={(checked) => handleToggleAlert(record.id, checked)} />
    ) },
    { title: 'Created', dataIndex: 'createdAt', key: 'createdAt', render: (t: number) => formatDate(t) },
    { title: 'Actions', key: 'actions', render: (_: any, record: Alert) => (
      <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDeleteAlert(record.id)} />
    )},
  ];

  const historyColumns = [
    { title: 'DAO', dataIndex: 'dao', key: 'dao', render: (text: string) => <Tag>{text}</Tag> },
    { title: 'Proposal ID', dataIndex: 'proposalId', key: 'proposalId' },
    { title: 'Triggered', dataIndex: 'triggeredAt', key: 'triggeredAt', render: (t: number) => formatDate(t) },
    { title: 'Method', dataIndex: 'notificationMethod', key: 'notificationMethod', render: (m: string) => <Tag color="blue">{m}</Tag> },
    { title: 'Notified', dataIndex: 'notified', key: 'notified', render: (n: boolean) => n ? <Badge status="success" text="Yes" /> : <Badge status="default" text="No" /> },
  ];

  const tabItems: TabsProps['items'] = [
    {
      key: 'proposals',
      label: 'Proposals',
      children: (
        <Card bordered={false}>
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} md={6}>
              <Select
                placeholder="Select DAO"
                style={{ width: '100%' }}
                allowClear
                value={selectedDao || undefined}
                onChange={setSelectedDao}
              >
                {daoNames.map(dao => (
                  <Option key={dao} value={dao}>{dao}</Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} md={6}>
              <Select
                placeholder="Select Chain"
                style={{ width: '100%' }}
                allowClear
                value={selectedChain || undefined}
                onChange={setSelectedChain}
              >
                {chains.map(chain => (
                  <Option key={chain} value={chain}>{chain}</Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} md={6}>
              <Select
                placeholder="Select Status"
                style={{ width: '100%' }}
                allowClear
                value={selectedStatus || undefined}
                onChange={setSelectedStatus}
              >
                <Option value="active">Active</Option>
                <Option value="passed">Passed</Option>
                <Option value="failed">Failed</Option>
                <Option value="pending">Pending</Option>
              </Select>
            </Col>
            <Col xs={24} md={6}>
              <Button type="primary" icon={<ReloadOutlined />} onClick={fetchProposals}>
                Search
              </Button>
            </Col>
          </Row>
          <Table
            dataSource={proposals}
            columns={proposalColumns}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            size="small"
          />
        </Card>
      ),
    },
    {
      key: 'alerts',
      label: 'Alerts',
      children: (
        <Card
          bordered={false}
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
              Create Alert
            </Button>
          }
        >
          <Table
            dataSource={alerts}
            columns={alertColumns}
            rowKey="id"
            pagination={false}
          />
        </Card>
      ),
    },
    {
      key: 'history',
      label: 'Alert History',
      children: (
        <Card bordered={false}>
          <Table
            dataSource={alertHistory}
            columns={historyColumns}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            size="small"
          />
        </Card>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <h1 style={{ margin: 0 }}><BellOutlined /> DAO Proposal Alert System</h1>
          <p style={{ margin: 0, color: '#888' }}>Monitor DAO proposals and receive alerts for governance activity</p>
        </Col>
        <Col>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => { fetchProposals(); fetchStats(); }}>
              Refresh
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
              Create Alert
            </Button>
          </Space>
        </Col>
      </Row>

      {stats && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} md={6}>
            <Card>
              <Statistic title="Total Proposals" value={stats.totalProposals} prefix={<BellOutlined />} />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card>
              <Statistic title="Active" value={stats.activeProposals} valueStyle={{ color: '#52c41a' }} />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card>
              <Statistic title="Passed" value={stats.passedProposals} valueStyle={{ color: '#1890ff' }} />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card>
              <Statistic title="Pending" value={stats.pendingProposals} valueStyle={{ color: '#faad14' }} />
            </Card>
          </Col>
        </Row>
      )}

      <Spin spinning={loading}>
        <Card bordered={false}>
          <Tabs items={tabItems} />
        </Card>
      </Spin>

      <Modal
        title="Create Alert"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateAlert}>
          <Form.Item name="dao" label="DAO" rules={[{ required: true }]}>
            <Select placeholder="Select DAO">
              <Option value="*">All DAOs</Option>
              {daoNames.map(dao => (
                <Option key={dao} value={dao}>{dao}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="alertType" label="Alert Type" rules={[{ required: true }]}>
            <Select placeholder="Select alert type">
              {alertTypes.map(type => (
                <Option key={type.value} value={type.value}>
                  {type.label} - {type.description}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="threshold" label="Threshold (blocks)" initialValue={1000}>
            <Input type="number" placeholder="e.g., 1000" />
          </Form.Item>
          <Form.Item name="webhookUrl" label="Webhook URL (optional)">
            <Input placeholder="https://your-webhook-url.com" />
          </Form.Item>
          <Form.Item name="email" label="Email (optional)">
            <Input placeholder="your@email.com" />
          </Form.Item>
          <Form.Item name="enabled" label="Enabled" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Create Alert
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DaoProposalAlert;