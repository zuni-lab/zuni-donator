'use client';
import { Suspense, useEffect } from 'react';
import { injectStyle } from 'react-toastify/dist/inject-style';

import { Footer } from '@/components/Footer';
import { Navigation } from '@/components/Navigation';
import { useBaseSepoliaSigner } from '@/hooks/useWagmi';
import { useSchemaStore } from '@/states/schema';
import { ProjectENV } from '@env';
import { Authentication } from './Authentication';

export const WrapperClientLayout: IComponent = ({ children }) => {
  const { loadSchemaRegistry } = useSchemaStore();
  const provider = useBaseSepoliaSigner();
  useEffect(() => {
    if (!provider) return;
    loadSchemaRegistry(ProjectENV.NEXT_PUBLIC_SCHEMA_REGISTRY_CONTRACT_ADDRESS, provider);
  }, [loadSchemaRegistry, provider]);

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
