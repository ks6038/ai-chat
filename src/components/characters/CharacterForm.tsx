"use client";

import { useState, useEffect, FormEvent } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { ICharacter } from "@/types/character";

interface CharacterFormProps {
  open: boolean;
  character: ICharacter | null;
  sessionId: string;
  onClose: () => void;
  onSaved: (character: ICharacter) => void;
}

const EMPTY = { name: "", description: "", personality: "", systemPrompt: "", avatarUrl: "" };

export default function CharacterForm({ open, character, sessionId, onClose, onSaved }: CharacterFormProps) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(
        character
          ? { name: character.name, description: character.description, personality: character.personality, systemPrompt: character.systemPrompt, avatarUrl: character.avatarUrl ?? "" }
          : EMPTY
      );
      setError("");
    }
  }, [open, character]);

  function set(field: keyof typeof EMPTY) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const url = character ? `/api/characters/${character._id}` : "/api/characters";
    const method = character ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", "x-session-id": sessionId },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "저장 중 오류가 발생했습니다.");
        return;
      }

      const saved: ICharacter = await res.json();
      onSaved(saved);
    } catch {
      setError("서버와 연결할 수 없습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{character ? "캐릭터 편집" : "새 캐릭터 만들기"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <Field label="이름 *">
            <Input placeholder="캐릭터 이름" value={form.name} onChange={set("name")} required />
          </Field>

          <Field label="한 줄 소개 *">
            <Input placeholder="캐릭터를 간략히 설명해 주세요" value={form.description} onChange={set("description")} required />
          </Field>

          <Field label="성격 *">
            <Textarea placeholder="말투, 성격, 특징을 자세히 적어주세요" rows={3} value={form.personality} onChange={set("personality")} required />
          </Field>

          <Field label="시스템 프롬프트 *" hint="Claude에게 전달되는 역할 지시문">
            <Textarea placeholder="당신은 ... 입니다. 한국어로 대화합니다." rows={5} value={form.systemPrompt} onChange={set("systemPrompt")} required />
          </Field>

          <Field label="아바타 URL">
            <Input type="url" placeholder="https://..." value={form.avatarUrl} onChange={set("avatarUrl")} />
          </Field>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>취소</Button>
            <Button type="submit" disabled={saving}>{saving ? "저장 중..." : "저장"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-gray-700">
        {label}
        {hint && <span className="ml-1 font-normal text-gray-400">— {hint}</span>}
      </label>
      {children}
    </div>
  );
}
