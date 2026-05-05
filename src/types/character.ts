export interface ICharacter {
  _id: string;
  name: string;
  description: string;
  personality: string;
  systemPrompt: string;
  avatarUrl?: string;
  isPublic: boolean;
  createdBy: string; // "admin" | sessionId UUID
  createdAt: Date;
  updatedAt: Date;
}

export type CreateCharacterInput = Pick<
  ICharacter,
  "name" | "description" | "personality" | "systemPrompt" | "avatarUrl"
>;

export type UpdateCharacterInput = Partial<CreateCharacterInput>;
