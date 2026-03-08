import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import axios from "axios";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:5001/api";

export async function POST(req: NextRequest) {
  try {
    const { email, otp, useBackend, purpose } = await req.json();
    if (!email || !otp) {
      return NextResponse.json({ success: false, message: "Missing email or otp" }, { status: 400 });
    }

    // If useBackend flag is set, use server API (for password reset or email verification)
    if (useBackend) {
      try {
        console.log("Verifying OTP with server:", { email, otp, purpose, API_URL: `${BACKEND_URL}/user/verify-otp` });
        
        const response = await axios.post(
          `${BACKEND_URL}/user/verify-otp`,
          {
            email: email,
            otp: otp,
            purpose: purpose || undefined,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
            timeout: 30000, // 30 second timeout
          }
        );

        console.log("Server OTP verification response:", response.data);

        // Server returns { success: bool, verified: bool, message: string }
        if (response.data && (response.data.success === true || response.data.verified === true)) {
          return NextResponse.json({ success: true, verified: true });
        } else {
          return NextResponse.json(
            { success: false, message: response.data?.message || "Invalid OTP" },
            { status: 400 }
          );
        }
      } catch (error: any) {
        console.error("Server OTP verification error:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          code: error.code,
        });
        
        let errorMessage = "Verification failed";
        let statusCode = 500;
        
        if (error.response) {
          // Server responded with error
          errorMessage = error.response?.data?.message || errorMessage;
          statusCode = error.response?.status || statusCode;
        } else if (error.request) {
          // Request made but no response
          errorMessage = "Unable to reach server. Please check your connection.";
          statusCode = 503;
        } else if (error.code === "ECONNREFUSED") {
          errorMessage = "Cannot connect to server. Please ensure the backend is running.";
          statusCode = 503;
        }
        
        return NextResponse.json(
          {
            success: false,
            message: errorMessage,
          },
          { status: statusCode }
        );
      }
    }

    // Legacy cookie-based verification (for registration)
    const cookies = req.cookies;
    const savedEmail = cookies.get("otp_email")?.value || "";
    const savedHash = cookies.get("otp_hash")?.value || "";
    const expiresRaw = cookies.get("otp_expires")?.value || "0";
    const expires = parseInt(expiresRaw, 10) || 0;

    if (!savedEmail || !savedHash || !expires) {
      return NextResponse.json({ success: false, message: "OTP not found or expired" }, { status: 400 });
    }

    if (Date.now() > expires) {
      const resp = NextResponse.json({ success: false, message: "OTP expired" }, { status: 400 });
      resp.cookies.delete("otp_email");
      resp.cookies.delete("otp_hash");
      resp.cookies.delete("otp_expires");
      return resp;
    }

    if (savedEmail.toLowerCase() !== String(email).toLowerCase()) {
      return NextResponse.json({ success: false, message: "Email mismatch" }, { status: 400 });
    }

    const compare = crypto.createHash("sha256").update(String(otp)).digest("hex");
    if (compare !== savedHash) {
      return NextResponse.json({ success: false, message: "Invalid OTP" }, { status: 400 });
    }

    const res = NextResponse.json({ success: true });
    // Mark verified for the subsequent register call
    res.cookies.set("otp_verified", "true", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 600 });
    // cleanup
    res.cookies.delete("otp_email");
    res.cookies.delete("otp_hash");
    res.cookies.delete("otp_expires");
    return res;
  } catch (error) {
    return NextResponse.json({ success: false, message: "Verification error" }, { status: 500 });
  }
}

