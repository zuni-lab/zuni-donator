import { ProjectENV } from '@env';
import { ethers } from 'ethers';
import { useCallback, useEffect, useMemo, useState } from 'react';

const ALCHEMY_RPC_URL =
  ProjectENV.NEXT_PUBLIC_ENV === 'development'
    ? `wss://base-sepolia.g.alchemy.com/v2/${ProjectENV.NEXT_PUBLIC_ALCHEMY_API_KEY}`
    : `wss://base-mainnet.g.alchemy.com/v2/${ProjectENV.NEXT_PUBLIC_ALCHEMY_API_KEY}`;

const providerCache: { [key: string]: ethers.WebSocketProvider } = {};

export const useRpcProvider = (rpcUrl: string) => {
  const [reconnectTrigger, setReconnectTrigger] = useState(0);

  const reconnect = useCallback(() => {
    setTimeout(() => {
      setReconnectTrigger((prev) => prev + 1);
    }, 1000);
  }, []);

  const provider = useMemo(() => {
    if (!providerCache[rpcUrl]) {
      const newProvider = new ethers.WebSocketProvider(rpcUrl);
      newProvider.websocket.close = reconnect;
      newProvider.websocket.onerror = (err) => {
        console.error('WebSocket error:', err);
        newProvider?.websocket.close();
      };
      providerCache[rpcUrl] = newProvider;
    }
    return providerCache[rpcUrl];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rpcUrl, reconnectTrigger, reconnect]);

  useEffect(() => {
    return () => {
      provider.removeAllListeners();
    };
  }, [provider]);

  return provider;
};

export const useAlchemyProvider = () => {
  return useRpcProvider(ALCHEMY_RPC_URL);
};
