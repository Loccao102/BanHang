import type { Product } from "./products";

export type ChatRole = "user" | "assistant";

export type ChatMessageView = {
  id: string;
  role: ChatRole;
  text: string;
  createdAt?: string;
  products?: Product[];
};

export type ChatConversationSummary = {
  id: string;
  title: string;
  updatedAt: string;
  createdAt: string;
  messageCount: number;
  lastMessage?: string;
};
