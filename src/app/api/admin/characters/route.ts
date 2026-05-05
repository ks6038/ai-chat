import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db/connect";
import Character from "@/lib/db/models/character";
import { isAdmin, badRequest, forbidden, serverError } from "@/lib/api-helpers";

const CreateSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().min(1).max(500),
  personality: z.string().trim().min(1).max(2000),
  systemPrompt: z.string().trim().min(1).max(4000),
  avatarUrl: z.string().url().optional().or(z.literal("")),
  isPublic: z.boolean().default(true),
});

// GET /api/admin/characters — list all admin-created characters
export async function GET(request: NextRequest) {
  if (!isAdmin(request)) return forbidden("관리자 코드가 올바르지 않습니다.");

  try {
    await connectDB();
    const characters = await Character.find({ createdBy: "admin" })
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json(characters);
  } catch {
    return serverError();
  }
}

// POST /api/admin/characters — create an admin character
export async function POST(request: NextRequest) {
  if (!isAdmin(request)) return forbidden("관리자 코드가 올바르지 않습니다.");

  const body = await request.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다.");
  }

  try {
    await connectDB();
    const character = await Character.create({
      ...parsed.data,
      createdBy: "admin",
    });
    return NextResponse.json(character, { status: 201 });
  } catch {
    return serverError();
  }
}
