import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware() {
  return NextResponse.next();
}
