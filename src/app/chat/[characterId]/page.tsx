import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db/connect";
import Character from "@/lib/db/models/character";
import ChatInterface from "@/components/chat/ChatInterface";
import type { ICharacter } from "@/types/character";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ characterId: string }> };

export default async function ChatPage({ params }: Props) {
  const { characterId } = await params;

  let character: ICharacter | null = null;

  try {
    await connectDB();
    const doc = await Character.findById(characterId).lean();
    if (doc) character = JSON.parse(JSON.stringify(doc));
  } catch {
    notFound();
  }

  if (!character) notFound();

  return <ChatInterface character={character} />;
}
