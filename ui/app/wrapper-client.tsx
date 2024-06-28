'use client';
import { Suspense, useEffect } from 'react';
import { injectStyle } from 'react-toastify/dist/inject-style';

import { Footer } from '@/components/Footer';
import { Navigation } from '@/components/Navigation';
import { SMART_VAULT_ABI } from '@/constants/abi';
import { useListenVaults } from '@/hooks/useListenVault';
import { ProjectENV } from '@env';
import { Authentication } from './Authentication';

export const WrapperClientLayout: IComponent = ({ children }) => {
  useListenVaults(ProjectENV.NEXT_PUBLIC_SMART_VAULT_ADDRESS, SMART_VAULT_ABI);

  useEffect(() => {
    injectStyle();
  }, []);

  return (
    <div className="w-full h-auto relative text-white">
      <Navigation />
      {children}
      <Footer />
      <Suspense>
        <Authentication />
      </Suspense>
    </div>
  );
};
