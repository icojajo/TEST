import { NextResponse } from 'next/server';
import { getKvClient } from '../../../lib/kv';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const kv = getKvClient();
    if (!kv) return NextResponse.json({ error: "Baza nieaktywna" }, { status: 500 });

    const data: { url: string, filename: string } | null = await kv.get('server_zip_url');
    
    if (!data || !data.url) {
      return NextResponse.json({ error: "Brak pliku na serwerze (wymagany Vercel Blob)" }, { status: 404 });
    }

    // Przekierowujemy bezpośrednio do pliku w Blob Storage
    return NextResponse.redirect(data.url);
  } catch (error) {
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
