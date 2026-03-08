import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

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

    const { searchParams } = new URL(request.url);
    
    const response = await axios.get(`${API_URL}/support/tickets`, {
      params: {
        status: searchParams.get('status'),
        ticket_type: searchParams.get('ticket_type'),
        search: searchParams.get('search'),
      },
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error in support tickets API:', error);
    return NextResponse.json(
      {
        success: false,
        message: error?.response?.data?.message || 'Failed to fetch tickets',
      },
      { status: error?.response?.status || 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    const response = await axios.post(`${API_URL}/support/tickets`, body, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error creating ticket:', error);
    return NextResponse.json(
      {
        success: false,
        message: error?.response?.data?.message || 'Failed to create ticket',
      },
      { status: error?.response?.status || 500 }
    );
  }
}

