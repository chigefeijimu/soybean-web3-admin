<template>
  <div class="defi-protocol-sentiment">
    <n-card title="DeFi Protocol Social Sentiment" :bordered="false" class="mb-4">
      <n-space vertical>
        <n-space align="center">
          <n-select
            v-model:value="selectedProtocol"
            filterable
            placeholder="Select protocol"
            :options="protocolOptions"
            style="width: 200px"
            @update:value="handleProtocolChange"
          />
          <n-select
            v-model:value="selectedChain"
            filterable
            placeholder="Select chain"
            :options="chainOptions"
            style="width: 150px"
            @update:value="handleChainChange"
          />
          <n-button type="primary" @click="fetchSentiment">
            Analyze
          </n-button>
        </n-space>
      </n-space>
    </n-card>

    <n-grid :cols="2" :x-gap="16" :y-gap="16" v-if="overview">
      <n-gi>
        <n-card title="Overview" :bordered="false">
          <n-statistic label="Total Protocols" :value="overview.totalProtocols" />
          <n-statistic label="Average Sentiment" :value="overview.avgSentiment" />
          <n-statistic label="Bullish Protocols" :value="overview.bullishCount">
            <template #suffix>
              <n-tag type="success" size="small">bullish</n-tag>
            </template>
          </n-statistic>
          <n-statistic label="Bearish Protocols" :value="overview.bearishCount">
            <template #suffix>
              <n-tag type="error" size="small">bearish</n-tag>
            </template>
          </n-statistic>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card title="Sentiment Distribution" :bordered="false">
          <div class="sentiment-bars">
            <div class="sentiment-bar">
              <span class="label">Bullish</span>
              <n-progress
                type="line"
                :percentage="overview.bullishCount"
                :color="'#18a058'"
                :rail-color="'#f0f0f0'"
              />
            </div>
            <div class="sentiment-bar">
              <span class="label">Neutral</span>
              <n-progress
                type="line"
                :percentage="overview.neutralCount"
                :color="'#2080f0'"
                :rail-color="'#f0f0f0'"
              />
            </div>
            <div class="sentiment-bar">
              <span class="label">Bearish</span>
              <n-progress
                type="line"
                :percentage="overview.bearishCount"
                :color="'#d03050'"
                :rail-color="'#f0f0f0'"
              />
            </div>
          </div>
        </n-card>
      </n-gi>
    </n-grid>

    <n-grid :cols="2" :x-gap="16" :y-gap="16" v-if="sentimentData" class="mt-4">
      <n-gi>
        <n-card title="Protocol Sentiment Score" :bordered="false">
          <n-space vertical>
            <div class="score-card">
              <div class="score-label">Overall Sentiment</div>
              <div class="score-value" :class="getSentimentClass(sentimentData.overall)">
                {{ sentimentData.overall }}
              </div>
              <n-tag :type="getTrendType(sentimentData.trend)" size="small">
                {{ sentimentData.trend }}
              </n-tag>
            </div>
            
            <n-divider>Platform Breakdown</n-divider>
            
            <div class="platform-scores">
              <div class="platform-score">
                <span class="platform">Twitter</span>
                <n-progress
                  type="line"
                  :percentage="sentimentData.twitter"
                  :color="getScoreColor(sentimentData.twitter)"
                />
                <span class="value">{{ sentimentData.twitter }}</span>
              </div>
              <div class="platform-score">
                <span class="platform">Discord</span>
                <n-progress
                  type="line"
                  :percentage="sentimentData.discord"
                  :color="getScoreColor(sentimentData.discord)"
                />
                <span class="value">{{ sentimentData.discord }}</span>
              </div>
              <div class="platform-score">
                <span class="platform">Reddit</span>
                <n-progress
                  type="line"
                  :percentage="sentimentData.reddit"
                  :color="getScoreColor(sentimentData.reddit)"
                />
                <span class="value">{{ sentimentData.reddit }}</span>
              </div>
              <div class="platform-score">
                <span class="platform">GitHub</span>
                <n-progress
                  type="line"
                  :percentage="sentimentData.github"
                  :color="getScoreColor(sentimentData.github)"
                />
                <span class="value">{{ sentimentData.github }}</span>
              </div>
              <div class="platform-score">
                <span class="platform">News</span>
                <n-progress
                  type="line"
                  :percentage="sentimentData.news"
                  :color="getScoreColor(sentimentData.news)"
                />
                <span class="value">{{ sentimentData.news }}</span>
              </div>
            </div>
          </n-space>
        </n-card>
      </n-gi>
      
      <n-gi>
        <n-card title="Sentiment Distribution" :bordered="false">
          <n-space vertical>
            <div class="distribution-chart">
              <n-progress
                type="circle"
                :percentage="sentimentData.sentimentDistribution.positive"
                :color="'#18a058'"
              >
                <div class="progress-text">
                  <div>Positive</div>
                  <div>{{ sentimentData.sentimentDistribution.positive }}%</div>
                </div>
              </n-progress>
              <n-progress
                type="circle"
                :percentage="sentimentData.sentimentDistribution.neutral"
                :color="'#2080f0'"
              >
                <div class="progress-text">
                  <div>Neutral</div>
                  <div>{{ sentimentData.sentimentDistribution.neutral }}%</div>
                </div>
              </n-progress>
              <n-progress
                type="circle"
                :percentage="sentimentData.sentimentDistribution.negative"
                :color="'#d03050'"
              >
                <div class="progress-text">
                  <div>Negative</div>
                  <div>{{ sentimentData.sentimentDistribution.negative }}%</div>
                </div>
              </n-progress>
            </div>
            
            <n-divider>Top Keywords</n-divider>
            
            <n-space>
              <n-tag v-for="keyword in sentimentData.topKeywords" :key="keyword" size="small">
                {{ keyword }}
              </n-tag>
            </n-space>
            
            <n-divider>Stats</n-divider>
            
            <n-space vertical>
              <n-statistic label="Total Mentions" :value="sentimentData.mentionCount" />
              <n-statistic label="Engagement Rate" :value="sentimentData.engagementRate" suffix="%" />
            </n-space>
          </n-space>
        </n-card>
      </n-gi>
    </n-grid>

    <n-card title="Trending Protocols" :bordered="false" class="mt-4" v-if="trending.length">
      <n-table :single-line="false">
        <thead>
          <tr>
            <th>Protocol</th>
            <th>Sentiment</th>
            <th>Mentions</th>
            <th>Trend</th>
            <th>Change</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in trending" :key="item.protocol">
            <td>
              <n-button text type="primary" @click="selectProtocol(item.protocol)">
                {{ item.protocol }}
              </n-button>
            </td>
            <td>
              <n-progress
                type="line"
                :percentage="item.sentiment"
                :color="getScoreColor(item.sentiment)"
                style="width: 100px"
              />
            </td>
            <td>{{ item.mentions.toLocaleString() }}</td>
            <td>
              <n-tag :type="item.trend === 'up' ? 'success' : item.trend === 'down' ? 'error' : 'default'" size="small">
                {{ item.trend }}
              </n-tag>
            </td>
            <td>
              <span :class="item.change >= 0 ? 'text-success' : 'text-error'">
                {{ item.change >= 0 ? '+' : '' }}{{ item.change }}%
              </span>
            </td>
          </tr>
        </tbody>
      </n-table>
    </n-card>

    <n-card title="Social Statistics" :bordered="false" class="mt-4" v-if="socialStats">
      <n-grid :cols="4" :x-gap="16">
        <n-gi>
          <n-card title="Twitter" size="small">
            <n-statistic :value="socialStats.twitter.followers" label="Followers" />
            <n-statistic :value="socialStats.twitter.engagement" label="Engagement" suffix="%" />
          </n-card>
        </n-gi>
        <n-gi>
          <n-card title="Discord" size="small">
            <n-statistic :value="socialStats.discord.members" label="Members" />
            <n-statistic :value="socialStats.discord.online" label="Online" />
          </n-card>
        </n-gi>
        <n-gi>
          <n-card title="Reddit" size="small">
            <n-statistic :value="socialStats.reddit.subscribers" label="Subscribers" />
            <n-statistic :value="socialStats.reddit.activeUsers" label="Active Users" />
          </n-card>
        </n-gi>
        <n-gi>
          <n-card title="GitHub" size="small">
            <n-statistic :value="socialStats.github.stars" label="Stars" />
            <n-statistic :value="socialStats.github.contributors" label="Contributors" />
          </n-card>
        </n-gi>
      </n-grid>
    </n-card>

    <n-card title="Sentiment Alerts" :bordered="false" class="mt-4" v-if="alerts.length">
      <n-space vertical>
        <n-alert
          v-for="alert in alerts"
          :key="alert.protocol + alert.type"
          :type="alert.severity === 'critical' ? 'error' : alert.severity === 'warning' ? 'warning' : 'info'"
          :title="alert.message"
        >
          Current sentiment: {{ alert.currentSentiment }} | Threshold: {{ alert.threshold }}
        </n-alert>
      </n-space>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { 
  NCard, NSelect, NButton, NSpace, NGrid, NGi, NStatistic, NTag, 
  NProgress, NDivider, NTable, NAlert, useMessage 
} from 'naive-ui';
import { defiProtocolSentiment } from '@/service/defiProtocolSentiment';

