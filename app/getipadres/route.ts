import { NextResponse } from 'next/server';
import { getKvClient } from '../../lib/kv';
import { get } from '@vercel/edge-config';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Wyłącz jakiekolwiek cache'owanie Next.js

export async function GET() {
  try {
    const kv = getKvClient();
    let content: string | null = null;

    // 1. Najpierw sprawdź Vercel KV (bo tam zapisujesz ze strony)
    if (kv) {
      try {
        content = await kv.get('ip_list');
      } catch (e) {
        console.error("[GETIP_API] KV Error:", e);
      }
    }

    // 2. Jeśli puste w KV, sprawdź Edge Config (jako zapas)
    if (!content) {
      try {
        content = await get<string>('ip_list') || null;
      } catch (e) {}
    }

    // Jeśli nadal pusto, pokaż komunikat testowy
    const finalContent = content || "BRAK_ADRESOW_W_BAZIE_DODAJ_JE_W_PANELU";

    return new NextResponse(finalContent, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Access-Control-Allow-Origin': '*' // Pozwól na dostęp z dowolnego miejsca
      }
    });
  } catch (error) {
    return new NextResponse('Error', { status: 500 });
  }
}
