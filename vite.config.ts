import nodeCrypto from 'node:crypto';
if (typeof globalThis.crypto === 'undefined') {
  // @ts-expect-error polyfill for Node 18
  globalThis.crypto = nodeCrypto;
}
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import { defineConfig, loadEnv, type Plugin } from 'vite';

/** En développement, sert les fonctions Vercel du dossier api/ (/api/live, /api/resume, /api/assistant). */
const vercelApi = (): Plugin => ({
  name: 'vercel-api',
  configureServer(server) {
    for (const [route, file] of [['/api/live', '/api/live.js'], ['/api/resume', '/api/resume.ts'], ['/api/assistant', '/api/assistant.ts']]) {
      server.middlewares.use(route, async (req, res) => {
        // Seulement depuis ce poste : un site tiers qui ferait pointer son nom vers 127.0.0.1 (rebinding DNS)
        // pourrait sinon utiliser la clé de développement. Vite protège ses pages, pas ces routes ajoutées.
        const hote = (req.headers.host ?? '').replace(/:\d+$/, '');
        if (!['localhost', '127.0.0.1', '[::1]'].includes(hote)) {
          res.statusCode = 403;
          res.end();
          return;
        }
        const { default: handler } = await server.ssrLoadModule(file);
        req.url = req.originalUrl ?? req.url; // garde « /api/resume?jour=… » complet
        await handler(req, res);
      });
    }
  },
});

export default defineConfig(({ mode }) => {
  // En développement seulement : la clé de l'API Claude peut venir de `.env.local` (ignoré par git),
  // pour que les fonctions `api/` servies par Vite la trouvent. Sans préfixe VITE_, elle n'est jamais
  // envoyée au navigateur. En production, elle vient des variables d'environnement de Vercel.
  if (mode === 'development' && !process.env.ANTHROPIC_API_KEY) {
    const cle = loadEnv(mode, process.cwd(), '').ANTHROPIC_API_KEY;
    if (cle) process.env.ANTHROPIC_API_KEY = cle;
  }

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
