<script setup lang="ts">
import { ref } from 'vue'

interface Contact {
  id: string
  name: string
  address: string
  note: string
  tags: string[]
}

const contacts = ref<Contact[]>([
  { id: '1', name: 'Main Wallet', address: '0x742d35Cc6634C0532925a3b844Bc9e7595f', note: 'Primary wallet', tags: ['wallet'] },
  { id: '2', name: 'Cold Storage', address: '0x1234567890abcdef1234567890abcdef12345678', note: 'Long term', tags: ['cold'] },
  { id: '3', name: 'Deployer', address: '0xdeadbeef12345678deadbeef12345678deadbeef', note: 'Contract deployer', tags: ['deployer'] },
])

const search = ref('')
const showAddModal = ref(false)
const newContact = ref({ name: '', address: '', note: '', tags: '' })

const filteredContacts = () => {
  if (!search.value) return contacts.value
  return contacts.value.filter(c => 
    c.name.toLowerCase().includes(search.value.toLowerCase()) ||
    c.address.toLowerCase().includes(search.value.toLowerCase())
  )
}

const addContact = () => {
  if (!newContact.value.name || !newContact.value.address) return
  contacts.value.push({
    id: Date.now().toString(),
    ...newContact.value,
    tags: newContact.value.tags.split(',').map(t => t.trim()).filter(Boolean)
  })
  showAddModal.value = false
  newContact.value = { name: '', address: '', note: '', tags: '' }
}

const deleteContact = (id: string) => {
  contacts.value = contacts.value.filter(c => c.id !== id)
}
</script>

<template>
  <div class="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
    <div class="p-6 border-b border-slate-700/50 flex items-center justify-between">
      <div>
        <h2 class="text-xl font-semibold">📒 Address Book</h2>
        <p class="text-sm text-slate-400 mt-1">Manage your saved addresses</p>
      </div>
      <button 
        @click="showAddModal = true"
        class="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg font-medium"
      >
        + Add
      </button>
    </div>

    <div class="p-6">
      <input 
        v-model="search"
        placeholder="Search contacts..."
        class="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
      />

      <div class="space-y-3">
        <div v-for="contact in filteredContacts()" :key="contact.id" 
          class="p-4 bg-slate-900/50 rounded-xl border border-slate-700">
          <div class="flex justify-between items-start">
            <div>
              <p class="font-medium">{{ contact.name }}</p>
              <p class="text-sm text-slate-400 font-mono">{{ contact.address.slice(0, 18) }}...</p>
              <p v-if="contact.note" class="text-xs text-slate-500 mt-1">{{ contact.note }}</p>
              <div class="flex gap-1 mt-2">
                <span v-for="tag in contact.tags" :key="tag" 
                  class="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs">
                  {{ tag }}
                </span>
              </div>
            </div>
            <button @click="deleteContact(contact.id)" class="text-slate-500 hover:text-red-400">
              🗑️
            </button>
          </div>
        </div>
      </div>

      <div v-if="filteredContacts().length === 0" class="text-center py-8 text-slate-500">
        <p>No contacts found</p>
      </div>
    </div>

    <!-- Add Modal -->
    <div v-if="showAddModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-slate-800 p-6 rounded-xl w-96 border border-slate-700">
        <h3 class="text-lg font-semibold mb-4">Add Contact</h3>
        <input v-model="newContact.name" placeholder="Name" class="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg mb-3" />
        <input v-model="newContact.address" placeholder="Address" class="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg mb-3" />
        <input v-model="newContact.note" placeholder="Note (optional)" class="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg mb-3" />
        <input v-model="newContact.tags" placeholder="Tags (comma separated)" class="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg mb-4" />
        <div class="flex gap-2">
          <button @click="showAddModal = false" class="flex-1 py-2 bg-slate-700 rounded-lg">Cancel</button>
          <button @click="addContact" class="flex-1 py-2 bg-purple-500 rounded-lg">Add</button>
        </div>
      </div>
    </div>
  </div>
</template>
