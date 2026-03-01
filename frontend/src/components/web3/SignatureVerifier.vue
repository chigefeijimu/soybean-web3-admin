<script setup lang="ts">
import { ref, computed } from 'vue';
import { useWeb3 } from '@/composables/web3/useWeb3';

const { ethers } = useWeb3();

// State
const message = ref('Hello, Web3!');
const signature = ref('');
const verifyResult = ref<{
  isValid: boolean;
  recoveredAddress: string;
  originalAddress: string;
  error?: string;
} | null>(null);

// Sign message with connected wallet
const signMessage = async () => {
  if (!ethers) {
    verifyResult.value = {
      isValid: false,
      recoveredAddress: '',
      originalAddress: '',
      error: 'Ethers.js not available'
    };
    return;
  }
  
  try {
    const signer = await (window as any).ethereum?.request({ method: 'eth_requestAccounts' });
    if (!signer || signer.length === 0) {
      verifyResult.value = {
        isValid: false,
        recoveredAddress: '',
        originalAddress: '',
        error: 'Wallet not connected'
      };
      return;
    }
    
    // Use browser wallet to sign
    const provider = new ethers.BrowserProvider((window as any).ethereum);
    const signerObj = await provider.getSigner();
    const signatureHex = await signerObj.signMessage(message.value);
    signature.value = signatureHex;
    
    // Auto verify after signing
    verifySignature();
  } catch (e: any) {
    verifyResult.value = {
      isValid: false,
      recoveredAddress: '',
      originalAddress: '',
      error: e.message || 'Signing failed'
    };
  }
};

// Verify signature
const verifySignature = async () => {
  if (!signature.value || !message.value) {
    verifyResult.value = {
      isValid: false,
      recoveredAddress: '',
      originalAddress: '',
      error: 'Please provide both message and signature'
    };
    return;
  }
  
  try {
    if (!ethers) {
      verifyResult.value = {
        isValid: false,
        recoveredAddress: '',
        originalAddress: '',
        error: 'Ethers.js not available'
      };
      return;
    }
    
    // Verify using ethers.js
    const recoveredAddress = ethers.verifyMessage(message.value, signature.value);
    
    verifyResult.value = {
      isValid: true,
      recoveredAddress,
      originalAddress: ''
    };
  } catch (e: any) {
    verifyResult.value = {
      isValid: false,
      recoveredAddress: '',
      originalAddress: '',
      error: e.message || 'Verification failed'
    };
  }
};

// Verify with specific address
const verifyWithAddress = async () => {
  if (!signature.value || !message.value || !verifyResult.value?.recoveredAddress) {
    return;
  }
  
  const originalAddress = verifyResult.value.recoveredAddress;
  verifyResult.value.originalAddress = originalAddress;
};

// Clear all fields
const clearAll = () => {
  message.value = 'Hello, Web3!';
  signature.value = '';
  verifyResult.value = null;
};

// Copy to clipboard
const copySignature = async () => {
  if (signature.value) {
    await navigator.clipboard.writeText(signature.value);
  }
};

// Common test messages
const commonMessages = [
  { label: 'Login', value: 'I want to login to Web3 Dashboard' },
  { label: 'Verify', value: 'Verify my address ownership' },
  { label: 'Transaction', value: 'Authorize transaction of 1 ETH' },
  { label: 'Custom', value: '' }
];

const selectMessage = (msg: string) => {
  if (msg) {
    message.value = msg;
  }
};
</script>