const message = useMessage();

const protocols = [
  'uniswap', 'aave', 'compound', 'curve', 'lido', 'yearn',
  'makerdao', 'balancer', 'sushiswap', 'gmx', 'dydx', 'rocket-pool',
  'morpho', 'gearbox', 'pendle', 'convex', 'stargate', 'across',
];

const chains = [
  { label: 'Ethereum', value: 'ethereum' },
  { label: 'Polygon', value: 'polygon' },
  { label: 'Arbitrum', value: 'arbitrum' },
  { label: 'Optimism', value: 'optimism' },
  { label: 'BSC', value: 'bsc' },
  { label: 'Base', value: 'base' },
  { label: 'Avalanche', value: 'avalanche' },
];

const selectedProtocol = ref('uniswap');
const selectedChain = ref('ethereum');
const overview = ref<any>(null);
const sentimentData = ref<any>(null);
const trending = ref<any[]>([]);
const socialStats = ref<any>(null);
const alerts = ref<any[]>([]);

const protocolOptions = protocols.map(p => ({ label: p, value: p }));
const chainOptions = chains;

const fetchOverview = async () => {
  try {
    const res = await defiProtocolSentiment.getOverview();
    overview.value = res.data;
  } catch (e) {
    message.error('Failed to fetch overview');
  }
};

