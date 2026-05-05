"use client";

import { useRef, KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({ onSend, disabled, placeholder }: ChatInputProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  function submit() {
    const value = ref.current?.value.trim();
    if (!value || disabled) return;
    onSend(value);
    if (ref.current) ref.current.value = "";
    // Reset height after clearing
    if (ref.current) ref.current.style.height = "auto";
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function handleInput() {
    if (!ref.current) return;
    ref.current.style.height = "auto";
    ref.current.style.height = `${Math.min(ref.current.scrollHeight, 160)}px`;
  }

  return (
    <div className="flex items-end gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
      <Textarea
        ref={ref}
        rows={1}
        placeholder={placeholder ?? "메시지를 입력하세요 (Shift+Enter로 줄바꿈)"}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        disabled={disabled}
        className="max-h-40 min-h-0 resize-none border-none p-0 shadow-none focus-visible:ring-0 text-sm"
      />
      <Button
        size="icon"
        onClick={submit}
        disabled={disabled}
        className="h-8 w-8 shrink-0 rounded-full"
      >
        <Send className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
