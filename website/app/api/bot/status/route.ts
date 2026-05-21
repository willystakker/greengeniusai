import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    mode:    "live",
    active:  true,
    message: "AI trading engine active.",
  });
}
