"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Conversation, Platform } from "@/lib/types";
import { createDemoConversation, readState, sendCustomerMessage, subscribeState } from "@/lib/store";

const examples = ["How much is a Bohol package?", "Do you provide airport pickup?", "Can I customize a tour?", "How can I make a reservation?", "I want to speak with a human agent."];

export default function DemoTester() {
  const [platform, setPlatform] = useState<Platform>("tiktok");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [draft, setDraft] = useState("");

  function refresh() {
    if (!conversationId) return;
    const c = readState().conversations.find((x) => x.id === conversationId) || null;
    setConversation(c);
  }
  useEffect(() => subscribeState(refresh), [conversationId]);

  function start() {
    const c = createDemoConversation(platform, "Demo Guest");
    setConversationId(c.id); setConversation(c);
  }
  function send() {
    if (!conversationId || !draft.trim()) return;
    sendCustomerMessage(conversationId, draft.trim());
    setDraft(""); refresh();
  }

  return <main className="demo-shell"><header className="demo-top"><div><p className="eyebrow">CUSTOMER SIMULATION</p><h2>Arjam Travel & Tours</h2></div><Link href="/arjam" target="_blank">Open Arjam Dashboard ↗</Link></header><div className="demo-layout"><aside className="sim-panel"><p className="eyebrow">SIMULATION CONTROL</p><h3>Customer channel</h3><p>Select the channel this demo conversation should represent.</p><label>Platform<select value={platform} onChange={(e) => setPlatform(e.target.value as Platform)} disabled={Boolean(conversation)}><option value="facebook">Facebook Messenger</option><option value="instagram">Instagram</option><option value="tiktok">TikTok</option></select></label><button className="primary" onClick={start}>{conversation ? "Conversation active" : "Start new conversation"}</button>{conversation && <button className="secondary" onClick={() => { setConversation(null); setConversationId(null); }}>Start another</button>}<div className="sim-note"><b>Demo adapter</b><p>This simulates social transport. Chatbot processing, conversation state, inquiry extraction and agent takeover are functional.</p></div></aside><section className="phone-wrap"><div className="phone"><div className="phone-head"><div className="avatar">A</div><div><b>Arjam Travel & Tours</b><small><span /> Online · Travel Assistant</small></div></div><div className="phone-messages">{!conversation ? <div className="start-state"><div className="avatar large">A</div><h3>Arjam Travel & Tours</h3><p>Start a simulated conversation to test the inquiry assistant.</p></div> : conversation.messages.map((m) => <div key={m.id} className={`bubble ${m.sender === "customer" ? "customer-bubble" : "business-bubble"}`}><p>{m.text}</p><small>{m.sender === "agent" ? "Arjam Agent" : m.sender === "bot" ? "Arjam Assistant" : "You"}</small></div>)}</div>{conversation && <><div className="quick-prompts">{examples.slice(0,3).map((x) => <button key={x} onClick={() => setDraft(x)}>{x}</button>)}</div><div className="phone-composer"><input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Type your message..."/><button onClick={send} disabled={!draft.trim()}>Send</button></div></>}</div></section><aside className="test-panel"><p className="eyebrow">TRY THESE</p><h3>FAQ coverage</h3><div>{examples.map((x) => <button key={x} onClick={() => setDraft(x)} disabled={!conversation}>{x}</button>)}</div><p className="muted">The engine also recognizes common variants such as “hm”, “pila”, “pax”, “hotel”, “gcash”, “Panglao”, “group”, and “agent”.</p></aside></div></main>;
}
