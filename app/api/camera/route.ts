import { NextResponse } from 'next/server';
import { clients } from '@/lib/store';

export async function POST(req: Request) {
  try {
    const { id, frame } = await req.json();
    console.log(`[CAMERA] Received frame from ID: ${id}, Frame size: ${frame ? frame.length : 0} bytes`);
    const client = clients.get(id);
    
    if (client) {
      client.cameraData = frame; // Update the latest camera frame
      console.log(`[CAMERA] Frame updated for ID: ${id}. New size: ${frame ? frame.length : 0} bytes. Time: ${new Date().toLocaleTimeString()}`);
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "Klient nie znaleziony" }, { status: 404 });
  } catch (err) {
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
