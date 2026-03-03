import { request } from '../request';

export interface PriceAlert {
  id: string;
  token: string;
  chain: string;
  targetPrice: number;
  condition: 'above' | 'below';
  currentPrice: number;
  notifyEmail: boolean;
  notifyWebhook: boolean;
  webhookUrl?: string;
  isActive: boolean;
  triggeredAt?: string;
  createdAt: string;
}

export interface TokenPrice {
  symbol: string;
  name: string;
  chain: string;
  price: number;
  change24h: number;
  change7d: number;
  marketCap: number;
  volume24h: number;
  lastUpdated: string;
}

export interface PriceAlertNotification {
  id: string;
  alertId: string;
  token: string;
  chain: string;
  targetPrice: number;
  triggeredPrice: number;
  condition: 'above' | 'below';
  triggeredAt: string;
  notified: boolean;
}

export interface PriceAlertStats {
  totalAlerts: number;
  activeAlerts: number;
  triggeredAlerts: number;
  totalNotifications: number;
  unreadNotifications: number;
  avgChangeToTarget: string;
  supportedTokens: number;
}

// Get all price alerts
export function getAlerts() {
  return request<PriceAlert[]>('/web3-token-price-alert/alerts');
}

// Get alert by ID
export function getAlertById(id: string) {
  return request<PriceAlert>(`/web3-token-price-alert/alerts/${id}`);
}

// Create new price alert
export function createAlert(alertData: {
  token: string;
  chain: string;
  targetPrice: number;
  condition: 'above' | 'below';
  notifyEmail?: boolean;
  notifyWebhook?: boolean;
  webhookUrl?: string;
}) {
  return request<PriceAlert>('/web3-token-price-alert/alerts', {
    method: 'POST',
    body: alertData,
  });
}

// Update price alert
export function updateAlert(id: string, updates: Partial<PriceAlert>) {
  return request<PriceAlert>(`/web3-token-price-alert/alerts/${id}`, {
    method: 'PUT',
    body: updates,
  });
}

// Delete price alert
export function deleteAlert(id: string) {
  return request<{ success: boolean }>(`/web3-token-price-alert/alerts/${id}`, {
    method: 'DELETE',
  });
}

// Toggle alert active status
export function toggleAlert(id: string) {
  return request<PriceAlert>(`/web3-token-price-alert/alerts/${id}/toggle`, {
    method: 'POST',
  });
}

// Reset triggered alert
export function resetAlert(id: string) {
  return request<PriceAlert>(`/web3-token-price-alert/alerts/${id}/reset`, {
    method: 'POST',
  });
}

// Get current token price
export function getTokenPrice(token: string, chain?: string) {
  const params = new URLSearchParams();
  if (chain) params.append('chain', chain);
  return request<TokenPrice>(`/web3-token-price-alert/price/${token}?${params}`);
}

// Get multiple token prices
export function getMultipleTokenPrices(tokens: string[], chain?: string) {
  return request<TokenPrice[]>('/web3-token-price-alert/prices', {
    method: 'POST',
    body: { tokens, chain },
  });
}

// Get supported tokens list
export function getSupportedTokens() {
  return request<Array<{ symbol: string; name: string }>>('/web3-token-price-alert/tokens');
}

// Get price history
export function getPriceHistory(token: string, days?: number) {
  const params = days ? `?days=${days}` : '';
  return request<Array<{ timestamp: string; price: number }>>(
    `/web3-token-price-alert/history/${token}${params}`
  );
}

// Get notifications
export function getNotifications(alertId?: string) {
  const params = alertId ? `?alertId=${alertId}` : '';
  return request<PriceAlertNotification[]>(`/web3-token-price-alert/notifications${params}`);
}

// Mark notification as sent
export function markNotificationSent(id: string) {
  return request<{ success: boolean }>(
    `/web3-token-price-alert/notifications/${id}/acknowledge`,
    { method: 'POST' }
  );
}

// Get statistics
export function getPriceAlertStats() {
  return request<PriceAlertStats>('/web3-token-price-alert/stats');
}

// Manually check prices
export function checkPrices() {
  return request<PriceAlertNotification[]>('/web3-token-price-alert/check', {
    method: 'POST',
  });
}
