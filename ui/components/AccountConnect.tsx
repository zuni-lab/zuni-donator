'use client';

import { ConnectAccount } from '@coinbase/onchainkit/wallet';
import { baseSepolia } from 'viem/chains';
import { useAccount, useChainId, useConnect, useDisconnect } from 'wagmi';
import { AccountDropdown } from './AccountDropdown';
import { AccountInfoPanel } from './AccountInfoPanel';

/**
 * AccountConnect
 *  - Connects to the wallet
 *  - Disconnects from the wallet
 *  - Displays the wallet network
 */
export const AccountConnect: IComponent = () => {
  const account = useAccount();
  const { status } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();

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
      {(() => {
        if (account.status === 'disconnected') {
          return <ConnectAccount />;
        }

        console.log({
          status: account.status,
          chainId,
        });

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
      })()}
    </div>
  );
};
