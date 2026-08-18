import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="login-shell">
      <section className="login-card">
        <div className="brand-mark">A</div>
        <p className="eyebrow">ARJAM TRAVEL & TOURS</p>
        <h1>Arjam Connect</h1>
        <p className="lead">Customer inquiry management and chatbot prototype.</p>
        <div className="role-grid">
          <Link className="role-card" href="/arjam">
            <span className="role-icon">⌘</span>
            <strong>Login as Arjam</strong>
            <small>Client dashboard, inbox, inquiry tracking and agent takeover.</small>
            <span className="role-action">Enter dashboard →</span>
          </Link>
          <Link className="role-card" href="/demo">
            <span className="role-icon">◌</span>
            <strong>Login as Demo Tester</strong>
            <small>Simulate a customer inquiry from Messenger, Instagram or TikTok.</small>
            <span className="role-action">Open customer demo →</span>
          </Link>
        </div>
        <p className="prototype-note">Prototype environment · Social channels are simulated adapters for demonstration.</p>
      </section>
    </main>
  );
}
