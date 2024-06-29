'use client';
import { useAccount } from 'wagmi';

import { Button } from '@/shadcn/Button';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shadcn/Dialog';
import { cx } from '@/utils/tools';
import { AccountConnect } from '../account/AccountConnect';
import { VaultForm } from './VaultForm';

export const CreateVaultMode: IComponent = () => {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Create a new vault</DialogTitle>
        <DialogDescription>Make changes to your profile here.</DialogDescription>
      </DialogHeader>
      <VaultForm />
    </>
  );
};

export const DepositVaultMode: IComponent = () => {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Deposit to vault</DialogTitle>
        <DialogDescription>Make changes to your profile here.</DialogDescription>
      </DialogHeader>
      <VaultForm />
    </>
  );
};

export const VaultDialog: IComponent<{
  description?: string;
  button?: string;
  buttonClassName?: string;
}> = ({
  button = 'Create vault',
  buttonClassName = '',
  description = 'Connect your account to create a new vault.',
  children,
}) => {
  const { address } = useAccount();
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className={cx('border border-blue-400', buttonClassName)}>
          {button}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-white max-w-[33rem]">
        {!address && (
          <>
            <DialogHeader>
              <DialogTitle>Login</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </DialogHeader>
            <div className="w-full flex items-center justify-center">
              <div className="w-max">
                <AccountConnect />
              </div>
            </div>
          </>
        )}
        {address && children}
      </DialogContent>
    </Dialog>
  );
};
