import { NextResponse } from "next/server";
import axios, { AxiosError } from "axios";

export async function POST() {
  try {
    // Check if required environment variables are set
    if (!process.env.CLIENT_API_CLIENT_ID || !process.env.CLIENT_API_CLIENT_SECRET) {
      console.error("Missing required environment variables:", {
        CLIENT_ID: !!process.env.CLIENT_API_CLIENT_ID,
        CLIENT_SECRET: !!process.env.CLIENT_API_CLIENT_SECRET,
      });
      return NextResponse.json(
        {
          success: false,
          message: "Server configuration error: Missing API credentials",
          error: "Environment variables CLIENT_API_CLIENT_ID and CLIENT_API_CLIENT_SECRET must be configured",
        },
        { status: 500 }
      );
    }

    const formData = new URLSearchParams();
    formData.append("grant_type", process.env.CLIENT_API_GRANT_TYPE || "client_credentials");
    formData.append("client_id", process.env.CLIENT_API_CLIENT_ID);
    formData.append("client_secret", process.env.CLIENT_API_CLIENT_SECRET);

    const response = await axios.post(
      "https://client.api.skaleapps.io/api/authorisation",
      formData.toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        validateStatus: (status) => status < 500,
      }
    );

    // Check if the response was successful
    if (response.status >= 400) {
      console.error("Access Token API Error (Status:", response.status, "):", JSON.stringify(response.data, null, 2));
      return NextResponse.json(
        {
          success: false,
          message: "Failed to fetch access token from external API",
          error: response.data,
          status: response.status,
        },
        { status: response.status }
      );
    }

    // Validate that access_token exists in response
    if (!response.data?.access_token) {
      console.error("Access token missing in response. Response data:", JSON.stringify(response.data, null, 2));
      return NextResponse.json(
        {
          success: false,
          message: "Access token not returned from API",
          error: response.data,
        },
        { status: 500 }
      );
    }

    // Return the access token in a consistent format
    return NextResponse.json({
      access_token: response.data.access_token,
      expires_in: response.data.expires_in,
      token_type: response.data.token_type,
    });

  } catch (error: unknown) {
    const err = error as AxiosError;
    let errorData: unknown = err.response?.data;

    if (typeof errorData === "string") {
      try {
        errorData = JSON.parse(errorData);
      } catch {
        // keep errorData as string if JSON.parse fails
      }
    }

    console.error("Access Token Error:", errorData ?? err.message);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch access token",
        error: errorData ?? err.message,
      },
      { status: err.response?.status || 500 }
    );
  }
}