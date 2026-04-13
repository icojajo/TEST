import { NextResponse } from 'next/server';
import { clients } from '@/lib/store';

export async function POST(req: Request) {
  try {
    const { id, path, b64 } = await req.json();
    const client = clients.get(id);
    
    if (client) {
      client.downloadData = { path, b64, timestamp: Date.now() };
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "Klient nie znaleziony" }, { status: 404 });
  } catch (err) {
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (id) {
    const client = clients.get(id);
    if (client && client.downloadData) {
      return NextResponse.json({ data: client.downloadData }, { headers: { 'Cache-Control': 'no-store' } });
    }
  }
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
