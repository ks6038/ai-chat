import { NextRequest, NextResponse } from "next/server";
import { verifyAdminCode } from "@/lib/auth";

export function getSessionId(request: NextRequest): string {
  return request.headers.get("x-session-id") ?? "";
}

export function isAdmin(request: NextRequest): boolean {
  const code = request.headers.get("x-admin-code") ?? "";
  return verifyAdminCode(code);
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function notFound(message = "찾을 수 없습니다.") {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function forbidden(message = "권한이 없습니다.") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function serverError(message = "서버 오류가 발생했습니다.") {
  return NextResponse.json({ error: message }, { status: 500 });
}
