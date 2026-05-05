import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/connect";
import Character from "@/lib/db/models/character";
import { isAdmin, badRequest, notFound, forbidden, serverError } from "@/lib/api-helpers";

const UpdateSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().min(1).max(500).optional(),
  personality: z.string().trim().min(1).max(2000).optional(),
  systemPrompt: z.string().trim().min(1).max(4000).optional(),
  avatarUrl: z.string().url().optional().or(z.literal("")),
  isPublic: z.boolean().optional(),
});

type Params = { params: Promise<{ id: string }> };

// PATCH /api/admin/characters/[id]
export async function PATCH(request: NextRequest, { params }: Params) {
  if (!isAdmin(request)) return forbidden("관리자 코드가 올바르지 않습니다.");

  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) return notFound();

  const body = await request.json().catch(() => null);
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다.");
  }

  try {
    await connectDB();
    const character = await Character.findOne({ _id: id, createdBy: "admin" });
    if (!character) return notFound();

    Object.assign(character, parsed.data);
    await character.save();
    return NextResponse.json(character);
  } catch {
    return serverError();
  }
}

// DELETE /api/admin/characters/[id]
export async function DELETE(request: NextRequest, { params }: Params) {
  if (!isAdmin(request)) return forbidden("관리자 코드가 올바르지 않습니다.");

  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) return notFound();

  try {
    await connectDB();
    const character = await Character.findOne({ _id: id, createdBy: "admin" });
    if (!character) return notFound();

    await character.deleteOne();
    return NextResponse.json({ ok: true });
  } catch {
    return serverError();
  }
}
