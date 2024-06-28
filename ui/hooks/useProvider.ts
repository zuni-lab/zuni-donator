import { ProjectENV } from '@env';
import { ethers } from 'ethers';
import { useCallback, useEffect, useMemo, useState } from 'react';

export const useRpcProvider = (rpcUrl: string) => {
  const [reconnectTrigger, setReconnectTrigger] = useState(0);

  const reconnect = useCallback(() => {
    setTimeout(() => {
      setReconnectTrigger((prev) => prev + 1);
    }, 1000);
  }, []);

  const provider = useMemo(() => {
    console.log('Connecting to:', rpcUrl);
    const newProvider = new ethers.WebSocketProvider(rpcUrl);
    newProvider.websocket.close = reconnect;
    newProvider.websocket.onerror = (err) => {
      console.error('WebSocket error:', err);
      newProvider?.websocket.close();
    };
    return newProvider;
  }, [rpcUrl, reconnectTrigger, reconnect]);

  useEffect(() => {
    return () => {
      provider.removeAllListeners();
    };
  }, [provider]);

  return provider;
};

export const useAlchemyProvider = () => {
  return useRpcProvider(ProjectENV.NEXT_PUBLIC_ALCHEMY_RPC_URL);
};