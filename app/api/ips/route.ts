import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'dane', 'ips.txt');
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ ips: "" });
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return NextResponse.json({ ips: content });
  } catch (error) {
    return NextResponse.json({ error: "Błąd odczytu" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { ips } = await req.json();
    const filePath = path.join(process.cwd(), 'dane', 'ips.txt');
    
    // Upewnij się, że katalog istnieje
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(filePath, ips, 'utf-8');
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Błąd zapisu" }, { status: 500 });
  }
}
