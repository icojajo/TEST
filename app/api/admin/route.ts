import { NextResponse } from 'next/server';
import { clients } from '@/lib/store';

export async function GET() {
  const now = Date.now();
  const activeClients = Array.from(clients.values()).filter(c => now - c.lastSeen < 120000).map(c => {
    const { downloadData, ...rest } = c;
    return { ...rest, hasDownload: !!downloadData };
  });
  
  return NextResponse.json({ clients: activeClients }, {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}

export async function POST(req: Request) {
  const { id, message } = await req.json();
  const client = clients.get(id);
  
  if (client) {
    client.messages.push(message);
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: "Klient nie znaleziony" }, { status: 404 });
}
