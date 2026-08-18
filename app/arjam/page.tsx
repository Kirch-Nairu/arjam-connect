import { Suspense } from "react";
import ArjamDashboard from "./client";

export default function ArjamPage() {
  return (
    <Suspense fallback={<main className="route-loading">Loading Arjam Operations…</main>}>
      <ArjamDashboard />
    </Suspense>
  );
}
