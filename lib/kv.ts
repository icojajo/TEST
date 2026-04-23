import { createClient } from '@vercel/kv';

// Dane dostępowe (Hardcoded jako fallback)
const KV_URL = process.env.KV_URL || "rediss://default:gQAAAAAAAWHiAAIgcDIyMWYzYzFjNmIyZTM0NjllYTZmZjg1ZjBhODBlODMwZg@polished-bluejay-90594.upstash.io:6379";
const KV_REST_API_TOKEN = process.env.KV_REST_API_TOKEN || "gQAAAAAAAWHiAAIgcDIyMWYzYzFjNmIyZTM0NjllYTZmZjg1ZjBhODBlODMwZg";

let client: any = null;

export function getKvClient() {
  if (!client) {
    client = createClient({
      url: KV_URL,
      token: KV_REST_API_TOKEN,
    });
  }
  return client;
}
