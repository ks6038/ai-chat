import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/connect";
import Character from "@/lib/db/models/character";
import Conversation from "@/lib/db/models/conversation";
import anthropic from "@/lib/claude";
import { getSessionId, badRequest, notFound, serverError } from "@/lib/api-helpers";

// POST /api/chat — streaming roleplay chat
export async function POST(request: NextRequest) {
  const sessionId = getSessionId(request);
  if (!sessionId) return badRequest("X-Session-Id 헤더가 필요합니다.");

  const body = await request.json().catch(() => null);
  const { characterId, conversationId, message } = body ?? {};

  if (!characterId || typeof characterId !== "string") return badRequest("characterId가 필요합니다.");
  if (!message || typeof message !== "string" || !message.trim()) return badRequest("message가 필요합니다.");
  if (!mongoose.Types.ObjectId.isValid(characterId)) return notFound();

  try {
    await connectDB();

    // Load character
    const character = await Character.findById(characterId).lean();
    if (!character) return notFound();

    // Load or create conversation
    let conversation;
    if (conversationId && mongoose.Types.ObjectId.isValid(conversationId)) {
      conversation = await Conversation.findOne({ _id: conversationId, sessionId });
    }
    if (!conversation) {
      conversation = await Conversation.create({ characterId, sessionId, messages: [] });
    }

    // Build message history for Claude (last 40 messages to stay within context)
    const history = conversation.messages.slice(-40).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
    history.push({ role: "user", content: message.trim() });

    // Stream from Claude
    const claudeStream = anthropic.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: character.systemPrompt,
      messages: history,
    });

    const encoder = new TextEncoder();
    let fullText = "";

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of claudeStream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              const text = event.delta.text;
              fullText += text;
              controller.enqueue(encoder.encode(text));
            }
          }
        } catch (err) {
          controller.error(err);
          return;
        }

        controller.close();

        // Persist both messages after stream ends (background, doesn't block client)
        Conversation.findByIdAndUpdate(conversation._id, {
          $push: {
            messages: {
              $each: [
                { role: "user", content: message.trim(), createdAt: new Date() },
                { role: "assistant", content: fullText, createdAt: new Date() },
              ],
            },
          },
          updatedAt: new Date(),
        }).catch(console.error);
      },
    });

    return new NextResponse(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Conversation-Id": conversation._id.toString(),
        // Disable buffering in proxies so chunks reach the client immediately
        "X-Accel-Buffering": "no",
        "Cache-Control": "no-cache",
      },
    });
  } catch {
    return serverError();
  }
}
