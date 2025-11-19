import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

// Backend API URL for zuperior-api (FastAPI)
// This should point to your zuperior-api server (default port 8000)
const ZUPERIOR_API_URL = process.env.NEXT_PUBLIC_ZUPERIOR_API_URL || "http://localhost:8000/api";

export async function POST(req: NextRequest) {
  try {
    const { token, newPassword } = await req.json();

    if (!token || !newPassword) {
      return NextResponse.json(
        { success: false, message: "Token and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Call the zuperior-api reset password endpoint
    const response = await axios.post(
      `${ZUPERIOR_API_URL}/auth/reset-password`,
      {
        token: token,
        newPassword: newPassword,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: response.data?.message || "Password reset successfully",
    });
  } catch (error: any) {
    console.error("Password reset error:", error);
    
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message = error.response?.data?.detail || 
                     error.response?.data?.message || 
                     "Failed to reset password";
      
      return NextResponse.json(
        {
          success: false,
          message: message,
        },
        { status: status }
      );
    }
    
    return NextResponse.json(
      { success: false, message: "Failed to reset password" },
      { status: 500 }
    );
  }
}

