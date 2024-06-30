import { AppRouter, RouterMeta } from '@/constants/router';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = RouterMeta.About;

export default function HomePage() {
  return redirect(AppRouter.Vaults);
}
