import { NextResponse } from 'next/server';
import { getKvClient } from '../../../lib/kv';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    const kv = getKvClient();
    
    // Superadmin hardcoded as requested
    const SUPER_USER = "admin";
    const SUPER_PASS = "superadmin";

    let authenticated = false;
    let role = 'user';

    if (username === SUPER_USER && password === SUPER_PASS) {
      authenticated = true;
      role = 'admin';
    } else if (kv) {
      // Sprawdzamy innych użytkowników w KV
      const users: any[] = await kv.get('user_list') || [];
      const user = users.find(u => u.username === username && u.password === password);
      if (user) {
        authenticated = true;
        role = 'user';
        
        // Aktualizujemy czas aktywności
        user.lastActive = Date.now();
        await kv.set('user_list', users);
      }
    }

    if (authenticated) {
      const res = NextResponse.json({ success: true, role });
      
      // Zapisujemy login w ciastku (bezpiecznym httpOnly)
      res.cookies.set('admin_auth', `${username}:${role}`, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === "production", 
        maxAge: 7 * 24 * 60 * 60, 
        path: '/' 
      });

      return res;
    }

    return NextResponse.json({ error: "Błędny login lub hasło!" }, { status: 401 });
  } catch (err) {
    return NextResponse.json({ error: "Błąd uwierzytelniania" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const cookie = req.headers.get('cookie');
  const authCookie = cookie?.split('; ').find(row => row.startsWith('admin_auth='))?.split('=')[1];
  
  if (!authCookie) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const [username, role] = decodeURIComponent(authCookie).split(':');
  
  // Aktualizacja aktywności w tle przy każdym sprawdzeniu statusu (jeśli to nie superadmin)
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
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.set('admin_auth', '', { 
    maxAge: 0,
    path: '/'
  });
  return res;
}
