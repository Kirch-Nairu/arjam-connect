export type Platform = "facebook" | "instagram" | "tiktok";
export type Sender = "customer" | "bot" | "agent" | "system";
export type ConversationStatus =
  | "new"
  | "qualifying"
  | "qualified"
  | "needs_human"
  | "follow_up"
  | "closed";
export type Priority = "normal" | "high";

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
  seniors?: number;
  origin?: string;
  accommodation?: boolean;
  transport?: boolean;
  accessibilityNeeds?: string;
  requestedDurationOptions?: string[];
  quotationRequested?: boolean;
  recommendationRequested?: boolean;
  contactNumber?: string;
}

export interface Conversation {
  id: string;
  customerName: string;
  customerHandle: string;
  platform: Platform;
  status: ConversationStatus;
  priority: Priority;
  botEnabled: boolean;
  needsHuman: boolean;
  unread: boolean;
  assignedTo?: string;
  intent?: string;
  inquiry: Inquiry;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export interface FaqItem {
  id: string;
  intent: string;
  title: string;
  category: "Packages" | "Booking" | "Transport" | "Policies" | "Support";
  answer: string;
  keywords: string[];
  enabled: boolean;
  handoff?: boolean;
}

export interface ActivityItem {
  id: string;
  text: string;
  createdAt: string;
  tone: "info" | "success" | "attention";
}

export interface AppState {
  version: 2;
  conversations: Conversation[];
  faqItems: FaqItem[];
  activity: ActivityItem[];
}

export interface BotResult {
  text: string;
  intent?: string;
  handoff?: boolean;
  inquiryPatch: Partial<Inquiry>;
  status: ConversationStatus;
}
