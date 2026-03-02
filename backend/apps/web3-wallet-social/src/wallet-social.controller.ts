import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { WalletSocialService, FollowedWallet, WalletActivity, WalletStats, SocialFeedItem, NotificationConfig } from './wallet-social.service';

@Controller('wallet-social')
export class WalletSocialController {
  constructor(private readonly walletSocialService: WalletSocialService) {}

  /**
   * Follow a wallet
   * POST /wallet-social/follow
   */
  @Post('follow')
  async followWallet(
    @Body() body: { userId: string; walletAddress: string; label?: string; category?: string; notes?: string }
  ): Promise<{ success: boolean; wallet: FollowedWallet }> {
    return this.walletSocialService.followWallet(
      body.userId,
      body.walletAddress,
      body.label,
      body.category,
      body.notes
    );
  }

  /**
   * Unfollow a wallet
   * DELETE /wallet-social/unfollow/:userId/:walletAddress
   */
  @Delete('unfollow/:userId/:walletAddress')
  async unfollowWallet(
    @Param('userId') userId: string,
    @Param('walletAddress') walletAddress: string
  ): Promise<{ success: boolean }> {
    return this.walletSocialService.unfollowWallet(userId, walletAddress);
  }

  /**
   * Get followed wallets
   * GET /wallet-social/following/:userId
   */
  @Get('following/:userId')
  async getFollowedWallets(@Param('userId') userId: string): Promise<FollowedWallet[]> {
    return this.walletSocialService.getFollowedWallets(userId);
  }

  /**
   * Get wallet activity
   * GET /wallet-social/activity/:address
   */
  @Get('activity/:address')
  async getWalletActivity(
    @Param('address') address: string,
    @Query('chainId') chainId?: string,
    @Query('limit') limit?: string
  ): Promise<WalletActivity[]> {
    return this.walletSocialService.getWalletActivity(
      address,
      chainId ? parseInt(chainId) : 1,
      limit ? parseInt(limit) : 20
    );
  }

  /**
   * Get wallet statistics
   * GET /wallet-social/stats/:address
   */
  @Get('stats/:address')
  async getWalletStats(
    @Param('address') address: string,
    @Query('chainId') chainId?: string
  ): Promise<WalletStats> {
    return this.walletSocialService.getWalletStats(
      address,
      chainId ? parseInt(chainId) : 1
    );
  }

  /**
   * Get social feed
   * GET /wallet-social/feed/:userId
   */
  @Get('feed/:userId')
  async getSocialFeed(
    @Param('userId') userId: string,
    @Query('limit') limit?: string
  ): Promise<SocialFeedItem[]> {
    return this.walletSocialService.getSocialFeed(
      userId,
      limit ? parseInt(limit) : 20
    );
  }

  /**
   * Configure notifications
   * POST /wallet-social/notifications
   */
  @Post('notifications')
  async configureNotifications(
    @Body() config: NotificationConfig
  ): Promise<{ success: boolean }> {
    return this.walletSocialService.configureNotifications(config.userId || '', config);
  }

  /**
   * Get notification settings
   * GET /wallet-social/notifications/:userId
   */
  @Get('notifications/:userId')
  async getNotificationSettings(@Param('userId') userId: string): Promise<NotificationConfig[]> {
    return this.walletSocialService.getNotificationSettings(userId);
  }

  /**
   * Lookup address (known whale/celebrity)
   * GET /wallet-social/lookup/:address
   */
  @Get('lookup/:address')
  async lookupAddress(
    @Param('address') address: string
  ): Promise<{
    isKnown: boolean;
    label?: string;
    category?: string;
    riskAssessment?: string;
  }> {
    return this.walletSocialService.lookupAddress(address);
  }

  /**
   * Get trending wallets
   * GET /wallet-social/trending
   */
  @Get('trending')
  async getTrendingWallets(@Query('limit') limit?: string): Promise<Array<{
    address: string;
    label: string;
    category: string;
    followerCount: number;
    recentActivity: number;
  }>> {
    return this.walletSocialService.getTrendingWallets(limit ? parseInt(limit) : 10);
  }

  /**
   * Compare wallets
   * POST /wallet-social/compare
   */
  @Post('compare')
  async compareWallets(
    @Body() body: { addresses: string[] }
  ): Promise<{
    wallets: Array<{
      address: string;
      label: string;
      stats: WalletStats;
    }>;
    comparison: {
      mostActive: string;
      highestVolume: string;
      commonTokens: string[];
    };
  }> {
    return this.walletSocialService.compareWallets(body.addresses);
  }
}
