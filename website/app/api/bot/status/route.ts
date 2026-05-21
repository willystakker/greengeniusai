import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    mode:    "paper",
    active:  true,
    message: "Running in paper trading mode — no broker required.",
  });
}
