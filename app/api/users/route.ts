import { NextResponse } from 'next/server';
import { getKvClient } from '../../../lib/kv';

import { cookies } from 'next/headers';

function getRoleFromCookie() {
  const cookieStore = cookies();
  const auth = cookieStore.get('admin_auth')?.value;
  if (!auth) return null;
  const parts = decodeURIComponent(auth).split(':');
  return parts.length > 1 ? parts[1] : null;
}

export async function GET() {
  const role = getRoleFromCookie();
  if (role !== 'admin') {
    return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
  }

  const kv = getKvClient();
  if (!kv) return NextResponse.json({ users: [] });

  const users = await kv.get('user_list') || [];
  return NextResponse.json({ users });
}

export async function POST(req: Request) {
  const role = getRoleFromCookie();
  if (role !== 'admin') {
    return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
  }

  const { username, password } = await req.json();
  if (!username || !password) {
    return NextResponse.json({ error: "Brak danych" }, { status: 400 });
  }

  const kv = getKvClient();
  if (!kv) return NextResponse.json({ error: "KV error" }, { status: 500 });

  const users: any[] = await kv.get('user_list') || [];
  
  if (users.find(u => u.username === username)) {
    return NextResponse.json({ error: "Użytkownik już istnieje" }, { status: 400 });
  }

  users.push({
    username,
    password,
    lastActive: Date.now(),
    role: 'user'
  });

  await kv.set('user_list', users);
  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const role = getRoleFromCookie();
  if (role !== 'admin') {
    return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
  }

  const { username } = await req.json();
  const kv = getKvClient();
  if (!kv) return NextResponse.json({ error: "KV error" }, { status: 500 });

  let users: any[] = await kv.get('user_list') || [];
  users = users.filter(u => u.username !== username);

  await kv.set('user_list', users);
  return NextResponse.json({ success: true });
}
