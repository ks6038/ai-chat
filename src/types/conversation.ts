export type MessageRole = "user" | "assistant";

export interface IMessage {
  role: MessageRole;
  content: string;
  createdAt: Date;
}

export interface IConversation {
  _id: string;
  characterId: string;
  sessionId: string;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IConversationWithCharacter extends IConversation {
  character: {
    _id: string;
    name: string;
    avatarUrl?: string;
  };
}
