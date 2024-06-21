import { Button } from '@/components/shadcn/Button';
import { Metadata } from 'next';
import { RecentVaultSection } from './sections/RecentVaultSection';
import { StatSection } from './sections/StatSection';

export const metadata: Metadata = {
  description: 'Zuni Vault',
  icons: '/favicon.ico',
  title: 'Zuni Vault',
};

export default function HomePage() {
  return (
    <main className="py-16">
      <div className="glass section rounded-xl py-32 flex flex-col items-center justify-normal gap-8">
        <h1 className="text-7xl font-bold text-center">Zuni Vault</h1>
        <p className="text-xl text-center w-[500px]">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt
          ut labore et dolore magna aliqua.
        </p>
        <Button className="h-12 text-lg px-6">Get Started</Button>
      </div>
      <div className="my-12 h-[2px] max-w-6xl mx-auto bg-white"></div>
      <RecentVaultSection />
      <StatSection />
    </main>
  );
}
