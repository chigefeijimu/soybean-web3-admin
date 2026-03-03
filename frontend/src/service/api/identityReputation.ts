// Web3 Identity & Reputation API Service

// Get verification message
export const getVerificationMessage = (type: 'sign' | 'login' | 'attest' = 'sign', domain?: string) => {
  const params = new URLSearchParams({ type });
  if (domain) params.append('domain', domain);
  return fetch(`/api/web3/identity/verify-message?${params}`)
    .then(res => res.json());
};

// Verify identity with signature
export const verifyIdentity = (address: string, signature: string, message: string, chainId?: number) => {
  return fetch('/api/web3/identity/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, signature, message, chainId }),
  }).then(res => res.json());
};

// Create or update profile
export const createProfile = (
  address: string,
  displayName: string,
  bio?: string,
  socialLinks?: { twitter?: string; github?: string; website?: string }
) => {
  return fetch('/api/web3/identity/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, displayName, bio, socialLinks }),
  }).then(res => res.json());
};

// Get profile by address
export const getProfile = (address: string) => {
  return fetch(`/api/web3/identity/profile/${address}`).then(res => res.json());
};

// Get reputation history
export const getReputationHistory = (address: string, limit?: number) => {
  const params = limit ? `?limit=${limit}` : '';
  return fetch(`/api/web3/identity/reputation/${address}${params}`).then(res => res.json());
};

// Get credentials
export const getCredentials = (address: string) => {
  return fetch(`/api/web3/identity/credentials/${address}`).then(res => res.json());
};

// Add cross-chain identity
export const addCrossChainIdentity = (address: string, chain: string, transactionCount: number) => {
  return fetch('/api/web3/identity/cross-chain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, chain, transactionCount }),
  }).then(res => res.json());
};

// Get cross-chain identities
export const getCrossChainIdentities = (address: string) => {
  return fetch(`/api/web3/identity/cross-chain/${address}`).then(res => res.json());
};

// Get top identities
export const getTopIdentities = (limit?: number) => {
  const params = limit ? `?limit=${limit}` : '';
  return fetch(`/api/web3/identity/top${params}`).then(res => res.json());
};

// Search identities
export const searchIdentities = (query: string, limit?: number) => {
  const params = new URLSearchParams({ q: query });
  if (limit) params.append('limit', limit.toString());
  return fetch(`/api/web3/identity/search?${params}`).then(res => res.json());
};

// Award badge
export const awardBadge = (address: string, badge: string) => {
  return fetch('/api/web3/identity/badge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, badge }),
  }).then(res => res.json());
};

// Get platform statistics
export const getIdentityStats = () => {
  return fetch('/api/web3/identity/stats').then(res => res.json());
};

// Compare identities
export const compareIdentities = (address1: string, address2: string) => {
  return fetch(`/api/web3/identity/compare/${address1}/${address2}`).then(res => res.json());
};

// Update reputation (internal)
export const updateReputation = (address: string, points: number, reason: string) => {
  return fetch('/api/web3/identity/reputation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, points, reason }),
  }).then(res => res.json());
};
