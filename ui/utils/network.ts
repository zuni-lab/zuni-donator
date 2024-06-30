import { ProjectENV } from '@env';
import { baseSepolia } from 'viem/chains';
import { base } from 'wagmi/chains';

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

export const defaultNetworkConfig =
  ProjectENV.NEXT_PUBLIC_ENV === 'development' ? Networks.baseSepolia : Networks.base;
