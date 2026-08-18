"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppState, Conversation } from "@/lib/types";
import { readState, resetState, sendAgentMessage, setAgentTakeover, subscribeState } from "@/lib/store";

const platformLabel = { facebook: "Messenger", instagram: "Instagram", tiktok: "TikTok" } as const;

export default function ArjamDashboard() {
  const [state, setState] = useState<AppState>({ conversations: [] });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [view, setView] = useState<"overview" | "inbox" | "knowledge">("overview");

  const refresh = () => setState(readState());
  useEffect(() => {
    refresh();
    return subscribeState(refresh);
  }, []);
  useEffect(() => {
    if (!activeId && state.conversations[0]) setActiveId(state.conversations[0].id);
  }, [state, activeId]);

  const active = state.conversations.find((c) => c.id === activeId) || null;
  const counts = useMemo(() => ({
    total: state.conversations.length,
    qualified: state.conversations.filter((c) => c.status === "qualified").length,
    human: state.conversations.filter((c) => c.needsHuman).length,
    bot: state.conversations.filter((c) => c.botEnabled).length
  }), [state]);

  function send() {
    if (!active || !draft.trim()) return;
    sendAgentMessage(active.id, draft.trim());
    setDraft("");
    refresh();
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div>
          <div className="brand-row"><span className="brand-mini">A</span><div><b>Arjam Connect</b><small>Travel & Tours</small></div></div>
          <nav>
            <button className={view === "overview" ? "nav-active" : ""} onClick={() => setView("overview")}>Overview</button>
            <button className={view === "inbox" ? "nav-active" : ""} onClick={() => setView("inbox")}>Inbox <span>{state.conversations.length}</span></button>
            <button disabled>Customers</button><button disabled>Inquiries</button>
            <button className={view === "knowledge" ? "nav-active" : ""} onClick={() => setView("knowledge")}>Knowledge Base</button>
            <button disabled>Analytics</button><button disabled>Settings</button>
          </nav>
        </div>
        <div className="sidebar-footer"><Link href="/">Switch role</Link><button onClick={() => { setState(resetState()); setActiveId(null); }}>Reset demo data</button></div>
      </aside>

      <section className="workspace">
        <header className="topbar"><div><p className="eyebrow">CLIENT DASHBOARD</p><h2>{view === "inbox" ? "Unified Inbox" : view === "knowledge" ? "Knowledge Base" : "Good evening, Arjam"}</h2></div><div className="status-pill"><span /> Prototype Online</div></header>

        {view === "overview" && <Overview state={state} counts={counts} onInbox={() => setView("inbox")} />}
        {view === "inbox" && <Inbox state={state} active={active} setActiveId={setActiveId} draft={draft} setDraft={setDraft} send={send} refresh={refresh} />}
        {view === "knowledge" && <Knowledge />}
      </section>
    </main>
  );
}

function Overview({ state, counts, onInbox }: { state: AppState; counts: { total: number; qualified: number; human: number; bot: number }; onInbox: () => void }) {
  const platforms = ["facebook", "instagram", "tiktok"] as const;
  return <div className="page-content">
    <div className="metrics">
      <Metric label="Total inquiries" value={counts.total} detail="Demo dataset + live tests" />
      <Metric label="Handled by chatbot" value={counts.bot} detail="Automation currently active" />
      <Metric label="Qualified leads" value={counts.qualified} detail="Structured travel interest" />
      <Metric label="Needs human" value={counts.human} detail="Agent attention requested" />
    </div>
    <div className="overview-grid">
      <article className="panel"><div className="panel-head"><div><p className="eyebrow">CHANNEL MIX</p><h3>Inquiries by platform</h3></div></div>
        {platforms.map((p) => { const count = state.conversations.filter((c) => c.platform === p).length; const pct = state.conversations.length ? Math.round((count / state.conversations.length) * 100) : 0; return <div className="channel-row" key={p}><div><b>{platformLabel[p]}</b><small>{count} conversations</small></div><div className="bar"><i style={{ width: `${pct}%` }} /></div><strong>{pct}%</strong></div>; })}
      </article>
      <article className="panel"><div className="panel-head"><div><p className="eyebrow">RECENT ACTIVITY</p><h3>Latest inquiries</h3></div><button onClick={onInbox}>Open inbox</button></div>
        <div className="activity-list">{state.conversations.slice(0,5).map((c) => <div key={c.id}><span className={`platform-dot ${c.platform}`} /><div><b>{c.customerName}</b><small>{platformLabel[c.platform]} · {c.messages.at(-1)?.text}</small></div><em>{c.status.replace("_", " ")}</em></div>)}</div>
      </article>
    </div>
    <article className="panel demo-callout"><div><p className="eyebrow">LIVE DEMONSTRATION</p><h3>Open the Demo Tester in another window</h3><p>Messages sent from the tester appear here through the same normalized conversation workflow used by the prototype.</p></div><Link href="/demo" target="_blank">Open Demo Tester ↗</Link></article>
  </div>;
}

