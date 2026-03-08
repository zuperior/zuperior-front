// client/src/app/api/mt5/groups/route.ts
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5001/api';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const response = await fetch(`${API_URL}/mt5/groups`, {
      method: 'GET',
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
          message: errorData.message || 'Failed to fetch MT5 groups'
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Filter to only allowed groups as per documentation
    const allowedGroups = [
      'real\\Bbook\\Pro\\dynamic-2000x-10P',
      'real\\Bbook\\Standard\\dynamic-2000x-20Pips'
    ];

    const filteredGroups = Array.isArray(data)
      ? data.filter((group: any) => allowedGroups.includes(group.Group))
      : [];

    return NextResponse.json({
      success: true,
      message: 'MT5 groups retrieved successfully',
      data: filteredGroups
    });

  } catch (error) {
    console.error('Error fetching MT5 groups:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error'
      },
      { status: 500 }
    );
  }
}