<template>
  <div class="token-unlock-schedule">
    <n-card title="代币解锁时间表" :bordered="false" class="mb-4">
      <n-space vertical :size="16">
        <n-space justify="space-between" align="center">
          <n-space>
            <n-select
              v-model:value="selectedChain"
              :options="chainOptions"
              style="width: 150px"
              @update:value="loadData"
            />
            <n-input-group>
              <n-input
                v-model:value="searchQuery"
                placeholder="搜索代币..."
                clearable
                @update:value="handleSearch"
              >
                <template #prefix>
                  <n-icon><SearchOutline /></n-icon>
                </template>
              </n-input>
            </n-input-group>
          </n-space>
          <n-space>
            <n-button-group>
              <n-button :type="viewMode === 'list' ? 'primary' : 'default'" @click="viewMode = 'list'">
                <n-icon><ListOutline /></n-icon>
              </n-button>
              <n-button :type="viewMode === 'calendar' ? 'primary' : 'default'" @click="viewMode = 'calendar'">
                <n-icon><CalendarOutline /></n-icon>
              </n-button>
              <n-button :type="viewMode === 'stats' ? 'primary' : 'default'" @click="viewMode = 'stats'">
                <n-icon><StatsChartOutline /></n-icon>
              </n-button>
            </n-button-group>
          </n-space>
        </n-space>

        <!-- Stats Overview -->
        <n-grid v-if="stats && viewMode === 'stats'" :x-gap="16" :cols="4">
          <n-gi>
            <n-statistic label="即将解锁" :value="stats.totalUpcoming">
              <template #prefix>
                <n-icon color="#18a058"><TimeOutline /></n-icon>
              </template>
            </n-statistic>
          </n-gi>
          <n-gi>
            <n-statistic label="7天内解锁" :value="stats.next7Days">
              <template #prefix>
                <n-icon color="#f0a020"><FlameOutline /></n-icon>
              </template>
            </n-statistic>
          </n-gi>
          <n-gi>
            <n-statistic label="30天内解锁" :value="stats.next30Days">
              <template #prefix>
                <n-icon color="#2080f0"><CalendarOutline /></n-icon>
              </template>
            </n-statistic>
          </n-gi>
          <n-gi>
            <n-statistic label="总解锁数量" :value="formatNumber(stats.totalValue)">
              <template #prefix>
                <n-icon color="#9c27b0"><PieChartOutline /></n-icon>
              </template>
            </n-statistic>
          </n-gi>
        </n-grid>

        <!-- Calendar View -->
        <div v-if="viewMode === 'calendar'" class="calendar-view">
          <n-calendar
            v-model:value="calendarValue"
            #="{ year, month, date }"
            @update:value="handleCalendarClick"
          >
            <div class="calendar-cell">
              <div class="date-number">{{ date }}</div>
              <div v-if="getUnlocksForDate(year, month, date).length" class="unlock-dots">
                <n-tag
                  v-for="unlock in getUnlocksForDate(year, month, date).slice(0, 3)"
                  :key="unlock.id"
                  size="small"
                  :type="getTagType(unlock.recipientType)"
                >
                  {{ unlock.tokenSymbol }}
                </n-tag>
              </div>
            </div>
          </n-calendar>
        </div>

        <!-- List View -->
        <n-data-table
          v-if="viewMode === 'list'"
          :columns="columns"
          :data="unlocks"
          :loading="loading"
          :pagination="pagination"
          :row-key="row => row.id"
        />

        <!-- Stats Chart -->
        <n-grid v-if="viewMode === 'stats' && stats" :x-gap="16" :cols="2">
          <n-gi>
            <n-card title="按接收者类型分布">
              <n-pie-chart :data="pieChartData" :height="300" />
            </n-card>
          </n-gi>
          <n-gi>
            <n-card title="解锁时间分布">
              <n-space vertical>
                <n-progress
                  type="line"
                  :percentage="(stats.next7Days / stats.totalUpcoming) * 100"
                  :indicator-placement="'inside'"
                  status="warning"
                >
                  7天内: {{ stats.next7Days }} 个
                </n-progress>
                <n-progress
                  type="line"
                  :percentage="(stats.next30Days / stats.totalUpcoming) * 100"
                  :indicator-placement="'inside'"
                  status="info"
                >
                  30天内: {{ stats.next30Days }} 个
                </n-progress>
                <n-progress
                  type="line"
                  :percentage="((stats.totalUpcoming - stats.next30Days) / stats.totalUpcoming) * 100"
                  :indicator-placement="'inside'"
                  status="default"
                >
                  30天后: {{ stats.totalUpcoming - stats.next30Days }} 个
                </n-progress>
              </n-space>
            </n-card>
          </n-gi>
        </n-grid>
      </n-space>
    </n-card>

    <!-- Token Detail Modal -->
    <n-modal v-model:show="showDetailModal" preset="card" title="代币解锁详情" style="width: 600px">
      <n-descriptions v-if="selectedUnlock" :column="2" bordered>
        <n-descriptions-item label="代币名称">{{ selectedUnlock.tokenName }}</n-descriptions-item>
        <n-descriptions-item label="代币符号">{{ selectedUnlock.tokenSymbol }}</n-descriptions-item>
        <n-descriptions-item label="解锁日期">{{ selectedUnlock.unlockDate }}</n-descriptions-item>
        <n-descriptions-item label="状态">
          <n-tag :type="getStatusType(selectedUnlock.status)">
            {{ getStatusText(selectedUnlock.status) }}
          </n-tag>
        </n-descriptions-item>
        <n-descriptions-item label="解锁数量">{{ formatNumber(selectedUnlock.unlockAmount) }}</n-descriptions-item>
        <n-descriptions-item label="解锁比例">{{ selectedUnlock.unlockPercentage }}%</n-descriptions-item>
        <n-descriptions-item label="接收方">{{ selectedUnlock.recipient }}</n-descriptions-item>
        <n-descriptions-item label="类型">
          <n-tag :type="getTagType(selectedUnlock.recipientType)">
            {{ getRecipientTypeText(selectedUnlock.recipientType) }}
          </n-tag>
        </n-descriptions-item>
        <n-descriptions-item label="描述" :span="2">{{ selectedUnlock.description }}</n-descriptions-item>
        <n-descriptions-item label="合约地址" :span="2">
          <n-text code>{{ selectedUnlock.tokenAddress }}</n-text>
        </n-descriptions-item>
      </n-descriptions>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue';
