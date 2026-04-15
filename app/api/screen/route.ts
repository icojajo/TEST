import { NextResponse } from 'next/server';
import { clients } from '@/lib/store';

export async function POST(req: Request) {
  try {
    const { id, screen } = await req.json();
    const client = clients.get(id);
    if (client) {
      client.screenData = screen;
      client.lastSeen = Date.now();
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "NotFound" }, { status: 404 });
  } catch (err) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
