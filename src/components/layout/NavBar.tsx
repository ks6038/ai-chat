"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, User } from "lucide-react";

export default function NavBar() {
  const pathname = usePathname();

  // Access page has its own full-screen layout — no nav needed
  if (pathname === "/access") return null;

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center border-b border-gray-100 bg-white/80 px-4 backdrop-blur-sm sm:px-6">
      <Link
        href="/"
        className="flex items-center gap-2 font-semibold text-gray-900 hover:text-gray-600 transition-colors"
      >
        <MessageSquare className="h-5 w-5" />
        AI Chat
      </Link>

      <nav className="ml-auto flex items-center gap-1">
        <Link
          href="/"
          className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
            pathname === "/" ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:text-gray-900"
          }`}
        >
          홈
        </Link>
        <Link
          href="/characters"
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
            pathname === "/characters" ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <User className="h-3.5 w-3.5" />
          내 캐릭터
        </Link>
      </nav>
    </header>
  );
}
