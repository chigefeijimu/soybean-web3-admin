<template>
  <div class="event-monitor">
    <div class="header">
      <h1>🔔 Smart Contract Event Monitor</h1>
      <p>Monitor smart contract events in real-time and get alerts when specific events occur</p>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">{{ stats.totalSubscriptions }}</div>
        <div class="stat-label">Total Subscriptions</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.activeSubscriptions }}</div>
        <div class="stat-label">Active</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.totalEvents }}</div>
        <div class="stat-label">Events Tracked</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.totalAlerts }}</div>
        <div class="stat-label">Total Alerts</div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="content-grid">
      <!-- Left: Subscriptions -->
      <div class="card subscriptions-card">
        <div class="card-header">
          <h2>Event Subscriptions</h2>
          <button class="btn-primary" @click="showCreateModal = true">+ New Subscription</button>
        </div>
        
        <div class="subscription-list">
          <div 
            v-for="sub in subscriptions" 
            :key="sub.id" 
            class="subscription-item"
            :class="{ inactive: !sub.active }"
          >
            <div class="sub-info">
              <div class="sub-chain">{{ sub.chain }}</div>
              <div class="sub-contract">{{ shortenAddress(sub.contractAddress) }}</div>
              <div class="sub-event">{{ sub.eventName }}</div>
            </div>
            <div class="sub-actions">
              <button class="btn-icon" @click="toggleSubscription(sub)" :title="sub.active ? 'Pause' : 'Activate'">
                {{ sub.active ? '⏸️' : '▶️' }}
              </button>
              <button class="btn-icon" @click="deleteSubscription(sub.id)" title="Delete">🗑️</button>
            </div>
          </div>
          <div v-if="subscriptions.length === 0" class="empty-state">
            No subscriptions yet. Create one to start monitoring!
          </div>
        </div>
      </div>

      <!-- Right: Recent Events -->
      <div class="card events-card">
        <div class="card-header">
          <h2>Recent Events</h2>
          <button class="btn-secondary" @click="refreshEvents">🔄 Refresh</button>
        </div>
        
        <div class="event-list">
          <div v-for="event in recentEvents" :key="event.transactionHash" class="event-item">
            <div class="event-header">
              <span class="event-chain">{{ event.chain }}</span>
              <span class="event-name">{{ event.eventName }}</span>
            </div>
            <div class="event-details">
              <div class="event-contract">{{ shortenAddress(event.contractAddress) }}</div>
              <div class="event-tx">{{ shortenAddress(event.transactionHash) }}</div>
              <div class="event-time">{{ formatTime(event.timestamp) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Event Templates -->
    <div class="card templates-card">
      <div class="card-header">
        <h2>📋 Event Templates</h2>
      </div>
      <div class="templates-grid">
        <div v-for="(events, protocol) in eventTemplates" :key="protocol" class="template-group">
          <h3>{{ protocol }}</h3>
          <div class="template-events">
            <div v-for="event in events" :key="event.signature" class="template-event">
              <span class="event-name">{{ event.name }}</span>
              <code class="event-sig">{{ event.signature }}</code>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal">
        <div class="modal-header">
          <h2>Create Event Subscription</h2>
          <button class="btn-close" @click="showCreateModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Chain</label>
            <select v-model="newSubscription.chain">
              <option v-for="chain in supportedChains" :key="chain" :value="chain">{{ chain }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Contract Address</label>
            <input v-model="newSubscription.contractAddress" placeholder="0x..." />
          </div>
          <div class="form-group">
            <label>Event Name</label>
            <input v-model="newSubscription.eventName" placeholder="Transfer, Swap, etc." />
          </div>
          <div class="form-group">
            <label>Event Signature</label>
            <input v-model="newSubscription.eventSignature" placeholder="Transfer(address,address,uint256)" />
          </div>
          <div class="form-group">
            <label>Webhook URL (optional)</label>
            <input v-model="newSubscription.webhookUrl" placeholder="https://..." />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showCreateModal = false">Cancel</button>
          <button class="btn-primary" @click="createSubscription">Create</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

interface EventSubscription {
  id: string;
  chain: string;
  contractAddress: string;
  eventName: string;
  eventSignature: string;
  active: boolean;
  createdAt: Date;
}

interface ContractEvent {
  chain: string;
  contractAddress: string;
  eventName: string;
  transactionHash: string;
  timestamp: Date;
  args: Record<string, unknown>;
}

const stats = ref({
  totalSubscriptions: 0,
  activeSubscriptions: 0,
  totalEvents: 0,
  totalAlerts: 0,
});

const subscriptions = ref<EventSubscription[]>([]);
const recentEvents = ref<ContractEvent[]>([]);
const eventTemplates = ref<Record<string, { name: string; signature: string }[]>>({});
const supportedChains = ref<string[]>([]);

const showCreateModal = ref(false);
const newSubscription = ref({
  chain: 'ethereum',
  contractAddress: '',
  eventName: '',
  eventSignature: '',
  webhookUrl: '',
});

const shortenAddress = (addr: string) => {
  if (!addr) return '';
  return addr.slice(0, 6) + '...' + addr.slice(-4);
};

const formatTime = (date: Date | string) => {
  const d = new Date(date);
  return d.toLocaleString();
};

const loadStats = async () => {
  try {
    const res = await fetch('/api/web3/event-monitor/stats');
    stats.value = await res.json();
  } catch (e) {
    console.error('Failed to load stats:', e);
  }
};

const loadSubscriptions = async () => {
  try {
    const res = await fetch('/api/web3/event-monitor/subscriptions?userId=user_1');
    subscriptions.value = await res.json();
  } catch (e) {
    console.error('Failed to load subscriptions:', e);
  }
};

const loadEvents = async () => {
  try {
    const res = await fetch('/api/web3/event-monitor/events?limit=20');
    recentEvents.value = await res.json();
  } catch (e) {
    console.error('Failed to load events:', e);
  }
};

const loadTemplates = async () => {
  try {
    const res = await fetch('/api/web3/event-monitor/templates');
    eventTemplates.value = await res.json();
  } catch (e) {
    console.error('Failed to load templates:', e);
  }
};

const loadChains = async () => {
  try {
    const res = await fetch('/api/web3/event-monitor/chains');
    supportedChains.value = await res.json();
  } catch (e) {
    console.error('Failed to load chains:', e);
  }
};

const refreshEvents = () => {
  loadEvents();
};

const createSubscription = async () => {
  try {
    const res = await fetch('/api/web3/event-monitor/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newSubscription.value,
        userId: 'user_1',
      }),
    });
    const created = await res.json();
    subscriptions.value.push(created);
    showCreateModal.value = false;
    newSubscription.value = {
      chain: 'ethereum',
      contractAddress: '',
      eventName: '',
      eventSignature: '',
      webhookUrl: '',
    };
    loadStats();
  } catch (e) {
    console.error('Failed to create subscription:', e);
  }
};

