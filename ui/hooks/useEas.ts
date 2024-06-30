import { ProjectENV } from '@env';
import { EAS } from '@ethereum-attestation-service/eas-sdk';
import { ethers } from 'ethers';
import { useCallback, useEffect, useState } from 'react';
import { useChainId } from 'wagmi';
import { useEthersProvider } from './useWagmi';

const easAddress = ProjectENV.NEXT_PUBLIC_EAS_ADDRESS;

const easCache: { [chainId: number]: EAS } = {};

export const useEAS = () => {
  const chainId = useChainId();
  const provider = useEthersProvider({ chainId });

  const [eas, setEas] = useState<EAS | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadEas = useCallback(async () => {
    try {
      if (easCache[chainId]) {
        setEas(easCache[chainId]);
        return;
      }

      const newEas = new EAS(easAddress);
      if (provider) {
        await newEas.connect(provider as unknown as ethers.Signer);
      }

      easCache[chainId] = newEas;
      setEas(newEas);
    } catch (err) {
      setError(`Failed to load EAS: ${err}`);
    }
  }, [chainId, provider]);

  useEffect(() => {
    loadEas();
  }, [loadEas]);

  return { eas, error };
};
