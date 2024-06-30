'use client';

import { Button } from '@/shadcn/Button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shadcn/Form';
import { Input } from '@/shadcn/Input';

import { SMART_VAULT_ABI } from '@/constants/abi';

import { TxDialog } from '@/components/vault/TxDialog';
import { isValidFloat } from '@/utils/tools';
import { ProjectENV } from '@env';
import { zodResolver } from '@hookform/resolvers/zod';
import { cx } from 'class-variance-authority';
import { parseEther } from 'ethers';
import { Loader } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { BaseError, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { z } from 'zod';

const formSchma = z.object({
  ethers: z.string().refine(
    (v) => {
      return isValidFloat(v) && parseFloat(v) > 0;
    },
    {
      message: 'Enter a valid amount of ethers',
    }
  ),
});

const defaultValues = {
  ethers: '',
};

export const ContributeVaultForm: IComponent<{
  vaultId: THexString;
  vaultName: string;
}> = ({ vaultId, vaultName }) => {
  const {
    data: hash,
    isPending,
    writeContract,
    isSuccess,
    error: writeCallError,
  } = useWriteContract();
  const [hashState, setHash] = useState('');

  const form = useForm({
    resolver: zodResolver(formSchma),
    defaultValues,
  });

  const { control, handleSubmit } = form;

  const handlePressSubmit = handleSubmit((values) => {
    writeContract({
      address: ProjectENV.NEXT_PUBLIC_SMART_VAULT_ADDRESS as THexString,
      abi: SMART_VAULT_ABI,
      functionName: 'contribute',
      args: [vaultId],
      value: parseEther(values.ethers),
    });
  });

  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isSuccess && hash) {
      form.reset();
      setHash(hash as string);
    }
  }, [isSuccess, form, hash, setHash]);

  return (
    <Form {...form}>
      <form onSubmit={handlePressSubmit} className="space-y-2">
        <div className="py-2">
          <h3 className="text-gray-700 text-lg font-bold">@{`${vaultName}`}</h3>
          <h4 className="text-blue-500 text-xs">#{`${vaultId}`}</h4>
        </div>
        <FormLabel className="text-gray-400 text-lg"></FormLabel>
        <FormField
          control={control}
          name={'ethers'}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1" required>
                Ethers (ETH)
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={'Enter the amount of ethers. Eg 0.01'}
                  className={cx(
                    'bg-white !border-[1.5px] !border-solid focus:border-input focus-visible:border-primary text-gray-700'
                  )}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex items-center justify-center !mt-4">
          <Button
            type="submit"
            className="px-4 bg-green-700 hover:bg-green-800"
            disabled={isPending || isConfirming}>
            {isPending || isConfirming ? (
              <Loader className="w-4 h-4 text-background animate-spin" />
            ) : (
              'Contribute'
            )}
          </Button>
        </div>
        {<TxDialog hash={hashState as string} onClose={() => setHash('')} />}
        {writeCallError && (
          <div className="text-destructive text-sm">
            Error: {(writeCallError as BaseError).shortMessage || writeCallError.message}
          </div>
        )}
      </form>
    </Form>
  );
};
