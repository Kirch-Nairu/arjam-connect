"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DemoRole, demoCredentials, quickSignIn, signIn } from "@/lib/auth";

const roleCopy: Record<DemoRole, { title: string; description: string; destination: string }> = {
  arjam: {
    title: "Arjam workspace",
    description: "Manage inquiries, customers, FAQ responses, and agent handoff.",
    destination: "/arjam",
  },
  tester: {
    title: "Demo customer",
    description: "Send test inquiries through Messenger, Instagram, or TikTok.",
    destination: "/demo",
  },
};

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<DemoRole>("arjam");
  const [email, setEmail] = useState(demoCredentials("arjam").email);
  const [password, setPassword] = useState(demoCredentials("arjam").password);
  const [error, setError] = useState("");

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("role");
    if (requested === "tester") chooseRole("tester");
  }, []);

  function chooseRole(nextRole: DemoRole) {
    setRole(nextRole);
    const credentials = demoCredentials(nextRole);
    setEmail(credentials.email);
    setPassword(credentials.password);
    setError("");
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const session = signIn(role, email, password);
    if (!session) {
      setError("Invalid demo credentials.");
      return;
    }
    router.push(roleCopy[role].destination);
  }

  function enterDemo() {
    quickSignIn(role);
    router.push(roleCopy[role].destination);
  }

  return (
    <main className="login-screen">
      <section className="login-card">
        <div className="login-brand">
          <div className="logo-mark">A</div>
          <div>
            <strong>Arjam Connect</strong>
            <span>Travel & Tours</span>
          </div>
        </div>

        <div className="login-copy">
          <h1>Customer inquiry workspace</h1>
          <p>Choose which side of the demo you want to open.</p>
        </div>

        <div className="role-options">
          {(Object.keys(roleCopy) as DemoRole[]).map((item) => (
            <button
              type="button"
              key={item}
              className={role === item ? "role-option active" : "role-option"}
              onClick={() => chooseRole(item)}
            >
              <span className="role-letter">{item === "arjam" ? "A" : "D"}</span>
              <span>
                <b>{roleCopy[item].title}</b>
                <small>{roleCopy[item].description}</small>
              </span>
            </button>
          ))}
        </div>

        <form className="login-form-clean" onSubmit={submit}>
          <label>
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
          </label>
          {error && <p className="login-error">{error}</p>}
          <button className="btn btn-primary" type="submit">Sign in</button>
        </form>

        <button className="demo-entry" type="button" onClick={enterDemo}>Enter with demo access</button>
        <p className="login-note">Demo environment. Social channel delivery is simulated.</p>
      </section>
    </main>
  );
}
