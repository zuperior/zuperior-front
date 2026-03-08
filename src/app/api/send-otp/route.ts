import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import crypto from "crypto";
import path from "path";
import axios from "axios";

// Helper to generate a 6-digit OTP
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const buildEmailHtml = (otp: string, name?: string) => `
  <div style="background:#0b0f1a;padding:24px;font-family:Arial,sans-serif;color:#e6e6e6">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#121828;border-radius:12px;overflow:hidden">
      <tr>
        <td style="background:linear-gradient(90deg,#6242a5,#9f8bcf);padding:16px 20px">
          <h1 style="margin:0;font-size:20px;color:#fff">Zuperior</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:24px">
          <p style="margin:0 0 12px 0;font-size:14px;color:#cbd5e1">${name ? `Hi ${name},` : "Hi,"}</p>
          <p style="margin:0 0 16px 0;font-size:14px;color:#cbd5e1">Use the one-time code below to verify your email address.</p>
          <div style="letter-spacing:6px;font-weight:700;font-size:28px;text-align:center;color:#fff;margin:18px 0 8px">${otp}</div>
          <p style="margin:0 0 6px 0;font-size:12px;color:#94a3b8;text-align:center">This code will expire in 10 minutes.</p>
          <div style="margin-top:22px;padding:12px 16px;background:#0f172a;border:1px solid #1f2937;border-radius:8px;color:#94a3b8;font-size:12px">
            If you didn't request this email, you can safely ignore it.
          </div>
          <p style="margin-top:24px;font-size:12px;color:#64748b">— Team Zuperior</p>
        </td>
      </tr>
    </table>
  </div>
`;

// Responsive email (no attachments). Supports dark/light in clients that honor prefers-color-scheme.
const buildResponsiveEmailHtml = (otp: string, name?: string) => `
<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="color-scheme" content="light dark" />
    <meta name="supported-color-schemes" content="light dark" />
    <style>
      body{margin:0;padding:24px;background:#f6f7fb;font-family:Arial,Helvetica,sans-serif;color:#0f172a}
      .card{max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden}
      .header{background:linear-gradient(90deg,#6242a5,#9f8bcf);padding:16px 20px;display:flex;align-items:center;gap:10px}
      .title{margin:0;font-size:20px;color:#ffffff}
      .muted{color:#475569}
      .code{letter-spacing:6px;font-weight:700;font-size:28px;text-align:center;color:#111827;margin:18px 0 8px}
      .panel{margin-top:22px;padding:12px 16px;border:1px solid #e2e8f0;border-radius:8px;color:#475569;font-size:12px}
      .foot{margin-top:24px;font-size:12px;color:#475569}
      @media (prefers-color-scheme: dark){
        body{background:#0b0f1a;color:#e6e6e6}
        .card{background:#121828}
        .muted{color:#94a3b8}
        .code{color:#ffffff}
        .panel{border-color:#1f2937;color:#94a3b8}
        .foot{color:#94a3b8}
      }
    </style>
  </head>
  <body>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="card">
      <tr>
        <td class="header">
          <img src="cid:zuperior-logo" alt="Zuperior" style="height:28px;border:0;outline:none;display:block" />
          <h1 class="title">Zuperior</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:24px">
          <p class="muted" style="margin:0 0 12px 0;font-size:14px">${name ? `Hi ${name},` : "Hi,"}</p>
          <p class="muted" style="margin:0 0 16px 0;font-size:14px">Use the one-time code below to verify your email address.</p>
          <div class="code">${otp}</div>
          <p class="muted" style="margin:0 0 6px 0;font-size:12px;text-align:center">This code will expire in 10 minutes.</p>
          <div class="panel">If you didn't request this email, you can safely ignore it.</div>
          <p class="foot">— Team Zuperior</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

export async function POST(req: NextRequest) {
  const { email, name, purpose, useBackend } = await req.json();

  if (!email || !email.trim()) {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }

  // If useBackend flag is set, use server API (for password reset/change)
  if (useBackend) {
    try {
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:5001/api";
      
      console.log("Sending OTP to server:", { email, name, purpose, API_URL: `${BACKEND_URL}/user/send-otp` });
      
      const response = await axios.post(
        `${BACKEND_URL}/user/send-otp`,
        {
          email: email.trim(),
          name: name || "User",
          purpose: purpose || "verification", // Pass purpose to backend
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 30000, // 30 second timeout
        }
      );

      console.log("Server OTP send response:", response.data);

      if (response.data?.success) {
        return NextResponse.json({ success: true, message: response.data.message });
      } else {
        return NextResponse.json(
          { success: false, error: response.data?.message || "Failed to send OTP" },
          { status: 400 }
        );
      }
    } catch (error: any) {
      console.error("Server OTP send error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        code: error.code,
      });
      
      let errorMessage = "Failed to send OTP";
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
          error: errorMessage,
        },
        { status: statusCode }
      );
    }
  }

  const otp = generateOtp();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
  const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

  // Setup Nodemailer transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const from = process.env.SMTP_FROM || "Zuperior <noreply@zuperior.com>";

  const mailOptions = {
    from,
    to: email,
    subject: "Verify your email • Zuperior",
    text: `Your OTP code is: ${otp}. It expires in 10 minutes.`,
    html: buildResponsiveEmailHtml(otp, name),
    attachments: [
      {
        filename: "logo.png",
        path: path.resolve(process.cwd(), "public/logo.png"),
        cid: "zuperior-logo",
      },
    ],
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("📧 OTP email sent", {
      to: email,
      messageId: info?.messageId,
      accepted: info?.accepted,
      response: info?.response,
    });

    // Set secure cookies to verify later (hash only)
    const res = NextResponse.json({ success: true });
    res.cookies.set("otp_email", email, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 600 });
    res.cookies.set("otp_hash", otpHash, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 600 });
    res.cookies.set("otp_expires", String(expiresAt), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 600 });
    return res;
  } catch (error) {
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