import { 
  NCard, NSpace, NButton, NDataTable, NTag, NModal, NDescriptions, 
  NDescriptionsItem, NIcon, NSelect, NInput, NInputGroup, NGrid, NGi,
  NStatistic, NCalendar, NProgress, NPieChart, NButtonGroup, NText
} from 'naive-ui';
import { 
  SearchOutline, ListOutline, CalendarOutline, StatsChartOutline,
  TimeOutline, FlameOutline, PieChartOutline
} from '@vicons/ionicons5';

interface TokenUnlock {
  id: string;
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  chain: string;
  unlockDate: string;
  unlockAmount: number;
  unlockPercentage: number;
  recipient: string;
  recipientType: 'team' | 'investor' | 'community' | 'treasury';
  description: string;
  status: 'upcoming' | 'unlocked' | 'partial';
}

const loading = ref(false);
const selectedChain = ref('ethereum');
const viewMode = ref<'list' | 'calendar' | 'stats'>('list');
const searchQuery = ref('');
const unlocks = ref<TokenUnlock[]>([]);
const stats = ref<any>(null);
const calendarValue = ref(Date.now());
const showDetailModal = ref(false);
const selectedUnlock = ref<TokenUnlock | null>(null);

const chainOptions = [
  { label: 'Ethereum', value: 'ethereum' },
  { label: 'BSC', value: 'bsc' },
  { label: 'Polygon', value: 'polygon' },
  { label: 'Arbitrum', value: 'arbitrum' },
  { label: 'Optimism', value: 'optimism' },
];

const columns = [
  {
    title: '代币',
    key: 'tokenName',
    render(row: TokenUnlock) {
      return h('div', { class: 'token-cell' }, [
        h('span', { class: 'token-symbol' }, row.tokenSymbol),
        h('span', { class: 'token-name' }, row.tokenName)
      ]);
    }
  },
  {
    title: '解锁日期',
    key: 'unlockDate',
    sorter: (a: TokenUnlock, b: TokenUnlock) => 
      new Date(a.unlockDate).getTime() - new Date(b.unlockDate).getTime()
  },
  {
    title: '解锁数量',
    key: 'unlockAmount',
    render(row: TokenUnlock) {
      return formatNumber(row.unlockAmount);
    },
    sorter: (a: TokenUnlock, b: TokenUnlock) => a.unlockAmount - b.unlockAmount
  },
  {
    title: '比例',
    key: 'unlockPercentage',
    render(row: TokenUnlock) {
      return `${row.unlockPercentage}%`;
    }
  },
  {
    title: '接收方',
    key: 'recipientType',
    render(row: TokenUnlock) {
      return h(NTag, { 
        type: getTagType(row.recipientType),
        size: 'small'
      }, () => getRecipientTypeText(row.recipientType));
    }
  },
  {
    title: '状态',
    key: 'status',
    render(row: TokenUnlock) {
      return h(NTag, { 
        type: getStatusType(row.status),
        size: 'small'
      }, () => getStatusText(row.status));
    }
  },
  {
    title: '操作',
    key: 'actions',
    render(row: TokenUnlock) {
      return h(NButton, { 
        size: 'small', 
        onClick: () => viewDetail(row) 
      }, () => '详情');
    }
  }
];

