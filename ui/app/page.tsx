import Head from 'next/head';

export default function HomePage() {
  return (
    <div>
      <Head>
        <title>Hello World!</title>
        <meta name="description" content="Your thoughts, your words, your story." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="p-20">
        <h1 className="mt-20 font-bold text-center text-4xl">Welcome to X!</h1>
      </main>
    </div>
  );
}
