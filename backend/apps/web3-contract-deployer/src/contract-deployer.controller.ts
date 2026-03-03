import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ContractDeployerService, DeployErc20Params, DeployErc721Params, DeployMultisigParams } from './contract-deployer.service';

@Controller('contract-deployer')
export class ContractDeployerController {
  constructor(private readonly deployerService: ContractDeployerService) {}

  /**
   * GET /api/contract-deployer/chains
   * Get list of supported chains
   */
  @Get('chains')
  getSupportedChains() {
    const chains = this.deployerService.getSupportedChains();
    return { success: true, data: chains };
  }

  /**
   * GET /api/contract-deployer/templates
   * Get all contract templates
   */
  @Get('templates')
  getTemplates() {
    const templates = this.deployerService.getTemplates();
    return { success: true, data: templates };
  }

  /**
   * GET /api/contract-deployer/templates/:id
   * Get specific template by ID
   */
  @Get('templates/:id')
  getTemplateById(@Param('id') id: string) {
    const template = this.deployerService.getTemplateById(id);
    if (!template) {
      return { success: false, error: `Template not found: ${id}` };
    }
    return { success: true, data: template };
  }

  /**
   * GET /api/contract-deployer/templates/chain/:chain
   * Get templates supported on a specific chain
   */
  @Get('templates/chain/:chain')
  getTemplatesByChain(@Param('chain') chain: string) {
    const templates = this.deployerService.getTemplatesByChain(chain);
    return { success: true, data: templates };
  }

  /**
   * GET /api/contract-deployer/templates/type/:type
   * Get templates by type (ERC20, ERC721, ERC1155, MULTISIG)
   */
  @Get('templates/type/:type')
  getTemplatesByType(@Param('type') type: string) {
    const templates = this.deployerService.getTemplatesByType(type);
    return { success: true, data: templates };
  }

  /**
   * POST /api/contract-deployer/deploy/erc20
   * Deploy ERC20 token contract
   */
  @Post('deploy/erc20')
  async deployErc20(@Body() body: DeployErc20Params) {
    const result = await this.deployerService.deployErc20(body);
    return { success: result.success, data: result };
  }

  /**
   * POST /api/contract-deployer/deploy/erc721
   * Deploy ERC721 NFT contract
   */
  @Post('deploy/erc721')
  async deployErc721(@Body() body: DeployErc721Params) {
    const result = await this.deployerService.deployErc721(body);
    return { success: result.success, data: result };
  }

  /**
   * POST /api/contract-deployer/deploy/multisig
   * Deploy Multisig wallet contract
   */
  @Post('deploy/multisig')
  async deployMultisig(@Body() body: DeployMultisigParams) {
    const result = await this.deployerService.deployMultisig(body);
    return { success: result.success, data: result };
  }

  /**
   * GET /api/contract-deployer/cost/:templateId
   * Get deployment cost estimate for a template
   */
  @Get('cost/:templateId')
  async getDeploymentCost(
    @Param('templateId') templateId: string,
    @Query('chain') chain: string,
  ) {
    try {
      const cost = await this.deployerService.getDeploymentCost(templateId, chain);
      return { success: true, data: cost };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * GET /api/contract-deployer/history/:address
   * Get deployment history for an address
   */
  @Get('history/:address')
  async getDeploymentHistory(@Param('address') address: string) {
    const history = await this.deployerService.getDeploymentHistory(address);
    return { success: true, data: history };
  }

  /**
   * GET /api/contract-deployer/gas/:chain
   * Get gas recommendations for deployment
   */
  @Get('gas/:chain')
  async getGasRecommendation(@Param('chain') chain: string) {
    const recommendation = await this.deployerService.getGasRecommendation(chain);
    return { success: true, data: recommendation };
  }

  /**
   * GET /api/contract-deployer/health
   * Health check endpoint
   */
  @Get('health')
  healthCheck() {
    return {
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'Smart Contract Deployer',
      version: '1.0.0',
      features: [
        'ERC20 Token Deployment',
        'ERC721 NFT Deployment',
        'ERC1155 Multi-Token Deployment',
        'Multisig Wallet Deployment',
        'Deployment Cost Estimation',
        'Gas Price Recommendations',
      ],
    };
  }
}
