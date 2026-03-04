import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

class CreateVerificationDto {
  address: string;
  chainId: number;
  verificationLevel: 'basic' | 'standard' | 'advanced' | 'enterprise';
  methods: ('wallet' | 'email' | 'phone' | 'social' | 'kyc')[];
}

class VerifyWalletDto {
  address: string;
  chainId: number;
  signature: string;
  message: string;
}

class VerifyEmailDto {
  email: string;
  code: string;
}

class VerifySocialDto {
  platform: 'twitter' | 'discord' | 'github' | 'telegram';
  handle: string;
  oauthToken?: string;
}

class KycSubmissionDto {
  firstName: string;
  lastName: string;
  documentType: 'passport' | 'drivers_license' | 'national_id';
  documentId: string;
  country: string;
}

class VerificationStats {
  totalVerifications: number;
  byLevel: { basic: number; standard: number; advanced: number; enterprise: number };
  byStatus: { pending: number; verified: number; rejected: number; expired: number };
  averageTrustScore: number;
  verificationRate: number;
}

@ApiTags('Identity Verification')
@Controller('web3-identity-verification')
export class Web3IdentityVerificationController {
  private verifications = new Map();
  private idCounter = 1;

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    const levels = ['basic', 'standard', 'advanced', 'enterprise'] as const;
    const statuses = ['pending', 'verified', 'rejected', 'expired'] as const;
    const methods = ['wallet', 'email', 'phone', 'social', 'kyc'] as const;
    const chains = [1, 137, 42161, 10, 56, 8453, 43114];

    for (let i = 0; i < 50; i++) {
      const id = this.idCounter++;
      const verification = {
        id,
        address: `0x${Math.random().toString(16).substr(2, 40)}`,
        chainId: chains[Math.floor(Math.random() * chains.length)],
        level: levels[Math.floor(Math.random() * levels.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        methods: [methods[Math.floor(Math.random() * 3)]],
        trustScore: Math.floor(Math.random() * 40) + 60,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000),
        verifiedAt: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : null,
      };
      this.verifications.set(id, verification);
    }
  }

  @Post()
  @ApiOperation({ summary: 'Create verification request' })
  @ApiResponse({ status: 201, description: 'Verification request created' })
  create(@Body() dto: CreateVerificationDto) {
    const id = this.idCounter++;
    const verification = {
      id,
      address: dto.address,
      chainId: dto.chainId,
      level: dto.verificationLevel,
      status: 'pending',
      methods: dto.methods,
      trustScore: 0,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      verifiedAt: null,
      requiredActions: dto.methods.map(m => this.getRequiredAction(m)),
    };
    this.verifications.set(id, verification);
    return verification;
  }

  private getRequiredAction(method: string): string {
    const actions: Record<string, string> = {
      wallet: 'Sign verification message with wallet',
      email: 'Verify email address',
      phone: 'Verify phone number',
      social: 'Connect social media account',
      kyc: 'Submit identity documents',
    };
    return actions[method] || '';
  }

  @Post('verify/wallet')
  @ApiOperation({ summary: 'Verify wallet ownership' })
  verifyWallet(@Body() dto: VerifyWalletDto) {
    const verified = Math.random() > 0.1;
    return {
      success: verified,
      message: verified ? 'Wallet verified successfully' : 'Signature verification failed',
      timestamp: new Date(),
    };
  }

  @Post('verify/email')
  @ApiOperation({ summary: 'Verify email address' })
  verifyEmail(@Body() dto: VerifyEmailDto) {
    const verified = dto.code === '123456' || Math.random() > 0.1;
    return {
      success: verified,
      message: verified ? 'Email verified successfully' : 'Invalid verification code',
      timestamp: new Date(),
    };
  }

  @Post('verify/social')
  @ApiOperation({ summary: 'Verify social media account' })
  verifySocial(@Body() dto: VerifySocialDto) {
    return {
      success: true,
      platform: dto.platform,
      handle: dto.handle,
      message: `${dto.platform} account connected successfully`,
      timestamp: new Date(),
    };
  }