const toggleSubscription = async (sub: EventSubscription) => {
  try {
    await fetch(`/api/web3/event-monitor/subscriptions/${sub.id}/toggle`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !sub.active }),
    });
    sub.active = !sub.active;
    loadStats();
  } catch (e) {
    console.error('Failed to toggle subscription:', e);
  }
};

const deleteSubscription = async (id: string) => {
  try {
    await fetch(`/api/web3/event-monitor/subscriptions/${id}`, {
      method: 'DELETE',
    });
    subscriptions.value = subscriptions.value.filter(s => s.id !== id);
    loadStats();
  } catch (e) {
    console.error('Failed to delete subscription:', e);
  }
};

onMounted(() => {
  loadStats();
  loadSubscriptions();
  loadEvents();
  loadTemplates();
  loadChains();
});
</script>

<style scoped>
.event-monitor {
  padding: 20px;
}

.header {
  margin-bottom: 24px;
}

.header h1 {
  font-size: 28px;
  margin-bottom: 8px;
}

.header p {
  color: #666;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 20px;
  color: white;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 24px;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-header h2 {
  font-size: 18px;
  margin: 0;
}

.btn-primary {
  background: #667eea;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}

.btn-secondary {
  background: #e0e0e0;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}

.btn-icon {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 4px 8px;
}

.subscription-list, .event-list {
  max-height: 400px;
  overflow-y: auto;
}

.subscription-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #eee;
}

.subscription-item.inactive {
  opacity: 0.5;
}

.sub-info {
  flex: 1;
}

.sub-chain {
  font-size: 12px;
  color: #667eea;
  text-transform: uppercase;
}

.sub-contract {
  font-family: monospace;
  font-size: 14px;
}

.sub-event {
  font-size: 14px;
  color: #333;
}

.event-item {
  padding: 12px;
  border-bottom: 1px solid #eee;
}

.event-header {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
}

.event-chain {
  font-size: 12px;
  color: #667eea;
  text-transform: uppercase;
}

.event-name {
  font-weight: 600;
}

.event-details {
  font-size: 12px;
  color: #666;
  display: flex;
  gap: 12px;
}

.templates-card {
  margin-bottom: 24px;
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}

.template-group h3 {
  font-size: 14px;
  margin-bottom: 8px;
  color: #667eea;
}

.template-event {
  display: flex;
  flex-direction: column;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 6px;
  margin-bottom: 8px;
}

.event-sig {
  font-size: 11px;
  color: #666;
  word-break: break-all;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #999;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 12px;
  width: 500px;
  max-width: 90%;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.btn-close {
  background: transparent;
  border: none;
  font-size: 24px;
  cursor: pointer;
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
}

.form-group input, .form-group select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
