import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';

export interface IdentityProfile {
  address: string;
  ens?: string;
  displayName: string;
  bio?: string;
  avatar?: string;
  socialLinks: {
    twitter?: string;
    github?: string;
    website?: string;
  };
  verified: boolean;
  reputationScore: number;
  reputationLevel: 'newbie' | 'trusted' | 'expert' | 'veteran' | 'legend';
  createdAt: number;
  lastActive: number;
  totalInteractions: number;
  badges: string[];
}

export interface IdentityVerification {
  address: string;
  verified: boolean;
  verificationType: 'signature' | 'social' | 'kyc';
  verifiedAt?: number;
  expiresAt?: number;
}

export interface ReputationHistory {
  address: string;
  score: number;
  change: number;
  reason: string;
  timestamp: number;
}

export interface IdentityCredential {
  id: string;
  type: 'ownership' | 'activity' | 'verification' | 'badge';
  name: string;
  description: string;
  issuedAt: number;
  expiresAt?: number;
  metadata?: Record<string, any>;
}

export interface CrossChainIdentity {
  address: string;
  chain: string;
  verified: boolean;
  firstSeen: number;
  lastSeen: number;
  transactionCount: number;
}

@Injectable()
export class IdentityReputationService {
  private readonly rpcUrls: Record<number, string> = {
    1: 'https://eth.llamarpc.com',
    56: 'https://bsc-dataseed.binance.org',
    137: 'https://polygon-rpc.com',
    42161: 'https://arb1.arbitrum.io/rpc',
    10: 'https://mainnet.optimism.io',
    8453: 'https://mainnet.base.org',
    43114: 'https://api.avax.network',
  };

  // In-memory storage (replace with database in production)
  private profiles: Map<string, IdentityProfile> = new Map();
  private verifications: Map<string, IdentityVerification> = new Map();
  private credentials: Map<string, IdentityCredential[]> = new Map();
  private crossChainIdentities: Map<string, CrossChainIdentity[]> = new Map();
  private reputationHistory: Map<string, ReputationHistory[]> = new Map();

  // Verification messages
  private readonly verificationMessages: Record<string, string> = {
    sign: 'Verify your Web3 identity on {domain}. Sign this message to prove ownership of this address.',
    login: 'Login to {domain} at {timestamp}. This signature is valid for 24 hours.',
    attest: 'Attest your reputation on {domain}. This creates a verifiable credential.',
  };

  constructor(private readonly httpService: HttpService) {}

  /**
   * Generate a verification message for signature
   */
  generateVerificationMessage(type: 'sign' | 'login' | 'attest', domain?: string): string {
    const d = domain || 'Web3 Platform';
    const msg = this.verificationMessages[type];
    
    if (type === 'login') {
      return msg
        .replace('{domain}', d)
        .replace('{timestamp}', Date.now().toString());
    }
    
    return msg.replace('{domain}', d);
  }

  /**
   * Verify a signature (simplified - in production use proper signature verification)
   */
  async verifySignature(
    address: string,
    signature: string,
    message: string,
    chainId: number = 1
  ): Promise<{ valid: boolean; recoveredAddress?: string }> {
    try {
      // For demo purposes, we simulate signature verification
      // In production, use ethers.js or web3.js for proper verification
      
      // Check if message format is valid
      if (!message.includes('Verify your') && !message.includes('Login to') && !message.includes('Attest your')) {
        return { valid: false };
      }

      // Simulate verification (in production, use proper ECDSA recovery)
      const simulatedValid = signature.length > 0 && address.startsWith('0x');
      
      if (simulatedValid) {
        return { valid: true, recoveredAddress: address.toLowerCase() };
      }
      
      return { valid: false };
    } catch (error) {
      return { valid: false };
    }
  }

  /**
   * Create or update an identity profile
   */
  async createProfile(
    address: string,
    displayName: string,
    bio?: string,
    socialLinks?: { twitter?: string; github?: string; website?: string }
  ): Promise<IdentityProfile> {
    const normalizedAddress = address.toLowerCase();
    const now = Date.now();
    
    let profile = this.profiles.get(normalizedAddress);
    
    if (profile) {
      // Update existing profile
      profile.displayName = displayName;
      profile.bio = bio;
      profile.socialLinks = { ...profile.socialLinks, ...socialLinks };
      profile.lastActive = now;
    } else {
      // Create new profile
      profile = {
        address: normalizedAddress,
        displayName,
        bio,
        socialLinks: socialLinks || {},
        verified: false,
        reputationScore: 0,
        reputationLevel: 'newbie',
        createdAt: now,
        lastActive: now,
        totalInteractions: 0,
        badges: [],
      };
    }
    
    this.profiles.set(normalizedAddress, profile);
    
    // Add initial credential
    this.addCredential(normalizedAddress, {
      id: crypto.randomUUID(),
      type: 'ownership',
      name: 'Address Ownership',
      description: 'Verified ownership of wallet address',
      issuedAt: now,
    });
    
    return profile;
  }

