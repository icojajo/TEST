import { NextResponse } from 'next/server';
import { getKvClient } from '../../../lib/kv';
import { get } from '@vercel/edge-config';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const kv = getKvClient();
    
    // 1. Edge Config
    try {
      const edgeIpList = await get<string>('ip_list');
      if (edgeIpList) return NextResponse.json({ ips: edgeIpList });
    } catch (e) {}

    // 2. Vercel KV
    let content: string | null = null;
    if (kv) {
      try {
        content = await kv.get('ip_list');
      } catch (e) {
        console.error("[IPS_API] KV Get Error:", e);
      }
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
      console.error("[IPS_API] KV Set Error:", e);
      return NextResponse.json({ error: "Błąd bazy danych" }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
