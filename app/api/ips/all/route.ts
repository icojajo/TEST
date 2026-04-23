import { NextResponse } from 'next/server';
import { getKvClient } from '../../../lib/kv';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const cookieStore = cookies();
    const auth = cookieStore.get('admin_auth')?.value;
    if (!auth) return NextResponse.json({ error: "Nieautoryzowany" }, { status: 401 });
    const [_, role] = decodeURIComponent(auth).split(':');
    
    if (role !== 'admin') {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const kv = getKvClient();
    if (!kv) return NextResponse.json({ data: [] });

    const users: any[] = await kv.get('user_list') || [];
    const allUsers = [{ username: 'admin' }, ...users];
    
    const results = [];
    for (const u of allUsers) {
      const ips: string = await kv.get(`ips:${u.username}`) || "";
      const ipList = ips.split('\n').filter(x => x.trim() !== "");
      for (const ip of ipList) {
        results.push({ ip, owner: u.username });
      }
    }

    return NextResponse.json({ data: results });
  } catch (error) {
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
