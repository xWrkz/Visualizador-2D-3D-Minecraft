import { defineConfig } from 'vite';

export default defineConfig({
  root: './',
  publicDir: 'public',
  server: {
    port: 3000,
    open: true
  },
  plugins: [
    {
      name: 'netlify-functions-dev-simulator',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const cookieHeader = req.headers.cookie || '';
          
          // Soporte para cambiar nivel en local vía URL: /?dev_tier=2 o /?dev_tier=3 o /?dev_tier=0
          if (req.url.includes('dev_tier=')) {
            const urlObj = new URL(req.url, 'http://localhost:3000');
            const tierVal = urlObj.searchParams.get('dev_tier');
            urlObj.searchParams.delete('dev_tier');
            const targetUrl = urlObj.pathname + (urlObj.search ? urlObj.search : '');

            res.statusCode = 302;
            if (tierVal === '0') {
              res.setHeader('Set-Cookie', 'dev_tier=; Path=/; Max-Age=0');
            } else {
              res.setHeader('Set-Cookie', `dev_tier=${tierVal}; Path=/; Max-Age=86400; SameSite=Lax`);
            }
            res.setHeader('Location', targetUrl || '/');
            res.end();
            return;
          }

          // Simular login de Patreon en local
          if (req.url.startsWith('/.netlify/functions/patreon-login')) {
            res.statusCode = 302;
            res.setHeader('Set-Cookie', 'dev_tier=2; Path=/; Max-Age=86400; SameSite=Lax');
            res.setHeader('Location', '/?auth=success');
            res.end();
            return;
          }

          // Simular logout de Patreon en local
          if (req.url.startsWith('/.netlify/functions/patreon-logout')) {
            res.statusCode = 302;
            res.setHeader('Set-Cookie', 'dev_tier=; Path=/; Max-Age=0');
            res.setHeader('Location', '/?logout=success');
            res.end();
            return;
          }

          // Servir get-session según la cookie dev_tier
          if (req.url.startsWith('/.netlify/functions/get-session')) {
            res.setHeader('Content-Type', 'application/json');
            
            let simTier = 0;
            if (cookieHeader.includes('dev_tier=3')) simTier = 3;
            else if (cookieHeader.includes('dev_tier=2')) simTier = 2;
            else if (cookieHeader.includes('dev_tier=1')) simTier = 1;

            if (simTier > 0) {
              const tierNames = { 1: 'Básico', 2: 'Maestro', 3: 'Arquitecto' };
              res.end(JSON.stringify({
                authenticated: true,
                tier: simTier,
                user: `Marco (Simulación ${tierNames[simTier]})`,
                tierName: tierNames[simTier]
              }));
            } else {
              res.end(JSON.stringify({
                authenticated: false,
                tier: 0,
                user: null,
                tierName: 'Público'
              }));
            }
            return;
          }

          next();
        });
      }
    }
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
});
