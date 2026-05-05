import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db/connect";
import Character from "@/lib/db/models/character";
import { getSessionId, badRequest, serverError } from "@/lib/api-helpers";

const CreateSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().min(1).max(500),
  personality: z.string().trim().min(1).max(2000),
  systemPrompt: z.string().trim().min(1).max(4000),
  avatarUrl: z.string().url().optional().or(z.literal("")),
});

// GET /api/characters — public characters + session's own characters
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const sessionId = getSessionId(request);

    const characters = await Character.find({
      $or: [{ isPublic: true }, ...(sessionId ? [{ createdBy: sessionId }] : [])],
    })
      .sort({ isPublic: -1, createdAt: -1 })
      .lean();

    return NextResponse.json(characters);
  } catch {
    return serverError();
  }
}

// POST /api/characters — create a user character
export async function POST(request: NextRequest) {
  const sessionId = getSessionId(request);
  if (!sessionId) return badRequest("X-Session-Id 헤더가 필요합니다.");

  const body = await request.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다.");
  }

  try {
    await connectDB();
    const character = await Character.create({
      ...parsed.data,
      isPublic: false,
      createdBy: sessionId,
    });
    return NextResponse.json(character, { status: 201 });
  } catch {
    return serverError();
  }
}