  /**
   * Get identity profile by address
   */
  async getProfile(address: string): Promise<IdentityProfile | null> {
    const normalizedAddress = address.toLowerCase();
    return this.profiles.get(normalizedAddress) || null;
  }

  /**
   * Verify identity with signature
   */
  async verifyIdentity(
    address: string,
    signature: string,
    message: string,
    chainId: number = 1
  ): Promise<{ success: boolean; profile?: IdentityProfile; verification?: IdentityVerification }> {
    const normalizedAddress = address.toLowerCase();
    
    // Verify signature
    const { valid, recoveredAddress } = await this.verifySignature(
      normalizedAddress,
      signature,
      message,
      chainId
    );
    
    if (!valid || recoveredAddress?.toLowerCase() !== normalizedAddress) {
      throw new HttpException(
        'Invalid signature',
        HttpStatus.UNAUTHORIZED
      );
    }
    
    // Get or create profile
    let profile = this.profiles.get(normalizedAddress);
    if (!profile) {
      profile = await this.createProfile(normalizedAddress, `User_${normalizedAddress.slice(2, 8)}`);
    }
    
    // Update verification status
    profile.verified = true;
    profile.lastActive = Date.now();
    this.profiles.set(normalizedAddress, profile);
    
    // Create verification record
    const verification: IdentityVerification = {
      address: normalizedAddress,
      verified: true,
      verificationType: 'signature',
      verifiedAt: Date.now(),
      expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
    };
    
    this.verifications.set(normalizedAddress, verification);
    
    // Add reputation points
    await this.updateReputation(normalizedAddress, 10, 'Identity verified');
    
    // Add verification badge
    if (!profile.badges.includes('verified')) {
      profile.badges.push('verified');
    }
    
    return { success: true, profile, verification };
  }

  /**
   * Update reputation score
   */
  async updateReputation(
    address: string,
    points: number,
    reason: string
  ): Promise<IdentityProfile> {
    const normalizedAddress = address.toLowerCase();
    let profile = this.profiles.get(normalizedAddress);
    
    if (!profile) {
      profile = await this.createProfile(normalizedAddress, `User_${normalizedAddress.slice(2, 8)}`);
    }
    
    const oldScore = profile.reputationScore;
    profile.reputationScore = Math.max(0, Math.min(1000, profile.reputationScore + points));
    profile.lastActive = Date.now();
    profile.totalInteractions++;
    
    // Determine reputation level
    profile.reputationLevel = this.calculateReputationLevel(profile.reputationScore);
    
    this.profiles.set(normalizedAddress, profile);
    
    // Record reputation history
    const history: ReputationHistory = {
      address: normalizedAddress,
      score: profile.reputationScore,
      change: profile.reputationScore - oldScore,
      reason,
      timestamp: Date.now(),
    };
    
    const historyList = this.reputationHistory.get(normalizedAddress) || [];
    historyList.push(history);
    // Keep only last 100 records
    this.reputationHistory.set(normalizedAddress, historyList.slice(-100));
    
    return profile;
  }

  /**
   * Calculate reputation level based on score
   */
  private calculateReputationLevel(score: number): IdentityProfile['reputationLevel'] {
    if (score >= 800) return 'legend';
    if (score >= 600) return 'veteran';
    if (score >= 400) return 'expert';
    if (score >= 100) return 'trusted';
    return 'newbie';
  }

  /**
   * Get reputation history
   */
  async getReputationHistory(address: string, limit: number = 50): Promise<ReputationHistory[]> {
    const normalizedAddress = address.toLowerCase();
    const history = this.reputationHistory.get(normalizedAddress) || [];
    return history.slice(-limit);
  }

  /**
   * Add credential to identity
   */
  private addCredential(address: string, credential: IdentityCredential): void {
    const normalizedAddress = address.toLowerCase();
    const credentials = this.credentials.get(normalizedAddress) || [];
    credentials.push(credential);
    this.credentials.set(normalizedAddress, credentials);
  }

  /**
   * Get credentials for an address
   */
  async getCredentials(address: string): Promise<IdentityCredential[]> {
    const normalizedAddress = address.toLowerCase();
    return this.credentials.get(normalizedAddress) || [];
  }

