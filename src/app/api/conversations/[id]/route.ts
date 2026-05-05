import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/connect";
import Conversation from "@/lib/db/models/conversation";
import { getSessionId, notFound, forbidden, serverError } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

// DELETE /api/conversations/[id]
export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) return notFound();

  const sessionId = getSessionId(request);

  try {
    await connectDB();

    const conversation = await Conversation.findById(id).lean();
    if (!conversation) return notFound();
    if (conversation.sessionId !== sessionId) return forbidden();

    await Conversation.findByIdAndDelete(id);
    return new NextResponse(null, { status: 204 });
  } catch {
    return serverError();
  }
}

// GET /api/conversations/[id] — full conversation with messages
export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) return notFound();

  const sessionId = getSessionId(request);

  try {
    await connectDB();

    const conversation = await Conversation.findById(id)
      .populate("characterId", "name avatarUrl description systemPrompt")
      .lean();

    if (!conversation) return notFound();
    if (conversation.sessionId !== sessionId) return forbidden();

    return NextResponse.json(conversation);
  } catch {
    return serverError();
  }
}
