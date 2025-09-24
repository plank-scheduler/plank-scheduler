// app/api/debug-env/route.ts
import { NextResponse } from "next/server";
export function GET() {
  return NextResponse.json({
    hasKey: !!process.env.FIELDSTER_API_KEY,
    baseUrlSet: !!process.env.FIELDSTER_BASE_URL,
    mock: process.env.USE_FIELDSTER_MOCK,
  });
}
