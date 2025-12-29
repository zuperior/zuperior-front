import { NextRequest, NextResponse } from "next/server";
import * as unipaymentService from "@/lib/unipayment.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { invoiceId: string };

    if (!body.invoiceId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing invoiceId"
        },
        { status: 400 }
      );
    }

    const result = await unipaymentService.getInvoiceStatus(body.invoiceId);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("❌ [Unipayment] Status check error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Unknown error"
      },
      { status: 500 }
    );
  }
}

