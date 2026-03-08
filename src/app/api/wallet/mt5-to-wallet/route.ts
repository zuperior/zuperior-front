import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5001/api';

export async function POST(req: Request) {
  const incoming = req.headers.get('authorization');
  const token = incoming || (typeof window === 'undefined' ? '' : `Bearer ${typeof localStorage !== 'undefined' ? localStorage.getItem('userToken') : ''}`);
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = token;
  const body = await req.json();
  const r = await fetch(`${API_URL}/wallet/mt5-to-wallet`, { method: 'POST', headers, body: JSON.stringify(body) });
  const j = await r.json();
  return NextResponse.json(j, { status: r.status });
}
