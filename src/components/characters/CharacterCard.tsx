"use client";

import Link from "next/link";
import { Pencil, Trash2, MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { ICharacter } from "@/types/character";

interface CharacterCardProps {
  character: ICharacter;
  isOwner: boolean;
  onEdit?: (character: ICharacter) => void;
  onDelete?: (id: string) => void;
}

export default function CharacterCard({
  character,
  isOwner,
  onEdit,
  onDelete,
}: CharacterCardProps) {
  return (
    <Card className="group flex flex-col gap-0 overflow-hidden border border-gray-100 shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="flex flex-1 flex-col gap-4 p-5">
        {/* Avatar + name row */}
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 shrink-0">
            <AvatarImage src={character.avatarUrl} alt={character.name} />
            <AvatarFallback className="bg-gray-100 text-gray-600 text-lg font-medium">
              {character.name[0]}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate font-semibold text-gray-900">{character.name}</p>
              {character.createdBy === "admin" && (
                <Badge variant="secondary" className="shrink-0 text-xs">공식</Badge>
              )}
            </div>
            <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">
              {character.description}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-auto flex items-center gap-2">
          <Link href={`/chat/${character._id}`} className="flex-1">
            <Button size="sm" className="w-full gap-1.5">
              <MessageCircle className="h-3.5 w-3.5" />
              대화 시작
            </Button>
          </Link>

          {isOwner && (
            <>
              <Button
                size="sm"
                variant="ghost"
                className="px-2 text-gray-400 hover:text-gray-700"
                onClick={() => onEdit?.(character)}
                aria-label="편집"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="px-2 text-gray-400 hover:text-red-500"
                onClick={() => onDelete?.(character._id)}
                aria-label="삭제"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
