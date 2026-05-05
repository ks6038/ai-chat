import { NextRequest, NextResponse } from "next/server";
import { verifyAccessCode, signAccessToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const code: string = body?.code ?? "";

  if (!verifyAccessCode(code)) {
    return NextResponse.json({ error: "잘못된 접근 코드입니다." }, { status: 401 });
  }

  const token = await signAccessToken();

  const response = NextResponse.json({ ok: true });
  response.cookies.set("access_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: "/",
  });

  return response;
}
