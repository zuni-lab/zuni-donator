'use client';
import { Suspense, useEffect } from 'react';
import { injectStyle } from 'react-toastify/dist/inject-style';

const Authentication: IComponent = () => {
  return null;
};

export const WrapperClientLayout: IComponent = ({ children }) => {
  useEffect(() => {
    injectStyle();
  }, []);

  return (
    <div className="w-full h-auto relative">
      {children}
      <Suspense>
        <Authentication />
      </Suspense>
    </div>
  );
};
