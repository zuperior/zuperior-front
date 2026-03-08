"use server";

import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const buildCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24, // 1 day
});

const buildPublicCookieOptions = () => ({
  ...buildCookieOptions(),
  httpOnly: false,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, country, phone } = body || {};

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:5001/api";
    // Include emailVerified if OTP was verified
    const cookieStore = await cookies();
    const isVerified = cookieStore.get("otp_verified")?.value === "true";

    const response = await axios.post(
      `${baseUrl}/register`,
      {
        name,
        email,
        password,
        country,
        phone,
        emailVerified: isVerified || undefined,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }
    );

    const nextResponse = NextResponse.json(response.data);
    const token = response.data?.token;
    const clientId = response.data?.clientId;

    if (token) {
      nextResponse.cookies.set("token", token, buildCookieOptions());
    }

    if (clientId) {
      nextResponse.cookies.set(
        "clientId",
        clientId,
        buildPublicCookieOptions()
      );
    }

    if (isVerified) {
      nextResponse.cookies.delete("otp_verified");
    }

    return nextResponse;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error(
        "Server API AxiosError:",
        error.response?.data || error.message
      );
      return NextResponse.json(
        {
          message: error.response?.data?.message || "Registration failed",
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
