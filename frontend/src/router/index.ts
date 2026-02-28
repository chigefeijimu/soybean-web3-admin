import type { App } from 'vue';
import {
  type RouterHistory,
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory
} from 'vue-router';
import { layouts, views } from './elegant/imports';
import { transformElegantRoutesToVueRoutes } from './elegant/transform';
import { createRouterGuard } from './guard';
import { generatedRoutes } from './elegant/routes';

const { VITE_ROUTER_HISTORY_MODE = 'history', VITE_BASE_URL } = import.meta.env;

const historyCreatorMap: Record<Env.RouterHistoryMode, (base?: string) => RouterHistory> = {
  hash: createWebHashHistory,
  history: createWebHistory,
  memory: createMemoryHistory
};

// Create a root route that redirects to home
const rootRoute = {
  path: '/',
  redirect: '/home'
};

// Include all generated routes with root redirect
const allRoutes = [
  rootRoute,
  ...transformElegantRoutesToVueRoutes(generatedRoutes, layouts, views)
];

export const router = createRouter({
  history: historyCreatorMap[VITE_ROUTER_HISTORY_MODE](VITE_BASE_URL),
  routes: allRoutes
});

/** Setup Vue Router */
export async function setupRouter(app: App) {
  app.use(router);
  createRouterGuard(router);
  await router.isReady();
}
