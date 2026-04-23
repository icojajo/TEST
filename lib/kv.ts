import { createClient } from '@vercel/kv';

// Używamy REST API dla maksymalnej stabilności na Vercel
const KV_REST_API_URL = process.env.KV_REST_API_URL || "https://polished-bluejay-90594.upstash.io";
const KV_REST_API_TOKEN = process.env.KV_REST_API_TOKEN || "gQAAAAAAAWHiAAIgcDIyMWYzYzFjNmIyZTM0NjllYTZmZjg1ZjBhODBlODMwZg";

let client: any = null;

export function getKvClient() {
  if (!client) {
    try {
      client = createClient({
        url: KV_REST_API_URL,
        token: KV_REST_API_TOKEN,
      });
    } catch (e) {
      console.error("[KV_LIB] Failed to create client:", e);
    }
  }
  return client;
}
