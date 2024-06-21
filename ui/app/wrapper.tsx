import { ReactNode } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function WrapperLayout({ children }: { children: ReactNode; locale: any }) {
  return <div className="w-full h-full min-h-screen">{children}</div>;
}
