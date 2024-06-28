'use client';

import { DynamicWidget } from '@dynamic-labs/sdk-react-core';

/**
 * AccountConnect
 *  - Connects to the wallet
 *  - Disconnects from the wallet
 *  - Displays the wallet network
 */
export const AccountConnect: IComponent = () => {
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
      <DynamicWidget />
    </div>
  );
};
