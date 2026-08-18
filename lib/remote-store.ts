"use client";

import { AppState, ConversationStatus, FaqItem, Platform } from "./types";

const uid = () => `conv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

async function requestState(method: "GET" | "POST", body?: unknown): Promise<AppState> {
  const response = await fetch("/api/state", {
    method,
    cache: "no-store",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) throw new Error(`State API failed with ${response.status}`);
  return response.json() as Promise<AppState>;
}

export function readState() {
  return requestState("GET");
}

export function subscribeState(callback: (state: AppState) => void, intervalMs = 700) {
  let stopped = false;
  let lastSignature = "";

  async function tick() {
    try {
      const state = await readState();
      const signature = JSON.stringify(state);
      if (!stopped && signature !== lastSignature) {
        lastSignature = signature;
        callback(state);
      }
    } catch {
      // Keep retrying. A transient LAN hiccup should not break the presentation.
    }
  }

  void tick();
  const timer = window.setInterval(() => void tick(), intervalMs);
  return () => {
    stopped = true;
    window.clearInterval(timer);
  };
}

async function action(payload: Record<string, unknown>) {
  return requestState("POST", payload);
}

export async function createDemoConversation(platform: Platform, name = "Demo Guest") {
  const conversationId = uid();
  const state = await action({ action: "createConversation", platform, name, conversationId });
  const conversation = state.conversations.find((item) => item.id === conversationId);
  if (!conversation) throw new Error("Conversation was not created");
  return { state, conversation };
}

export function sendCustomerMessage(conversationId: string, text: string) {
  return action({ action: "customerMessage", conversationId, text });
}

export function sendAgentMessage(conversationId: string, text: string) {
  return action({ action: "agentMessage", conversationId, text });
}

export function setAgentTakeover(conversationId: string, active: boolean) {
  return action({ action: "takeover", conversationId, active });
}

export function markConversationRead(conversationId: string) {
  return action({ action: "markRead", conversationId });
}

export function setConversationStatus(conversationId: string, status: ConversationStatus) {
  return action({ action: "setStatus", conversationId, status });
}

export function updateFaq(faqId: string, patch: Partial<FaqItem>) {
  return action({ action: "updateFaq", faqId, patch });
}

export function resetState() {
  return action({ action: "reset" });
}
