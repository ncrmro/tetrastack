import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from './app/auth'; // Import auth from your updated auth.ts

export async function middleware(request: NextRequest) {
  const session = await auth();

  if (!session?.user && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
