import { hashPassword } from '@/lib/password';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get('secret') !== 'test1234') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const results: Record<number, number> = {};
  for (const iters of [10000, 5000, 2000]) {
    const start = Date.now();
    await hashPassword('testpass', iters);
    results[iters] = Date.now() - start;
  }
  return NextResponse.json(results);
}
