// auth.ts - simple login: compare bcrypt hash stored in USERS_KV
import bcrypt from 'bcryptjs';
export async function loginHandler(request: Request, env: any) {
  const { username, password } = await request.json();
  if (!username || !password) return new Response('Bad request', { status: 400 });
  const stored = await env.USERS_KV.get('user:' + username);
  if (!stored) return new Response('Unauthorized', { status: 401 });
  const user = JSON.parse(stored);
  const ok = await bcrypt.compare(password, user.hash);
  if (!ok) return new Response('Unauthorized', { status: 401 });
  const token = crypto.randomUUID();
  await env.SESSIONS_KV.put('sess:' + token, JSON.stringify({ username, created_at: new Date().toISOString() }), { expirationTtl: 60 * 60 * 8 });
  return new Response(JSON.stringify({ token }), { headers: { 'Content-Type':'application/json' }});
}
