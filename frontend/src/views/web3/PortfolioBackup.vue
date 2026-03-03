<template>
  <div class="portfolio-backup">
    <el-card class="header-card">
      <template #header>
        <div class="card-header">
          <span class="title">💾 Portfolio Backup & Restore</span>
          <el-tag type="success" effect="dark">API Ready</el-tag>
        </div>
      </template>
      <p class="description">
        Export and backup your portfolio data including wallets, watchlists, alerts, and strategies.
        Import configurations across devices or share with others.
      </p>
    </el-card>

    <el-row :gutter="20">
      <!-- Export Section -->
      <el-col :xs="24" :lg="12">
        <el-card class="feature-card">
          <template #header>
            <div class="card-header">
              <span>📤 Export Portfolio</span>
            </div>
          </template>
          
          <el-form label-position="top">
            <el-form-item label="Export Type">
              <el-select v-model="exportType" placeholder="Select export type" style="width: 100%">
                <el-option
                  v-for="type in exportTypes"
                  :key="type.type"
                  :label="type.type"
                  :value="type.type"
                >
                  <div class="option-content">
                    <span class="option-type">{{ type.type }}</span>
                    <span class="option-desc">{{ type.description }}</span>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="exportData" :loading="exporting" style="width: 100%">
                <el-icon><Download /></el-icon>
                Export Data
              </el-button>
            </el-form-item>

            <el-form-item>
              <el-button @click="downloadJson" :disabled="!exportedData" style="width: 100%">
                <el-icon><Download /></el-icon>
                Download as JSON
              </el-button>
            </el-form-item>
          </el-form>

          <el-divider />

          <div v-if="exportedData" class="preview-section">
            <h4>Export Preview</h4>
            <pre class="json-preview">{{ JSON.stringify(exportedData, null, 2).slice(0, 500) }}...</pre>
          </div>
        </el-card>
      </el-col>

      <!-- Import Section -->
      <el-col :xs="24" :lg="12">
        <el-card class="feature-card">
          <template #header>
            <div class="card-header">
              <span>📥 Import Portfolio</span>
            </div>
          </template>
          
          <el-form label-position="top">
            <el-form-item label="Import Mode">
              <el-radio-group v-model="importMode">
                <el-radio label="merge">Merge with existing</el-radio>
                <el-radio label="replace">Replace all</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="Backup Data (JSON)">
              <el-input
                v-model="importData"
                type="textarea"
                :rows="6"
                placeholder="Paste your backup JSON here..."
              />
            </el-form-item>

            <el-form-item>
              <el-button @click="validateData" :disabled="!importData" :loading="validating">
                <el-icon><Check /></el-icon>
                Validate
              </el-button>
              <el-button type="success" @click="importDataAction" :disabled="!importData" :loading="importing">
                <el-icon><Upload /></el-icon>
                Import
              </el-button>
            </el-form-item>
          </el-form>

          <el-divider />

          <div v-if="validationResult" class="validation-result">
            <h4>Validation Result</h4>
            <el-tag :type="validationResult.valid ? 'success' : 'danger'">
              {{ validationResult.valid ? 'Valid' : 'Invalid' }}
            </el-tag>
            <div v-if="validationResult.checks" class="checks">
              <p><strong>Version:</strong> {{ validationResult.version }}</p>
              <p><strong>Wallets:</strong> {{ validationResult.checks.wallets ? '✓' : '✗' }}</p>
              <p><strong>Watchlists:</strong> {{ validationResult.checks.watchlists ? '✓' : '✗' }}</p>
              <p><strong>Alerts:</strong> {{ validationResult.checks.alerts ? '✓' : '✗' }}</p>
              <p><strong>Strategies:</strong> {{ validationResult.checks.strategies ? '✓' : '✗' }}</p>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Statistics -->
    <el-card class="stats-card">
      <template #header>
        <div class="card-header">
          <span>📊 Backup Statistics</span>
          <el-button text @click="loadStatistics">
            <el-icon><Refresh /></el-icon>
          </el-button>
        </div>
      </template>
      
      <el-row :gutter="20">
        <el-col :xs="12" :sm="6">
          <div class="stat-item">
            <div class="stat-value">{{ statistics?.totalBackups || 0 }}</div>
            <div class="stat-label">Total Backups</div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div class="stat-item">
            <div class="stat-value">{{ formatBytes(statistics?.totalDataSize || 0) }}</div>
            <div class="stat-label">Total Size</div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div class="stat-item">
            <div class="stat-value">{{ statistics?.dataBreakdown?.wallets || 0 }}</div>
            <div class="stat-label">Wallets</div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div class="stat-item">
            <div class="stat-value">{{ statistics?.dataBreakdown?.watchlists || 0 }}</div>
            <div class="stat-label">Watchlists</div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- History -->
    <el-card class="history-card">
      <template #header>
        <div class="card-header">
          <span>📜 Backup History</span>
        </div>
      </template>
      
      <el-table :data="backupHistory" style="width: 100%">
        <el-table-column prop="id" label="ID" width="180" />
        <el-table-column prop="timestamp" label="Date" width="180">
          <template #default="{ row }">
            {{ formatDate(row.timestamp) }}
          </template>
        </el-table-column>
        <el-table-column prop="type" label="Type" width="120" />
        <el-table-column prop="size" label="Size">
          <template #default="{ row }">
            {{ formatBytes(row.size) }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Sample Data -->
    <el-card class="sample-card">
      <template #header>
        <div class="card-header">
          <span>📋 Sample Backup Format</span>
          <el-button text @click="loadSample">
            <el-icon><Refresh /></el-icon>
            Load Sample
          </el-button>
        </div>
      </template>
      
      <el-button @click="loadSample" style="margin-bottom: 10px">
        Get Sample Backup
      </el-button>

      <div v-if="sampleData" class="sample-preview">
        <pre>{{ JSON.stringify(sampleData, null, 2).slice(0, 800) }}...</pre>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Download, Upload, Check, Refresh } from '@element-plus/icons-vue';
