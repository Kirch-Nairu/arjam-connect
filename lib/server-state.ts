import { promises as fs } from "fs";
import path from "path";
import { createBotResult, extractInquiry } from "./chatbot";
import { defaultFaqItems } from "./knowledge";
import { AppState, Conversation, ConversationStatus, FaqItem, Platform } from "./types";

const STATE_VERSION = 2 as const;
const DATA_DIR = path.join(process.cwd(), "data");
const STATE_FILE = path.join(DATA_DIR, "arjam-state.json");

const now = () => new Date().toISOString();
const uid = (prefix = "id") => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function addMinutes(iso: string, minutes: number) {
  return new Date(new Date(iso).getTime() + minutes * 60_000).toISOString();
}

function seedConversation(
  id: string,
  customerName: string,
  handle: string,
  platform: Platform,
  text: string,
  status: ConversationStatus,
  minutesAgo: number,
): Conversation {
  const created = addMinutes(now(), -minutesAgo);
  const inquiry = extractInquiry(text);
  const base: Conversation = {
    id,
    customerName,
    customerHandle: handle,
    platform,
    status,
    priority: status === "needs_human" ? "high" : "normal",
    botEnabled: status !== "needs_human" && status !== "closed",
    needsHuman: status === "needs_human",
    unread: status === "needs_human" || status === "new",
    assignedTo: status === "needs_human" ? "Unassigned" : undefined,
    intent: undefined,
    inquiry,
    messages: [],
    createdAt: created,
    updatedAt: created,
  };
  const result = createBotResult(text, base, defaultFaqItems);
  base.intent = result.intent;
  base.messages = [
    { id: uid("msg"), sender: "customer", text, createdAt: created },
    { id: uid("msg"), sender: "bot", text: result.text, createdAt: addMinutes(created, 1) },
  ];
  base.updatedAt = addMinutes(created, 1);
  return base;
}

export function seedServerState(): AppState {
  return {
    version: STATE_VERSION,
    conversations: [
      seedConversation("seed-1", "Maria Santos", "maria.santos", "facebook", "Hi, how much is a Bohol package for 4 pax on September 22?", "qualified", 8),
      seedConversation("seed-2", "James Villanueva", "@jamesgoes", "instagram", "Do you arrange Panglao tours with airport pickup?", "qualifying", 16),
      seedConversation("seed-3", "Carla Reyes", "@carlatravels", "tiktok", "Can I customize a Bohol tour for our company outing, 14 pax on September 26?", "qualified", 28),
      seedConversation("seed-4", "Anne Cruz", "anne.cruz", "facebook", "I want to speak with a human agent about accommodation.", "needs_human", 39),
      seedConversation("seed-5", "Mark Dela Torre", "@markdt", "instagram", "What payment methods do you accept?", "new", 47),
      seedConversation("seed-6", "Paolo Lim", "@paoloexplores", "tiktok", "Do your packages include hotel and airport transfer?", "qualifying", 63),
      seedConversation("seed-7", "Rica Gomez", "rica.gomez", "facebook", "What do you need to prepare a quotation?", "new", 84),
      seedConversation("seed-8", "Loren Yu", "@lorenyu", "instagram", "Can children join the tour? 3 adults and 2 kids", "qualifying", 118),
    ].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    faqItems: defaultFaqItems,
    activity: [],
  };
}

function normalizeState(raw: unknown): AppState {
  if (!raw || typeof raw !== "object" || (raw as AppState).version !== STATE_VERSION) return seedServerState();
  const state = raw as AppState;
  return {
    version: STATE_VERSION,
    conversations: Array.isArray(state.conversations) ? state.conversations : [],
    faqItems: Array.isArray(state.faqItems) && state.faqItems.length ? state.faqItems : defaultFaqItems,
    activity: Array.isArray(state.activity) ? state.activity : [],
  };
}

async function writeState(state: AppState) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2), "utf8");
}

export async function readServerState(): Promise<AppState> {
  try {
    const raw = await fs.readFile(STATE_FILE, "utf8");
    return normalizeState(JSON.parse(raw));
  } catch {
    const seeded = seedServerState();
    await writeState(seeded);
    return seeded;
  }
}

let mutationQueue: Promise<unknown> = Promise.resolve();

