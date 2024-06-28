/** @type {import('next').NextConfig} */
const intercept = require('intercept-stdout');

const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  webpack: (config) => {
    // added due to issues finding these packages when running. Github issue/comment:
    // https://github.com/WalletConnect/walletconnect-monorepo/issues/1908#issuecomment-1487801131
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
};

/**
 * Hide warning of RecoilJS when hot reload
 */
intercept((text) => (text.includes('Duplicate atom key') ? '' : text));

module.exports = nextConfig;
