import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getKvClient } from '../../../lib/kv';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    console.log(`[AUTH-DEBUG] Logowanie: ${username} / ${password}`);
    
    const SUPER_USER = "admin";
    const SUPER_PASS = "superadmin";

    let authenticated = false;
    let role = 'user';

    // 1. Sprawdź superadmina (zawsze działa, nawet bez KV)
    if (username === SUPER_USER && password === SUPER_PASS) {
      authenticated = true;
      role = 'admin';
      console.log(`[AUTH-DEBUG] Sukces SUPERADMIN`);
    } else {
      // 2. Sprawdź KV jeśli to nie admin
      const kv = getKvClient();
      if (kv) {
        const users: any[] = await kv.get('user_list') || [];
        const user = users.find(u => u.username === username && u.password === password);
        if (user) {
          authenticated = true;
          role = 'user';
          user.lastActive = Date.now();
          await kv.set('user_list', users);
          console.log(`[AUTH-DEBUG] Sukces USER: ${username}`);
        }
      }
    }

    if (authenticated) {
      const cookieValue = `${username}:${role}`;
      
      // Próba ustawienia ciastka przez cookies() helper
      cookies().set('admin_auth', cookieValue, { 
        httpOnly: true, 
        secure: false, 
        maxAge: 60 * 60 * 24 * 7, 
        path: '/',
        sameSite: 'lax'
      });
      
      console.log(`[AUTH-DEBUG] Ciastko ustawione przez helper: ${cookieValue}`);
      
      // Dodatkowo ustawiamy na obiekcie odpowiedzi dla pewności
      const res = NextResponse.json({ success: true, role });
      res.cookies.set('admin_auth', cookieValue, { 
        httpOnly: true, 
        secure: false, 
        maxAge: 60 * 60 * 24 * 7, 
        path: '/',
        sameSite: 'lax'
      });
      
      return res;
    }

    console.log(`[AUTH-DEBUG] Nieudane logowanie dla: ${username}`);
    return NextResponse.json({ error: "Błędny login lub hasło!" }, { status: 401 });
  } catch (err) {
    console.error(`[AUTH-DEBUG] Błąd krytyczny:`, err);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const cookieStore = cookies();
    const auth = cookieStore.get('admin_auth');
    
    if (!auth || !auth.value) {
      console.log("[AUTH-DEBUG] GET: Brak ciastka admin_auth");
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    console.log(`[AUTH-DEBUG] GET: Znaleziono ciastko: ${auth.value}`);
    const [username, role] = auth.value.split(':');
    
    return NextResponse.json({ authenticated: true, username, role });
  } catch (e) {
    console.error("[AUTH-DEBUG] GET: Błąd", e);
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.delete('admin_auth');
  return res;
}
