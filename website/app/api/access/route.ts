import { NextRequest, NextResponse } from "next/server";

const ACCESS_CODE = process.env.ACCESS_CODE ?? "1289";

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();
    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Invalid" }, { status: 400 });
    }
    if (code.trim() !== ACCESS_CODE) {
      return NextResponse.json({ error: "Invalid access code" }, { status: 401 });
    }
    const res = NextResponse.json({ ok: true });
    res.cookies.set("ggai_access", "1", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
    return res;
  } catch {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }
}
