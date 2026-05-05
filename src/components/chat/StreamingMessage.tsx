import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface StreamingMessageProps {
  text: string;
  characterName?: string;
  characterAvatar?: string;
}

export default function StreamingMessage({ text, characterName, characterAvatar }: StreamingMessageProps) {
  const showTyping = text === "";

  return (
    <div className="flex gap-3">
      <Avatar className="h-8 w-8 shrink-0 mt-0.5">
        <AvatarImage src={characterAvatar} alt={characterName} />
        <AvatarFallback className="bg-gray-100 text-gray-600 text-sm">
          {characterName?.[0] ?? "A"}
        </AvatarFallback>
      </Avatar>

      <div className="max-w-[75%] rounded-2xl rounded-tl-sm bg-gray-100 px-4 py-2.5 text-sm leading-relaxed text-gray-900">
        {showTyping ? (
          <span className="flex items-center gap-1 h-5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
          </span>
        ) : (
          <span className="whitespace-pre-wrap">
            {text}
            <span className="inline-block w-0.5 h-3.5 bg-gray-500 align-middle ml-0.5 animate-pulse" />
          </span>
        )}
      </div>
    </div>
  );
}
