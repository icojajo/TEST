import { NextResponse } from 'next/server';
import { getKvClient } from '../../../lib/kv';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function getUserInfo() {
  const cookieStore = cookies();
  const auth = cookieStore.get('admin_auth')?.value;
  if (!auth) return null;
  const [username, role] = decodeURIComponent(auth).split(':');
  return { username, role };
}

export async function GET(req: Request) {
  try {
    const user = getUserInfo();
    if (!user) return NextResponse.json({ error: "Nieautoryzowany" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const targetUser = user.role === 'admin' ? (searchParams.get('user') || user.username) : user.username;

    const kv = getKvClient();
    if (!kv) return NextResponse.json({ ips: "" });

    const content = await kv.get(`ips:${targetUser}`) || "";
    return NextResponse.json({ ips: content });
  } catch (error) {
    return NextResponse.json({ ips: "", error: "Błąd serwera" });
  }
}

export async function POST(req: Request) {
  try {
    const user = getUserInfo();
    if (!user) return NextResponse.json({ error: "Nieautoryzowany" }, { status: 401 });

    const { ips, targetUser: providedTarget } = await req.json();
    const targetUser = user.role === 'admin' ? (providedTarget || user.username) : user.username;

    const kv = getKvClient();
    if (!kv) throw new Error("KV Client not initialized");

    await kv.set(`ips:${targetUser}`, ips);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
