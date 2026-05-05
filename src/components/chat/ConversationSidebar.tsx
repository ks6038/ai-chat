"use client";

import { X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { IConversation } from "@/types/conversation";

interface ConversationSidebarProps {
  conversations: IConversation[];
  activeId: string | null;
  onSelect: (conversation: IConversation) => void;
  onDelete: (id: string) => void;
}

export default function ConversationSidebar({
  conversations,
  activeId,
  onSelect,
  onDelete,
}: ConversationSidebarProps) {
  if (conversations.length === 0) {
    return (
      <aside className="flex w-60 shrink-0 flex-col border-r border-gray-100 bg-gray-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">대화 기록</p>
        <p className="mt-4 text-xs text-gray-400">아직 대화 기록이 없습니다.</p>
      </aside>
    );
  }

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-gray-100 bg-gray-50">
      <div className="px-4 pt-4 pb-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">대화 기록</p>
      </div>
      <Separator />
      <ScrollArea className="flex-1">
        <ul className="space-y-0.5 p-2">
          {conversations.map((conv) => {
            const preview = conv.messages.at(-1)?.content ?? "새 대화";
            const isActive = conv._id === activeId;

            return (
              <li key={conv._id} className="group relative">
                <button
                  onClick={() => onSelect(conv)}
                  className={cn(
                    "w-full rounded-lg px-3 py-2.5 pr-8 text-left text-xs transition-colors",
                    isActive
                      ? "bg-gray-200 text-gray-900"
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <p className="line-clamp-2 leading-snug">{preview}</p>
                  <p className="mt-1 text-gray-400">
                    {new Date(conv.updatedAt).toLocaleDateString("ko-KR", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(conv._id); }}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 hidden rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700 group-hover:flex"
                  aria-label="대화 삭제"
                >
                  <X className="h-3 w-3" />
                </button>
              </li>
            );
          })}
        </ul>
      </ScrollArea>
    </aside>
  );
}
