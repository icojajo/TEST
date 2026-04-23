import { NextResponse } from 'next/server';
import { getIpStore, setIpStore } from '@/lib/store';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    let content = getIpStore();
    if (!content) {
      const filePath = path.join(process.cwd(), 'dane', 'ips.txt');
      if (fs.existsSync(filePath)) {
        content = fs.readFileSync(filePath, 'utf-8');
        setIpStore(content); // Synchronizuj z pamięcią
      }
    }
    return NextResponse.json({ ips: content || "" });
  } catch (error) {
    return NextResponse.json({ error: "Błąd odczytu" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { ips } = await req.json();
    
    // Zapisz w pamięci (działa na Vercel)
    setIpStore(ips);
    
    // Spróbuj zapisać w pliku (lokalnie) - na Vercel to rzuci błędem, więc ignorujemy go
    try {
      const filePath = path.join(process.cwd(), 'dane', 'ips.txt');
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filePath, ips, 'utf-8');
    } catch (e) {
      console.log("File save failed (probably Vercel), but memory updated.");
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Błąd zapisu" }, { status: 500 });
  }
}
