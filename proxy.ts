import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const isProtectedPath = request.nextUrl.pathname.startsWith('/trader') || request.nextUrl.pathname.startsWith('/investor');

  if (isProtectedPath && !token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/trader/:path*', '/investor/:path*'],
};
