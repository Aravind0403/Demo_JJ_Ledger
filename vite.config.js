import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['jjledger_demo.svg'],
      manifest: {
        name: 'Demo Ledger Pro',
        short_name: 'Demo Ledger Pro',
        description: 'Customer cash, gold, silver and chit ledger',
        theme_color: '#0f172a',
        background_color: '#070c18',
        display: 'standalone',
        start_url: '/',
        icons: [{ src: 'jjledger_demo.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
    }),
  ],
});
