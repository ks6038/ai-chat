import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { IMessage } from "@/types/conversation";

interface MessageBubbleProps {
  message: IMessage;
  characterName?: string;
  characterAvatar?: string;
}

export default function MessageBubble({ message, characterName, characterAvatar }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar — only for assistant */}
      {!isUser && (
        <Avatar className="h-8 w-8 shrink-0 mt-0.5">
          <AvatarImage src={characterAvatar} alt={characterName} />
          <AvatarFallback className="bg-gray-100 text-gray-600 text-sm">
            {characterName?.[0] ?? "A"}
          </AvatarFallback>
        </Avatar>
      )}

      {/* Bubble */}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "rounded-tr-sm bg-gray-900 text-white"
            : "rounded-tl-sm bg-gray-100 text-gray-900"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}
