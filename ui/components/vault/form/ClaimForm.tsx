'use client';

import { Button } from '@/shadcn/Button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shadcn/Form';
import { Input } from '@/shadcn/Input';

import { TooltipWrapper } from '@/components/TooltipWrapper';
import { TxDialog } from '@/components/vault/TxDialog';
import { SMART_VAULT_ABI } from '@/constants/abi';
import { useEAS } from '@/hooks/useEas';
import { isValidBytesWithLength } from '@/utils/tools';
import { ProjectENV } from '@env';
import { zodResolver } from '@hookform/resolvers/zod';
import { cx } from 'class-variance-authority';
import { Loader, ShieldBan, ShieldCheck } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { BaseError, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { z } from 'zod';

const formSchma = z.object({
  attestationUID: z.string().refine((val) => isValidBytesWithLength(val, 32), {
    message: 'Enter a valid attestation UID',
  }),
});

const defaultValues = {
  attestationUID: '',
};

export const ClaimVaultForm: IComponent<{
  vaultId: THexString;
  vaultName: string;
  schemaUID: THexString;
}> = ({ vaultId, vaultName, schemaUID }) => {
  const {
    data: hash,
    isPending,
    writeContract,
    isSuccess,
    error: writeCallError,
  } = useWriteContract();

  const { eas } = useEAS();

  const form = useForm({
    resolver: zodResolver(formSchma),
    defaultValues,
  });

  const { control, handleSubmit, reset } = form;

  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash,
  });

  const [isValidAttestation, setIsValidAttestation] = useState(false);
  const [loading, setLoading] = useState(false);

  const [hashState, setHash] = useState('');

  const uid = form.watch('attestationUID');

  const fetchAttestation = useCallback(async () => {
    setLoading(true);
    try {
      if (!isValidBytesWithLength(uid, 32)) {
        // throw new Error('Enter a valid attestation UID');
        setIsValidAttestation(false);
        setLoading(false);
        return;
      }

      if (!eas) {
        throw new Error('Try again later');
      }

      const rsp = await eas.getAttestation(uid);
      if (!rsp) {
        throw new Error('Attestation not found');
      }

      if (rsp.schema !== schemaUID) {
        throw new Error('Attestation schema mismatch');
      }

      form.clearErrors('attestationUID');
      setIsValidAttestation(true);
    } catch (error) {
      form.setError('attestationUID', {
        type: 'manual',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        message: (error as any).message,
      });
      setIsValidAttestation(false);
    } finally {
      setLoading(false);
    }
  }, [eas, form, schemaUID, uid]);

  useEffect(() => {
    fetchAttestation();
  }, [fetchAttestation]);

  useEffect(() => {
    if (isSuccess && hash) {
      reset();
      setHash(hash as string);
    }
  }, [isSuccess, reset, hash, setHash]);

  const handlePressSubmit = handleSubmit((values) => {
    if (form.formState.errors.attestationUID) {
      form.setError('attestationUID', {
        type: 'manual',
        message: 'Enter a valid attestation UID',
      });
      return;
    }

    console.log({
      id: values.attestationUID,
    });

    writeContract({
      address: ProjectENV.NEXT_PUBLIC_SMART_VAULT_ADDRESS as THexString,
      abi: SMART_VAULT_ABI,
      functionName: 'claim',
      args: [vaultId, values.attestationUID as THexString],
    });
  });

  const renderAttestationStatus = useMemo(() => {
    if (loading) {
      return <Loader className="w-4 h-4 text-background animate-spin" />;
    }
    if (!isValidAttestation) {
      return (
        <TooltipWrapper text="The attestation UID is not valid.">
          <ShieldBan className="w-4 h-4 text-red-500" />
        </TooltipWrapper>
      );
    }
    return (
      <TooltipWrapper text="The validation schema is valid">
        <ShieldCheck className="w-4 h-4 text-green-500" />
      </TooltipWrapper>
    );
  }, [isValidAttestation, loading]);

  console.log({ writeCallError });

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
          name={'attestationUID'}
          render={({ field }) => (
            <FormItem>
              <FormLabel
                className="flex items-center gap-1"
                required
                renderSuffix={renderAttestationStatus}>
                Attestation UID
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={'Enter the attestation UID. Eg. 0xe778568a76efed4c34...'}
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
            className="px-4 bg-rose-500 hover:bg-rose-600"
            disabled={isPending || isConfirming}>
            {isPending || isConfirming ? (
              <Loader className="w-4 h-4 text-background animate-spin" />
            ) : (
              'Claim funds'
            )}
          </Button>
        </div>
        {<TxDialog hash={hashState as string} onClose={() => setHash('')} />}
        {writeCallError && (
          <div className="text-destructive text-sm">
            {(writeCallError as BaseError).metaMessages?.[0] ||
              'An error occurred while claiming funds'}
          </div>
        )}
      </form>
    </Form>
  );
};
