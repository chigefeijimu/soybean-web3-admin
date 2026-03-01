<script setup lang="ts">
import { ref } from 'vue'

interface Airdrop {
  id: string
  name: string
  status: 'upcoming' | 'active' | 'claimed'
  amount: number
  value: number
  deadline: string
  steps: string[]
}

const airdrops = ref<Airdrop[]>([
  { id: '1', name: 'LayerZero', status: 'active', amount: 2500, value: 5000, deadline: '2026-03-15', steps: ['Bridge', 'Swap', 'Vote'] },
  { id: '2', name: 'Stargate', status: 'upcoming', amount: 500, value: 800, deadline: '2026-04-01', steps: ['Bridge', 'Transfer'] },
  { id: '3', name: 'zkSync', status: 'claimed', amount: 320, value: 450, deadline: '2026-01-01', steps: ['Done'] },
])

const totalPending = () => airdrops.value.filter(a => a.status !== 'claimed').reduce((sum, a) => sum + a.value, 0)
</script>

<template>
  <div class="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
    <div class="p-6 border-b border-slate-700/50">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-xl font-semibold">🎁 Airdrop Tracker</h2>
          <p class="text-sm text-slate-400 mt-1">Track potential and upcoming airdrops</p>
        </div>
        <div class="text-right">
          <p class="text-xs text-slate-400">Pending Value</p>
          <p class="text-2xl font-bold text-green-400">${{ totalPending().toLocaleString() }}</p>
        </div>
      </div>
    </div>

    <div class="p-4 space-y-3 max-h-96 overflow-y-auto">
      <div v-for="drop in airdrops" :key="drop.id"
        class="p-4 bg-slate-900/50 rounded-xl border border-slate-700">
        <div class="flex justify-between items-start">
          <div>
            <div class="flex items-center gap-2">
              <h3 class="font-semibold">{{ drop.name }}</h3>
              <span :class="['px-2 py-0.5 rounded-full text-xs font-medium',
                drop.status === 'active' ? 'bg-green-500/20 text-green-400' :
                drop.status === 'upcoming' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-purple-500/20 text-purple-400']">
                {{ drop.status }}
              </span>
            </div>
            <div class="flex gap-4 mt-2 text-sm text-slate-400">
              <span>{{ drop.amount }} tokens</span>
              <span>~${{ drop.value }}</span>
              <span>Due: {{ drop.deadline }}</span>
            </div>
          </div>
        </div>
        <div v-if="drop.steps.length > 0" class="mt-3 flex gap-1">
          <span v-for="(step, i) in drop.steps" :key="i"
            class="px-2 py-1 bg-slate-700 rounded text-xs text-slate-400">
            {{ step }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
