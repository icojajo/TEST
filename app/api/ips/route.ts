import { NextResponse } from 'next/server';
import { getKvClient } from '../../../lib/kv';
import { get } from '@vercel/edge-config';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const kv = getKvClient();
    let content: string | null = null;

    // 1. Priorytet dla KV (Zapisywane przez stronę)
    if (kv) {
      try {
        content = await kv.get('ip_list');
      } catch (e) {}
    }

    // 2. Fallback dla Edge Config
    if (!content) {
      try {
        content = await get<string>('ip_list') || null;
      } catch (e) {}
    }

    return NextResponse.json({ ips: content || "" });
  } catch (error) {
    return NextResponse.json({ ips: "", error: "Błąd serwera" });
  }
}

export async function POST(req: Request) {
  try {
    const { ips } = await req.json();
    const kv = getKvClient();

    if (!kv) throw new Error("KV Client not initialized");

    try {
      await kv.set('ip_list', ips);
      return NextResponse.json({ success: true });
    } catch (e) {
      return NextResponse.json({ error: "Błąd bazy danych" }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
