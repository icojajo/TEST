import { NextResponse } from 'next/server';
import { clients } from '@/lib/store';

export async function POST(req: Request) {
  try {
    const { id, path, content } = await req.json();
    const client = clients.get(id);
    
    if (client) {
      client.explorerData = { path, content, timestamp: Date.now() };
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "Klient nie znaleziony" }, { status: 404 });
  } catch (err) {
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
