export type Platform = "facebook" | "instagram" | "tiktok";
export type Sender = "customer" | "bot" | "agent";
export type ConversationStatus = "new" | "qualifying" | "qualified" | "needs_human" | "closed";

export interface Message {
  id: string;
  sender: Sender;
  text: string;
  createdAt: string;
}

export interface Inquiry {
  destination?: string;
  travelDate?: string;
  guests?: number;
  adults?: number;
  children?: number;
  origin?: string;
}

export interface Conversation {
  id: string;
  customerName: string;
  platform: Platform;
  status: ConversationStatus;
  botEnabled: boolean;
  needsHuman: boolean;
  intent?: string;
  inquiry: Inquiry;
  messages: Message[];
  updatedAt: string;
}

export interface AppState {
  conversations: Conversation[];
}
