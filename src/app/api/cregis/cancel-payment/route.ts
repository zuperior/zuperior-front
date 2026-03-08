import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5001/api';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { cregisId } = body;

        console.log('🚫 [CANCEL-PAYMENT] Cancelling payment:', cregisId);

        if (!cregisId) {
            return NextResponse.json(
                { success: false, error: "Missing cregisId" },
                { status: 400 }
            );
        }

        // Get auth token
        const cookieStore = await cookies();
        let token = cookieStore.get('token')?.value || cookieStore.get('userToken')?.value;

        // Check Authorization header fallback
        if (!token) {
            const authHeader = req.headers.get('authorization');
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            }
        }

        if (!token) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Proxy to backend
        const backendResponse = await fetch(`${BACKEND_API_URL}/cregis/cancel-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ cregisId }),
        });

        const data = await backendResponse.json();

        if (!backendResponse.ok) {
            console.error('❌ [CANCEL-PAYMENT] Backend failed:', data);
            return NextResponse.json(data, { status: backendResponse.status });
        }

        console.log('✅ [CANCEL-PAYMENT] Cancellation successful:', data);
        return NextResponse.json(data);

    } catch (error: unknown) {
        console.error("❌ [CANCEL-PAYMENT] Error:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Internal server error",
            },
            { status: 500 }
        );
    }
}
