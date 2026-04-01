import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#1e3a5f] text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚡</span>
          <span className="text-xl font-black text-amber-400">VoltPass</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/inspect" className="text-blue-300 hover:text-white text-sm">Inspector PWA</Link>
          <Link href="/login" className="bg-amber-400 text-[#1e3a5f] px-4 py-2 rounded-lg font-bold text-sm hover:bg-amber-300 transition">
            Employer Login
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto text-center py-24 px-6">
        <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
          Work in any state.<br />
          <span className="text-amber-400">Verified in 30 seconds.</span>
        </h1>
        <p className="text-xl text-blue-200 mb-10 max-w-2xl mx-auto">
          VoltPass is a portable digital credential wallet for licensed electricians.
          Check multi-state compliance instantly. Share your license with a QR code.
          Works offline.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <a href="#download" className="bg-amber-400 text-[#1e3a5f] px-8 py-4 rounded-xl font-black text-lg hover:bg-amber-300 transition">
            Get the App
          </a>
          <Link href="/dashboard" className="border-2 border-blue-300 text-blue-200 px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-900/30 transition">
            Employer Portal →
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto py-20 px-6 grid md:grid-cols-3 gap-8">
        {[
          { icon: '🔐', title: 'Cryptographically Signed', desc: 'Every license is signed with Ed25519. Verifiable offline, no internet needed.' },
          { icon: '🗺', title: 'Multi-State Compliance', desc: 'Instant check against reciprocity rules for all 50 states. See exactly what steps remain.' },
          { icon: '📲', title: 'QR Verification', desc: 'Share your credential via QR. Employers and inspectors can verify on any device.' },
        ].map(({ icon, title, desc }) => (
          <div key={title} className="bg-white/10 rounded-2xl p-6">
            <div className="text-4xl mb-4">{icon}</div>
            <h3 className="text-xl font-bold mb-2">{title}</h3>
            <p className="text-blue-200 leading-relaxed">{desc}</p>
          </div>
        ))}
      </section>

      {/* Pilot states */}
      <section className="max-w-5xl mx-auto py-12 px-6 text-center">
        <p className="text-blue-300 mb-4 font-semibold tracking-widest text-sm uppercase">Now live in 10 states</p>
        <div className="flex flex-wrap justify-center gap-3">
          {['TX', 'CA', 'FL', 'NV', 'AZ', 'CO', 'GA', 'NC', 'VA', 'PA'].map(s => (
            <span key={s} className="bg-amber-400/20 text-amber-300 border border-amber-400/40 px-4 py-2 rounded-lg font-bold">{s}</span>
          ))}
        </div>
      </section>

      <footer className="text-center py-10 text-blue-400 text-sm">
        © {new Date().getFullYear()} VoltPass · Built for electricians, by electricians.
      </footer>
    </main>
  );
}
