import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = process.env.JARVIS_AUTH_TOKEN;
  const origin = request.headers.get('origin');
  const hostname = request.nextUrl.hostname;
  if (!['localhost', '127.0.0.1', '[::1]'].includes(hostname)) {
    return NextResponse.json({ error: 'Local access only' }, { status: 403 });
  }
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }
  // The query capability is accepted only for read-only speech audio playback.
  const capability = request.headers.get('x-jarvis-token') ||
    (request.method === 'GET' && request.nextUrl.pathname === '/api/speak'
      ? request.nextUrl.searchParams.get('session') : null);
  if (token && capability !== token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const response = NextResponse.next();
  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('Referrer-Policy', 'no-referrer');
  return response;
}

export const config = { matcher: '/api/:path*' };
