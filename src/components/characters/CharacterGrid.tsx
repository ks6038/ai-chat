"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import CharacterCard from "@/components/characters/CharacterCard";
import CharacterForm from "@/components/characters/CharacterForm";
import { useSessionId } from "@/lib/hooks/use-session-id";
import type { ICharacter } from "@/types/character";

interface CharacterGridProps {
  initialCharacters: ICharacter[];
}

export default function CharacterGrid({ initialCharacters }: CharacterGridProps) {
  const sessionId = useSessionId();
  const [characters, setCharacters] = useState<ICharacter[]>(initialCharacters);

  // Merge user-created characters after session ID is available
  useEffect(() => {
    if (!sessionId) return;
    fetch("/api/characters", { headers: { "x-session-id": sessionId } })
      .then((r) => r.json())
      .then((all: ICharacter[]) => setCharacters(all))
      .catch(console.error);
  }, [sessionId]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ICharacter | null>(null);

  function handleEdit(character: ICharacter) {
    setEditing(character);
    setFormOpen(true);
  }

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
    <>
      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {/* New character card */}
        <button
          onClick={() => { setEditing(null); setFormOpen(true); }}
          className="flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 transition-colors hover:border-gray-300 hover:text-gray-600"
        >
          <Plus className="h-6 w-6" />
          <span className="text-sm font-medium">새 캐릭터 만들기</span>
        </button>

        {characters.map((c) => (
          <CharacterCard
            key={c._id}
            character={c}
            isOwner={c.createdBy === sessionId}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      <CharacterForm
        open={formOpen}
        character={editing}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSaved={handleSaved}
        sessionId={sessionId}
      />
    </>
  );
}
