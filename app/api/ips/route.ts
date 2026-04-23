import { NextResponse } from 'next/server';
import { getKvClient } from '@/lib/kv';
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
    try {
      content = await kv.get('ip_list');
    } catch (e) {
      console.error("[IPS] KV Error:", e);
    }

    return NextResponse.json({ ips: content || "" });
  } catch (error) {
    return NextResponse.json({ ips: "" });
  }
}

export async function POST(req: Request) {
  try {
    const { ips } = await req.json();
    const kv = getKvClient();

    try {
      console.log("[IPS] Saving to KV:", ips);
      await kv.set('ip_list', ips);
      console.log("[IPS] Save successful");
      return NextResponse.json({ success: true });
    } catch (e) {
      console.error("[IPS] KV Save Error:", e);
      return NextResponse.json({ error: "Błąd zapisu w chmurze" }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
