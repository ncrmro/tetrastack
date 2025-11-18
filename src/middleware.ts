import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  // Handle .md food requests by rewriting to unified API route
  if (req.nextUrl.pathname.match(/^\/foods\/[^\/]+\.md$/)) {
    const slug = req.nextUrl.pathname.match(/^\/foods\/(.+)\.md$/)?.[1];
    if (slug) {
      return NextResponse.rewrite(
        new URL(`/api/markdown/foods/${slug}`, req.url),
      );
    }
  }

  // Handle .md recipe requests by rewriting to unified API route
  if (req.nextUrl.pathname.match(/^\/recipes\/[^\/]+\.md$/)) {
    const slug = req.nextUrl.pathname.match(/^\/recipes\/(.+)\.md$/)?.[1];
    if (slug) {
      return NextResponse.rewrite(
        new URL(`/api/markdown/recipes/${slug}`, req.url),
      );
    }
  }

  return NextResponse.next();
}
