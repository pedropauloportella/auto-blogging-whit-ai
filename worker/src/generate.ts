// generate.ts - calls OpenAI and stores draft in KV
import { Env } from './types';
export async function generateHandler(request: Request, env: Env) {
  const auth = request.headers.get('Authorization') || '';
  if (!auth.startsWith('Bearer ') || auth.split(' ')[1] !== env.API_TOKEN) return new Response('Unauthorized', { status: 401 });
  const body = await request.json();
  const topics = body.topics || [];
  const sources = body.sources || [];
  const lang = body.lang || 'pt';
  // Build prompt
  const system = 'You are a concise blog writer. Return JSON object with keys: title, summary, markdown, tags.';
  const user = JSON.stringify({ topics, sources, lang });
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type':'application/json', Authorization: `Bearer ${env.OPENAI_KEY}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      max_tokens: 1200,
      temperature: 0.2
    })
  });
  const data = await resp.json();
  const text = data?.choices?.[0]?.message?.content || '';
  // naive JSON extract
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  let parsed = {};
  try { parsed = JSON.parse(first >=0 && last>first ? text.slice(first, last+1) : text); } catch(e) {
    // store raw output for debugging
    const idErr = crypto.randomUUID();
    await env.POSTS_KV.put('debug:' + idErr, text, { expirationTtl: 3600 });
    return new Response(JSON.stringify({ error: 'AI output parse error', debugId: idErr, raw: text.slice(0,1000) }), { status: 500, headers: { 'Content-Type': 'application/json' }});
  }
  const id = crypto.randomUUID();
  const slug = (parsed.title || 'post').toString().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g,'') + '-' + id.slice(0,6);
  const md = `---\ntitle: "${parsed.title}"\ndate: "${new Date().toISOString()}"\nlang: "${lang}"\ntags: ${JSON.stringify(parsed.tags || [])}\nai_generated: true\nsummary: "${(parsed.summary||'').replace(/\"/g,'\\"')}"\n---\n\n${parsed.markdown || ''}`;
  const draft = { id, title: parsed.title, summary: parsed.summary, content: md, lang, tags: parsed.tags||[], sources, status: 'draft', created_at: new Date().toISOString(), slug };
  await env.POSTS_KV.put('draft:' + id, JSON.stringify(draft));
  return new Response(JSON.stringify({ id, slug, preview: (parsed.markdown || '').slice(0,2000) }), { headers: { 'Content-Type':'application/json' }});
}