function Metric({ label, value, detail }: { label: string; value: number; detail: string }) { return <article className="metric"><small>{label}</small><strong>{value}</strong><p>{detail}</p></article>; }

function Inbox({ state, active, setActiveId, draft, setDraft, send, refresh }: { state: AppState; active: Conversation | null; setActiveId: (id: string) => void; draft: string; setDraft: (v:string) => void; send: () => void; refresh: () => void }) {
  return <div className="inbox-layout">
    <div className="conversation-list"><div className="list-head"><b>Conversations</b><small>{state.conversations.length} total</small></div>{state.conversations.map((c) => <button key={c.id} className={c.id === active?.id ? "conversation active" : "conversation"} onClick={() => setActiveId(c.id)}><span className={`platform-badge ${c.platform}`}>{c.platform === "facebook" ? "f" : c.platform === "instagram" ? "◎" : "♪"}</span><span><b>{c.customerName}</b><small>{c.messages.at(-1)?.text}</small></span>{c.needsHuman && <em>Human</em>}</button>)}</div>
    <div className="chat-panel">{active ? <><div className="chat-head"><div><b>{active.customerName}</b><small>{platformLabel[active.platform]} · {active.status.replace("_", " ")}</small></div><button className={active.botEnabled ? "takeover" : "return-ai"} onClick={() => { setAgentTakeover(active.id, active.botEnabled); refresh(); }}>{active.botEnabled ? "Take over" : "Return to AI"}</button></div><div className="messages">{active.messages.map((m) => <div key={m.id} className={`message ${m.sender}`}><small>{m.sender === "customer" ? active.customerName : m.sender === "bot" ? "Arjam Assistant" : "Arjam Agent"}</small><p>{m.text}</p></div>)}</div><div className="composer"><input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder={active.botEnabled ? "Take over to reply as an agent…" : "Reply as Arjam Agent…"} disabled={active.botEnabled}/><button onClick={send} disabled={active.botEnabled || !draft.trim()}>Send</button></div></> : <div className="empty">Select a conversation</div>}</div>
    <div className="details-panel">{active && <><p className="eyebrow">INQUIRY DETAILS</p><h3>{active.customerName}</h3><Detail label="Platform" value={platformLabel[active.platform]} /><Detail label="Status" value={active.status.replace("_", " ")} /><Detail label="Destination" value={active.inquiry.destination || "Not captured"} /><Detail label="Guests" value={active.inquiry.guests?.toString() || "Not captured"} /><Detail label="Origin" value={active.inquiry.origin || "Not captured"} /><Detail label="Automation" value={active.botEnabled ? "AI assistant active" : "Human agent active"} /></>}</div>
  </div>;
}
function Detail({ label, value }: { label: string; value: string }) { return <div className="detail"><small>{label}</small><b>{value}</b></div>; }

function Knowledge() {
  const items = ["Travel packages", "Package pricing", "Bohol tours", "Panglao tours", "Airport / seaport pickup", "Accommodation", "Reservation process", "Payment methods", "Group bookings", "Human assistance", "Customized packages", "Destinations", "Children", "Travel date changes", "Quotation requirements"];
  return <div className="page-content"><article className="panel"><div className="panel-head"><div><p className="eyebrow">FAQ ENGINE</p><h3>15 supported inquiry categories</h3></div><span className="status-pill"><span /> Enabled</span></div><div className="faq-grid">{items.map((x, i) => <div key={x}><span>{String(i+1).padStart(2,"0")}</span><b>{x}</b><small>Enabled</small></div>)}</div></article><article className="panel"><p className="eyebrow">PROTOTYPE POLICY</p><h3>Controlled answers first</h3><p className="muted">The prototype intentionally avoids inventing package prices, payment account details, booking confirmations, or availability. Those business facts can be replaced with Arjam-approved information before production.</p></article></div>;
}
