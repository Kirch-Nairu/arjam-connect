"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { quickSignIn, readSession, signOut } from "@/lib/auth";
import { createDemoConversation, sendCustomerMessage, subscribeState } from "@/lib/remote-store";
import { Conversation, Platform } from "@/lib/types";

const platformLabel: Record<Platform, string> = { facebook: "Messenger", instagram: "Instagram", tiktok: "TikTok" };

const starterQuestions = [
  "How much is a Bohol package?",
  "Do you provide airport pickup?",
  "Can I customize a tour?",
  "How do I make a reservation?",
  "What payment methods do you accept?",
  "I want to speak with a human agent.",
];

const moreQuestions = [
  "Do you offer Panglao tours?",
  "Can you include accommodation?",
  "Can you accommodate 14 pax?",
  "What do you need for a quotation?",
  "Can children join the tour?",
  "Can I reschedule my travel date?",
  "Hi, we’re coming from Cebu on September 27. We’re 7 adults, 2 kids, and one senior with limited mobility. We need airport pickup, accommodation, and a Bohol countryside tour. Can you recommend whether 3D2N or 4D3N would be better for us and give an estimated total package cost?",
];

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("en-PH", { hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}

export default function DemoTesterPage() {
  const router = useRouter();
  const [platform, setPlatform] = useState<Platform>("tiktok");
  const [customerName, setCustomerName] = useState("Demo Guest");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [draft, setDraft] = useState("");
  const messageEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let session = readSession();
    const auto = new URLSearchParams(window.location.search).get("auto") === "1";
    if (auto) session = quickSignIn("tester");
    if (!session || session.role !== "tester") {
      router.replace("/?role=tester");
      return;
    }

    return subscribeState((state) => {
      if (!conversationId) return;
      setConversation(state.conversations.find((item) => item.id === conversationId) ?? null);
    });
  }, [conversationId, router]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ block: "end" });
  }, [conversation?.messages.length]);

  const handler = useMemo(() => {
    if (!conversation) return "Arjam Assistant";
    return conversation.botEnabled ? "Arjam Assistant" : "Arjam Agent";
  }, [conversation]);

  async function startConversation() {
    try {
      const created = await createDemoConversation(platform, customerName);
      setConversationId(created.conversation.id);
      setConversation(created.conversation);
      setDraft("");
    } catch {}
  }

  async function send(text = draft) {
    const message = text.trim();
    if (!conversationId || !message) return;
    setDraft("");
    try {
      const state = await sendCustomerMessage(conversationId, message);
      setConversation(state.conversations.find((item) => item.id === conversationId) ?? null);
    } catch {
      setDraft(message);
    }
  }

  function newConversation() {
    setConversationId(null);
    setConversation(null);
    setDraft("");
  }

  function logout() { signOut(); router.push("/"); }

  return (
    <main className="tester-clean">
      <header className="tester-clean-header">
        <div className="workspace-brand"><div className="logo-mark small">A</div><div><strong>Arjam Travel & Tours</strong><span>Customer demo</span></div></div>
        <div><Link className="btn btn-secondary" href="/arjam?auto=1" target="_blank">Open Arjam workspace</Link><button className="text-link" onClick={logout}>Sign out</button></div>
      </header>

      <section className="tester-clean-body">
        <div className="tester-controls-clean">
          <label>Customer name<input value={customerName} onChange={(event) => setCustomerName(event.target.value)} disabled={Boolean(conversation)} /></label>
          <div className="platform-tabs-clean">{(Object.keys(platformLabel) as Platform[]).map((item) => <button key={item} className={platform === item ? "active" : ""} disabled={Boolean(conversation)} onClick={() => setPlatform(item)}>{platformLabel[item]}</button>)}</div>
          {!conversation ? <button className="btn btn-primary" onClick={() => void startConversation()}>Start conversation</button> : <button className="btn btn-secondary" onClick={newConversation}>New conversation</button>}
        </div>

        <section className="customer-chat-card">
          <header className={`customer-chat-header ${platform}`}><div className="customer-chat-avatar">A</div><div><h1>Arjam Travel & Tours</h1><p>{platformLabel[platform]} · {handler}</p></div></header>
          <div className="customer-chat-messages">
            {!conversation ? <div className="chat-placeholder"><div className="customer-chat-avatar large">A</div><h2>Start a conversation</h2><p>Select a channel above, then start the demo.</p></div> : conversation.messages.map((message) => {
              if (message.sender === "system") return <div className="system-line" key={message.id}>{message.text}</div>;
              const customer = message.sender === "customer";
              return <div className={customer ? "customer-message-row mine" : "customer-message-row"} key={message.id}><div>{message.text}</div><small>{customer ? "You" : message.sender === "agent" ? "Arjam Agent" : "Arjam Assistant"} · {formatTime(message.createdAt)}</small></div>;
            })}
            <div ref={messageEndRef} />
          </div>
          <div className="customer-composer-clean">
            <textarea rows={1} value={draft} disabled={!conversation} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(); } }} placeholder={conversation ? "Message Arjam Travel & Tours" : "Start a conversation first"} />
            <button className="btn btn-primary" disabled={!conversation || !draft.trim()} onClick={() => void send()}>Send</button>
          </div>
        </section>

        <section className="prompt-section-clean">
          <div><h2>Try a common inquiry</h2><p>These are only shortcuts. You can type naturally in the chat.</p></div>
          <div className="prompt-chips-clean">{starterQuestions.map((question) => <button key={question} disabled={!conversation} onClick={() => void send(question)}>{question}</button>)}</div>
          <details className="more-prompts-clean"><summary>More test questions</summary><div>{moreQuestions.map((question) => <button key={question} disabled={!conversation} onClick={() => void send(question)}>{question}</button>)}</div></details>
        </section>

        <p className="tester-footnote">The social channel is simulated. The chatbot, inquiry state, handoff, and Arjam inbox are functional.</p>
      </section>
    </main>
  );
}
