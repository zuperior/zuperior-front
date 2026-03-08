import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5001/api';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = url.searchParams.get('limit') || '50';
  const token = req.headers.get('authorization');
  const headers: Record<string, string> = token ? { Authorization: token } : {};
  const r = await fetch(`${API_URL}/wallet/transactions?limit=${encodeURIComponent(limit)}`, { headers, cache: 'no-store' });
  const j = await r.json();
  return NextResponse.json(j, { status: r.status });
}

