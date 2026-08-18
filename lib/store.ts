"use client";

import { createBotResult, extractInquiry } from "./chatbot";
import { defaultFaqItems } from "./knowledge";
import { AppState, Conversation, ConversationStatus, FaqItem, Platform } from "./types";

const STORAGE_KEY = "arjam-connect-state-v2";
const CHANNEL_NAME = "arjam-connect-live-v2";
const STATE_VERSION = 2 as const;

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
  const botResult = createBotResult(text, base, defaultFaqItems);
  base.intent = botResult.intent;
  base.messages = [
    { id: uid("msg"), sender: "customer", text, createdAt: created },
    { id: uid("msg"), sender: "bot", text: botResult.text, createdAt: addMinutes(created, 1) },
  ];
  base.updatedAt = addMinutes(created, 1);
  if (status === "needs_human") {
    base.botEnabled = false;
    base.needsHuman = true;
    base.priority = "high";
  }
  return base;
}

export function seedState(): AppState {
  const conversations = [
    seedConversation("seed-1", "Maria Santos", "maria.santos", "facebook", "Hi, how much is a Bohol package for 4 pax on September 22?", "qualified", 8),
    seedConversation("seed-2", "James Villanueva", "@jamesgoes", "instagram", "Do you arrange Panglao tours with airport pickup?", "qualifying", 16),
    seedConversation("seed-3", "Carla Reyes", "@carlatravels", "tiktok", "Can I customize a Bohol tour for our company outing, 14 pax on September 26?", "qualified", 28),
    seedConversation("seed-4", "Anne Cruz", "anne.cruz", "facebook", "I want to speak with a human agent about accommodation.", "needs_human", 39),
    seedConversation("seed-5", "Mark Dela Torre", "@markdt", "instagram", "What payment methods do you accept?", "new", 47),
    seedConversation("seed-6", "Paolo Lim", "@paoloexplores", "tiktok", "Do your packages include hotel and airport transfer?", "qualifying", 63),
    seedConversation("seed-7", "Rica Gomez", "rica.gomez", "facebook", "What do you need to prepare a quotation?", "new", 84),
    seedConversation("seed-8", "Loren Yu", "@lorenyu", "instagram", "Can children join the tour? 3 adults and 2 kids", "qualifying", 118),
  ].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return {
    version: STATE_VERSION,
    conversations,
    faqItems: defaultFaqItems,
    activity: [
      { id: uid("act"), text: "Demo environment initialized", createdAt: now(), tone: "info" },
      { id: uid("act"), text: "18 FAQ categories loaded", createdAt: now(), tone: "success" },
    ],
  };
}

function normalizeState(raw: unknown): AppState {
  if (!raw || typeof raw !== "object" || (raw as AppState).version !== STATE_VERSION) return seedState();
  const state = raw as AppState;
  return {
    version: STATE_VERSION,
    conversations: Array.isArray(state.conversations) ? state.conversations : [],
    faqItems: Array.isArray(state.faqItems) && state.faqItems.length ? state.faqItems : defaultFaqItems,
    activity: Array.isArray(state.activity) ? state.activity : [],
  };
}

export function readState(): AppState {
  if (typeof window === "undefined") return seedState();
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seeded = seedState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
  try {
    return normalizeState(JSON.parse(raw));
  } catch {
    const seeded = seedState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
}

function broadcast() {
  try {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage({ type: "state-changed", at: Date.now() });
    channel.close();
  } catch {
    // BroadcastChannel is optional; the storage event still syncs separate tabs.
  }
}

export function writeState(state: AppState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  broadcast();
}

export function subscribeState(callback: () => void) {
  const storageHandler = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) callback();
  };
  window.addEventListener("storage", storageHandler);

  let channel: BroadcastChannel | null = null;
  try {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = callback;
  } catch {
    channel = null;
  }

  return () => {
    window.removeEventListener("storage", storageHandler);
    channel?.close();
  };
}

function mutate(mutator: (state: AppState) => void) {
  const state = readState();
  mutator(state);
  state.conversations.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  writeState(state);
  return state;
}

function addActivity(state: AppState, text: string, tone: "info" | "success" | "attention" = "info") {
  state.activity.unshift({ id: uid("act"), text, createdAt: now(), tone });
  state.activity = state.activity.slice(0, 20);
}

export function resetState() {
  const state = seedState();
  writeState(state);
  return state;
}

export function createDemoConversation(platform: Platform, name = "Demo Guest") {
  const state = readState();
  const handle = platform === "facebook" ? name.toLowerCase().replace(/\s+/g, ".") : `@${name.toLowerCase().replace(/\s+/g, "")}`;
  const conversation: Conversation = {
    id: uid("conv"),
    customerName: name.trim() || "Demo Guest",
    customerHandle: handle,
    platform,
    status: "new",
    priority: "normal",
    botEnabled: true,
    needsHuman: false,
    unread: true,
    inquiry: {},
    messages: [
      {
        id: uid("msg"),
        sender: "bot",
        text: "Hello! Welcome to Arjam Travel & Tours. How can I assist you today?",
        createdAt: now(),
      },
    ],
    createdAt: now(),
    updatedAt: now(),
  };
  state.conversations.unshift(conversation);
  addActivity(state, `New ${platform} demo conversation from ${conversation.customerName}`, "attention");
  writeState(state);
  return conversation;
}

export function sendCustomerMessage(conversationId: string, text: string) {
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
        addActivity(state, `${conversation.customerName} requested human assistance`, "attention");
      } else if (result.status === "qualified") {
        addActivity(state, `${conversation.customerName} became a qualified inquiry`, "success");
      }
    }
  });
}

export function sendAgentMessage(conversationId: string, text: string) {
  return mutate((state) => {
    const conversation = state.conversations.find((item) => item.id === conversationId);
    if (!conversation) return;
    conversation.messages.push({ id: uid("msg"), sender: "agent", text, createdAt: now() });
    conversation.updatedAt = now();
    conversation.unread = false;
    conversation.assignedTo = conversation.assignedTo && conversation.assignedTo !== "Unassigned" ? conversation.assignedTo : "Arjam Agent";
  });
}

export function setAgentTakeover(conversationId: string, active: boolean) {
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
      id: uid("msg"),
      sender: "system",
      text: active ? "Arjam Agent joined the conversation. Automated replies are paused." : "Conversation returned to Arjam Assistant.",
      createdAt: now(),
    });
    addActivity(state, `${conversation.customerName}: ${active ? "agent takeover" : "returned to automation"}`, active ? "attention" : "info");
  });
}

export function markConversationRead(conversationId: string) {
  return mutate((state) => {
    const conversation = state.conversations.find((item) => item.id === conversationId);
    if (conversation) conversation.unread = false;
  });
}

export function setConversationStatus(conversationId: string, status: ConversationStatus) {
  return mutate((state) => {
    const conversation = state.conversations.find((item) => item.id === conversationId);
    if (!conversation) return;
    conversation.status = status;
    conversation.updatedAt = now();
    if (status === "closed") {
      conversation.botEnabled = false;
      conversation.needsHuman = false;
    }
    addActivity(state, `${conversation.customerName} moved to ${status.replaceAll("_", " ")}`, "info");
  });
}

export function updateFaq(faqId: string, patch: Partial<FaqItem>) {
  return mutate((state) => {
    const faq = state.faqItems.find((item) => item.id === faqId);
    if (!faq) return;
    Object.assign(faq, patch);
    addActivity(state, `Knowledge Base updated: ${faq.title}`, "success");
  });
}
