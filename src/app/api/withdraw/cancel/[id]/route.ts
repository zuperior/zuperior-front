import { NextRequest, NextResponse } from 'next/server';

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const backendBase = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5000/api';
        const authHeader = request.headers.get('authorization') || '';

        // In Next.js 15+, params is a promise
        const { id } = await params;

        const resp = await fetch(`${backendBase}/withdraw/cancel/${id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(authHeader ? { Authorization: authHeader } : {}),
            },
            body: JSON.stringify({}),
        });

        const text = await resp.text();
        let data: any = {};
        try {
            data = JSON.parse(text);
        } catch {
            data = { success: false, message: text || 'Server Error' };
        }

        return NextResponse.json(data, { status: resp.status });
    } catch (e: any) {
        console.error('Withdraw cancel proxy error:', e?.message || e);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}
