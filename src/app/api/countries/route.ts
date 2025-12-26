import { NextResponse } from "next/server";
import axios from "axios";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:5000/api";

export async function GET() {
  try {
    // Try the backend API first
    const url = `${BACKEND_URL}/countries`;
    console.log("🌍 Fetching countries from backend:", url);
    
    try {
      const response = await axios.get(url, {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000,
        validateStatus: (status) => status < 500, // Don't throw on 4xx
      });

      console.log("✅ Backend response:", {
        status: response.status,
        success: response.data?.success,
        hasData: !!response.data?.data,
        dataLength: response.data?.data?.length
      });

      if (response.status === 200 && response.data?.success && Array.isArray(response.data.data)) {
        // Filter out countries without country_code and clean up country_code (remove +)
        const validCountries = response.data.data
          .filter((c: any) => c.country_code)
          .map((c: any) => ({
            code: c.code,
            country: c.country,
            country_code: c.country_code ? c.country_code.replace(/^\+/, '') : null
          }))
          .filter((c: any) => c.country_code); // Filter again after cleaning

        console.log(`✅ Returning ${validCountries.length} valid countries`);
        return NextResponse.json({
          success: true,
          countries: validCountries,
        });
      }

      // If 404 or invalid response, fall through to error
      if (response.status === 404) {
        console.warn("⚠️ Backend route not found (404), backend may need restart");
      }
    } catch (axiosError: any) {
      if (axiosError.response?.status === 404) {
        console.warn("⚠️ Backend countries route not found (404)");
      } else {
        console.error("❌ Backend request failed:", axiosError.message);
      }
    }

    // Fallback: Return empty array with error message
    console.error("❌ Failed to fetch countries from backend");
    return NextResponse.json(
      {
        success: false,
        error: "Backend countries endpoint not available. Please ensure backend server is running and route is registered.",
        countries: []
      },
      { status: 503 }
    );
  } catch (error: any) {
    console.error("❌ Unexpected error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch countries",
        countries: []
      },
      { status: 500 }
    );
  }
}

