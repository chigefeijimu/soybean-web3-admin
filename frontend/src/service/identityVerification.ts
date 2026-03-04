import { request } from '@/service/request';

export interface VerificationRequest {
  id: number;
  address: string;
  chainId: number;
  level: 'basic' | 'standard' | 'advanced' | 'enterprise';
  status: 'pending' | 'verified' | 'rejected' | 'expired';
  methods: string[];
  trustScore: number;
  createdAt: Date;
  expiresAt: Date;
  verifiedAt: Date | null;
  requiredActions?: string[];
}

export interface VerificationStats {
  totalVerifications: number;
  byLevel: { basic: number; standard: number; advanced: number; enterprise: number };
  byStatus: { pending: number; verified: number; rejected: number; expired: number };
  averageTrustScore: number;
  verificationRate: number;
}

export interface VerificationLevel {
  name: string;
  description: string;
  methods: string[];
  trustScore: number;
  price: number;
  features: string[];
}

export const createVerification = (data: {
  address: string;
  chainId: number;
  verificationLevel: 'basic' | 'standard' | 'advanced' | 'enterprise';
  methods: string[];
}) => {
  return request.post<VerificationRequest>('/web3-identity-verification', data);
};

export const getVerifications = (params?: {
  status?: string;
  level?: string;
  address?: string;
  page?: number;
  limit?: number;
}) => {
  return request.get<{ data: VerificationRequest[]; total: number; page: number; limit: number }>('/web3-identity-verification', { params });
};

export const getVerificationById = (id: number) => {
  return request.get<VerificationRequest>(`/web3-identity-verification/${id}`);
};

export const getVerificationByAddress = (address: string, chainId?: number) => {
  return request.get<{ data: VerificationRequest[]; count: number }>(`/web3-identity-verification/address/${address}`, {
    params: { chainId },
  });
};

export const getVerificationStats = () => {
  return request.get<VerificationStats>('/web3-identity-verification/stats');
};

export const getVerificationLevels = () => {
  return request.get<Record<string, VerificationLevel>>('/web3-identity-verification/levels');
};

export const verifyWallet = (data: {
  address: string;
  chainId: number;
  signature: string;
  message: string;
}) => {
  return request.post<{ success: boolean; message: string; timestamp: Date }>('/web3-identity-verification/verify/wallet', data);
};

export const verifyEmail = (data: { email: string; code: string }) => {
  return request.post<{ success: boolean; message: string; timestamp: Date }>('/web3-identity-verification/verify/email', data);
};

export const verifySocial = (data: { platform: string; handle: string; oauthToken?: string }) => {
  return request.post<{ success: boolean; platform: string; handle: string; message: string; timestamp: Date }>('/web3-identity-verification/verify/social', data);
};

export const submitKyc = (data: {
  firstName: string;
  lastName: string;
  documentType: string;
  documentId: string;
  country: string;
}) => {
  return request.post<{ success: boolean; status: string; message: string; reviewTime: Date }>('/web3-identity-verification/verify/kyc', data);
};

export const completeVerification = (id: number) => {
  return request.put<VerificationRequest>(`/web3-identity-verification/${id}/complete`);
};

export const rejectVerification = (id: number, reason: string) => {
  return request.put<VerificationRequest>(`/web3-identity-verification/${id}/reject`, { reason });
};

export const deleteVerification = (id: number) => {
  return request.delete<{ success: boolean; message: string }>(`/web3-identity-verification/${id}`);
};

export const sendEmailCode = (email: string) => {
  return request.post<{ success: boolean; message: string; expiresIn: number }>('/web3-identity-verification/send-email-code', { email });
};

export const calculateTrustScore = (address: string) => {
  return request.get<number>('/web3-identity-verification/trust-score/calculate', { params: { address } });
};
