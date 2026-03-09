// Minimal worker router for API endpoints
import { generateHandler } from './generate';
import { publishHandler } from './publish';
import { loginHandler } from './auth';

export default {
  async fetch(request: Request, env: any) {
    const url = new URL(request.url);
    if (url.pathname === '/api/generate' && request.method === 'POST') return generateHandler(request, env);
    if (url.pathname === '/api/publish' && request.method === 'POST') return publishHandler(request, env);
    if (url.pathname === '/api/login' && request.method === 'POST') return loginHandler(request, env);
    return new Response('Not found', { status: 404 });
  }
};
