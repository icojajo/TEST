import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getKvClient } from '../../../lib/kv';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    const kv = getKvClient();
    
    // HARDCODED CREDENTIALS
    const SUPER_USER = "admin";
    const SUPER_PASS = "superadmin";

    let authenticated = false;
    let role = 'user';

    console.log(`[AUTH] Próba logowania: ${username}`);

    if (username === SUPER_USER && password === SUPER_PASS) {
      authenticated = true;
      role = 'admin';
      console.log(`[AUTH] Zalogowano jako SUPERADMIN`);
    } else if (kv) {
      const users: any[] = await kv.get('user_list') || [];
      const user = users.find(u => u.username === username && u.password === password);
      if (user) {
        authenticated = true;
        role = 'user';
        user.lastActive = Date.now();
        await kv.set('user_list', users);
        console.log(`[AUTH] Zalogowano jako użytkownik: ${username}`);
      }
    }

    if (authenticated) {
      const res = NextResponse.json({ success: true, role });
      res.cookies.set('admin_auth', `${username}:${role}`, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === "production", 
        maxAge: 7 * 24 * 60 * 60, 
        path: '/' 
      });
      return res;
    }

    console.log(`[AUTH] Błędne dane dla: ${username}`);
    return NextResponse.json({ error: "Błędny login lub hasło!" }, { status: 401 });
  } catch (err) {
    console.error(`[AUTH] Błąd:`, err);
    return NextResponse.json({ error: "Błąd uwierzytelniania" }, { status: 500 });
  }
}

export async function GET() {
  const cookieStore = cookies();
  const authCookie = cookieStore.get('admin_auth')?.value;
  
  if (!authCookie) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    const [username, role] = decodeURIComponent(authCookie).split(':');
    
    if (username !== 'admin') {
      const kv = getKvClient();
      if (kv) {
        const users: any[] = await kv.get('user_list') || [];
        const userIndex = users.findIndex(u => u.username === username);
        if (userIndex !== -1) {
          users[userIndex].lastActive = Date.now();
          await kv.set('user_list', users);
        }
      }
    }

    return NextResponse.json({ authenticated: true, username, role });
  } catch (e) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}

export async function DELETE() {
  const cookieStore = cookies();
  cookieStore.set('admin_auth', '', { maxAge: 0, path: '/' });
  return NextResponse.json({ success: true });
}
