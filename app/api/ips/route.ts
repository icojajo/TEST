import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { get } from '@vercel/edge-config';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Sprawdź Edge Config (Najwyższy priorytet, ustawiany w panelu Vercel)
    try {
      const edgeIpList = await get<string>('ip_list');
      if (edgeIpList) return NextResponse.json({ ips: edgeIpList });
    } catch (e) {}

    // 2. Sprawdź Vercel KV (Baza danych w chmurze - Zapisywana przez Twoją stronę)
    let content: string | null = null;
    try {
      content = await kv.get('ip_list');
    } catch (e) {
      console.error("Błąd KV (Prawdopodobnie brak połączenia bazy w panelu Vercel):", e);
    }

    return NextResponse.json({ ips: content || "" });
  } catch (error) {
    return NextResponse.json({ ips: "" });
  }
}

export async function POST(req: Request) {
  try {
    const { ips } = await req.json();

    // Zapisz TYLKO W CHMURZE (Vercel KV)
    try {
      console.log("[IPS] Saving to KV:", ips);
      await kv.set('ip_list', ips);
      console.log("[IPS] Save successful");
      return NextResponse.json({ success: true });
    } catch (e) {
      console.error("[IPS] KV Save Error:", e);
      return NextResponse.json({ 
        error: "Nie udało się zapisać w chmurze! Upewnij się, że stworzyłeś bazę KV w panelu Vercel i połączyłeś ją z projektem." 
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
