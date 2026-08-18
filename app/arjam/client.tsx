"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { quickSignIn, readSession, signOut } from "@/lib/auth";
import {
  markConversationRead,
  readState,
  sendAgentMessage,
  setAgentTakeover,
  setConversationStatus,
  subscribeState,
  updateFaq,
} from "@/lib/store";
import { AppState, Conversation, ConversationStatus, FaqItem, Platform } from "@/lib/types";

type View = "inbox" | "dashboard" | "customers" | "faq";
type InboxFilter = "all" | "unread" | "human";

const platformLabel: Record<Platform, string> = {
  facebook: "Messenger",
  instagram: "Instagram",
  tiktok: "TikTok",
};

const platformShort: Record<Platform, string> = {
  facebook: "FB",
  instagram: "IG",
  tiktok: "TT",
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
  if (!iso) return "Not provided";
  const value = iso.length === 10 ? `${iso}T00:00:00` : iso;
  return new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export default function ArjamDashboard() {
  const router = useRouter();
  const [state, setState] = useState<AppState>({ version: 2, conversations: [], faqItems: [], activity: [] });
  const [view, setView] = useState<View>("inbox");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<InboxFilter>("all");
  const [draft, setDraft] = useState("");

  function refresh() {
    setState(readState());
  }

  useEffect(() => {
    let session = readSession();
    const auto = new URLSearchParams(window.location.search).get("auto") === "1";
    if (auto) session = quickSignIn("arjam");
    if (!session || session.role !== "arjam") {
      router.replace("/?role=arjam");
      return;
    }
    refresh();
    return subscribeState(refresh);
  }, [router]);

  useEffect(() => {
    if (!activeId && state.conversations[0]) setActiveId(state.conversations[0].id);
  }, [activeId, state.conversations]);

  const active = state.conversations.find((item) => item.id === activeId) ?? null;

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return state.conversations.filter((conversation) => {
      if (filter === "unread" && !conversation.unread) return false;
      if (filter === "human" && !conversation.needsHuman) return false;
      if (!query) return true;
      return [
        conversation.customerName,
        conversation.customerHandle,
        platformLabel[conversation.platform],
        conversation.inquiry.destination,
        conversation.messages.at(-1)?.text,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [filter, search, state.conversations]);

  const metrics = useMemo(() => ({
    open: state.conversations.filter((item) => item.status !== "closed").length,
    human: state.conversations.filter((item) => item.needsHuman).length,
    qualified: state.conversations.filter((item) => item.status === "qualified").length,
  }), [state.conversations]);

  function openConversation(id: string) {
    setActiveId(id);
    markConversationRead(id);
    setState(readState());
  }

  function sendAgentReply() {
    if (!active || !draft.trim() || active.botEnabled) return;
    setState(sendAgentMessage(active.id, draft.trim()));
    setDraft("");
  }

  function logout() {
    signOut();
    router.push("/");
  }

  return (
    <main className="workspace-shell">
      <aside className="workspace-nav">
        <div>
          <div className="workspace-brand">
            <div className="logo-mark small">A</div>
            <div><strong>Arjam Connect</strong><span>Travel & Tours</span></div>
          </div>

          <nav>
            <NavItem active={view === "inbox"} label="Inbox" count={state.conversations.filter((item) => item.unread).length} onClick={() => setView("inbox")} />
            <NavItem active={view === "dashboard"} label="Dashboard" onClick={() => setView("dashboard")} />
            <NavItem active={view === "customers"} label="Customers" onClick={() => setView("customers")} />
            <NavItem active={view === "faq"} label="FAQ responses" onClick={() => setView("faq")} />
          </nav>
        </div>

        <div className="workspace-nav-bottom">
          <Link href="/demo?auto=1" target="_blank">Open demo customer</Link>
          <button onClick={logout}>Sign out</button>
        </div>
      </aside>

      <section className="workspace-main">
        <header className="workspace-header">
          <div>
            <h1>{view === "inbox" ? "Inbox" : view === "dashboard" ? "Dashboard" : view === "customers" ? "Customers" : "FAQ responses"}</h1>
            {view === "inbox" && <p>All customer conversations in one place.</p>}
          </div>
          <Link className="btn btn-secondary" href="/demo?auto=1" target="_blank">Open tester</Link>
        </header>

        {view === "inbox" && (
          <InboxView
            conversations={filtered}
            active={active}
            activeId={activeId}
            search={search}
            filter={filter}
            draft={draft}
            onSearch={setSearch}
            onFilter={setFilter}
            onSelect={openConversation}
            onDraft={setDraft}
            onSend={sendAgentReply}
            onTakeover={(id, takeover) => setState(setAgentTakeover(id, takeover))}
            onStatus={(id, status) => setState(setConversationStatus(id, status))}
          />
        )}
        {view === "dashboard" && <DashboardView conversations={state.conversations} metrics={metrics} onOpen={(id) => { openConversation(id); setView("inbox"); }} />}
        {view === "customers" && <CustomersView conversations={state.conversations} onOpen={(id) => { openConversation(id); setView("inbox"); }} />}
        {view === "faq" && <FaqView items={state.faqItems} onUpdate={(id, patch) => setState(updateFaq(id, patch))} />}
      </section>
    </main>
  );
}

function NavItem({ active, label, count, onClick }: { active: boolean; label: string; count?: number; onClick: () => void }) {
  return (
    <button className={active ? "nav-item active" : "nav-item"} onClick={onClick}>
      <span>{label}</span>
      {Boolean(count) && <b>{count}</b>}
    </button>
  );
}

function DashboardView({ conversations, metrics, onOpen }: { conversations: Conversation[]; metrics: { open: number; human: number; qualified: number }; onOpen: (id: string) => void }) {
  return (
    <div className="page-body">
      <div className="summary-grid">
        <SummaryCard label="Open inquiries" value={metrics.open} />
        <SummaryCard label="Needs human reply" value={metrics.human} attention={metrics.human > 0} />
        <SummaryCard label="Qualified" value={metrics.qualified} />
      </div>

      <section className="panel simple-panel">
        <div className="panel-title"><h2>Recent inquiries</h2><span>{conversations.length} total</span></div>
        <div className="recent-list">
          {conversations.slice(0, 7).map((conversation) => (
            <button key={conversation.id} onClick={() => onOpen(conversation.id)}>
              <span className={`platform-chip ${conversation.platform}`}>{platformShort[conversation.platform]}</span>
              <span className="recent-main"><b>{conversation.customerName}</b><small>{conversation.messages.at(-1)?.text}</small></span>
              <span className={`status-pill ${conversation.status}`}>{statusLabel[conversation.status]}</span>
              <time>{formatTime(conversation.updatedAt)}</time>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function SummaryCard({ label, value, attention = false }: { label: string; value: number; attention?: boolean }) {
  return <div className={attention ? "summary-card attention" : "summary-card"}><span>{label}</span><strong>{value}</strong></div>;
}

function InboxView({ conversations, active, activeId, search, filter, draft, onSearch, onFilter, onSelect, onDraft, onSend, onTakeover, onStatus }: {
  conversations: Conversation[];
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
  onTakeover: (id: string, takeover: boolean) => void;
  onStatus: (id: string, status: ConversationStatus) => void;
}) {
  return (
    <div className="inbox-grid-clean">
      <aside className="thread-list">
        <div className="thread-tools">
          <input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search conversations" />
          <div className="thread-filters">
            {(["all", "unread", "human"] as InboxFilter[]).map((item) => (
              <button key={item} className={filter === item ? "active" : ""} onClick={() => onFilter(item)}>
                {item === "human" ? "Needs human" : item.charAt(0).toUpperCase() + item.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="threads">
          {conversations.map((conversation) => (
            <button key={conversation.id} className={activeId === conversation.id ? "thread active" : "thread"} onClick={() => onSelect(conversation.id)}>
              <span className={`platform-chip ${conversation.platform}`}>{platformShort[conversation.platform]}</span>
              <span className="thread-copy">
                <span><b>{conversation.customerName}</b><time>{formatTime(conversation.updatedAt)}</time></span>
                <small>{conversation.messages.at(-1)?.text}</small>
                <em>{statusLabel[conversation.status]}</em>
              </span>
              {conversation.unread && <i className="unread-indicator" />}
            </button>
          ))}
          {conversations.length === 0 && <div className="empty-state">No conversations found.</div>}
        </div>
      </aside>

      <section className="conversation-clean">
        {!active ? (
          <div className="empty-state large">Select a conversation.</div>
        ) : (
          <>
            <header className="conversation-clean-header">
              <div>
                <h2>{active.customerName}</h2>
                <p>{platformLabel[active.platform]} · {active.botEnabled ? "Assistant active" : "Human agent active"}</p>
              </div>
              <button className={active.botEnabled ? "btn btn-secondary" : "btn btn-primary"} onClick={() => onTakeover(active.id, active.botEnabled)}>
                {active.botEnabled ? "Take over" : "Return to assistant"}
              </button>
            </header>

            <div className="message-list-clean">
              {active.messages.map((message) => {
                if (message.sender === "system") return <div className="system-line" key={message.id}>{message.text}</div>;
                const outgoing = message.sender !== "customer";
                return (
                  <div className={outgoing ? "message-clean outgoing" : "message-clean"} key={message.id}>
                    <div>{message.text}</div>
                    <small>{message.sender === "customer" ? active.customerName : message.sender === "bot" ? "Arjam Assistant" : "Arjam Agent"} · {formatTime(message.createdAt)}</small>
                  </div>
                );
              })}
            </div>

            <div className="reply-box">
              <textarea
                rows={2}
                value={draft}
                onChange={(event) => onDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    onSend();
                  }
                }}
                disabled={active.botEnabled}
                placeholder={active.botEnabled ? "Take over this conversation to reply manually." : "Reply to customer"}
              />
              <button className="btn btn-primary" disabled={active.botEnabled || !draft.trim()} onClick={onSend}>Send</button>
            </div>
          </>
        )}
      </section>

      <aside className="conversation-details-clean">
        {!active ? null : (
          <>
            <div className="customer-summary">
              <div className="customer-avatar">{active.customerName.split(" ").map((part) => part[0]).slice(0, 2).join("")}</div>
              <h3>{active.customerName}</h3>
              <p>{active.customerHandle}</p>
            </div>

            <label className="status-field">
              Status
              <select value={active.status} onChange={(event) => onStatus(active.id, event.target.value as ConversationStatus)}>
                {(Object.keys(statusLabel) as ConversationStatus[]).map((status) => <option key={status} value={status}>{statusLabel[status]}</option>)}
              </select>
            </label>

            <div className="detail-group">
              <Detail label="Channel" value={platformLabel[active.platform]} />
              <Detail label="Destination" value={active.inquiry.destination ?? "Not provided"} />
              <Detail label="Travel date" value={formatDate(active.inquiry.travelDate)} />
              <Detail label="Guests" value={active.inquiry.guests?.toString() ?? "Not provided"} />
              <Detail label="Origin" value={active.inquiry.origin ?? "Not provided"} />
              <Detail label="Assigned to" value={active.assignedTo ?? "Assistant"} />
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="detail-row-clean"><span>{label}</span><b>{value}</b></div>;
}

function CustomersView({ conversations, onOpen }: { conversations: Conversation[]; onOpen: (id: string) => void }) {
  return (
    <div className="page-body">
      <section className="panel table-panel">
        <table>
          <thead><tr><th>Customer</th><th>Channel</th><th>Destination</th><th>Status</th><th>Last activity</th><th /></tr></thead>
          <tbody>
            {conversations.map((conversation) => (
              <tr key={conversation.id}>
                <td><b>{conversation.customerName}</b><small>{conversation.customerHandle}</small></td>
                <td>{platformLabel[conversation.platform]}</td>
                <td>{conversation.inquiry.destination ?? "—"}</td>
                <td><span className={`status-pill ${conversation.status}`}>{statusLabel[conversation.status]}</span></td>
                <td>{formatTime(conversation.updatedAt)}</td>
                <td><button className="text-link" onClick={() => onOpen(conversation.id)}>Open</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function FaqView({ items, onUpdate }: { items: FaqItem[]; onUpdate: (id: string, patch: Partial<FaqItem>) => void }) {
  return (
    <div className="page-body faq-page-clean">
      <div className="faq-intro">
        <h2>Chatbot answers</h2>
        <p>These are the approved responses used for common customer questions. Edit the wording here without changing the chatbot code.</p>
      </div>
      <div className="faq-list-clean">
        {items.map((item) => <FaqEditor key={item.id} item={item} onUpdate={onUpdate} />)}
      </div>
    </div>
  );
}

function FaqEditor({ item, onUpdate }: { item: FaqItem; onUpdate: (id: string, patch: Partial<FaqItem>) => void }) {
  const [answer, setAnswer] = useState(item.answer);
  useEffect(() => setAnswer(item.answer), [item.answer]);

  return (
    <details className="faq-item-clean">
      <summary>
        <span><b>{item.title}</b><small>{item.category}</small></span>
        <span className={item.enabled ? "faq-enabled" : "faq-disabled"}>{item.enabled ? "Enabled" : "Disabled"}</span>
      </summary>
      <div className="faq-editor-clean">
        <label>
          Response
          <textarea rows={5} value={answer} onChange={(event) => setAnswer(event.target.value)} />
        </label>
        <div>
          <label className="toggle-line"><input type="checkbox" checked={item.enabled} onChange={(event) => onUpdate(item.id, { enabled: event.target.checked })} /> Enable this response</label>
          <button className="btn btn-primary" onClick={() => onUpdate(item.id, { answer })}>Save response</button>
        </div>
      </div>
    </details>
  );
}
