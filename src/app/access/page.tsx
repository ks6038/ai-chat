"use client";

import { Suspense, useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function AccessForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (res.ok) {
        const from = searchParams.get("from") ?? "/";
        router.replace(from);
      } else {
        const data = await res.json();
        setError(data.error ?? "오류가 발생했습니다.");
      }
    } catch {
      setError("서버와 연결할 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        type="password"
        placeholder="접근 코드"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        autoFocus
        autoComplete="current-password"
        className="h-11 text-base"
      />

      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}

      <Button
        type="submit"
        className="w-full h-11"
        disabled={!code || loading}
      >
        {loading ? "확인 중..." : "입장"}
      </Button>
    </form>
  );
}

export default function AccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
            AI Chat
          </h1>
          <p className="text-sm text-gray-500">접근 코드를 입력해 주세요.</p>
        </div>

        <Suspense fallback={null}>
          <AccessForm />
        </Suspense>
      </div>
    </div>
  );
}