  @Post('verify/kyc')
  @ApiOperation({ summary: 'Submit KYC documents' })
  submitKyc(@Body() dto: KycSubmissionDto) {
    const statuses = ['pending', 'approved', 'rejected'];
    const status = statuses[Math.floor(Math.random() * 3)];
    return {
      success: status === 'approved',
      status,
      message: status === 'approved' ? 'KYC approved' : status === 'pending' ? 'KYC under review' : 'KYC rejected',
      reviewTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
  }

  @Get()
  @ApiOperation({ summary: 'List all verifications' })
  findAll(
    @Query('status') status?: string,
    @Query('level') level?: string,
    @Query('address') address?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    let results = Array.from(this.verifications.values());
    
    if (status) results = results.filter(v => v.status === status);
    if (level) results = results.filter(v => v.level === level);
    if (address) results = results.filter(v => v.address.toLowerCase().includes(address.toLowerCase()));

    const start = (parseInt(page) - 1) * parseInt(limit);
    const paginated = results.slice(start, start + parseInt(limit));

    return {
      data: paginated,
      total: results.length,
      page: parseInt(page),
      limit: parseInt(limit),
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get verification statistics' })
  getStats(): VerificationStats {
    const verifications = Array.from(this.verifications.values());
    const verified = verifications.filter(v => v.status === 'verified');
    
    return {
      totalVerifications: verifications.length,
      byLevel: {
        basic: verifications.filter(v => v.level === 'basic').length,
        standard: verifications.filter(v => v.level === 'standard').length,
        advanced: verifications.filter(v => v.level === 'advanced').length,
        enterprise: verifications.filter(v => v.level === 'enterprise').length,
      },
      byStatus: {
        pending: verifications.filter(v => v.status === 'pending').length,
        verified: verified.length,
        rejected: verifications.filter(v => v.status === 'rejected').length,
        expired: verifications.filter(v => v.status === 'expired').length,
      },
      averageTrustScore: verified.length > 0 
        ? Math.round(verified.reduce((sum, v) => sum + v.trustScore, 0) / verified.length)
        : 0,
      verificationRate: verifications.length > 0
        ? Math.round((verified.length / verifications.length) * 100)
        : 0,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get verification by ID' })
  findOne(@Param('id') id: string) {
    const verification = this.verifications.get(parseInt(id));
    if (!verification) {
      return { error: 'Verification not found', status: 404 };
    }
    return verification;
  }

  @Get('address/:address')
  @ApiOperation({ summary: 'Get verifications by address' })
  findByAddress(@Param('address') address: string, @Query('chainId') chainId?: string) {
    let results = Array.from(this.verifications.values())
      .filter(v => v.address.toLowerCase() === address.toLowerCase());
    
    if (chainId) {
      results = results.filter(v => v.chainId === parseInt(chainId));
    }
    
    return {
      data: results,
      count: results.length,
    };
  }

  @Put(':id/complete')
  @ApiOperation({ summary: 'Complete verification' })
  complete(@Param('id') id: string) {
    const verification = this.verifications.get(parseInt(id));
    if (!verification) {
      return { error: 'Verification not found', status: 404 };
    }
    
    verification.status = 'verified';
    verification.verifiedAt = new Date();
    verification.trustScore = this.calculateTrustScore(verification);
    
    return verification;
  }

  @Put(':id/reject')
  @ApiOperation({ summary: 'Reject verification' })
  reject(@Param('id') id: string, @Body('reason') reason: string) {
    const verification = this.verifications.get(parseInt(id));
    if (!verification) {
      return { error: 'Verification not found', status: 404 };
    }
    
    verification.status = 'rejected';
    verification.rejectionReason = reason;
    
    return verification;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete verification' })
  remove(@Param('id') id: string) {
    const exists = this.verifications.has(parseInt(id));
    this.verifications.delete(parseInt(id));
    return { success: exists, message: exists ? 'Verification deleted' : 'Verification not found' };
  }

  @Get('trust-score/calculate')
  @ApiOperation({ summary: 'Calculate trust score' })
  calculateTrustScore(@Query('address') address: string) {
    const verifications = Array.from(this.verifications.values())
      .filter(v => v.address.toLowerCase() === address.toLowerCase() && v.status === 'verified');
    
    if (verifications.length === 0) return 0;
    
    const levelScores: Record<string, number> = {
      basic: 20,
      standard: 40,
      advanced: 70,
      enterprise: 100,
    };
    
    const totalScore = verifications.reduce((sum, v) => sum + levelScores[v.level], 0);
    const methodBonus = Math.min(verifications[0].methods.length * 5, 25);
    
    return Math.min(Math.round(totalScore / verifications.length + methodBonus), 100);
  }

  @Post('send-email-code')
  @ApiOperation({ summary: 'Send email verification code' })
  sendEmailCode(@Body('email') email: string) {
    return {
      success: true,
      message: 'Verification code sent',
      expiresIn: 300,
    };
  }

  @Get('levels')
  @ApiOperation({ summary: 'Get verification levels info' })
  getLevels() {
    return {
      basic: {
        name: 'Basic',
        description: 'Wallet ownership verification',
        methods: ['wallet'],
        trustScore: 20,
        price: 0,
        features: ['Wallet verification', 'Basic trust score'],
      },
      standard: {
        name: 'Standard',
        description: 'Wallet + Email verification',
        methods: ['wallet', 'email'],
        trustScore: 40,
        price: 9.99,
        features: ['Wallet verification', 'Email verification', 'Standard trust score', 'Email notifications'],
      },
      advanced: {
        name: 'Advanced',
        description: 'Wallet + Email + Social verification',
        methods: ['wallet', 'email', 'social'],
        trustScore: 70,
        price: 29.99,
        features: ['All Standard features', 'Social media verification', 'Higher trust score', 'API access'],
      },
      enterprise: {
        name: 'Enterprise',
        description: 'Full KYC verification',
        methods: ['wallet', 'email', 'phone', 'social', 'kyc'],
        trustScore: 100,
        price: 99.99,
        features: ['All Advanced features', 'KYC verification', 'Highest trust score', 'Priority support', 'Custom integrations'],
      },
    };
  }
}
