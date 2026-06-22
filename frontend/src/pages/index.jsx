import Head from "next/head";
import Link from "next/link";

const FEATURES = [
  {
    icon: "⚡",
    title: "3–5 Second Settlement",
    desc: "Stellar confirms transactions faster than a credit card swipe. Parents get instant proof of payment.",
  },
  {
    icon: "🔗",
    title: "On-Chain Immutability",
    desc: "Every payment is permanently recorded on a public blockchain. Receipts that can never be faked or lost.",
  },
  {
    icon: "🔄",
    title: "Zero Manual Reconciliation",
    desc: "Student IDs in the Stellar memo field automatically match every payment — no spreadsheets required.",
  },
  {
    icon: "💰",
    title: "$0.000001 Per Transaction",
    desc: "Forget 2.9% + 30¢. Stellar's fees are microscopic. Every dollar goes toward education.",
  },
  {
    icon: "🏫",
    title: "Multi-School Architecture",
    desc: "Fully isolated wallets, students, and records per institution. Scale from one school to a district.",
  },
  {
    icon: "📡",
    title: "Real-Time Notifications",
    desc: "Server-sent events push live payment confirmations to parents and admins the instant they land.",
  },
];

const STEPS = [
  {
    n: "1",
    title: "Parent opens the pay page",
    desc: "They see the school wallet address, their student's ID as a pre-filled memo, the exact amount owed, and accepted assets (XLM or USDC).",
  },
  {
    n: "2",
    title: "They send from any Stellar wallet",
    desc: "Lobstr, Solar, XBULL — any wallet works. The transaction hits the Stellar network and confirms in seconds.",
  },
  {
    n: "3",
    title: "StellarEduPay does the rest",
    desc: "The poller reads the blockchain, matches the memo to the student, validates the amount, marks the fee paid, and fires a webhook.",
  },
];

const STATS = [
  { v: "< 5s", l: "Settlement time" },
  { v: "$0.000001", l: "Per transaction" },
  { v: "100%", l: "On-chain verified" },
  { v: "0", l: "Manual steps" },
];

