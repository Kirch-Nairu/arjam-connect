"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DemoRole, demoCredentials, quickSignIn, signIn } from "@/lib/auth";

const roleCopy: Record<DemoRole, { eyebrow: string; title: string; description: string; destination: string }> = {
  arjam: {
    eyebrow: "CLIENT WORKSPACE",
    title: "Arjam Operations",
    description: "Unified inbox, inquiry tracking, customer context, chatbot control, knowledge base, and analytics.",
    destination: "/arjam",
  },
  tester: {
    eyebrow: "CUSTOMER SIMULATION",
    title: "Demo Tester",
    description: "Simulate Facebook Messenger, Instagram, and TikTok inquiries against the working chatbot flow.",
    destination: "/demo",
  },
};

export default function LoginPage() {
  const router = useRouter();
  const initialRole: DemoRole = "arjam";
  const [role, setRole] = useState<DemoRole>(initialRole);
  const [email, setEmail] = useState(demoCredentials(initialRole).email);
  const [password, setPassword] = useState(demoCredentials(initialRole).password);
  const [error, setError] = useState("");

  const copy = useMemo(() => roleCopy[role], [role]);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("role");
    if (requested === "tester") chooseRole("tester");
  }, []);

  function chooseRole(nextRole: DemoRole) {
    setRole(nextRole);
    setEmail(demoCredentials(nextRole).email);
    setPassword(demoCredentials(nextRole).password);
    setError("");
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const session = signIn(role, email, password);
    if (!session) {
      setError("The demo credentials do not match this workspace.");
      return;
    }
    router.push(copy.destination);
  }

  function fastAccess() {
    quickSignIn(role);
    router.push(copy.destination);
  }

  return (
    <main className="login-page">
      <section className="login-hero">
        <div className="hero-brand">
          <div className="brand-symbol">A</div>
          <div>
            <strong>ARJAM CONNECT</strong>
            <span>Travel inquiry operations</span>
          </div>
        </div>
        <div className="hero-copy">
          <p className="eyebrow light">PRESENTATION PROTOTYPE · AUGUST 2026</p>
          <h1>One place for every customer conversation.</h1>
          <p>
            A working prototype for centralized travel inquiries, FAQ automation, lead qualification, and human handoff across social channels.
          </p>
        </div>
        <div className="hero-proof">
          <div><strong>3</strong><span>simulated channels</span></div>
          <div><strong>18</strong><span>FAQ categories</span></div>
          <div><strong>Live</strong><span>cross-window sync</span></div>
        </div>
        <p className="hero-footnote">Social transport is simulated for presentation. Chatbot logic, inquiry state, knowledge editing, and handoff are functional.</p>
      </section>

      <section className="login-panel">
        <div className="login-panel-inner">
          <div className="login-heading">
            <p className="eyebrow">SELECT WORKSPACE</p>
            <h2>Sign in to Arjam Connect</h2>
            <p>Choose which side of the prototype you want to operate.</p>
          </div>

          <div className="role-switch" role="tablist" aria-label="Demo workspace">
            {(Object.keys(roleCopy) as DemoRole[]).map((item) => (
              <button key={item} type="button" className={role === item ? "active" : ""} onClick={() => chooseRole(item)}>
                <span>{item === "arjam" ? "A" : "D"}</span>
                <div><b>{roleCopy[item].title}</b><small>{roleCopy[item].eyebrow}</small></div>
              </button>
            ))}
          </div>

          <div className="selected-role">
            <p className="eyebrow">{copy.eyebrow}</p>
            <h3>{copy.title}</h3>
            <p>{copy.description}</p>
          </div>

          <form onSubmit={submit} className="login-form">
            <label>
              Email
              <input autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <label>
              Password
              <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="primary wide" type="submit">Sign in to {copy.title}</button>
            <button className="text-button" type="button" onClick={fastAccess}>Use seeded demo access instead</button>
          </form>

          <div className="credential-note">
            <span>Demo credentials</span>
            <code>{demoCredentials(role).email}</code>
            <code>{demoCredentials(role).password}</code>
          </div>
        </div>
      </section>
    </main>
  );
}
