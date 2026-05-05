import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import Conversation from "@/lib/db/models/conversation";
import { getSessionId, serverError } from "@/lib/api-helpers";

// GET /api/conversations?characterId=... — list conversations, optionally filtered by character
export async function GET(request: NextRequest) {
  const sessionId = getSessionId(request);
  if (!sessionId) return NextResponse.json([]);

  try {
    await connectDB();

    const characterId = request.nextUrl.searchParams.get("characterId");
    const filter: Record<string, unknown> = { sessionId };
    if (characterId) filter.characterId = characterId;

    const conversations = await Conversation.find(filter)
      .populate("characterId", "name avatarUrl")
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json(conversations);
  } catch {
    return serverError();
  }
}
