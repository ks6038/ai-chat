import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/connect";
import Character from "@/lib/db/models/character";
import {
  getSessionId,
  isAdmin,
  badRequest,
  notFound,
  forbidden,
  serverError,
} from "@/lib/api-helpers";

const UpdateSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().min(1).max(500).optional(),
  personality: z.string().trim().min(1).max(2000).optional(),
  systemPrompt: z.string().trim().min(1).max(4000).optional(),
  avatarUrl: z.string().url().optional().or(z.literal("")),
});

type Params = { params: Promise<{ id: string }> };

function isValidId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

// GET /api/characters/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!isValidId(id)) return notFound();

  try {
    await connectDB();
    const character = await Character.findById(id).lean();
    if (!character) return notFound();
    return NextResponse.json(character);
  } catch {
    return serverError();
  }
}

// PATCH /api/characters/[id] — owner or admin only
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!isValidId(id)) return notFound();

  const sessionId = getSessionId(request);

  const body = await request.json().catch(() => null);
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다.");
  }

  try {
    await connectDB();
    const character = await Character.findById(id);
    if (!character) return notFound();

    const ownsIt = character.createdBy === sessionId;
    const adminEdit = character.createdBy === "admin" && isAdmin(request);
    if (!ownsIt && !adminEdit) return forbidden();

    Object.assign(character, parsed.data);
    await character.save();
    return NextResponse.json(character);
  } catch {
    return serverError();
  }
}

// DELETE /api/characters/[id] — owner or admin only
export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!isValidId(id)) return notFound();

  const sessionId = getSessionId(request);

  try {
    await connectDB();
    const character = await Character.findById(id);
    if (!character) return notFound();

    const ownsIt = character.createdBy === sessionId;
    const adminDelete = character.createdBy === "admin" && isAdmin(request);
    if (!ownsIt && !adminDelete) return forbidden();

    await character.deleteOne();
    return NextResponse.json({ ok: true });
  } catch {
    return serverError();
  }
}
