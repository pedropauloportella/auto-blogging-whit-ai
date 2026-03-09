export interface Env {
  OPENAI_KEY: string;
  GITHUB_TOKEN: string;
  API_TOKEN: string;
  POSTS_KV: KVNamespace;
  SESSIONS_KV: KVNamespace;
  USERS_KV: KVNamespace;
  ADMIN_PW_HASH?: string;
}
