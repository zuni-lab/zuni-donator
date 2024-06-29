import { ProjectENV } from '@env';
import { EAS } from '@ethereum-attestation-service/eas-sdk';
import { ethers } from 'ethers';
import { useCallback, useEffect, useState } from 'react';
import { useAlchemyProvider } from './useProvider';

const easAddress = ProjectENV.NEXT_PUBLIC_EAS_ADDRESS;
const easCache: { [key: string]: EAS } = {};

export const useEAS = () => {
  const provider = useAlchemyProvider();
  const [eas, setEas] = useState<EAS | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadEas = useCallback(async () => {
    try {
      if (easCache[easAddress]) {
        setEas(easCache[easAddress]);
        return;
      }

      const newEas = new EAS(easAddress);
      if (provider) {
        await newEas.connect(provider as unknown as ethers.Signer);
      }

      easCache[easAddress] = newEas;
      setEas(newEas);
    } catch (err) {
      setError(`Failed to load EAS: ${err}`);
    }
  }, [provider]);

  useEffect(() => {
    loadEas();
  }, [loadEas]);

  return { eas, error };
};
