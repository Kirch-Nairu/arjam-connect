"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { quickSignIn, readSession, signOut } from "@/lib/auth";
import { createDemoConversation, readState, sendCustomerMessage, subscribeState } from "@/lib/store";
import { Conversation, Platform } from "@/lib/types";

const platformMeta: Record<Platform, { label: string; short: string; subtitle: string }> = {
  facebook: { label: "Facebook Messenger", short: "f", subtitle: "Page messaging simulation" },
  instagram: { label: "Instagram", short: "ig", subtitle: "Professional DM simulation" },
  tiktok: { label: "TikTok", short: "tt", subtitle: "Business messaging simulation" },
};

const scenarios = [
  {
    label: "Pricing",
    title: "Qualify a Bohol inquiry",
    messages: ["Hi, how much is a Bohol package?", "5 pax", "September 20"],
  },
  {
    label: "Group",
    title: "Company outing",
    messages: ["Can you customize a Bohol tour for our company outing?", "14 pax", "September 26"],
  },
  {
    label: "Handoff",
    title: "Request a human agent",
    messages: ["I want to speak with a human agent about accommodation."],
  },
];

const faqExamples = [
  "What travel packages do you offer?",
  "How much is a Bohol package?",
  "Do you offer Panglao tours?",
  "Do you provide airport pickup?",
  "Can you include accommodation?",
  "How do I make a reservation?",
  "What payment methods do you accept?",
  "Can you accommodate a group of 14 pax?",
  "Can I customize a package?",
  "What do you need for a quotation?",
  "What are the package inclusions?",
  "Can I cancel or request a refund?",
  "Can children join the tour?",
  "Can I reschedule my travel date?",
  "I want to speak with a human agent.",
];

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("en-PH", { hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}

export default function DemoTesterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [platform, setPlatform] = useState<Platform>("tiktok");
  const [customerName, setCustomerName] = useState("Demo Guest");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [draft, setDraft] = useState("");
  const [faqOpen, setFaqOpen] = useState(false);

  function refresh() {
    if (!conversationId) return;
    const next = readState().conversations.find((item) => item.id === conversationId) ?? null;
    setConversation(next);
  }

  useEffect(() => {
    let session = readSession();
    if (searchParams.get("auto") === "1") session = quickSignIn("tester");
    if (!session || session.role !== "tester") {
      router.replace("/?role=tester");
      return;
    }
    return subscribeState(refresh);
  }, [conversationId, router, searchParams]);

  const contextSummary = useMemo(() => {
    if (!conversation) return [];
    return [
      ["Status", conversation.status.replaceAll("_", " ")],
      ["Destination", conversation.inquiry.destination ?? "—"],
      ["Travel date", conversation.inquiry.travelDate ?? "—"],
      ["Guests", conversation.inquiry.guests?.toString() ?? "—"],
      ["Handler", conversation.botEnabled ? "Arjam Assistant" : "Human agent"],
    ];
  }, [conversation]);

  function startConversation() {
    const created = createDemoConversation(platform, customerName);
    setConversationId(created.id);
    setConversation(created);
    setDraft("");
  }

  function send(message = draft) {
    const text = message.trim();
    if (!conversationId || !text) return;
    sendCustomerMessage(conversationId, text);
    setDraft("");
    refresh();
  }

  function newConversation() {
    setConversationId(null);
    setConversation(null);
    setDraft("");
  }

  function logout() {
    signOut();
    router.push("/");
  }

  return (
    <main className="tester-shell">
      <header className="tester-topbar">
        <div className="tester-brand"><div className="brand-symbol small">A</div><div><strong>Arjam Connect</strong><span>Customer Simulation</span></div></div>
        <div className="tester-top-actions"><span className="simulation-badge"><i /> Demo adapter active</span><Link className="button secondary compact" href="/arjam?auto=1" target="_blank">Open Arjam Dashboard ↗</Link><button className="icon-button" onClick={logout} title="Sign out">↗</button></div>
      </header>

      <section className="tester-grid">
        <aside className="simulation-panel">
          <div><p className="eyebrow">SIMULATION CONTROL</p><h2>Customer endpoint</h2><p>Create a controlled inquiry that behaves like an inbound social message.</p></div>

          <label className="control-field">Customer name<input value={customerName} onChange={(event) => setCustomerName(event.target.value)} disabled={Boolean(conversation)} placeholder="Demo Guest" /></label>
          <div className="control-field"><span>Channel</span><div className="platform-selector">{(Object.keys(platformMeta) as Platform[]).map((item) => <button key={item} className={platform === item ? `active ${item}` : ""} onClick={() => setPlatform(item)} disabled={Boolean(conversation)}><b>{platformMeta[item].short}</b><span>{platformMeta[item].label}</span></button>)}</div></div>

          {!conversation ? <button className="button primary wide" onClick={startConversation}>Start customer conversation</button> : <button className="button secondary wide" onClick={newConversation}>Start another conversation</button>}

          <div className="transport-card"><div><span>Transport</span><b>Demo Messaging Adapter</b></div><div><span>Persistence</span><b>Prototype Store</b></div><div><span>Dashboard sync</span><b>Live</b></div></div>

          {conversation && <div className="captured-context"><p className="eyebrow">CAPTURED CONTEXT</p>{contextSummary.map(([label, value]) => <div key={label}><span>{label}</span><b>{value}</b></div>)}</div>}
        </aside>

        <section className="device-stage">
          <div className="device-caption"><div><p className="eyebrow">CUSTOMER VIEW</p><h2>{platformMeta[platform].label}</h2></div><span>{platformMeta[platform].subtitle}</span></div>
          <div className={`chat-device ${platform}`}>
            <div className="device-notch" />
            <header className="chat-header"><button aria-label="Back">‹</button><div className="chat-avatar">A</div><div><b>Arjam Travel & Tours</b><span><i /> Online · Travel Assistant</span></div><button aria-label="Info">ⓘ</button></header>
            <div className="chat-body">
              {!conversation ? (
                <div className="chat-empty"><div className="chat-avatar large">A</div><h3>Arjam Travel & Tours</h3><p>Start a conversation from the simulation panel to test the working assistant.</p><span>Messages here are mirrored into the Arjam client dashboard.</span></div>
              ) : (
                <>
                  <div className="chat-date">Today</div>
                  {conversation.messages.map((message) => {
                    if (message.sender === "system") return <div className="chat-system" key={message.id}>{message.text}</div>;
                    const customer = message.sender === "customer";
                    return <div className={`chat-message ${customer ? "customer" : "business"}`} key={message.id}><div>{message.text.split("\n").map((line, index) => <span key={`${message.id}-${index}`}>{line || <br />}</span>)}</div><small>{message.sender === "agent" ? "Arjam Agent" : message.sender === "bot" ? "Arjam Assistant" : "You"} · {formatTime(message.createdAt)}</small></div>;
                  })}
                </>
              )}
            </div>
            {conversation && <div className="chat-composer"><button onClick={() => setFaqOpen((value) => !value)} title="Suggested questions">＋</button><textarea rows={1} value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); send(); } }} placeholder="Message Arjam Travel & Tours…" /><button className="send-round" onClick={() => send()} disabled={!draft.trim()}>➤</button></div>}
          </div>
        </section>

        <aside className="scenario-panel">
          <div><p className="eyebrow">PRESENTATION SCENARIOS</p><h2>Run a reliable demo</h2><p>Use a preset sequence or ask any supported FAQ naturally.</p></div>
          <div className="scenario-list">{scenarios.map((scenario) => <article key={scenario.label}><div><span>{scenario.label}</span><b>{scenario.title}</b></div>{scenario.messages.map((message) => <button key={message} disabled={!conversation} onClick={() => send(message)}>{message}<em>Send →</em></button>)}</article>)}</div>
          <button className="faq-drawer-button" onClick={() => setFaqOpen((value) => !value)}><span><b>FAQ test library</b><small>15 ready-to-send examples</small></span><em>{faqOpen ? "−" : "+"}</em></button>
          {faqOpen && <div className="faq-test-list">{faqExamples.map((example, index) => <button key={example} disabled={!conversation} onClick={() => send(example)}><span>{String(index + 1).padStart(2, "0")}</span>{example}</button>)}</div>}
          <div className="scenario-note"><b>Presentation boundary</b><p>Facebook, Instagram, and TikTok are simulated transport adapters. The chatbot, qualification state, knowledge base, handoff, inbox, and cross-window behavior are functional.</p></div>
        </aside>
      </section>
    </main>
  );
}
