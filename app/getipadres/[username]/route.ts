import { NextResponse } from 'next/server';
import { getKvClient } from '../../../lib/kv';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  req: Request,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;
    const kv = getKvClient();
    
    let content: string | null = null;
    if (kv) {
      content = await kv.get(`ips:${username}`);
    }

    // Fallback dla admina jeśli ktoś wpisze "admin" a nie ma jeszcze wpisów
    const finalContent = content || "BRAK_ADRESOW_DLA_UZYTKOWNIKA";

    return new NextResponse(finalContent, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new NextResponse('Error', { status: 500 });
  }
}
