import { Suspense } from "react";
import DemoTesterPage from "./client";

export default function DemoPage() {
  return (
    <Suspense fallback={<main className="route-loading">Loading Customer Simulation…</main>}>
      <DemoTesterPage />
    </Suspense>
  );
}
