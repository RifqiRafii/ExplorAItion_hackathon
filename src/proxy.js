import { NextResponse } from 'next/server';

export function proxy(request) {
  const userSession = request.cookies.get('userSession')?.value;
  const { pathname } = request.nextUrl;

  // Protect /dashboard
  if (pathname.startsWith('/dashboard') && !userSession) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect authenticated users away from auth pages
  if ((pathname === '/login' || pathname === '/register') && userSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/register', '/dashboard/:path*'],
};
