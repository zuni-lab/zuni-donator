import { EAS } from '@ethereum-attestation-service/eas-sdk';
import { ethers } from 'ethers';
import { useCallback, useEffect, useState } from 'react';
import { useAlchemyProvider } from './useProvider';

export const useEAS = (address: string) => {
  const provider = useAlchemyProvider();
  const [eas, setEas] = useState<EAS | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadEas = useCallback(async () => {
    try {
      if (!address) {
        throw new Error('Address not found');
      }

      const eas = new EAS(address);
      if (provider) {
        await eas.connect(provider as unknown as ethers.Signer);
      }

      setEas(eas);
    } catch (err) {
      setError(`Failed to load schema registry: ${err}`);
    }
  }, [address, provider]);

  useEffect(() => {
    loadEas();
  }, [loadEas]);

  return { eas, error };
};