  /**
   * Add cross-chain identity
   */
  async addCrossChainIdentity(
    address: string,
    chain: string,
    transactionCount: number
  ): Promise<CrossChainIdentity> {
    const normalizedAddress = address.toLowerCase();
    const now = Date.now();
    
    const identities = this.crossChainIdentities.get(normalizedAddress) || [];
    const existingIndex = identities.findIndex(i => i.chain === chain);
    
    const identity: CrossChainIdentity = {
      address: normalizedAddress,
      chain,
      verified: true,
      firstSeen: existingIndex >= 0 ? identities[existingIndex].firstSeen : now,
      lastSeen: now,
      transactionCount,
    };
    
    if (existingIndex >= 0) {
      identities[existingIndex] = identity;
    } else {
      identities.push(identity);
    }
    
    this.crossChainIdentities.set(normalizedAddress, identities);
    
    // Award reputation for cross-chain activity
    if (identities.length > 1) {
      await this.updateReputation(normalizedAddress, 5, `Verified identity on ${chain}`);
    }
    
    return identity;
  }

  /**
   * Get cross-chain identities
   */
  async getCrossChainIdentities(address: string): Promise<CrossChainIdentity[]> {
    const normalizedAddress = address.toLowerCase();
    return this.crossChainIdentities.get(normalizedAddress) || [];
  }

  /**
   * Get top identities by reputation
   */
  async getTopIdentities(limit: number = 20): Promise<IdentityProfile[]> {
    const allProfiles = Array.from(this.profiles.values());
    return allProfiles
      .sort((a, b) => b.reputationScore - a.reputationScore)
      .slice(0, limit);
  }

  /**
   * Search identities by name or address
   */
  async searchIdentities(query: string, limit: number = 20): Promise<IdentityProfile[]> {
    const normalizedQuery = query.toLowerCase();
    const allProfiles = Array.from(this.profiles.values());
    
    return allProfiles
      .filter(p => 
        p.address.includes(normalizedQuery) ||
        p.displayName.toLowerCase().includes(normalizedQuery) ||
        p.ens?.toLowerCase().includes(normalizedQuery)
      )
      .slice(0, limit);
  }

  /**
   * Award badge to user
   */
  async awardBadge(address: string, badge: string): Promise<IdentityProfile> {
    const normalizedAddress = address.toLowerCase();
    let profile = this.profiles.get(normalizedAddress);
    
    if (!profile) {
      throw new HttpException('Profile not found', HttpStatus.NOT_FOUND);
    }
    
    if (!profile.badges.includes(badge)) {
      profile.badges.push(badge);
      await this.updateReputation(normalizedAddress, 20, `Earned badge: ${badge}`);
    }
    
    return profile;
  }

  /**
   * Get platform statistics
   */
  async getPlatformStats(): Promise<{
    totalIdentities: number;
    verifiedIdentities: number;
    averageReputation: number;
    levelDistribution: Record<string, number>;
  }> {
    const allProfiles = Array.from(this.profiles.values());
    
    const levelDistribution: Record<string, number> = {
      newbie: 0,
      trusted: 0,
      expert: 0,
      veteran: 0,
      legend: 0,
    };
    
    let totalScore = 0;
    let verifiedCount = 0;
    
    for (const profile of allProfiles) {
      totalScore += profile.reputationScore;
      if (profile.verified) verifiedCount++;
      levelDistribution[profile.reputationLevel]++;
    }
    
    return {
      totalIdentities: allProfiles.length,
      verifiedIdentities: verifiedCount,
      averageReputation: allProfiles.length > 0 ? totalScore / allProfiles.length : 0,
      levelDistribution,
    };
  }

  /**
   * Compare two identities
   */
  async compareIdentities(address1: string, address2: string): Promise<{
    profile1: IdentityProfile;
    profile2: IdentityProfile;
    comparison: {
      reputationDiff: number;
      activityDiff: number;
      badgesDiff: number;
      commonChains: string[];
    };
  }> {
    const profile1 = await this.getProfile(address1);
    const profile2 = await this.getProfile(address2);
    
    if (!profile1 || !profile2) {
      throw new HttpException('One or both profiles not found', HttpStatus.NOT_FOUND);
    }
    
    const chains1 = (this.crossChainIdentities.get(address1.toLowerCase()) || []).map(c => c.chain);
    const chains2 = (this.crossChainIdentities.get(address2.toLowerCase()) || []).map(c => c.chain);
    const commonChains = chains1.filter(c => chains2.includes(c));
    
    return {
      profile1,
      profile2,
      comparison: {
        reputationDiff: profile1.reputationScore - profile2.reputationScore,
        activityDiff: profile1.totalInteractions - profile2.totalInteractions,
        badgesDiff: profile1.badges.length - profile2.badges.length,
        commonChains,
      },
    };
  }
}
