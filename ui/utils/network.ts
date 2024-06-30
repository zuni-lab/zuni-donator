import { base, baseSepolia } from 'wagmi/chains';

type TNetwork = 'base' | 'baseSepolia';
type TNetworkConfig = {
  easScan: string;
  blockExplorers: typeof base.blockExplorers | typeof baseSepolia.blockExplorers;
};

export const Networks: Record<TNetwork, TNetworkConfig> = {
  base: {
    easScan: 'https://base.easscan.org',
    blockExplorers: base.blockExplorers,
  },
  baseSepolia: {
    easScan: 'https://base-sepolia.easscan.org',
    blockExplorers: baseSepolia.blockExplorers,
  },
};

export const getNetworkConfig = (chainId: number) => {
  let networkConfig: TNetworkConfig;
  if (chainId === base.id) {
    networkConfig = Networks['base'];
  } else {
    networkConfig = Networks['baseSepolia'];
  }
  return networkConfig;
};

// export const networkConfig =
//   ProjectENV.NEXT_PUBLIC_ENV === 'development' ? Networks.baseSepolia : Networks.base;
