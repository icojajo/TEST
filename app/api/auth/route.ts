import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { password } = await req.json();
    
    // Zdefiniowane super tajne haslo. Najlepiej nadpisze się zmienną ze środowiska serwera.
    const CORRECT_PASS = process.env.ADMIN_PASSWORD || "mojehaslo123";

    if (password === CORRECT_PASS) {
      const res = NextResponse.json({ success: true });
      
      // Zapisujemy Ciastko HTTP, tak by było absolutnie nie do wykradnięcia dla javascriptu z zewnątrz (XSS)
      res.cookies.set('admin_auth', 'secure_authenticated_session', { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === "production", 
        maxAge: 7 * 24 * 60 * 60, // 7 dni sesji
        path: '/' 
      });

      return res;
    }

    return NextResponse.json({ error: "Błędne hasło autoryzacji!" }, { status: 401 });
  } catch (err) {
    return NextResponse.json({ error: "Błąd uwierzytelniania" }, { status: 500 });
  }
}
