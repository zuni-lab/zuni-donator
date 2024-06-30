'use client';
import { Suspense, useEffect } from 'react';
import { injectStyle } from 'react-toastify/dist/inject-style';

import { Footer } from '@/components/Footer';
import { Navigation } from '@/components/Navigation';
import { useListenVaults } from '@/hooks/useListenVault';
import { Authentication } from './Authentication';

export const WrapperClientLayout: IComponent = ({ children }) => {
  useListenVaults();

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
