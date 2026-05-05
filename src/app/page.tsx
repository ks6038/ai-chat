import { connectDB } from "@/lib/db/connect";
import Character from "@/lib/db/models/character";
import CharacterGrid from "@/components/characters/CharacterGrid";
import type { ICharacter } from "@/types/character";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let characters: ICharacter[] = [];

  try {
    await connectDB();
    const docs = await Character.find({ isPublic: true })
      .sort({ createdAt: -1 })
      .lean();
    // Serialize ObjectId / Date to plain values for client components
    characters = JSON.parse(JSON.stringify(docs));
  } catch {
    // MONGODB_URI not set yet — show empty grid
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">캐릭터 선택</h1>
        <p className="mt-1 text-sm text-gray-500">
          대화할 캐릭터를 선택하거나 나만의 캐릭터를 만들어 보세요.
        </p>
      </div>
      <CharacterGrid initialCharacters={characters} />
    </div>
  );
}
