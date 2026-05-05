import mongoose, { Schema, Model } from "mongoose";
import type { ICharacter } from "@/types/character";

const CharacterSchema = new Schema<ICharacter>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, required: true, trim: true, maxlength: 500 },
    personality: { type: String, required: true, trim: true, maxlength: 2000 },
    systemPrompt: { type: String, required: true, trim: true, maxlength: 4000 },
    avatarUrl: { type: String, trim: true },
    isPublic: { type: Boolean, default: false },
    createdBy: { type: String, required: true }, // "admin" | sessionId UUID
  },
  { timestamps: true }
);

CharacterSchema.index({ createdBy: 1 });
CharacterSchema.index({ isPublic: 1, createdAt: -1 });

const Character: Model<ICharacter> =
  mongoose.models.Character ??
  mongoose.model<ICharacter>("Character", CharacterSchema);

export default Character;