export default function Home() {
  return (
    <>
      <Head>
        <title>StellarEduPay — Blockchain School Fee Payments</title>
        <meta name="description" content="Instant, transparent, fraud-proof school fee payments on the Stellar blockchain. Auto-reconciliation via transaction memos." />
      </Head>

      <style dangerouslySetInnerHTML={{ __html: `
        /* ─── Override globals.css heading colours inside landing page ─── */
        .lp h1, .lp h2, .lp h3, .lp h4 { color: inherit; font-weight: inherit; }

        /* ─── Reset for landing sections ─── */
        .lp * { box-sizing: border-box; }

        /* ─── Page wrapper ─── */
        .lp {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          -webkit-font-smoothing: antialiased;
          color: #0f172a;
          /* prevent body var(--bg) flash between sections */
          background: #050b18;
        }

        /* ─── Centered content container ─── */
        .lp-container {
          width: 100%;
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        /* ═══════════════════════════════════
           HERO
        ═══════════════════════════════════ */
        .lp-hero {
          position: relative;
          min-height: calc(100vh - 60px);
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          overflow: hidden;
          background: #050b18;
        }
        /* mesh gradient blobs */
        .lp-hero-bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .lp-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          opacity: 0.45;
        }
        .lp-blob-1 {
          width: 600px; height: 600px;
          background: radial-gradient(circle, #1e4d7b 0%, transparent 70%);
          top: -180px; left: -100px;
        }
        .lp-blob-2 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, #0e3a5c 0%, transparent 70%);
          bottom: -120px; right: -80px;
        }
        .lp-blob-3 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, #818cf8 0%, transparent 70%);
          opacity: 0.07;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
        }
        /* subtle grid overlay */
        .lp-hero-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 60px 60px;
        }
        .lp-hero-content {
          position: relative;
          z-index: 1;
          max-width: 760px;
          margin: 0 auto;
          padding: 6rem 1.5rem 5rem;
        }
        .lp-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(126,200,227,0.08);
          border: 1px solid rgba(126,200,227,0.2);
          border-radius: 100px;
          color: #818cf8;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          padding: 0.3rem 0.9rem;
          text-transform: uppercase;
          margin-bottom: 2rem;
          animation: fadeUp 0.5s ease both;
        }
        .lp-badge-dot {
          width: 6px; height: 6px;
          background: #4ade80;
          border-radius: 50%;
          box-shadow: 0 0 0 3px rgba(74,222,128,0.2);
          animation: blink 2s ease-in-out infinite;
        }
        @keyframes blink {
          0%,100% { opacity:1; } 50% { opacity:0.3; }
        }
        .lp-hero h1 {
          font-size: clamp(2.6rem, 6.5vw, 4.25rem);
          font-weight: 900;
          line-height: 1.06;
          letter-spacing: -0.04em;
          color: #f8fafc;
          margin-bottom: 1.5rem;
          animation: fadeUp 0.5s 0.08s ease both;
        }
        .lp-hero h1 em {
          font-style: normal;
          background: linear-gradient(90deg, #22d3ee 0%, #818cf8 50%, #c4b5fd 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .lp-hero-sub {
          font-size: 1.125rem;
          line-height: 1.75;
          color: #94a3b8;
          max-width: 560px;
          margin: 0 auto 2.5rem;
          animation: fadeUp 0.5s 0.16s ease both;
        }
        .lp-hero-actions {
          display: flex;
          gap: 0.875rem;
          justify-content: center;
          flex-wrap: wrap;
          animation: fadeUp 0.5s 0.24s ease both;
        }
        .btn-cta {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: #fff;
          border: none;
          border-radius: 11px;
          font-size: 0.95rem;
          font-weight: 700;
          padding: 0.85rem 1.85rem;
          cursor: pointer;
          text-decoration: none;
          transition: transform 0.15s, box-shadow 0.15s, filter 0.15s;
          font-family: inherit;
          letter-spacing: -0.01em;
          box-shadow: 0 12px 30px -8px rgba(99,102,241,0.65);
        }
        .btn-cta:hover {
          transform: translateY(-2px);
          filter: brightness(1.08);
          box-shadow: 0 18px 42px -8px rgba(99,102,241,0.75);
        }
        .btn-ghost {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255,255,255,0.04);
          color: #cbd5e1;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 10px;
          font-size: 0.95rem;
          font-weight: 600;
          padding: 0.8rem 1.75rem;
          cursor: pointer;
          text-decoration: none;
          transition: background 0.15s, border-color 0.15s, color 0.15s;
          font-family: inherit;
        }
        .btn-ghost:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.22);
          color: #fff;
        }
        /* scroll indicator */
        .lp-scroll-hint {
          position: absolute;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.4rem;
          color: rgba(255,255,255,0.2);
          font-size: 0.7rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          animation: fadeUp 0.5s 0.5s ease both;
        }
        .lp-scroll-arrow {
          width: 20px;
          height: 32px;
          border: 1.5px solid rgba(255,255,255,0.15);
          border-radius: 10px;
          display: flex;
          justify-content: center;
          padding-top: 6px;
        }
        .lp-scroll-ball {
          width: 4px; height: 8px;
          background: rgba(255,255,255,0.25);
          border-radius: 2px;
          animation: scrollBall 1.8s ease-in-out infinite;
        }
        @keyframes scrollBall {
          0% { transform: translateY(0); opacity:1; }
          80% { transform: translateY(10px); opacity:0; }
          100% { transform: translateY(0); opacity:0; }
        }

        /* ═══════════════════════════════════
           STATS BAND
        ═══════════════════════════════════ */
        .lp-stats-band {
          background: #0a0f1e;
          border-top: 1px solid rgba(255,255,255,0.05);
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .lp-stats-inner {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
        }
        .lp-stat {
          padding: 2.25rem 1rem;
          text-align: center;
          border-right: 1px solid rgba(255,255,255,0.05);
        }
        .lp-stat:last-child { border-right: none; }
        .lp-stat-v {
          display: block;
          font-size: 2rem;
          font-weight: 900;
          letter-spacing: -0.04em;
          color: #818cf8;
          margin-bottom: 0.3rem;
        }
        .lp-stat-l {
          font-size: 0.75rem;
          font-weight: 500;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        @media (max-width: 600px) {
          .lp-stats-inner { grid-template-columns: repeat(2,1fr); }
          .lp-stat:nth-child(2) { border-right: none; }
          .lp-stat { border-bottom: 1px solid rgba(255,255,255,0.05); }
          .lp-stat:nth-child(3), .lp-stat:nth-child(4) { border-bottom: none; }
        }

        /* ═══════════════════════════════════
           FEATURES
        ═══════════════════════════════════ */
        .lp-features {
          padding: 6rem 1.5rem;
          background: #f8fafc;
        }
        .lp-section-header {
          text-align: center;
          max-width: 560px;
          margin: 0 auto 3.5rem;
        }
        .lp-eyebrow {
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #818cf8;
          margin-bottom: 0.75rem;
          display: block;
        }
        .lp-section-h2 {
          font-size: clamp(1.9rem, 3.5vw, 2.6rem);
          font-weight: 900;
          letter-spacing: -0.03em;
          color: #0f172a;
          margin-bottom: 0.875rem;
          line-height: 1.15;
        }
        .lp-section-p {
          font-size: 1rem;
          line-height: 1.75;
          color: #64748b;
        }
        .lp-features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
        }
        @media (max-width: 900px) { .lp-features-grid { grid-template-columns: repeat(2,1fr); } }
        @media (max-width: 560px) { .lp-features-grid { grid-template-columns: 1fr; } }
        .lp-feat {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 1.75rem;
          transition: transform 0.18s, box-shadow 0.18s, border-color 0.18s;
        }
        .lp-feat:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 48px rgba(0,0,0,0.07);
          border-color: rgba(126,200,227,0.5);
        }
        .lp-feat-icon {
          font-size: 1.6rem;
          margin-bottom: 1rem;
          display: block;
        }
        .lp-feat-title {
          font-size: 0.975rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 0.5rem;
          letter-spacing: -0.01em;
        }
        .lp-feat-desc {
          font-size: 0.875rem;
          color: #64748b;
          line-height: 1.65;
        }

        /* ═══════════════════════════════════
           HOW IT WORKS
        ═══════════════════════════════════ */
        .lp-how {
          padding: 6rem 1.5rem;
          background: #0a0f1e;
        }
        .lp-how .lp-eyebrow { color: #818cf8; }
        .lp-how .lp-section-h2 { color: #f1f5f9; }
        .lp-how .lp-section-p { color: #64748b; }
        .lp-steps {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
          position: relative;
          margin-top: 1rem;
        }
        .lp-steps::before {
          content: '';
          position: absolute;
          top: 27px;
          left: calc(16.67% + 27px);
          right: calc(16.67% + 27px);
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(126,200,227,0.3) 20%, rgba(126,200,227,0.3) 80%, transparent);
        }
        @media (max-width: 640px) {
          .lp-steps { grid-template-columns: 1fr; }
          .lp-steps::before { display: none; }
        }
        .lp-step { text-align: center; padding: 0 0.5rem; }
        .lp-step-num {
          width: 54px; height: 54px;
          border-radius: 50%;
          background: rgba(126,200,227,0.08);
          border: 1.5px solid rgba(126,200,227,0.25);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          font-weight: 900;
          color: #818cf8;
          margin-bottom: 1.25rem;
          position: relative;
        }
        .lp-step-title {
          font-size: 0.975rem;
          font-weight: 700;
          color: #f1f5f9;
          margin-bottom: 0.6rem;
        }
        .lp-step-desc {
          font-size: 0.85rem;
          color: #475569;
          line-height: 1.7;
        }

        /* ═══════════════════════════════════
           SOCIAL PROOF / TRUST STRIP
        ═══════════════════════════════════ */
        .lp-trust {
          background: #f1f5f9;
          border-top: 1px solid #e2e8f0;
          border-bottom: 1px solid #e2e8f0;
          padding: 2.5rem 1.5rem;
          text-align: center;
        }
        .lp-trust-label {
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #94a3b8;
          margin-bottom: 1.5rem;
          display: block;
        }
        .lp-trust-items {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 2.5rem;
          flex-wrap: wrap;
        }
        .lp-trust-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #475569;
          font-size: 0.875rem;
          font-weight: 500;
        }
        .lp-trust-item svg { color: #818cf8; }

        /* ═══════════════════════════════════
           CTA BANNER
        ═══════════════════════════════════ */
        .lp-cta {
          padding: 6rem 1.5rem;
          background: #050b18;
          position: relative;
          overflow: hidden;
          text-align: center;
        }
        .lp-cta::before {
          content: '';
          position: absolute;
          width: 700px; height: 700px;
          background: radial-gradient(circle, rgba(126,200,227,0.07) 0%, transparent 70%);
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }
        .lp-cta-inner { position: relative; z-index: 1; max-width: 600px; margin: 0 auto; }
        .lp-cta h2 {
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 900;
          letter-spacing: -0.04em;
          color: #f8fafc;
          margin-bottom: 1rem;
          line-height: 1.1;
        }
        .lp-cta p {
          color: #64748b;
          font-size: 1.05rem;
          line-height: 1.7;
          margin-bottom: 2.5rem;
        }
        .lp-cta-btns {
          display: flex;
          gap: 0.875rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        /* ═══════════════════════════════════
           FOOTER
        ═══════════════════════════════════ */
        .lp-footer {
          background: #020609;
          border-top: 1px solid rgba(255,255,255,0.04);
          padding: 2rem 1.5rem;
        }
        .lp-footer-inner {
          max-width: 1100px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .lp-footer-brand {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .lp-footer-logo {
          width: 22px; height: 22px;
          background: linear-gradient(135deg, #818cf8, #a5b4fc);
          border-radius: 5px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.65rem;
          font-weight: 900;
          color: #0f172a;
        }
        .lp-footer-name { color: #475569; font-size: 0.85rem; font-weight: 600; }
        .lp-footer-copy { color: #1e293b; font-size: 0.78rem; }
        .lp-footer-links { display: flex; gap: 1.25rem; }
        .lp-footer-links a { color: #334155; font-size: 0.78rem; text-decoration: none; }
        .lp-footer-links a:hover { color: #818cf8; }

        /* ═══════════════════════════════════
           ANIMATIONS
        ═══════════════════════════════════ */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}} />

      <div className="lp">

        {/* ── HERO ── */}
        <section className="lp-hero">
          <div className="lp-hero-bg">
            <div className="lp-blob lp-blob-1" />
            <div className="lp-blob lp-blob-2" />
            <div className="lp-blob lp-blob-3" />
          </div>
          <div className="lp-hero-grid" />

          <div className="lp-hero-content">
            <div className="lp-badge">
              <span className="lp-badge-dot" />
              Live on Stellar Testnet
            </div>

            <h1>
              School fees,<br />
              <em>settled in seconds.</em>
            </h1>

            <p className="lp-hero-sub">
              Blockchain-powered payments that eliminate manual reconciliation,
              prevent fraud, and give parents instant proof — for a fraction of a cent per transaction.
            </p>

            <div className="lp-hero-actions">
              <Link href="/pay-fees" className="btn-cta">
                Pay Fees Now
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </Link>
              <Link href="/dashboard" className="btn-ghost">
                View Dashboard
              </Link>
            </div>
          </div>

          <div className="lp-scroll-hint">
            <div className="lp-scroll-arrow">
              <div className="lp-scroll-ball" />
            </div>
            Scroll
          </div>
        </section>

        {/* ── STATS BAND ── */}
        <div className="lp-stats-band">
          <div className="lp-container">
            <div className="lp-stats-inner">
              {STATS.map(({ v, l }) => (
                <div key={l} className="lp-stat">
                  <span className="lp-stat-v">{v}</span>
                  <span className="lp-stat-l">{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── FEATURES ── */}
        <section className="lp-features">
          <div className="lp-container">
            <div className="lp-section-header">
              <span className="lp-eyebrow">Why StellarEduPay</span>
              <h2 className="lp-section-h2">Built for how schools<br />actually work.</h2>
              <p className="lp-section-p">No PDFs. No bank transfers. No chasing payments. Just transparent, instant, verifiable transactions on a public blockchain.</p>
            </div>
            <div className="lp-features-grid">
              {FEATURES.map(({ icon, title, desc }) => (
                <div key={title} className="lp-feat">
                  <span className="lp-feat-icon">{icon}</span>
                  <p className="lp-feat-title">{title}</p>
                  <p className="lp-feat-desc">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TRUST STRIP ── */}
        <div className="lp-trust">
          <div className="lp-container">
            <span className="lp-trust-label">Built on proven technology</span>
            <div className="lp-trust-items">
              {[
                ["Stellar SDK v12", "⬡"],
                ["MongoDB Atlas-ready", "🍃"],
                ["BullMQ + Redis", "⚙"],
                ["JWT + TOTP MFA", "🔐"],
                ["Prometheus metrics", "📊"],
                ["OpenAPI documented", "📄"],
              ].map(([label, icon]) => (
                <div key={label} className="lp-trust-item">
                  <span>{icon}</span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── HOW IT WORKS ── */}
        <section className="lp-how">
          <div className="lp-container">
            <div className="lp-section-header">
              <span className="lp-eyebrow">How It Works</span>
              <h2 className="lp-section-h2">Three steps.<br />One transaction.</h2>
              <p className="lp-section-p">Parents pay. Stellar confirms. StellarEduPay matches, validates, and records — automatically.</p>
            </div>
            <div className="lp-steps">
              {STEPS.map(({ n, title, desc }) => (
                <div key={n} className="lp-step">
                  <div className="lp-step-num">{n}</div>
                  <p className="lp-step-title">{title}</p>
                  <p className="lp-step-desc">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="lp-cta">
          <div className="lp-cta-inner">
            <h2>Ready to run on blockchain?</h2>
            <p>Everything is already live. Connect a school wallet, register students, and start accepting on-chain fee payments today.</p>
            <div className="lp-cta-btns">
              <Link href="/pay-fees" className="btn-cta">Start Paying Fees</Link>
              <Link href="/dashboard" className="btn-ghost">Admin Dashboard</Link>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="lp-footer">
          <div className="lp-footer-inner">
            <div className="lp-footer-brand">
              <div className="lp-footer-logo">S</div>
              <span className="lp-footer-name">StellarEduPay</span>
            </div>
            <span className="lp-footer-copy">© {new Date().getFullYear()} MIT License</span>
            <div className="lp-footer-links">
              <a href="https://stellar.org" target="_blank" rel="noopener noreferrer">Stellar</a>
              <a href="https://github.com/manuelusman73-png/StellarEduPay" target="_blank" rel="noopener noreferrer">GitHub</a>
              <Link href="/api/docs">API Docs</Link>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