async function mutate(mutator: (state: AppState) => void): Promise<AppState> {
  const run = mutationQueue.then(async () => {
    const state = await readServerState();
    mutator(state);
    state.conversations.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    await writeState(state);
    return state;
  });
  mutationQueue = run.catch(() => undefined);
  return run;
}

export async function resetServerState() {
  const state = seedServerState();
  await writeState(state);
  return state;
}

export async function createServerConversation(platform: Platform, name: string, conversationId: string) {
  return mutate((state) => {
    const cleanName = name.trim() || "Demo Guest";
    const handle = platform === "facebook" ? cleanName.toLowerCase().replace(/\s+/g, ".") : `@${cleanName.toLowerCase().replace(/\s+/g, "")}`;
    const conversation: Conversation = {
      id: conversationId,
      customerName: cleanName,
      customerHandle: handle,
      platform,
      status: "new",
      priority: "normal",
      botEnabled: true,
      needsHuman: false,
      unread: true,
      inquiry: {},
      messages: [
        { id: uid("msg"), sender: "bot", text: "Hello! Welcome to Arjam Travel & Tours. How can I assist you today?", createdAt: now() },
      ],
      createdAt: now(),
      updatedAt: now(),
    };
    state.conversations.unshift(conversation);
  });
}

export async function serverCustomerMessage(conversationId: string, text: string) {
  return mutate((state) => {
    const conversation = state.conversations.find((item) => item.id === conversationId);
    if (!conversation) return;
    conversation.messages.push({ id: uid("msg"), sender: "customer", text, createdAt: now() });
    conversation.unread = true;
    conversation.updatedAt = now();

    const result = createBotResult(text, conversation, state.faqItems);
    conversation.inquiry = { ...conversation.inquiry, ...result.inquiryPatch };
    conversation.intent = result.intent ?? conversation.intent;

    if (conversation.botEnabled && !conversation.needsHuman) {
      conversation.status = result.status;
      conversation.messages.push({ id: uid("msg"), sender: "bot", text: result.text, createdAt: now() });
      if (result.handoff) {
        conversation.needsHuman = true;
        conversation.botEnabled = false;
        conversation.priority = "high";
        conversation.assignedTo = "Unassigned";
      }
    }
  });
}

export async function serverAgentMessage(conversationId: string, text: string) {
  return mutate((state) => {
    const conversation = state.conversations.find((item) => item.id === conversationId);
    if (!conversation) return;
    conversation.messages.push({ id: uid("msg"), sender: "agent", text, createdAt: now() });
    conversation.updatedAt = now();
    conversation.unread = false;
    conversation.assignedTo = conversation.assignedTo && conversation.assignedTo !== "Unassigned" ? conversation.assignedTo : "Arjam Agent";
  });
}

export async function serverSetTakeover(conversationId: string, active: boolean) {
  return mutate((state) => {
    const conversation = state.conversations.find((item) => item.id === conversationId);
    if (!conversation) return;
    conversation.botEnabled = !active;
    conversation.needsHuman = active;
    conversation.priority = active ? "high" : "normal";
    conversation.assignedTo = active ? "Arjam Agent" : undefined;
    conversation.status = active ? "needs_human" : Object.keys(conversation.inquiry).length ? "qualifying" : "new";
    conversation.updatedAt = now();
    conversation.messages.push({
      id: uid("msg"), sender: "system",
      text: active ? "Arjam Agent joined the conversation. Automated replies are paused." : "Conversation returned to Arjam Assistant.",
      createdAt: now(),
    });
  });
}

export async function serverMarkRead(conversationId: string) {
  return mutate((state) => {
    const conversation = state.conversations.find((item) => item.id === conversationId);
    if (conversation) conversation.unread = false;
  });
}

export async function serverSetStatus(conversationId: string, status: ConversationStatus) {
  return mutate((state) => {
    const conversation = state.conversations.find((item) => item.id === conversationId);
    if (!conversation) return;
    conversation.status = status;
    conversation.updatedAt = now();
    if (status === "closed") {
      conversation.botEnabled = false;
      conversation.needsHuman = false;
    }
  });
}

export async function serverUpdateFaq(faqId: string, patch: Partial<FaqItem>) {
  return mutate((state) => {
    const faq = state.faqItems.find((item) => item.id === faqId);
    if (faq) Object.assign(faq, patch);
  });
}
