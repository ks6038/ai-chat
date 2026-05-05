"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import MessageBubble from "@/components/chat/MessageBubble";
import StreamingMessage from "@/components/chat/StreamingMessage";
import ChatInput from "@/components/chat/ChatInput";
import ConversationSidebar from "@/components/chat/ConversationSidebar";
import { useSessionId } from "@/lib/hooks/use-session-id";
import type { ICharacter } from "@/types/character";
import type { IConversation, IMessage } from "@/types/conversation";

interface ChatInterfaceProps {
  character: ICharacter;
}

export default function ChatInterface({ character }: ChatInterfaceProps) {
  const sessionId = useSessionId();
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<IConversation[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new content
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  // Load past conversations for this character
  useEffect(() => {
    if (!sessionId) return;
    fetch(`/api/conversations?characterId=${character._id}`, {
      headers: { "x-session-id": sessionId },
    })
      .then((r) => r.json())
      .then((convs: IConversation[]) => {
        setConversations(convs);
        if (convs.length > 0) selectConversation(convs[0]);
      })
      .catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, character._id]);

  function selectConversation(conv: IConversation) {
    setConversationId(conv._id);
    setMessages(conv.messages ?? []);
  }

  function startNewConversation() {
    setConversationId(null);
    setMessages([]);
  }

  async function deleteConversation(id: string) {
    if (!sessionId) return;
    await fetch(`/api/conversations/${id}`, {
      method: "DELETE",
      headers: { "x-session-id": sessionId },
    }).catch(console.error);
    setConversations((prev) => prev.filter((c) => c._id !== id));
    if (conversationId === id) startNewConversation();
  }

  const sendMessage = useCallback(
    async (userMessage: string) => {
      if (!sessionId || streaming) return;

      setMessages((prev) => [
        ...prev,
        { role: "user", content: userMessage, createdAt: new Date() },
      ]);
      setStreaming(true);
      setStreamingText("");

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-session-id": sessionId,
          },
          body: JSON.stringify({
            characterId: character._id,
            conversationId,
            message: userMessage,
          }),
        });

        if (!res.ok || !res.body) {
          setMessages((prev) => prev.slice(0, -1));
          return;
        }

        const newConvId = res.headers.get("x-conversation-id");
        if (newConvId && !conversationId) {
          setConversationId(newConvId);
          // Add new conversation to sidebar
          setConversations((prev) => [
            { _id: newConvId, characterId: character._id, sessionId, messages: [], createdAt: new Date(), updatedAt: new Date() },
            ...prev,
          ]);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullText += decoder.decode(value, { stream: true });
          setStreamingText(fullText);
        }

        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: fullText, createdAt: new Date() },
        ]);
      } catch (err) {
        console.error(err);
        setMessages((prev) => prev.slice(0, -1));
      } finally {
        setStreamingText("");
        setStreaming(false);
      }
    },
    [sessionId, streaming, character._id, conversationId]
  );

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Conversation history sidebar */}
      <ConversationSidebar
        conversations={conversations}
        activeId={conversationId}
        onSelect={selectConversation}
        onDelete={deleteConversation}
      />

      {/* Main chat area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Character header */}
        <div className="flex shrink-0 items-center gap-3 border-b border-gray-100 px-4 py-3">
          <Link
            href="/"
            className="text-gray-400 hover:text-gray-700 transition-colors"
            aria-label="홈으로"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-gray-900 text-sm">{character.name}</p>
            <p className="truncate text-xs text-gray-400">{character.description}</p>
          </div>

          <button
            onClick={startNewConversation}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            새 대화
          </button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1">
          <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
            {messages.length === 0 && !streaming && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-4xl mb-3">💬</p>
                <p className="font-semibold text-gray-800">{character.name}</p>
                <p className="mt-1.5 max-w-xs text-sm text-gray-400">{character.description}</p>
                <p className="mt-4 text-xs text-gray-300">첫 메시지를 보내 대화를 시작해 보세요.</p>
              </div>
            )}

            {messages.map((msg, i) => (
              <MessageBubble
                key={i}
                message={msg}
                characterName={character.name}
                characterAvatar={character.avatarUrl}
              />
            ))}

            {streaming && (
              <StreamingMessage
                text={streamingText}
                characterName={character.name}
                characterAvatar={character.avatarUrl}
              />
            )}

            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        {/* Input bar */}
        <div className="shrink-0 border-t border-gray-100 px-4 py-3">
          <div className="mx-auto max-w-2xl">
            <ChatInput
              onSend={sendMessage}
              disabled={streaming || !sessionId}
              placeholder={`${character.name}에게 메시지 보내기…`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
