import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { mode, name, email, password, riskProfile } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  // In production: validate against Supabase DB
  // For now: accept any valid signup and return a user object
  const user = {
    id: `user_${Date.now()}`,
    name: name || email.split("@")[0],
    email,
    riskProfile: riskProfile || "moderate",
    botActive: true,
    subscriptionStatus: "trialing",
    trialEnds: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };

  return NextResponse.json({ user, token: `tok_${user.id}` });
}