const pagination = {
  pageSize: 10,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
  showQuickJumper: true
};

const pieChartData = computed(() => {
  if (!stats.value?.byRecipientType) return [];
  const colors: Record<string, string> = {
    team: '#f0a020',
    investor: '#2080f0',
    community: '#18a058',
    treasury: '#9c27b0'
  };
  return Object.entries(stats.value.byRecipientType).map(([key, value]: [string, any]) => ({
    name: getRecipientTypeText(key),
    value: value,
    color: colors[key] || '#999'
  }));
});

const getUnlocksForDate = (year: number, month: number, date: number) => {
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
  return unlocks.value.filter(u => u.unlockDate === dateStr);
};

const handleCalendarClick = ({ year, month, date }: { year: number; month: number; date: number }) => {
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
  const dayUnlocks = unlocks.value.filter(u => u.unlockDate === dateStr);
  if (dayUnlocks.length > 0) {
    selectedUnlock.value = dayUnlocks[0];
    showDetailModal.value = true;
  }
};

const viewDetail = (unlock: TokenUnlock) => {
  selectedUnlock.value = unlock;
  showDetailModal.value = true;
};

const formatNumber = (num: number): string => {
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return num.toString();
};

const getTagType = (type: string): 'warning' | 'info' | 'success' | 'error' | 'default' => {
  const map: Record<string, any> = {
    team: 'warning',
    investor: 'info',
    community: 'success',
    treasury: 'error'
  };
  return map[type] || 'default';
};

const getRecipientTypeText = (type: string): string => {
  const map: Record<string, string> = {
    team: '团队',
    investor: '投资者',
    community: '社区',
    treasury: '金库'
  };
  return map[type] || type;
};

const getStatusType = (status: string): 'success' | 'warning' | 'info' => {
  const map: Record<string, any> = {
    upcoming: 'warning',
    unlocked: 'success',
    partial: 'info'
  };
  return map[status] || 'info';
};

const getStatusText = (status: string): string => {
  const map: Record<string, string> = {
    upcoming: '即将解锁',
    unlocked: '已解锁',
    partial: '部分解锁'
  };
  return map[status] || status;
};

const loadData = async () => {
  loading.value = true;
  try {
    const [unlocksRes, statsRes] = await Promise.all([
      fetch(`/api/token-unlock/list?days=180&chain=${selectedChain.value}`),
      fetch(`/api/token-unlock/stats?chain=${selectedChain.value}`)
    ]);
    unlocks.value = await unlocksRes.json();
    stats.value = await statsRes.json();
  } catch (error) {
    console.error('Failed to load token unlock data:', error);
  } finally {
    loading.value = false;
  }
};

const handleSearch = async (value: string) => {
  if (!value) {
    await loadData();
    return;
  }
  try {
    const res = await fetch(`/api/token-unlock/search?q=${value}`);
    const tokens = await res.json();
    if (tokens.length > 0) {
      const address = tokens[0].address;
      const res = await fetch(`/api/token-unlock/token/${address}?chain=${selectedChain.value}`);
      unlocks.value = await res.json();
    }
  } catch (error) {
    console.error('Search failed:', error);
  }
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.token-unlock-schedule {
  padding: 16px;
}

.token-cell {
  display: flex;
  flex-direction: column;
}

.token-symbol {
  font-weight: 600;
  color: #18a058;
}

.token-name {
  font-size: 12px;
  color: #999;
}

.calendar-view {
  max-height: 400px;
  overflow-y: auto;
}

.calendar-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.date-number {
  font-size: 12px;
}

.unlock-dots {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  justify-content: center;
  margin-top: 4px;
}

.mb-4 {
  margin-bottom: 16px;
}
</style>
