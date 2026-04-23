import { createClient } from '@vercel/kv';

// Dane dostępowe (Hardcoded jako fallback, jeśli zmienne środowiskowe nie działają)
const KV_URL = process.env.KV_URL || "rediss://default:gQAAAAAAAWHiAAIgcDIyMWYzYzFjNmIyZTM0NjllYTZmZjg1ZjBhODBlODMwZg@polished-bluejay-90594.upstash.io:6379";
const KV_REST_API_URL = process.env.KV_REST_API_URL || "https://polished-bluejay-90594.upstash.io";
const KV_REST_API_TOKEN = process.env.KV_REST_API_TOKEN || "gQAAAAAAAWHiAAIgcDIyMWYzYzFjNmIyZTM0NjllYTZmZjg1ZjBhODBlODMwZg";

export const kv = createClient({
  url: KV_URL,
  token: KV_REST_API_TOKEN,
});
