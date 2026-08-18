"use client";

export type DemoRole = "arjam" | "tester";

export interface DemoSession {
  role: DemoRole;
  displayName: string;
  signedInAt: string;
}

const SESSION_KEY = "arjam-connect-session-v2";

const credentials: Record<DemoRole, { email: string; password: string; displayName: string }> = {
  arjam: {
    email: "arjam@demo.local",
    password: "arjam2026",
    displayName: "Arjam Travel & Tours",
  },
  tester: {
    email: "tester@demo.local",
    password: "demo2026",
    displayName: "Demo Tester",
  },
};

export function demoCredentials(role: DemoRole) {
  return credentials[role];
}

export function signIn(role: DemoRole, email: string, password: string): DemoSession | null {
  const expected = credentials[role];
  if (email.trim().toLowerCase() !== expected.email || password !== expected.password) return null;
  const session: DemoSession = {
    role,
    displayName: expected.displayName,
    signedInAt: new Date().toISOString(),
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function quickSignIn(role: DemoRole): DemoSession {
  const expected = credentials[role];
  const session: DemoSession = {
    role,
    displayName: expected.displayName,
    signedInAt: new Date().toISOString(),
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function readSession(): DemoSession | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DemoSession;
  } catch {
    return null;
  }
}

export function signOut() {
  if (typeof window !== "undefined") sessionStorage.removeItem(SESSION_KEY);
}
