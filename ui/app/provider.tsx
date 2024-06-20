'use client';

import { createWagmiConfig } from '@/utils/wagmi';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { ProjectENV } from '@env';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import React from 'react';
import { base } from 'viem/chains';
import { WagmiProvider } from 'wagmi';

function Providers({ children }: React.PropsWithChildren) {
  const [client] = React.useState(
    new QueryClient({ defaultOptions: { queries: { staleTime: 5000 } } })
  );
  return (
    <WagmiProvider config={createWagmiConfig('/api/rpc')}>
      <QueryClientProvider client={client}>
        <OnchainKitProvider apiKey={ProjectENV.COINBASE_API_KEY} chain={base}>
          {children}
        </OnchainKitProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default Providers;
