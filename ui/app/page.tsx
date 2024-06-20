import { VaultCard } from '@/components/VaultCard';
import { VaultForm } from '@/components/VaultForm';
import { Button } from '@/components/shadcn/Button';
import { Metadata } from 'next';

export const metadata: Metadata = {
  description: 'Zuni Vault',
  icons: '/favicon.ico',
  title: 'Zuni Vault',
};

export default function HomePage() {
  return (
    <div>
      <main className="py-16">
        <div className="glass rounded p-12 flex flex-col items-center justify-normal gap-8">
          <h1 className="text-7xl font-bold text-center">Zuni Vault</h1>
          <p className="text-xl text-center w-[500px]">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
            incididunt ut labore et dolore magna aliqua.
          </p>
          <Button className="h-12 text-lg px-6">Get Started</Button>
        </div>
        <div className="flex justify-end items-center pr-4">
          <VaultForm />
        </div>
        <div className="flex gap-4 py-16 px-4">
          <div className="w-1/5 h-screen bg-red-400">Sidebar</div>
          <div className="w-4/5 grid grid-cols-4 gap-2">
            <VaultCard />
            <VaultCard />
            <VaultCard />
            <VaultCard />
          </div>
        </div>
      </main>
    </div>
  );
}
