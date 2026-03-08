// client/src/app/api/mt5-accounts/[account_id]/archive/route.ts
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5001/api';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ account_id: string }> }
) {
    try {
        const { account_id } = await params;
        const token = request.headers.get('authorization')?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json(
                { success: false, message: 'Authentication required' },
                { status: 401 }
            );
        }

        if (!account_id) {
            return NextResponse.json(
                { success: false, message: 'Account ID is required' },
                { status: 400 }
            );
        }

        // Call zuperior-server backend endpoint
        const response = await fetch(`${API_URL}/mt5/archive-account/${account_id}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return NextResponse.json(
                {
                    success: false,
                    message: errorData.detail || errorData.message || 'Failed to archive account'
                },
                { status: response.status }
            );
        }

        const data = await response.json();

        return NextResponse.json({
            success: true,
            data: data
        });

    } catch (error: any) {
        console.error('Error archiving account:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Internal server error'
            },
            { status: 500 }
        );
    }
}
