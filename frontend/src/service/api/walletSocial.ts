import { request } from '../request';

/** 关注的钱包 */
export interface FollowedWallet {
  address: string;
  label: string;
  category: string;
  followedAt: number;
  notes: string;
}

/** 钱包活动 */
export interface WalletActivity {
  hash: string;
  from: string;
  to: string;
  value: string;
  token: string;
  tokenValue: string;
  timestamp: number;
  type: 'swap' | 'transfer' | 'nft' | 'defi' | 'stake' | 'unknown';
  chain: string;
  gasUsed: string;
  status: 'success' | 'failed';
}

/** 钱包统计 */
export interface WalletStats {
  totalTransactions: number;
  totalVolume: string;
  avgTransactionSize: string;
  topTokens: string[];
  mostActiveHour: number;
  activityScore: number;
  riskLevel: 'low' | 'medium' | 'high';
}

/** 社交动态项 */
export interface SocialFeedItem {
  wallet: string;
  label: string;
  activity: WalletActivity;
  followers: number;
}

/** 通知配置 */
export interface NotificationConfig {
  walletAddress: string;
  notifyOnSwap: boolean;
  notifyOnTransfer: boolean;
  notifyOnNFT: boolean;
  notifyOnDefi: boolean;
  minTransactionValue: number;
}

/**
 * 关注钱包
 */
export function followWallet(params: {
  userId: string;
  walletAddress: string;
  label?: string;
  category?: string;
  notes?: string;
}) {
  return request<{ success: boolean; wallet: FollowedWallet }>({
    url: '/web3-wallet-social/follow',
    method: 'post',
    data: params
  });
}

/**
 * 取消关注钱包
 */
export function unfollowWallet(userId: string, walletAddress: string) {
  return request<{ success: boolean }>({
    url: `/web3-wallet-social/unfollow/${userId}/${walletAddress}`,
    method: 'delete'
  });
}

/**
 * 获取已关注钱包
 */
export function getFollowedWallets(userId: string) {
  return request<FollowedWallet[]>({
    url: `/web3-wallet-social/following/${userId}`,
    method: 'get'
  });
}

/**
 * 获取钱包活动
 */
export function getWalletActivity(address: string, chainId?: number, limit?: number) {
  return request<WalletActivity[]>({
    url: `/web3-wallet-social/activity/${address}`,
    method: 'get',
    params: { chainId, limit }
  });
}

/**
 * 获取钱包统计
 */
export function getWalletStats(address: string, chainId?: number) {
  return request<WalletStats>({
    url: `/web3-wallet-social/stats/${address}`,
    method: 'get',
    params: { chainId }
  });
}

/**
 * 获取社交动态
 */
export function getSocialFeed(userId: string, limit?: number) {
  return request<SocialFeedItem[]>({
    url: `/web3-wallet-social/feed/${userId}`,
    method: 'get',
    params: { limit }
  });
}

/**
 * 配置通知
 */
export function configureNotifications(config: NotificationConfig & { userId?: string }) {
  return request<{ success: boolean }>({
    url: '/web3-wallet-social/notifications',
    method: 'post',
    data: config
  });
}

/**
 * 获取通知设置
 */
export function getNotificationSettings(userId: string) {
  return request<NotificationConfig[]>({
    url: `/web3-wallet-social/notifications/${userId}`,
    method: 'get'
  });
}

/**
 * 查询已知地址
 */
export function lookupAddress(address: string) {
  return request<{
    isKnown: boolean;
    label?: string;
    category?: string;
    riskAssessment?: string;
  }>({
    url: `/web3-wallet-social/lookup/${address}`,
    method: 'get'
  });
}

/**
 * 获取热门钱包
 */
export function getTrendingWallets(limit?: number) {
  return request<Array<{
    address: string;
    label: string;
    category: string;
    followerCount: number;
    recentActivity: number;
  }>>({
    url: '/web3-wallet-social/trending',
    method: 'get',
    params: { limit }
  });
}

/**
 * 对比钱包
 */
export function compareWallets(addresses: string[]) {
  return request({
    url: '/web3-wallet-social/compare',
    method: 'post',
    data: { addresses }
  });
}
