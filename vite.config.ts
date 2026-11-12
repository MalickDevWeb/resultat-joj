import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';

/** En développement, sert les fonctions Vercel du dossier api/ (/api/live, /api/resume). */
const vercelApi = (): Plugin => ({
  name: 'vercel-api',
  configureServer(server) {
    for (const [route, file] of [['/api/live', '/api/live.js'], ['/api/resume', '/api/resume.ts']]) {
      server.middlewares.use(route, async (req, res) => {
        const { default: handler } = await server.ssrLoadModule(file);
        req.url = req.originalUrl ?? req.url; // garde « /api/resume?jour=… » complet
        await handler(req, res);
      });
    }
  },
});

export default defineConfig(({ mode }) => {
  // HTTPS (certificat auto-signé) uniquement sur demande : `HTTPS=1 npm run dev`,
  // utile pour tester sur un téléphone via le réseau local. Sur localhost, HTTP suffit.
  const useHttps = mode === 'development' && process.env.HTTPS === '1';

  return {
    plugins: [
      react(),
      vercelApi(),
      ...(useHttps ? [basicSsl()] : []),
      VitePWA({
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.ts',
        registerType: 'autoUpdate',
        manifest: false, // Utilise public/manifest.json
        injectManifest: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      chunkSizeWarningLimit: 2000,
    },
  };
});