import axios from 'axios';

const API_BASE = '/api/portfolio-backup';

// State
const exportType = ref('full');
const exportTypes = ref<any[]>([]);
const exporting = ref(false);
const exportedData = ref<any>(null);

const importMode = ref('merge');
const importData = ref('');
const validating = ref(false);
const importing = ref(false);
const validationResult = ref<any>(null);

const statistics = ref<any>(null);
const backupHistory = ref<any[]>([]);
const sampleData = ref<any>(null);

// Methods
const loadExportTypes = async () => {
  try {
    const res = await axios.get(`${API_BASE}/export-types`);
    exportTypes.value = res.data.data;
  } catch (error) {
    console.error('Failed to load export types:', error);
  }
};

const exportData = async () => {
  exporting.value = true;
  try {
    const res = await axios.post(`${API_BASE}/export`, { type: exportType.value });
    exportedData.value = res.data.data;
    ElMessage.success('Export successful!');
  } catch (error) {
    ElMessage.error('Export failed');
  } finally {
    exporting.value = false;
  }
};

const downloadJson = () => {
  if (!exportedData.value) return;
  
  const blob = new Blob([JSON.stringify(exportedData.value, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `portfolio-backup-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

const validateData = async () => {
  validating.value = true;
  try {
    const data = JSON.parse(importData.value);
    const res = await axios.post(`${API_BASE}/validate`, { data });
    validationResult.value = res.data.data;
    ElMessage.success('Validation complete');
  } catch (error) {
    ElMessage.error('Invalid JSON format');
    validationResult.value = { valid: false, issues: ['Invalid JSON format'] };
  } finally {
    validating.value = false;
  }
};

const importDataAction = async () => {
  importing.value = true;
  try {
    const data = JSON.parse(importData.value);
    const res = await axios.post(`${API_BASE}/import`, {
      data,
      merge: importMode.value === 'merge',
      replace: importMode.value === 'replace'
    });
    ElMessage.success(res.data.data.message);
    loadStatistics();
    loadHistory();
  } catch (error) {
    ElMessage.error('Import failed');
  } finally {
    importing.value = false;
  }
};

const loadStatistics = async () => {
  try {
    const res = await axios.get(`${API_BASE}/statistics`);
    statistics.value = res.data.data;
  } catch (error) {
    console.error('Failed to load statistics:', error);
  }
};

const loadHistory = async () => {
  try {
    const res = await axios.get(`${API_BASE}/history`);
    backupHistory.value = res.data.data.backups;
  } catch (error) {
    console.error('Failed to load history:', error);
  }
};

const loadSample = async () => {
  try {
    const res = await axios.get(`${API_BASE}/sample?type=full`);
    sampleData.value = res.data.data;
    importData.value = JSON.stringify(res.data.data, null, 2);
    ElMessage.success('Sample loaded');
  } catch (error) {
    ElMessage.error('Failed to load sample');
  }
};

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleString();
};

onMounted(() => {
  loadExportTypes();
  loadStatistics();
  loadHistory();
});
</script>

<style scoped>
.portfolio-backup {
  padding: 20px;
}

.header-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 18px;
  font-weight: bold;
}

.description {
  color: #666;
  margin: 0;
}

.feature-card {
  margin-bottom: 20px;
}

.option-content {
  display: flex;
  flex-direction: column;
}

.option-type {
  font-weight: bold;
  text-transform: capitalize;
}

.option-desc {
  font-size: 12px;
  color: #999;
}

.preview-section,
.validation-result,
.sample-preview {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 8px;
  overflow-x: auto;
}

.json-preview {
  font-size: 12px;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

.checks p {
  margin: 5px 0;
}

.stats-card {
  margin-bottom: 20px;
}

.stat-item {
  text-align: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  color: white;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
}

.stat-label {
  font-size: 12px;
  opacity: 0.8;
}

.history-card,
.sample-card {
  margin-bottom: 20px;
}

.sample-preview pre {
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 300px;
  overflow: auto;
}
</style>
