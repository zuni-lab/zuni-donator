import './global.scss';

import { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import { Suspense } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import ProgressBarClient from '@/components/NavProgressBar';
import { TransitionLayout } from '@/layouts/TransitionLayout';

import Providers from './provider';
import { WrapperLayout } from './wrapper';
import { WrapperClientLayout } from './wrapper-client';

export async function generateStaticParams() {
  return [{ lang: 'en-US' }, { lang: 'vi-VN' }];
}

const montserrat = Montserrat({ subsets: ['latin'] });

export const metadata: Metadata = {
  description: 'Donator',
  icons: '/favicon.ico',
  title: 'Donator',
};

export default function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: TAny;
}) {
  return (
    <html lang={params.lang}>
      <body className={montserrat.className}>
        <Suspense>
          <ProgressBarClient />
          <ToastContainer position="bottom-right" newestOnTop />
        </Suspense>
        <Providers>
          <WrapperClientLayout>
            <WrapperLayout locale={params.lang}>
              <TransitionLayout>{children}</TransitionLayout>
            </WrapperLayout>
          </WrapperClientLayout>
        </Providers>
      </body>
    </html>
  );
}
