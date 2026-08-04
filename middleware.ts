import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // In mock mode (development), allow access to all routes
  const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

  if (useMock) {
    // Redirect root to dashboard in mock mode
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // Allow all other routes in mock mode
    return NextResponse.next();
  }

  // Get session from cookie
  const sessionCookie = request.cookies.get('sb-access-token');
  const hasSession = !!sessionCookie;

  // Redirect to login if trying to access protected routes without session
  if (!hasSession) {
    if (pathname.startsWith('/app') || pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Redirect to dashboard if already logged in and trying to access auth pages
  if (hasSession) {
    if (pathname === '/login' || pathname === '/signup') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
