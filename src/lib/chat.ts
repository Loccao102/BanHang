import type { Product } from "./products";

export type ChatRole = "user" | "assistant";

export type ChatAgentAction =
  | {
      id: string;
      type: "add_to_cart";
      label: string;
      productId: string;
      size: string;
      quantity: number;
      autoExecute?: boolean;
    }
  | {
      id: string;
      type: "add_bundle";
      label: string;
      items: Array<{ productId: string; size: string; quantity: number }>;
      autoExecute?: boolean;
    }
  | {
      id: string;
      type: "apply_coupon";
      label: string;
      code: string;
      autoExecute?: boolean;
    }
  | {
      id: string;
      type: "open_order";
      label: string;
      orderId: string;
      autoExecute?: boolean;
    }
  | {
      id: string;
      type: "open_product";
      label: string;
      productId: string;
      autoExecute?: boolean;
    }
  | {
      id: string;
      type: "open_checkout";
      label: string;
      autoExecute?: boolean;
    };

export type ChatMessageView = {
  id: string;
  role: ChatRole;
  text: string;
  createdAt?: string;
  products?: Product[];
  actions?: ChatAgentAction[];
};

export type ChatConversationSummary = {
  id: string;
  title: string;
  updatedAt: string;
  createdAt: string;
  messageCount: number;
  lastMessage?: string;
};
