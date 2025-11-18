"use server";

import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

const buildCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24, // 1 day in seconds
});

const buildPublicCookieOptions = () => ({
  ...buildCookieOptions(),
  httpOnly: false,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required." },
        { status: 400 }
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:5000/api";
    const response = await axios.post(
      `${baseUrl}/login`,
      {
        email,
        password,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }
    );

    const jsonResponse = NextResponse.json(response.data);
    
    // Only set cookies if login is complete (not 2FA required)
    if (!response.data?.requiresTwoFactor) {
      const token = response.data?.token;
      const clientId = response.data?.clientId;

      if (token) {
        jsonResponse.cookies.set("token", token, buildCookieOptions());
      }

      if (clientId) {
        jsonResponse.cookies.set("clientId", clientId, buildPublicCookieOptions());
      }
    }

    return jsonResponse;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error(
        "Server API AxiosError:",
        error.response?.data || error.message
      );
      return NextResponse.json(
        {
          message: error.response?.data?.message || "Login failed",
          error: error.response?.data || error.message,
        },
        { status: error.response?.status || 500 }
      );
    }

    if (error instanceof Error) {
      console.error("Server API Error:", error.message);
      return NextResponse.json(
        {
          message: "Unexpected error occurred",
          error: error.message,
        },
        { status: 500 }
      );
    }

    console.error("Unknown error during server API call");
    return NextResponse.json(
      {
        message: "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
