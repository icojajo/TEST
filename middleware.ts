import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Zostawiamy otwarte otwarte trasy API przeznaczone dla naszych klientów C++/C#
  if (
    pathname.startsWith('/api/ping') || 
    pathname.startsWith('/api/explorer') || 
    pathname.startsWith('/api/download') || 
    pathname.startsWith('/api/camera') || 
    pathname.startsWith('/api/auth') || 
    pathname.startsWith('/login') ||
    pathname.startsWith('/_next') ||
    pathname.includes('favicon.ico')
  ) {
    return NextResponse.next();
  }

  // Odczytaj ciastko sesyjne
  const authCookie = request.cookies.get('admin_auth')?.value;
  
  // Zablokuj nieautoryzowany dostęp i przekieruj na bezpieczny ekran logowania
  if (authCookie !== 'secure_authenticated_session') {
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
