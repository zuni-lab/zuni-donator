type TNetwork = 'base' | 'baseSepolia';
type TNetworkConfig = {
  easScan: string;
};

export const Networks: Record<TNetwork, TNetworkConfig> = {
  base: {
    easScan: 'https://base.easscan.org',
  },
  baseSepolia: {
    easScan: 'https://base-sepolia.easscan.org',
  },
};

export const defaultNetworkConfig = Networks.baseSepolia;
