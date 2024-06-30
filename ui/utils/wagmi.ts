import { ProjectENV } from '@env';
import { createConfig, http } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';

export const wagmiConfig = createConfig({
  chains: [base, baseSepolia],
  multiInjectedProviderDiscovery: false,
  ssr: true,
  transports: {
    [base.id]: http(
      `https://base-mainnet.g.alchemy.com/v2/${ProjectENV.NEXT_PUBLIC_ALCHEMY_API_KEY}`
    ),
    [baseSepolia.id]: http(
      `https://base-sepolia.g.alchemy.com/v2/${ProjectENV.NEXT_PUBLIC_ALCHEMY_API_KEY}`
    ),
  },
});
