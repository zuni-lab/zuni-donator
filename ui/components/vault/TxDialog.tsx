'use client';

import { Dialog, DialogDescription } from '@radix-ui/react-dialog';
import Link from 'next/link';
import { DialogContent, DialogHeader, DialogTitle } from '../shadcn/Dialog';
import { usePublicClient } from 'wagmi';
import { getNetworkConfig } from '@/utils/network';
import { wagmiConfig } from '@/utils/wagmi';

export const TxDialog: IComponent<{
  hash: string;
  onClose?: () => void;
}> = ({ hash, onClose }) => {
  const publicClient = usePublicClient({ config: wagmiConfig });
  const networkConfig = getNetworkConfig(publicClient.chain.id);

  return (
    <Dialog
      open={hash.length > 0}
      onOpenChange={(o) => {
        if (!o) {
          onClose?.();
        }
      }}>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle>Transaction</DialogTitle>
          <DialogDescription className="text-gray-600 text-sm">
            View the transaction on the blockchain.
          </DialogDescription>
        </DialogHeader>
        <div className="text-gray-700 text-sm flex flex-col">
          Transaction ID:
          <Link
            href={`${networkConfig.blockExplorers.default.url}/tx/${hash}`}
            passHref
            legacyBehavior>
            <a target="_blank" className="text-blue-600 underline text-xs">
              {hash}
            </a>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
};
