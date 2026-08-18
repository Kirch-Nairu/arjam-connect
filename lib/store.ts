"use client";

import { AppState, Conversation, Platform } from "./types";
import { chatbotReply, extractInquiry } from "./faq";

const STORAGE_KEY = "arjam-connect-state-v1";
const CHANNEL = "arjam-connect-live";

const now = () => new Date().toISOString();
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function seedConversation(id: string, customerName: string, platform: Platform, text: string, status: Conversation["status"]): Conversation {
  return {
    id,
    customerName,
    platform,
    status,
    botEnabled: status !== "needs_human",
    needsHuman: status === "needs_human",
    inquiry: extractInquiry(text),
    messages: [
      { id: uid(), sender: "customer", text, createdAt: now() },
      { id: uid(), sender: "bot", text: chatbotReply(text).text, createdAt: now() }
    ],
    updatedAt: now()
  };
}

export function seedState(): AppState {
  return {
    conversations: [
      seedConversation("seed-1", "Maria Santos", "facebook", "Hi, how much is a Bohol package for 4 pax?", "qualified"),
      seedConversation("seed-2", "James Villanueva", "instagram", "Do you arrange Panglao tours with airport pickup?", "qualifying"),
      seedConversation("seed-3", "Carla Reyes", "tiktok", "Can I customize a tour for our company outing, 14 pax?", "qualified"),
      seedConversation("seed-4", "Anne Cruz", "facebook", "I want to speak with a human agent about accommodation.", "needs_human"),
      seedConversation("seed-5", "Mark Dela Torre", "instagram", "What payment methods do you accept?", "new")
    ]
  };
}

export function readState(): AppState {
  if (typeof window === "undefined") return seedState();
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const state = seedState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return state;
  }
  try { return JSON.parse(raw) as AppState; } catch { return seedState(); }
}

export function writeState(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  try {
    const channel = new BroadcastChannel(CHANNEL);
    channel.postMessage({ type: "state", at: Date.now() });
    channel.close();
  } catch {}
}

export function subscribeState(callback: () => void) {
  const storageHandler = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) callback();
  };
  window.addEventListener("storage", storageHandler);
  let channel: BroadcastChannel | null = null;
  try {
    channel = new BroadcastChannel(CHANNEL);
    channel.onmessage = callback;
  } catch {}
  return () => {
    window.removeEventListener("storage", storageHandler);
    channel?.close();
  };
}

export function resetState() {
  const state = seedState();
  writeState(state);
  return state;
}

export function createDemoConversation(platform: Platform, name = "Demo Guest") {
  const state = readState();
  const conversation: Conversation = {
    id: uid(),
    customerName: name,
    platform,
    status: "new",
    botEnabled: true,
    needsHuman: false,
    inquiry: {},
    messages: [{
      id: uid(), sender: "bot",
      text: "Hello! Welcome to Arjam Travel & Tours. How can I assist you today?",
      createdAt: now()
    }],
    updatedAt: now()
  };
  state.conversations.unshift(conversation);
  writeState(state);
  return conversation;
}

export function sendCustomerMessage(conversationId: string, text: string) {
  const state = readState();
  const conversation = state.conversations.find((c) => c.id === conversationId);
  if (!conversation) return;
  conversation.messages.push({ id: uid(), sender: "customer", text, createdAt: now() });
  conversation.inquiry = { ...conversation.inquiry, ...extractInquiry(text) };
  conversation.updatedAt = now();
  if (conversation.botEnabled && !conversation.needsHuman) {
    const reply = chatbotReply(text);
    conversation.intent = reply.intent;
    if (reply.handoff) {
      conversation.needsHuman = true;
      conversation.botEnabled = false;
      conversation.status = "needs_human";
    } else {
      const enough = Boolean(conversation.inquiry.destination && conversation.inquiry.guests);
      conversation.status = enough ? "qualified" : "qualifying";
    }
    conversation.messages.push({ id: uid(), sender: "bot", text: reply.text, createdAt: now() });
  }
  writeState(state);
}

export function sendAgentMessage(conversationId: string, text: string) {
  const state = readState();
  const conversation = state.conversations.find((c) => c.id === conversationId);
  if (!conversation) return;
  conversation.messages.push({ id: uid(), sender: "agent", text, createdAt: now() });
  conversation.updatedAt = now();
  writeState(state);
}

export function setAgentTakeover(conversationId: string, active: boolean) {
  const state = readState();
  const conversation = state.conversations.find((c) => c.id === conversationId);
  if (!conversation) return;
  conversation.botEnabled = !active;
  conversation.needsHuman = active;
  conversation.status = active ? "needs_human" : "qualifying";
  conversation.updatedAt = now();
  writeState(state);
}
