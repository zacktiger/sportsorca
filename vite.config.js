import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import handler from './api/reddit.js';

// In production Vercel runs api/reddit.js for us. The Vite dev server does not
// know about that folder, so this plugin mounts the very same function as
// middleware — development and production then run identical code.
function redditApiPlugin() {
  return {
    name: 'reddit-api-dev',
    configureServer(server) {
      server.middlewares.use('/api/reddit', async (req, res) => {
        const query = Object.fromEntries(new URL(req.url, 'http://localhost').searchParams);

        // A minimal stand-in for the response object Vercel passes the handler.
        const response = {
          setHeader: (name, value) => res.setHeader(name, value),
          status(code) {
            res.statusCode = code;
            return this;
          },
          json(body) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(body));
          },
        };

        await handler({ query }, response);
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), redditApiPlugin()],
});
