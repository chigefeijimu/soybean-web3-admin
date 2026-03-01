<script setup lang="ts">
import { ref } from 'vue';

interface IpfsFile {
  cid: string;
  name: string;
  size: number;
  url: string;
  uploadedAt: string;
}

const selectedFile = ref<File | null>(null);
const jsonContent = ref('');
const isJsonMode = ref(false);
const isUploading = ref(false);
const uploadResult = ref<IpfsFile | null>(null);
const error = ref('');

const pinnedFiles = ref<IpfsFile[]>([
  {
    cid: 'QmXyZ123456789',
    name: 'nft_metadata.json',
    size: 1024,
    url: 'https://ipfs.io/ipfs/QmXyZ123456789',
    uploadedAt: '2024-01-15'
  },
  {
    cid: 'QmAbC987654321',
    name: 'profile.png',
    size: 204800,
    url: 'https://ipfs.io/ipfs/QmAbC987654321',
    uploadedAt: '2024-01-10'
  }
]);

const onFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files?.[0]) {
    selectedFile.value = input.files[0];
    uploadResult.value = null;
    error.value = '';
  }
};

const upload = async () => {
  if (isJsonMode.value) {
    if (!jsonContent.value) {
      error.value = 'Please enter JSON content';
      return;
    }
  } else if (!selectedFile.value) {
    error.value = 'Please select a file';
    return;
  }

  isUploading.value = true;
  error.value = '';

  try {
    await new Promise(resolve => {
      setTimeout(resolve, 2000);
    });

    // Mock response
    const cid = `Qm${Math.random().toString(36).substring(2, 15)}`;
    const file = isJsonMode.value
      ? new File([jsonContent.value], 'data.json', { type: 'application/json' })
      : selectedFile.value!;

    uploadResult.value = {
      cid,
      name: file.name,
      size: file.size,
      url: `https://ipfs.io/ipfs/${cid}`,
      uploadedAt: new Date().toISOString().split('T')[0]
    };

    pinnedFiles.value.unshift(uploadResult.value);

    // Reset
    selectedFile.value = null;
    jsonContent.value = '';
  } catch {
    error.value = 'Upload failed';
  } finally {
    isUploading.value = false;
  }
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const copyUrl = (url: string) => {
  navigator.clipboard.writeText(url);
};
</script>

<template>
  <div class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl">
    <h2 class="mb-6 text-xl font-semibold">IPFS Upload</h2>

    <!-- Mode Toggle -->
    <div class="mb-4 flex gap-2">
      <button
        class="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
        :class="[!isJsonMode ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-700 text-slate-400']"
        @click="isJsonMode = false"
      >
        📁 File
      </button>
      <button
        class="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
        :class="[isJsonMode ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-700 text-slate-400']"
        @click="isJsonMode = true"
      >
        📝 JSON
      </button>
    </div>

    <!-- File Input -->
    <div v-if="!isJsonMode" class="mb-4">
      <label
        class="block w-full cursor-pointer border-2 border-slate-600 rounded-xl border-dashed p-8 text-center transition-colors hover:border-purple-500"
      >
        <input type="file" class="hidden" @change="onFileSelect" />
        <div v-if="selectedFile">
          <p class="text-lg font-medium">{{ selectedFile.name }}</p>
          <p class="text-sm text-slate-400">{{ formatSize(selectedFile.size) }}</p>
        </div>
        <div v-else>
          <p class="mb-2 text-4xl">📤</p>
          <p class="text-slate-400">Click to select file</p>
        </div>
      </label>
    </div>

    <!-- JSON Input -->
    <div v-else class="mb-4">
      <textarea
        v-model="jsonContent"
        placeholder='{"name": "My NFT", "description": "..."}'
        class="h-40 w-full border border-slate-700 rounded-xl bg-slate-900/50 p-4 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
      />
    </div>

    <!-- Error -->
    <div v-if="error" class="mb-4 border border-red-500/50 rounded-lg bg-red-500/20 p-3 text-sm text-red-300">
      {{ error }}
    </div>

    <!-- Upload Button -->
    <button
      :disabled="isUploading"
      class="w-full rounded-xl from-purple-500 to-blue-500 bg-gradient-to-r py-3 font-medium transition-all hover:from-purple-600 hover:to-blue-600 disabled:opacity-50"
      @click="upload"
    >
      {{ isUploading ? 'Uploading...' : 'Upload to IPFS' }}
    </button>

    <!-- Result -->
    <div v-if="uploadResult" class="mt-4 border border-green-500/50 rounded-xl bg-green-500/20 p-4">
      <p class="mb-2 text-green-400 font-medium">✅ Uploaded Successfully!</p>
      <div class="flex items-center gap-2">
        <code class="flex-1 overflow-x-auto rounded bg-slate-800 p-2 text-sm">
          {{ uploadResult.cid }}
        </code>
        <button class="rounded p-2 hover:bg-slate-700" @click="copyUrl(uploadResult!.url)">📋</button>
      </div>
      <a
        :href="uploadResult.url"
        target="_blank"
        rel="noopener noreferrer"
        class="mt-2 block text-sm text-purple-400 hover:underline"
      >
        🔗 {{ uploadResult.url }}
      </a>
    </div>

    <!-- Pinned Files -->
    <div class="mt-6 border-t border-slate-700 pt-6">
      <h3 class="mb-3 text-sm text-slate-400 font-medium">Pinned Files</h3>
      <div class="space-y-2">
        <div
          v-for="file in pinnedFiles"
          :key="file.cid"
          class="flex items-center justify-between rounded-xl bg-slate-900/50 p-3"
        >
          <div>
            <p class="text-sm font-medium">{{ file.name }}</p>
            <p class="text-xs text-slate-400">{{ formatSize(file.size) }} • {{ file.uploadedAt }}</p>
          </div>
          <a :href="file.url" target="_blank" rel="noopener noreferrer" class="text-sm text-purple-400 hover:underline">
            View
          </a>
        </div>
      </div>
    </div>
  </div>
</template>
