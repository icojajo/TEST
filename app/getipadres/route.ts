import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { get } from '@vercel/edge-config';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Edge Config (Chmura)
    try {
      const edgeIpList = await get<string>('ip_list');
      if (edgeIpList) {
        console.log("[GETIP] Found in Edge Config");
        return new NextResponse(edgeIpList, { headers: { 'Content-Type': 'text/plain' } });
      }
    } catch (e) {}

    // 2. Vercel KV (Baza danych w chmurze)
    let content: string | null = null;
    try {
      content = await kv.get('ip_list');
      if (content) console.log("[GETIP] Found in KV");
    } catch (e) {
      console.error("[GETIP] KV Get Error:", e);
    }

    return new NextResponse(content || "", {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    return new NextResponse('Internal Error', { status: 500 });
  }
}
