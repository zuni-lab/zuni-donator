'use client';

import { useMemo } from 'react';
import { baseSepolia } from 'viem/chains';
import { useAccount, useChainId, useConnect, useDisconnect } from 'wagmi';
import { AccountDropdown } from './AccountDropdown';
import { AccountInfoPanel } from './AccountInfoPanel';
import { Button } from '../shadcn/Button';

/**
 * AccountConnect
 *  - Connects to the wallet
 *  - Disconnects from the wallet
 *  - Displays the wallet network
 */
export const AccountConnect: IComponent = () => {
  const account = useAccount();
  const { connectors, connect, status } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();

  const connector = connectors[0];

  const renderConnectedChildren = useMemo(() => {
    if (account.status === 'disconnected') {
      return (
        <div className="flex grow" data-testid="ockConnectAccountButton">
          <Button className="px-6 text-base" onClick={() => connect({ connector })}>
            Login
          </Button>
        </div>
      );
    }

    if (account.status === 'connected' && chainId !== baseSepolia.id) {
      return (
        <button onClick={() => disconnect()} type="button">
          Wrong network
        </button>
      );
    }

    return (
      <>
        <div className="flex flex-grow flex-col md:hidden">
          <AccountInfoPanel />
        </div>
        <div className="hidden md:block">
          <AccountDropdown />
        </div>
      </>
    );
  }, [account.status, chainId, disconnect]);

  return (
    <div
      className="flex flex-grow"
      {...(status === 'pending' && {
        'aria-hidden': true,
        style: {
          opacity: 0,
          pointerEvents: 'none',
          userSelect: 'none',
        },
      })}>
      {renderConnectedChildren}
    </div>
  );
};
