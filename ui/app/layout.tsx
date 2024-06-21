import './global.scss';

import '@coinbase/onchainkit/styles.css';
import { Metadata } from 'next';
import { Roboto_Mono } from 'next/font/google';
import { Suspense } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import ProgressBarClient from '@/components/ProgressBar';
import { TransitionLayout } from '@/layouts/TransitionLayout';

import Providers from './provider';
import { WrapperLayout } from './wrapper';
import { WrapperClientLayout } from './wrapper-client';

export async function generateStaticParams() {
  return [{ lang: 'en-US' }, { lang: 'vi-VN' }];
}

const robotoMono = Roboto_Mono({ subsets: ['latin'] });

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
      <body className={`dark bg-black ${robotoMono.className}`}>
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
