import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

export interface SocialGraphParams {
  address: string;
  chain?: string;
  depth?: number;
}

export interface InteractionsParams {
  address: string;
  chain?: string;
  limit?: number;
}

export interface CompareParams {
  addresses: string[];
  chain?: string;
}

export const getAddressSocialGraph = (params: SocialGraphParams) => 
  api.get('/web3/social-graph/analyze', { params });

export const getAddressInteractions = (params: InteractionsParams) => 
  api.get('/web3/social-graph/interactions', { params });

export const compareAddresses = (params: CompareParams) => 
  api.post('/web3/social-graph/compare', params);

export const getInfluencers = (chain?: string, minVolume?: number) => 
  api.get('/web3/social-graph/influencers', { params: { chain, minVolume } });