<template>
  <div class="signature-verifier">
    <div class="header">
      <h3>🔏 Signature Verifier</h3>
      <p class="subtitle">Verify Ethereum message signatures</p>
    </div>

    <div class="content">
      <!-- Message Input -->
      <div class="form-group">
        <label>Message</label>
        <textarea 
          v-model="message" 
          placeholder="Enter message to sign or verify"
          rows="3"
        ></textarea>
        
        <div class="quick-messages">
          <span class="label">Quick:</span>
          <button 
            v-for="msg in commonMessages" 
            :key="msg.label"
            @click="selectMessage(msg.value)"
            class="quick-btn"
          >
            {{ msg.label }}
          </button>
        </div>
      </div>

      <!-- Signature Input -->
      <div class="form-group">
        <label>Signature (hex)</label>
        <div class="signature-input">
          <input 
            v-model="signature" 
            placeholder="0x..."
            class="mono"
          />
          <button @click="copySignature" class="copy-btn" title="Copy">
            📋
          </button>
        </div>
      </div>

      <!-- Actions -->
      <div class="actions">
        <button @click="signMessage" class="btn-primary">
          ✍️ Sign Message
        </button>
        <button @click="verifySignature" class="btn-secondary">
          ✅ Verify Signature
        </button>
        <button @click="clearAll" class="btn-ghost">
          🗑️ Clear
        </button>
      </div>

      <!-- Verification Result -->
      <div v-if="verifyResult" class="result" :class="{ 
        'success': verifyResult.isValid,
        'error': !verifyResult.isValid 
      }">
        <div class="result-header">
          <span class="icon">{{ verifyResult.isValid ? '✅' : '❌' }}</span>
          <span class="status">{{ verifyResult.isValid ? 'Signature Valid' : 'Verification Failed' }}</span>
        </div>
        
        <div v-if="verifyResult.error" class="error-message">
          {{ verifyResult.error }}
        </div>
        
        <div v-if="verifyResult.isValid" class="result-details">
          <div class="detail-row">
            <span class="label">Recovered Address:</span>
            <code class="address">{{ verifyResult.recoveredAddress }}</code>
          </div>
          
          <div v-if="verifyResult.originalAddress" class="detail-row">
            <span class="label">Match:</span>
            <span :class="verifyResult.recoveredAddress.toLowerCase() === verifyResult.originalAddress.toLowerCase() ? 'match' : 'no-match'">
              {{ verifyResult.recoveredAddress.toLowerCase() === verifyResult.originalAddress.toLowerCase() ? '✅ Address matches' : '❌ Address does not match' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Info Box -->
      <div class="info-box">
        <h4>ℹ️ How it works</h4>
        <ul>
          <li><strong>Sign:</strong> Connect wallet and sign a message</li>
          <li><strong>Verify:</strong> Recover the signer's address from signature</li>
          <li><strong>Use cases:</strong> Authentication, proof of ownership, off-chain agreements</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.signature-verifier {
  background: var(--bg-color, #1a1a2e);
  border-radius: 12px;
  padding: 20px;
  color: var(--text-color, #eee);
}

.header {
  margin-bottom: 20px;
  border-bottom: 1px solid var(--border-color, #333);
  padding-bottom: 12px;
}

.header h3 {
  margin: 0 0 4px 0;
  font-size: 1.3rem;
}

.subtitle {
  margin: 0;
  opacity: 0.7;
  font-size: 0.9rem;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--accent-color, #646cff);
}

.form-group textarea,
.form-group input {
  background: var(--input-bg, #16213e);
  border: 1px solid var(--border-color, #333);
  border-radius: 8px;
  padding: 12px;
  color: var(--text-color, #eee);
  font-size: 0.95rem;
  width: 100%;
  box-sizing: border-box;
}

.form-group textarea:focus,
.form-group input:focus {
  outline: none;
  border-color: var(--accent-color, #646cff);
}

.mono {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.85rem;
}

.signature-input {
  display: flex;
  gap: 8px;
}

.signature-input input {
  flex: 1;
}

.copy-btn {
  background: var(--btn-bg, #2a2a4a);
  border: 1px solid var(--border-color, #333);
  border-radius: 8px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.2s;
}

.copy-btn:hover {
  background: var(--btn-hover, #3a3a5a);
}

.quick-messages {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.quick-messages .label {
  font-size: 0.8rem;
  opacity: 0.7;
}

.quick-btn {
  background: var(--btn-bg, #2a2a4a);
  border: 1px solid var(--border-color, #333);
  border-radius: 20px;
  padding: 4px 12px;
  font-size: 0.75rem;
  cursor: pointer;
  color: var(--text-color, #eee);
  transition: all 0.2s;
}

.quick-btn:hover {
  background: var(--accent-color, #646cff);
  border-color: var(--accent-color, #646cff);
}

.actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-primary,
.btn-secondary,
.btn-ghost {
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-primary {
  background: var(--accent-color, #646cff);
  color: white;
}

.btn-primary:hover {
  background: var(--accent-hover, #535bf2);
}

.btn-secondary {
  background: var(--success-color, #10b981);
  color: white;
}

.btn-secondary:hover {
  background: #059669;
}

.btn-ghost {
  background: transparent;
  border: 1px solid var(--border-color, #333);
  color: var(--text-color, #eee);
}

.btn-ghost:hover {
  background: var(--btn-hover, #3a3a5a);
}

.result {
  border-radius: 8px;
  padding: 16px;
  margin-top: 8px;
}

.result.success {
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid #10b981;
}

.result.error {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid #ef4444;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.result-header .icon {
  font-size: 1.2rem;
}

.result-header .status {
  font-weight: 600;
  font-size: 1rem;
}

.result-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-row .label {
  font-size: 0.8rem;
  opacity: 0.7;
}

.detail-row .address {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.85rem;
  background: rgba(0, 0, 0, 0.3);
  padding: 8px;
  border-radius: 4px;
  word-break: break-all;
}

.match {
  color: #10b981;
}

.no-match {
  color: #ef4444;
}

.error-message {
  color: #ef4444;
  font-size: 0.9rem;
}

.info-box {
  background: var(--info-bg, rgba(100, 108, 255, 0.1));
  border-radius: 8px;
  padding: 12px;
  margin-top: 8px;
}

.info-box h4 {
  margin: 0 0 8px 0;
  font-size: 0.95rem;
  color: var(--accent-color, #646cff);
}

.info-box ul {
  margin: 0;
  padding-left: 20px;
  font-size: 0.85rem;
  opacity: 0.8;
}

.info-box li {
  margin-bottom: 4px;
}
</style>
