"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { quickSignIn, readSession, signOut } from "@/lib/auth";
import {
  markConversationRead,
  readState,
  resetState,
  sendAgentMessage,
  setAgentTakeover,
  setConversationStatus,
  subscribeState,
  updateFaq,
} from "@/lib/store";
import { AppState, Conversation, ConversationStatus, FaqItem, Platform } from "@/lib/types";

type View = "overview" | "inbox" | "customers" | "knowledge" | "analytics" | "settings";
type InboxFilter = "all" | "unread" | "human" | "qualified";

const platformMeta: Record<Platform, { label: string; short: string }> = {
  facebook: { label: "Messenger", short: "f" },
  instagram: { label: "Instagram", short: "ig" },
  tiktok: { label: "TikTok", short: "tt" },
};

const statusLabel: Record<ConversationStatus, string> = {
  new: "New",
  qualifying: "Qualifying",
  qualified: "Qualified",
  needs_human: "Needs human",
  follow_up: "Follow up",
  closed: "Closed",
};

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("en-PH", { hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}

function formatDate(iso?: string) {
  if (!iso) return "Not captured";
  const date = iso.length === 10 ? new Date(`${iso}T00:00:00`) : new Date(iso);
  return new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function pct(part: number, total: number) {
  return total ? Math.round((part / total) * 100) : 0;
}

export default function ArjamDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<AppState>(() => ({ version: 2, conversations: [], faqItems: [], activity: [] }));
  const [view, setView] = useState<View>("overview");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<InboxFilter>("all");
  const [draft, setDraft] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  function refresh() {
    setState(readState());
  }

  useEffect(() => {
    let session = readSession();
    if (searchParams.get("auto") === "1") session = quickSignIn("arjam");
    if (!session || session.role !== "arjam") {
      router.replace("/?role=arjam");
      return;
    }
    refresh();
    return subscribeState(refresh);
  }, [router, searchParams]);

  useEffect(() => {
    if (!activeId && state.conversations[0]) setActiveId(state.conversations[0].id);
  }, [state.conversations, activeId]);

  const active = state.conversations.find((conversation) => conversation.id === activeId) ?? null;
  const metrics = useMemo(() => {
    const open = state.conversations.filter((item) => item.status !== "closed");
    return {
      total: state.conversations.length,
      open: open.length,
      qualified: state.conversations.filter((item) => item.status === "qualified").length,
      human: state.conversations.filter((item) => item.needsHuman).length,
      automated: state.conversations.filter((item) => item.botEnabled && item.status !== "closed").length,
      unread: state.conversations.filter((item) => item.unread).length,
    };
  }, [state.conversations]);

  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase();
    return state.conversations.filter((conversation) => {
      const filterMatch =
        filter === "all" ||
        (filter === "unread" && conversation.unread) ||
        (filter === "human" && conversation.needsHuman) ||
        (filter === "qualified" && conversation.status === "qualified");
      if (!filterMatch) return false;
      if (!query) return true;
      const haystack = [
        conversation.customerName,
        conversation.customerHandle,
        platformMeta[conversation.platform].label,
        conversation.inquiry.destination,
        conversation.intent,
        conversation.messages.at(-1)?.text,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [filter, search, state.conversations]);

  function openConversation(id: string) {
    setActiveId(id);
    markConversationRead(id);
    setState(readState());
  }

  function send() {
    if (!active || !draft.trim() || active.botEnabled) return;
    setState(sendAgentMessage(active.id, draft.trim()));
    setDraft("");
  }

  function navigate(next: View) {
    setView(next);
    setMobileNavOpen(false);
  }

  function logout() {
    signOut();
    router.push("/");
  }

  return (
    <main className="admin-shell">
      <aside className={`admin-sidebar ${mobileNavOpen ? "open" : ""}`}>
        <div>
          <div className="admin-brand">
            <div className="brand-symbol small">A</div>
            <div><strong>Arjam Connect</strong><span>Travel & Tours</span></div>
          </div>
          <div className="environment-pill"><i /> Presentation prototype</div>
          <nav className="admin-nav" aria-label="Arjam navigation">
            <NavButton active={view === "overview"} label="Overview" meta="01" onClick={() => navigate("overview")} />
            <NavButton active={view === "inbox"} label="Unified Inbox" meta={String(metrics.unread)} onClick={() => navigate("inbox")} emphasize={metrics.unread > 0} />
            <NavButton active={view === "customers"} label="Customers" meta={String(metrics.total)} onClick={() => navigate("customers")} />
            <NavButton active={view === "knowledge"} label="Knowledge Base" meta={String(state.faqItems.filter((item) => item.enabled).length)} onClick={() => navigate("knowledge")} />
            <NavButton active={view === "analytics"} label="Analytics" meta="↗" onClick={() => navigate("analytics")} />
            <NavButton active={view === "settings"} label="System" meta="••" onClick={() => navigate("settings")} />
          </nav>
        </div>
        <div className="sidebar-account">
          <div className="account-avatar">AT</div>
          <div><b>Arjam Workspace</b><small>Client administrator</small></div>
          <button onClick={logout} title="Sign out">↗</button>
        </div>
      </aside>

      <section className="admin-workspace">
        <header className="admin-topbar">
          <div className="topbar-left">
            <button className="mobile-menu" onClick={() => setMobileNavOpen((value) => !value)} aria-label="Toggle navigation">☰</button>
            <div>
              <p className="eyebrow">ARJAM OPERATIONS</p>
              <h1>{viewTitle(view)}</h1>
            </div>
          </div>
          <div className="topbar-actions">
            <div className="live-indicator"><i /> Live demo sync</div>
            <Link className="button secondary compact" href="/demo?auto=1" target="_blank">Open Tester ↗</Link>
          </div>
        </header>

        {view === "overview" && <Overview state={state} metrics={metrics} onOpenInbox={() => navigate("inbox")} />}
        {view === "inbox" && (
          <Inbox
            conversations={filteredConversations}
            allCount={state.conversations.length}
            active={active}
            activeId={activeId}
            search={search}
            filter={filter}
            draft={draft}
            onSearch={setSearch}
            onFilter={setFilter}
            onSelect={openConversation}
            onDraft={setDraft}
            onSend={send}
            onTakeover={(id, activeTakeover) => setState(setAgentTakeover(id, activeTakeover))}
            onStatus={(id, status) => setState(setConversationStatus(id, status))}
          />
        )}
        {view === "customers" && <Customers conversations={state.conversations} onOpen={(id) => { openConversation(id); navigate("inbox"); }} />}
        {view === "knowledge" && <Knowledge items={state.faqItems} onUpdate={(id, patch) => setState(updateFaq(id, patch))} />}
        {view === "analytics" && <Analytics conversations={state.conversations} />}
        {view === "settings" && <SystemView state={state} onReset={() => { setState(resetState()); setActiveId(null); }} />}
      </section>
    </main>
  );
}

function NavButton({ active, label, meta, onClick, emphasize = false }: { active: boolean; label: string; meta: string; onClick: () => void; emphasize?: boolean }) {
  return <button className={active ? "active" : ""} onClick={onClick}><span>{label}</span><em className={emphasize ? "alert" : ""}>{meta}</em></button>;
}

function viewTitle(view: View) {
  return {
    overview: "Operations Overview",
    inbox: "Unified Inbox",
    customers: "Customer Directory",
    knowledge: "Knowledge Base",
    analytics: "Inquiry Analytics",
    settings: "Prototype System",
  }[view];
}

function Overview({ state, metrics, onOpenInbox }: { state: AppState; metrics: { total: number; open: number; qualified: number; human: number; automated: number; unread: number }; onOpenInbox: () => void }) {
  const platformCounts = (Object.keys(platformMeta) as Platform[]).map((platform) => ({
    platform,
    count: state.conversations.filter((item) => item.platform === platform).length,
  }));
  const resolvedByBot = state.conversations.filter((item) => item.botEnabled && !item.needsHuman).length;

  return (
    <div className="workspace-content overview-page">
      <section className="welcome-strip">
        <div>
          <p className="eyebrow">TODAY'S INQUIRY PICTURE</p>
          <h2>Customer conversations, without platform switching.</h2>
          <p>This workspace normalizes the demo channels into one operational queue and one customer record flow.</p>
        </div>
        <div className="welcome-status"><span>System state</span><b><i /> Operational</b><small>Demo adapters ready</small></div>
      </section>

      <section className="metric-grid">
        <Metric label="Total inquiries" value={metrics.total} note={`${metrics.unread} unread`} />
        <Metric label="Qualified leads" value={metrics.qualified} note={`${pct(metrics.qualified, metrics.total)}% of conversations`} accent />
        <Metric label="Automation active" value={metrics.automated} note={`${pct(resolvedByBot, metrics.total)}% bot-assisted`} />
        <Metric label="Needs human" value={metrics.human} note="Requires agent attention" warning={metrics.human > 0} />
      </section>

      <section className="overview-two-col">
        <article className="card channel-card">
          <CardHeader eyebrow="CHANNEL DISTRIBUTION" title="Inquiry sources" action={<button onClick={onOpenInbox}>Open inbox</button>} />
          <div className="channel-stack">
            {platformCounts.map(({ platform, count }) => (
              <div className="channel-stat" key={platform}>
                <div className={`platform-icon ${platform}`}>{platformMeta[platform].short}</div>
                <div className="channel-stat-copy"><b>{platformMeta[platform].label}</b><small>{count} conversations</small></div>
                <div className="mini-track"><i style={{ width: `${pct(count, state.conversations.length)}%` }} /></div>
                <strong>{pct(count, state.conversations.length)}%</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="card activity-card">
          <CardHeader eyebrow="LIVE ACTIVITY" title="What changed recently" />
          <div className="activity-feed">
            {state.activity.slice(0, 6).map((item) => (
              <div className="activity-item" key={item.id}>
                <i className={item.tone} />
                <div><b>{item.text}</b><small>{formatTime(item.createdAt)}</small></div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="card demo-banner">
        <div>
          <p className="eyebrow">CLIENT DEMONSTRATION</p>
          <h3>Run both sides of the workflow at once.</h3>
          <p>Open the Demo Tester in another window, send an inquiry, then watch it enter this workspace and move through chatbot qualification or human takeover.</p>
        </div>
        <Link className="button primary" href="/demo?auto=1" target="_blank">Launch Demo Tester ↗</Link>
      </section>
    </div>
  );
}

function Metric({ label, value, note, accent = false, warning = false }: { label: string; value: number; note: string; accent?: boolean; warning?: boolean }) {
  return <article className={`metric-card ${accent ? "accent" : ""} ${warning ? "warning" : ""}`}><div><span>{label}</span><b>{value}</b></div><small>{note}</small></article>;
}

function CardHeader({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) {
  return <div className="card-header"><div><p className="eyebrow">{eyebrow}</p><h3>{title}</h3></div>{action}</div>;
}

function Inbox({ conversations, allCount, active, activeId, search, filter, draft, onSearch, onFilter, onSelect, onDraft, onSend, onTakeover, onStatus }: {
  conversations: Conversation[];
  allCount: number;
  active: Conversation | null;
  activeId: string | null;
  search: string;
  filter: InboxFilter;
  draft: string;
  onSearch: (value: string) => void;
  onFilter: (value: InboxFilter) => void;
  onSelect: (id: string) => void;
  onDraft: (value: string) => void;
  onSend: () => void;
  onTakeover: (id: string, active: boolean) => void;
  onStatus: (id: string, status: ConversationStatus) => void;
}) {
  return (
    <div className="inbox-shell">
      <aside className="inbox-list-panel">
        <div className="inbox-tools">
          <label className="search-box"><span>⌕</span><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search conversations" /></label>
          <div className="filter-row">
            {(["all", "unread", "human", "qualified"] as InboxFilter[]).map((item) => (
              <button key={item} className={filter === item ? "active" : ""} onClick={() => onFilter(item)}>{item === "human" ? "Needs human" : item.charAt(0).toUpperCase() + item.slice(1)}</button>
            ))}
          </div>
        </div>
        <div className="conversation-count"><span>{conversations.length} shown</span><small>{allCount} total</small></div>
        <div className="conversation-list">
          {conversations.length === 0 && <div className="empty-list"><b>No conversations found</b><span>Try another search or filter.</span></div>}
          {conversations.map((conversation) => {
            const last = conversation.messages.at(-1);
            return (
              <button key={conversation.id} className={`conversation-row ${activeId === conversation.id ? "active" : ""}`} onClick={() => onSelect(conversation.id)}>
                <div className={`platform-icon ${conversation.platform}`}>{platformMeta[conversation.platform].short}</div>
                <div className="conversation-copy">
                  <div><b>{conversation.customerName}</b><time>{formatTime(conversation.updatedAt)}</time></div>
                  <p>{last?.text}</p>
                  <div className="conversation-tags">
                    <span className={`status-tag ${conversation.status}`}>{statusLabel[conversation.status]}</span>
                    {conversation.inquiry.destination && <span>{conversation.inquiry.destination}</span>}
                  </div>
                </div>
                {conversation.unread && <i className="unread-dot" />}
              </button>
            );
          })}
        </div>
      </aside>

      <section className="conversation-panel">
        {!active ? (
          <div className="conversation-empty"><div>A</div><h3>Select a conversation</h3><p>Customer history and controls will appear here.</p></div>
        ) : (
          <>
            <header className="conversation-header">
              <div className="customer-heading">
                <div className={`platform-icon ${active.platform}`}>{platformMeta[active.platform].short}</div>
                <div><h3>{active.customerName}</h3><p>{platformMeta[active.platform].label} · {active.customerHandle}</p></div>
              </div>
              <div className="conversation-actions">
                <span className={`status-tag ${active.status}`}>{statusLabel[active.status]}</span>
                <button className={active.botEnabled ? "button secondary compact" : "button primary compact"} onClick={() => onTakeover(active.id, active.botEnabled)}>
                  {active.botEnabled ? "Take over" : "Return to bot"}
                </button>
              </div>
            </header>

            <div className="automation-strip">
              <div><i className={active.botEnabled ? "online" : "paused"} /><span>{active.botEnabled ? "Arjam Assistant is handling this conversation" : "Human agent mode · automated replies paused"}</span></div>
              <small>{active.assignedTo ? `Assigned to ${active.assignedTo}` : "No manual assignee"}</small>
            </div>

            <div className="message-stream">
              <div className="timeline-date">Conversation history</div>
              {active.messages.map((message) => {
                if (message.sender === "system") return <div className="system-message" key={message.id}><span>{message.text}</span><time>{formatTime(message.createdAt)}</time></div>;
                const outgoing = message.sender !== "customer";
                return (
                  <div className={`message-row ${outgoing ? "outgoing" : "incoming"}`} key={message.id}>
                    <div className="message-meta"><b>{message.sender === "customer" ? active.customerName : message.sender === "bot" ? "Arjam Assistant" : "Arjam Agent"}</b><time>{formatTime(message.createdAt)}</time></div>
                    <div className={`message-bubble ${message.sender}`}>{message.text.split("\n").map((line, index) => <span key={`${message.id}-${index}`}>{line || <br />}</span>)}</div>
                  </div>
                );
              })}
            </div>

            <div className="agent-composer">
              <textarea value={draft} onChange={(event) => onDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); onSend(); } }} disabled={active.botEnabled} placeholder={active.botEnabled ? "Take over the conversation to reply manually" : "Reply as Arjam Agent…"} />
              <div><span>{active.botEnabled ? "Automation active" : "Enter to send · Shift+Enter for new line"}</span><button className="button primary compact" onClick={onSend} disabled={active.botEnabled || !draft.trim()}>Send reply</button></div>
            </div>
          </>
        )}
      </section>

      <aside className="customer-context">
        {active ? (
          <>
            <div className="context-profile"><div className="profile-avatar">{active.customerName.split(" ").map((part) => part[0]).join("").slice(0, 2)}</div><h3>{active.customerName}</h3><p>{active.customerHandle}</p></div>
            <section className="context-section"><p className="eyebrow">INQUIRY SUMMARY</p><Context label="Destination" value={active.inquiry.destination ?? "Not captured"} /><Context label="Travel date" value={formatDate(active.inquiry.travelDate)} /><Context label="Guests" value={active.inquiry.guests ? `${active.inquiry.guests} guest${active.inquiry.guests === 1 ? "" : "s"}` : "Not captured"} /><Context label="Origin" value={active.inquiry.origin ?? "Not captured"} /><Context label="Accommodation" value={active.inquiry.accommodation ? "Requested" : "Not specified"} /><Context label="Transport" value={active.inquiry.transport ? "Requested" : "Not specified"} /></section>
            <section className="context-section"><p className="eyebrow">WORKFLOW</p><label className="status-select">Status<select value={active.status} onChange={(event) => onStatus(active.id, event.target.value as ConversationStatus)}><option value="new">New</option><option value="qualifying">Qualifying</option><option value="qualified">Qualified</option><option value="needs_human">Needs human</option><option value="follow_up">Follow up</option><option value="closed">Closed</option></select></label><Context label="Last intent" value={active.intent?.replaceAll("_", " ") ?? "Not classified"} /><Context label="Automation" value={active.botEnabled ? "Active" : "Paused"} /></section>
          </>
        ) : <div className="context-empty">Customer context will appear here.</div>}
      </aside>
    </div>
  );
}

function Context({ label, value }: { label: string; value: string }) {
  return <div className="context-row"><span>{label}</span><b>{value}</b></div>;
}

function Customers({ conversations, onOpen }: { conversations: Conversation[]; onOpen: (id: string) => void }) {
  return (
    <div className="workspace-content">
      <section className="card table-card">
        <CardHeader eyebrow="CUSTOMER DIRECTORY" title={`${conversations.length} conversation-linked customers`} />
        <div className="customer-table-wrap">
          <table className="customer-table">
            <thead><tr><th>Customer</th><th>Channel</th><th>Destination</th><th>Status</th><th>Last contact</th><th /></tr></thead>
            <tbody>{conversations.map((item) => <tr key={item.id}><td><div className="table-person"><span>{item.customerName.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span><div><b>{item.customerName}</b><small>{item.customerHandle}</small></div></div></td><td><span className={`channel-chip ${item.platform}`}>{platformMeta[item.platform].label}</span></td><td>{item.inquiry.destination ?? "—"}</td><td><span className={`status-tag ${item.status}`}>{statusLabel[item.status]}</span></td><td>{formatTime(item.updatedAt)}</td><td><button className="table-action" onClick={() => onOpen(item.id)}>Open →</button></td></tr>)}</tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Knowledge({ items, onUpdate }: { items: FaqItem[]; onUpdate: (id: string, patch: Partial<FaqItem>) => void }) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? "");
  const [answerDraft, setAnswerDraft] = useState("");
  const filtered = items.filter((item) => `${item.title} ${item.category} ${item.keywords.join(" ")}`.toLowerCase().includes(query.toLowerCase()));
  const selected = items.find((item) => item.id === selectedId) ?? items[0];

  useEffect(() => {
    if (selected) setAnswerDraft(selected.answer);
  }, [selected?.id, selected?.answer]);

  return (
    <div className="workspace-content knowledge-page">
      <section className="knowledge-summary">
        <div><p className="eyebrow">CONTROLLED KNOWLEDGE</p><h2>{items.filter((item) => item.enabled).length} enabled FAQ categories</h2><p>These answers drive the deterministic demo assistant. Business-specific facts can be updated without changing chatbot code.</p></div>
        <div className="knowledge-policy"><span>Safety policy</span><b>No invented rates, payment accounts, availability, or confirmations.</b></div>
      </section>
      <section className="knowledge-layout">
        <article className="card faq-library">
          <label className="search-box"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search knowledge" /></label>
          <div className="faq-list">
            {filtered.map((item) => <button key={item.id} className={selected?.id === item.id ? "active" : ""} onClick={() => setSelectedId(item.id)}><div><b>{item.title}</b><small>{item.category} · {item.keywords.slice(0, 3).join(", ")}</small></div><span className={item.enabled ? "enabled-dot" : "disabled-dot"} /></button>)}
          </div>
        </article>
        <article className="card faq-editor">
          {selected ? <>
            <div className="faq-editor-head"><div><p className="eyebrow">FAQ ENTRY</p><h3>{selected.title}</h3></div><label className="toggle"><input type="checkbox" checked={selected.enabled} onChange={(event) => onUpdate(selected.id, { enabled: event.target.checked })} /><span /><b>{selected.enabled ? "Enabled" : "Disabled"}</b></label></div>
            <div className="editor-meta"><div><span>Intent</span><code>{selected.intent}</code></div><div><span>Category</span><b>{selected.category}</b></div></div>
            <label className="editor-field">Approved response<textarea value={answerDraft} onChange={(event) => setAnswerDraft(event.target.value)} /></label>
            <div className="keyword-box"><span>Recognition phrases</span><div>{selected.keywords.map((keyword) => <em key={keyword}>{keyword}</em>)}</div></div>
            <div className="editor-actions"><button className="button secondary" onClick={() => setAnswerDraft(selected.answer)}>Discard changes</button><button className="button primary" onClick={() => onUpdate(selected.id, { answer: answerDraft })} disabled={answerDraft.trim() === selected.answer.trim() || !answerDraft.trim()}>Save response</button></div>
          </> : <div className="context-empty">Select a knowledge item.</div>}
        </article>
      </section>
    </div>
  );
}

function Analytics({ conversations }: { conversations: Conversation[] }) {
  const total = conversations.length;
  const stages: { key: ConversationStatus; label: string }[] = [
    { key: "new", label: "New" },
    { key: "qualifying", label: "Qualifying" },
    { key: "qualified", label: "Qualified" },
    { key: "needs_human", label: "Needs human" },
    { key: "follow_up", label: "Follow up" },
  ];
  return (
    <div className="workspace-content analytics-page">
      <section className="metric-grid">
        <Metric label="Automation coverage" value={pct(conversations.filter((item) => item.botEnabled).length, total)} note="Percent of conversations" accent />
        <Metric label="Qualified share" value={pct(conversations.filter((item) => item.status === "qualified").length, total)} note="Percent of conversations" />
        <Metric label="Human handoff" value={pct(conversations.filter((item) => item.needsHuman).length, total)} note="Percent requiring agent" />
        <Metric label="Active channels" value={new Set(conversations.map((item) => item.platform)).size} note="Messenger · Instagram · TikTok" />
      </section>
      <section className="overview-two-col">
        <article className="card"><CardHeader eyebrow="INQUIRY FUNNEL" title="Current conversation states" /><div className="funnel-list">{stages.map((stage) => { const count = conversations.filter((item) => item.status === stage.key).length; return <div key={stage.key}><div><span>{stage.label}</span><b>{count}</b></div><div className="funnel-track"><i style={{ width: `${pct(count, total)}%` }} /></div></div>; })}</div></article>
        <article className="card"><CardHeader eyebrow="CHANNEL PERFORMANCE" title="Lead quality by source" /><div className="channel-quality">{(Object.keys(platformMeta) as Platform[]).map((platform) => { const items = conversations.filter((item) => item.platform === platform); const qualified = items.filter((item) => item.status === "qualified").length; return <div key={platform}><div className={`platform-icon ${platform}`}>{platformMeta[platform].short}</div><div><b>{platformMeta[platform].label}</b><small>{items.length} inquiries</small></div><strong>{pct(qualified, items.length)}%<small> qualified</small></strong></div>; })}</div></article>
      </section>
      <p className="analytics-disclaimer">Prototype analytics are calculated from seeded and live demo conversations. They are not presented as historical Arjam business performance.</p>
    </div>
  );
}

function SystemView({ state, onReset }: { state: AppState; onReset: () => void }) {
  return (
    <div className="workspace-content system-page">
      <section className="system-grid">
        <article className="card"><CardHeader eyebrow="MESSAGE ADAPTERS" title="Channel readiness" /><div className="system-list">{(Object.keys(platformMeta) as Platform[]).map((platform) => <div key={platform}><div className={`platform-icon ${platform}`}>{platformMeta[platform].short}</div><div><b>{platformMeta[platform].label}</b><small>Presentation transport</small></div><span className="system-ready">Demo ready</span></div>)}</div><p className="system-note">Production Meta and TikTok authorization is intentionally outside this prototype boundary.</p></article>
        <article className="card"><CardHeader eyebrow="CHATBOT ENGINE" title="Current operating mode" /><div className="system-facts"><Context label="Knowledge categories" value={`${state.faqItems.filter((item) => item.enabled).length} enabled`} /><Context label="Qualification" value="Context-aware" /><Context label="Human handoff" value="Enabled" /><Context label="Persistence" value="Browser prototype store" /><Context label="Cross-window sync" value="BroadcastChannel + storage" /></div></article>
      </section>
      <section className="card reset-card"><div><p className="eyebrow">PRESENTATION CONTROL</p><h3>Restore the seeded demo state</h3><p>Use this before the client presentation or after running multiple tester scenarios.</p></div><button className="button danger" onClick={onReset}>Reset demo data</button></section>
    </div>
  );
}