const fetchSentiment = async () => {
  try {
    const [sentiment, trendingRes, stats, alertsRes] = await Promise.all([
      defiProtocolSentiment.getProtocolSentiment(selectedProtocol.value, selectedChain.value),
      defiProtocolSentiment.getTrendingProtocols('24h'),
      defiProtocolSentiment.getSocialStats(selectedProtocol.value),
      defiProtocolSentiment.getSentimentAlerts(selectedProtocol.value),
    ]);
    
    sentimentData.value = sentiment.data;
    trending.value = trendingRes.data.trending;
    socialStats.value = stats.data;
    alerts.value = alertsRes.data.alerts;
  } catch (e) {
    message.error('Failed to fetch sentiment data');
  }
};

const handleProtocolChange = (value: string) => {
  selectedProtocol.value = value;
  fetchSentiment();
};

const handleChainChange = (value: string) => {
  selectedChain.value = value;
  fetchSentiment();
};

const selectProtocol = (protocol: string) => {
  selectedProtocol.value = protocol;
  fetchSentiment();
};

const getSentimentClass = (score: number) => {
  if (score >= 60) return 'sentiment-bullish';
  if (score <= 40) return 'sentiment-bearish';
  return 'sentiment-neutral';
};

const getTrendType = (trend: string) => {
  if (trend === 'bullish') return 'success';
  if (trend === 'bearish') return 'error';
  return 'default';
};

const getScoreColor = (score: number) => {
  if (score >= 60) return '#18a058';
  if (score <= 40) return '#d03050';
  return '#2080f0';
};

onMounted(() => {
  fetchOverview();
  fetchSentiment();
});
</script>

<style scoped>
.defi-protocol-sentiment {
  padding: 16px;
}

.mb-4 {
  margin-bottom: 16px;
}

.mt-4 {
  margin-top: 16px;
}

.sentiment-bars {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sentiment-bar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sentiment-bar .label {
  width: 60px;
  font-size: 14px;
  color: #666;
}

.score-card {
  text-align: center;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.score-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.score-value {
  font-size: 48px;
  font-weight: bold;
}

.sentiment-bullish {
  color: #18a058;
}

.sentiment-bearish {
  color: #d03050;
}

.sentiment-neutral {
  color: #2080f0;
}

.platform-scores {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.platform-score {
  display: grid;
  grid-template-columns: 80px 1fr 40px;
  align-items: center;
  gap: 12px;
}

.platform {
  font-size: 14px;
  color: #333;
}

.platform-score .value {
  font-weight: bold;
  text-align: right;
}

.distribution-chart {
  display: flex;
  justify-content: space-around;
  padding: 20px 0;
}

.progress-text {
  text-align: center;
}

.progress-text div:first-child {
  font-size: 12px;
  color: #666;
}

.progress-text div:last-child {
  font-size: 16px;
  font-weight: bold;
}

.text-success {
  color: #18a058;
}

.text-error {
  color: #d03050;
}
</style>
