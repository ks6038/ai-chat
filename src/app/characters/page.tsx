"use client";

import { useState, useEffect } from "react";
import CharacterCard from "@/components/characters/CharacterCard";
import CharacterForm from "@/components/characters/CharacterForm";
import { useSessionId } from "@/lib/hooks/use-session-id";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ICharacter } from "@/types/character";

export default function MyCharactersPage() {
  const sessionId = useSessionId();
  const [characters, setCharacters] = useState<ICharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ICharacter | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    fetch("/api/characters", { headers: { "x-session-id": sessionId } })
      .then((r) => r.json())
      .then((all: ICharacter[]) => {
        setCharacters(all.filter((c) => c.createdBy === sessionId));
      })
      .finally(() => setLoading(false));
  }, [sessionId]);

  async function handleDelete(id: string) {
    if (!confirm("이 캐릭터를 삭제할까요?")) return;
    const res = await fetch(`/api/characters/${id}`, {
      method: "DELETE",
      headers: { "x-session-id": sessionId },
    });
    if (res.ok) setCharacters((prev) => prev.filter((c) => c._id !== id));
  }

  function handleSaved(character: ICharacter) {
    setCharacters((prev) => {
      const idx = prev.findIndex((c) => c._id === character._id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = character;
        return next;
      }
      return [character, ...prev];
    });
    setFormOpen(false);
    setEditing(null);
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">내 캐릭터</h1>
          <p className="mt-1 text-sm text-gray-500">직접 만든 캐릭터를 관리해 보세요.</p>
        </div>
        <Button
          onClick={() => { setEditing(null); setFormOpen(true); }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          새 캐릭터
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : characters.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-4xl mb-3">🧩</p>
          <p className="font-medium text-gray-700">아직 만든 캐릭터가 없어요.</p>
          <p className="mt-1 text-sm text-gray-400">나만의 캐릭터를 만들어 대화해 보세요.</p>
          <Button
            className="mt-6 gap-2"
            onClick={() => { setEditing(null); setFormOpen(true); }}
          >
            <Plus className="h-4 w-4" />
            첫 캐릭터 만들기
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {characters.map((c) => (
            <CharacterCard
              key={c._id}
              character={c}
              isOwner={true}
              onEdit={(ch) => { setEditing(ch); setFormOpen(true); }}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <CharacterForm
        open={formOpen}
        character={editing}
        sessionId={sessionId}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSaved={handleSaved}
      />
    </div>
  );
}
