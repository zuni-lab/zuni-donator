'use client';
import { useAccount } from 'wagmi';

import { Button } from '@/shadcn/Button';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
  DialogDescription,
  DialogTitle,
} from '@/shadcn/Dialog';
import { AccountConnect } from '../account/AccountConnect';
import { VaultForm } from './VaultForm';

export const VaultDialog: IComponent = () => {
  const { address } = useAccount();
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="border border-blue-400">
          Create vault
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-white">
        {!address && (
          <>
            <DialogHeader>
              <DialogTitle>Login</DialogTitle>
              <DialogDescription>Connect your account to create a new vault.</DialogDescription>
            </DialogHeader>
            <div className="w-full flex items-center justify-center">
              <div className="w-max">
                <AccountConnect />
              </div>
            </div>
          </>
        )}
        {address && (
          <>
            <DialogHeader>
              <DialogTitle>Create a new vault</DialogTitle>
              <DialogDescription>Make changes to your profile here.</DialogDescription>
            </DialogHeader>
            <VaultForm />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
