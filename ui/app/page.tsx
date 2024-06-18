import { VaultCard } from '@/components/VaultCard';
import { VaultForm } from '@/components/VaultForm';
import Head from 'next/head';

export default function HomePage() {
  return (
    <div>
      <Head>
        <title>Hello World!</title>
        <meta name="description" content="Your thoughts, your words, your story." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="py-12">
        <h1 className="text-4xl font-bold text-center">Welcome to Zuni donator!</h1>
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
