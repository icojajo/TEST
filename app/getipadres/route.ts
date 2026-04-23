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
      if (edgeIpList) return new NextResponse(edgeIpList, { headers: { 'Content-Type': 'text/plain' } });
    } catch (e) {}

    // 2. Vercel KV
    let content: string | null = null;
    try {
      content = await kv.get('ip_list');
    } catch (e) {}

    // Jeśli pusto, pokaż komunikat testowy
    const finalContent = content || "BRAK_ADRESOW_W_BAZIE_DODAJ_JE_W_PANELU";

    return new NextResponse(finalContent, {
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
