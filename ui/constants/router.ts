import { usePathname } from 'next/navigation';

export const AppRouter = {
  Home: '/',
  About: '/about',
  Vaults: '/vaults',
  Policy: '/policy',
  Documentation: '/docs',
};

export type RouterKey = keyof typeof AppRouter;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const RouterMeta: Record<RouterKey, { title: string; description?: string; icon: any }> = {
  Home: { title: 'Home', description: 'Zuni - Smart Vaults', icon: null },
  About: { title: 'About', icon: null },
  Vaults: { title: 'ZUNI - Smart Vaults', description: 'Explore the vaults', icon: null },
  Policy: { title: 'Policy', description: 'Policy', icon: null },
  Documentation: { title: 'Documentation', description: 'Documentation', icon: null },
};

/**
 * Get current router meta
 */
export const useCurrentRouterMeta = () => {
  const pathname = usePathname()?.slice(3);
  const currentRouterKey =
    (Object.keys(AppRouter).find((key) => AppRouter[key as RouterKey] === pathname) as RouterKey) ??
    'Home';
  const currentRouterMeta = RouterMeta[currentRouterKey];
  if (currentRouterMeta && currentRouterMeta.icon === null) {
    currentRouterMeta.icon = '/favicon.ico';
  }

  return { ...currentRouterMeta, key: currentRouterKey };
};
