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
      type: "open_try_on";
      label: string;
      productIds: string[];
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
  imageUrl?: string;
  createdAt?: string;
  products?: Product[];
  actions?: ChatAgentAction[];
  /**
   * Internal shopping context snapshot used to preserve explicit constraints across
   * guest-chat turns. Logged-in conversations persist the same state server-side.
   */
  shoppingState?: unknown;
};

export type ChatConversationSummary = {
  id: string;
  title: string;
  updatedAt: string;
  createdAt: string;
  messageCount: number;
  lastMessage?: string;
};
