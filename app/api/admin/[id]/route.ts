import { NextResponse } from 'next/server';
import { clients } from '@/lib/store';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const client = clients.get(id);
  
  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  // Return only essential data for live monitoring
  return NextResponse.json({
    id: client.id,
    screenData: client.screenData,
    cameraData: client.cameraData,
    isCameraActive: client.isCameraActive,
    isScreenActive: client.isScreenActive,
    lastSeen: client.lastSeen
  });
}
