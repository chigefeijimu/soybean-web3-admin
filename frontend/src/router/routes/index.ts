import type { CustomRoute, ElegantConstRoute, ElegantRoute } from '@elegant-router/types';
import { generatedRoutes } from '../elegant/routes';
import { layouts, views } from '../elegant/imports';
import { transformElegantRoutesToVueRoutes } from '../elegant/transform';

/**
 * custom routes
 *
 * @link https://github.com/soybeanjs/elegant-router?tab=readme-ov-file#custom-route
 */
const customRoutes: CustomRoute[] = [
  {
    name: 'web3_nft-floor-price-oracle',
    path: '/web3/nft-floor-price-oracle',
    component: 'view.web3_nft-floor-price-oracle',
    meta: {
      title: 'NFT Floor Price Oracle',
      i18nKey: 'route.web3_nft-floor-price-oracle',
      icon: 'mdi:nft'
    }
  },
  {
    name: 'web3_dao-treasury-manager',
    path: '/web3/dao-treasury-manager',
    component: 'view.web3_dao-treasury-manager',
    meta: {
      title: 'DAO Treasury Manager',
      i18nKey: 'route.web3_dao-treasury-manager',
      icon: 'mdi:treasure-chest'
    }
  },
  {
    name: 'web3_token-transfer-tracker',
    path: '/web3/token-transfer-tracker',
    component: 'view.web3_token-transfer-tracker',
    meta: {
      title: 'Token Transfer Tracker',
      i18nKey: 'route.web3_token-transfer-tracker',
      icon: 'mdi:swap-horizontal'
    }
  },
  {
    name: 'web3_defi-usage-analytics',
    path: '/web3/defi-usage-analytics',
    component: 'view.web3_defi-usage-analytics',
    meta: {
      title: 'DeFi Usage Analytics',
      i18nKey: 'route.web3_defi-usage-analytics',
      icon: 'mdi:chart-areaspline'
    }
  },
  {
    name: 'web3_token-balance-history',
    path: '/web3/token-balance-history',
    component: 'view.web3_token-balance-history',
    meta: {
      title: 'Token Balance History',
      i18nKey: 'route.web3_token-balance-history',
      icon: 'mdi:history'
    }
  },
  {
    name: 'web3_multisig-health-monitor',
    path: '/web3/multisig-health-monitor',
    component: 'view.web3_multisig-health-monitor',
    meta: {
      title: 'Multi-sig Health Monitor',
      i18nKey: 'route.web3_multisig-health-monitor',
      icon: 'mdi:shield-check'
    }
  }
];

/** create routes when the auth route mode is static */
export function createStaticRoutes() {
  const constantRoutes: ElegantRoute[] = [];

  const authRoutes: ElegantRoute[] = [];

  [...customRoutes, ...generatedRoutes].forEach(item => {
    if (item.meta?.constant) {
      constantRoutes.push(item);
    } else {
      authRoutes.push(item);
    }
  });

  return {
    constantRoutes,
    authRoutes
  };
}

/**
 * Get auth vue routes
 *
 * @param routes Elegant routes
 */
export function getAuthVueRoutes(routes: ElegantConstRoute[]) {
  return transformElegantRoutesToVueRoutes(routes, layouts, views);
}
