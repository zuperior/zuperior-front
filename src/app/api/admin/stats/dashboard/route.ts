// client/src/app/api/admin/stats/dashboard/route.ts

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5001';

export async function GET(request: NextRequest) {
  try {
    // Get authorization header from request
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Authorization header required' },
        { status: 401 }
      );
    }

    // For now, return mock data since we don't have a dedicated dashboard stats endpoint
    // In a real implementation, this would call the backend to aggregate stats
    const mockDashboardStats = {
      totalUsers: 6,
      emailUnverified: 2,
      kycPending: 3,
      mt5Accounts: 1,
      totalDeposits: 0,
      totalWithdrawals: 0,
      pendingDeposits: 0,
      pendingWithdrawals: 0,
      recentActivity: [
        {
          id: '1',
          entity: 'user',
          action: 'create',
          createdAt: new Date().toISOString(),
          userId: 'user1',
          adminId: 'admin1',
          admin: { email: 'admin@example.com' }
        }
      ]
    };

    return NextResponse.json({
      success: true,
      data: mockDashboardStats
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

