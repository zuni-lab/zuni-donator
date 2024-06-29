import { EAS } from '@ethereum-attestation-service/eas-sdk';
import { ethers } from 'ethers';
import { useCallback, useEffect, useState } from 'react';
import { useAlchemyProvider } from './useProvider';

const easCache: { [key: string]: EAS } = {};

export const useEAS = (address: string) => {
  const provider = useAlchemyProvider();
  const [eas, setEas] = useState<EAS | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadEas = useCallback(async () => {
    try {
      if (!address) {
        throw new Error('Address not found');
      }

      if (easCache[address]) {
        setEas(easCache[address]);
        return;
      }

      const newEas = new EAS(address);
      if (provider) {
        await newEas.connect(provider as unknown as ethers.Signer);
      }

      easCache[address] = newEas;
      setEas(newEas);
    } catch (err) {
      setError(`Failed to load EAS: ${err}`);
    }
  }, [address, provider]);

  useEffect(() => {
    loadEas();
  }, [loadEas]);

  return { eas, error };
};
