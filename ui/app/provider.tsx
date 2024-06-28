'use client';

import { wagmiConfig } from '@/utils/wagmi';
import { EthereumWalletConnectors } from '@dynamic-labs/ethereum';
import { DynamicContextProvider } from '@dynamic-labs/sdk-react-core';
import { DynamicWagmiConnector } from '@dynamic-labs/wagmi-connector';
import { ProjectENV } from '@env';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import React from 'react';
import { WagmiProvider } from 'wagmi';

function Providers({ children }: React.PropsWithChildren) {
  const [client] = React.useState(
    new QueryClient({ defaultOptions: { queries: { staleTime: 5000 } } })
  );

  return (
    <DynamicContextProvider
      settings={{
        environmentId: ProjectENV.NEXT_PUBLIC_WALLET_CONNECT_ENV_ID,
        walletConnectors: [EthereumWalletConnectors],
      }}>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={client}>
          <DynamicWagmiConnector>{children}</DynamicWagmiConnector>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </WagmiProvider>
    </DynamicContextProvider>
  );
}

export default Providers;
