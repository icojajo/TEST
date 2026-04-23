import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Logowanie dla debugowania (widoczne w konsoli serwera)
  const authCookie = request.cookies.get('admin_auth')?.value;
  console.log(`[MIDDLEWARE] Path: ${pathname}, Auth: ${authCookie ? "TAK" : "BRAK"}`);

  // Zostawiamy otwarte otwarte trasy API przeznaczone dla naszych klientów C++/C#
  if (
    pathname.startsWith('/api/') || 
    pathname === '/getipadres' ||
    pathname.startsWith('/getipadres/') ||
    pathname === '/login' ||
    pathname.startsWith('/login/') ||
    pathname.startsWith('/_next') ||
    pathname.includes('favicon.ico')
  ) {
    return NextResponse.next();
  }

  // Zablokuj nieautoryzowany dostęp i przekieruj na bezpieczny ekran logowania
  if (!authCookie) {
    console.log(`[MIDDLEWARE] Redirect to /login from ${pathname}`);
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Wpuść admina do środka
  return NextResponse.next();
}

// Opcjonalnie: zastosuj ten middleware do wszystkich ścieżek
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
