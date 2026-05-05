"use client";

import { useState, useEffect, FormEvent } from "react";
import { Plus, Pencil, Trash2, Globe, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ICharacter } from "@/types/character";

// ── Admin auth gate ──────────────────────────────────────────────────────────

function AdminGate({ onVerified }: { onVerified: (code: string) => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    // Verify by calling the admin API — a 403 means wrong code
    fetch("/api/admin/characters", {
      headers: { "x-admin-code": code },
    }).then((res) => {
      if (res.ok) {
        onVerified(code);
      } else {
        setError("관리자 코드가 올바르지 않습니다.");
      }
    });
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900">관리자 페이지</h1>
          <p className="mt-1 text-sm text-gray-500">관리자 코드를 입력해 주세요.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="password"
            placeholder="관리자 코드"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoFocus
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={!code}>확인</Button>
        </form>
      </div>
    </div>
  );
}

// ── Character form ───────────────────────────────────────────────────────────

const EMPTY_FORM = {
  name: "", description: "", personality: "", systemPrompt: "", avatarUrl: "", isPublic: true,
};

function AdminCharacterForm({
  open, character, adminCode, onClose, onSaved,
}: {
  open: boolean;
  character: ICharacter | null;
  adminCode: string;
  onClose: () => void;
  onSaved: (c: ICharacter) => void;
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(
        character
          ? { name: character.name, description: character.description, personality: character.personality, systemPrompt: character.systemPrompt, avatarUrl: character.avatarUrl ?? "", isPublic: character.isPublic }
          : EMPTY_FORM
      );
      setError("");
    }
  }, [open, character]);

  function set(field: keyof typeof EMPTY_FORM) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [field]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const url = character ? `/api/admin/characters/${character._id}` : "/api/admin/characters";
    const method = character ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", "x-admin-code": adminCode },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "저장 중 오류가 발생했습니다.");
        return;
      }
      onSaved(await res.json());
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
          <DialogTitle>{character ? "캐릭터 편집" : "관리자 캐릭터 추가"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {[
            { label: "이름 *", field: "name" as const, el: "input", placeholder: "캐릭터 이름" },
            { label: "한 줄 소개 *", field: "description" as const, el: "input", placeholder: "짧은 설명" },
          ].map(({ label, field, placeholder }) => (
            <div key={field} className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">{label}</label>
              <Input placeholder={placeholder} value={form[field] as string} onChange={set(field)} required />
            </div>
          ))}

          {[
            { label: "성격 *", field: "personality" as const, rows: 3, placeholder: "말투, 성격, 특징" },
            { label: "시스템 프롬프트 *", field: "systemPrompt" as const, rows: 6, placeholder: "당신은 ... 입니다." },
          ].map(({ label, field, rows, placeholder }) => (
            <div key={field} className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">{label}</label>
              <Textarea rows={rows} placeholder={placeholder} value={form[field]} onChange={set(field)} required />
            </div>
          ))}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">아바타 URL</label>
            <Input type="url" placeholder="https://..." value={form.avatarUrl} onChange={set("avatarUrl")} />
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">공개 여부</label>
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, isPublic: !p.isPublic }))}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                form.isPublic ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
              }`}
            >
              {form.isPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
              {form.isPublic ? "공개" : "비공개"}
            </button>
          </div>

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

// ── Main admin page ──────────────────────────────────────────────────────────

export default function AdminPage() {
  const [adminCode, setAdminCode] = useState("");
  const [characters, setCharacters] = useState<ICharacter[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ICharacter | null>(null);

  function handleVerified(code: string) {
    setAdminCode(code);
    fetch("/api/admin/characters", { headers: { "x-admin-code": code } })
      .then((r) => r.json())
      .then(setCharacters)
      .catch(console.error);
  }

  async function handleDelete(id: string) {
    if (!confirm("이 캐릭터를 삭제할까요?")) return;
    const res = await fetch(`/api/admin/characters/${id}`, {
      method: "DELETE",
      headers: { "x-admin-code": adminCode },
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

  if (!adminCode) return <AdminGate onVerified={handleVerified} />;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">관리자 — 캐릭터 관리</h1>
          <p className="mt-1 text-sm text-gray-500">
            공식 캐릭터를 추가하고 관리합니다. 총 {characters.length}개
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" />
          캐릭터 추가
        </Button>
      </div>

      {characters.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-4xl mb-3">🎭</p>
          <p className="font-medium text-gray-700">등록된 공식 캐릭터가 없습니다.</p>
          <p className="mt-1 text-sm text-gray-400">
            씨드 스크립트를 실행하거나 직접 추가해 보세요.
          </p>
          <code className="mt-3 rounded bg-gray-100 px-3 py-1.5 text-xs text-gray-600">
            npx tsx scripts/seed.ts
          </code>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-100">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">캐릭터</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">설명</th>
                <th className="px-4 py-3 text-left">공개</th>
                <th className="px-4 py-3 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {characters.map((c) => (
                <tr key={c._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={c.avatarUrl} alt={c.name} />
                        <AvatarFallback className="bg-gray-100 text-xs">{c.name[0]}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-gray-900">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell max-w-xs truncate">
                    {c.description}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={c.isPublic ? "default" : "secondary"} className="text-xs">
                      {c.isPublic ? "공개" : "비공개"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm" variant="ghost"
                        className="h-8 w-8 p-0 text-gray-400 hover:text-gray-700"
                        onClick={() => { setEditing(c); setFormOpen(true); }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm" variant="ghost"
                        className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                        onClick={() => handleDelete(c._id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AdminCharacterForm
        open={formOpen}
        character={editing}
        adminCode={adminCode}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSaved={handleSaved}
      />
    </div>
  );
}
