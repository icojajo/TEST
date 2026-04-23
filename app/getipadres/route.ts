import { NextResponse } from 'next/server';
import { getIpStore } from '@/lib/store';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Najpierw sprawdź pamięć (działa na Vercel)
    let content = getIpStore();
    
    // Jeśli pamięć jest pusta, spróbuj odczytać z pliku (lokalnie)
    if (!content) {
      const filePath = path.join(process.cwd(), 'dane', 'ips.txt');
      if (fs.existsSync(filePath)) {
        content = fs.readFileSync(filePath, 'utf-8');
      }
    }

    return new NextResponse(content || "", {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (error) {
    return new NextResponse('Błąd serwera', { status: 500 });
  }
}
