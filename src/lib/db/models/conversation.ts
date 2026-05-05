import mongoose, { Schema, Model } from "mongoose";
import type { IConversation } from "@/types/conversation";

const MessageSchema = new Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ConversationSchema = new Schema<IConversation>(
  {
    characterId: {
      type: Schema.Types.ObjectId as unknown as typeof String,
      ref: "Character",
      required: true,
    },
    sessionId: { type: String, required: true },
    messages: { type: [MessageSchema], default: [] },
  },
  { timestamps: true }
);

ConversationSchema.index({ sessionId: 1, updatedAt: -1 });
ConversationSchema.index({ sessionId: 1, characterId: 1 });

const Conversation: Model<IConversation> =
  mongoose.models.Conversation ??
  mongoose.model<IConversation>("Conversation", ConversationSchema);

export default Conversation;
