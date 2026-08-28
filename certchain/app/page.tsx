import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔐</span>
          <span className="font-bold text-xl text-white">CertChain</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/verify"
            className="text-slate-300 hover:text-white transition-colors text-sm">
            Verify Certificate
          </Link>
          <Link href="/login"
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm transition-colors">
            Issuer Login
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-full px-4 py-2 mb-8">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-blue-300 text-sm">Live on Ethereum Sepolia Testnet</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
          Certificates you can{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
            trust
          </span>
        </h1>

        <p className="text-slate-400 text-xl max-w-2xl mb-12">
          Government certificates issued on the blockchain. Verified in 3 seconds.
          Tamper-proof. AI-validated. Free for anyone to verify.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/verify"
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all hover:scale-105">
            🔍 Verify a Certificate
          </Link>
          <Link href="/login"
            className="border border-slate-600 hover:border-slate-400 text-slate-300 hover:text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all">
            🏛️ Issuer Portal
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 mt-24 max-w-2xl w-full">
          {[
            { value: "< 3s",  label: "Verification time" },
            { value: "91%",   label: "AI fraud accuracy" },
            { value: "₹0",    label: "Cost to verify" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-slate-500 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="px-8 py-16 border-t border-slate-800 max-w-5xl mx-auto w-full">
        <h2 className="text-2xl font-bold text-white text-center mb-12">How it works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: "1",
              icon: "🏛️",
              title: "Issuer issues",
              desc: "Government officer fills the form. AI validates the certificate. It's minted on Ethereum blockchain.",
            },
            {
              step: "2",
              icon: "📄",
              title: "Holder receives",
              desc: "Certificate PDF with an embedded QR code is emailed to the holder. Permanent record on blockchain.",
            },
            {
              step: "3",
              icon: "✅",
              title: "Anyone verifies",
              desc: "Employer scans the QR code. Blockchain returns VALID / REVOKED / INVALID in under 3 seconds.",
            },
          ].map((item) => (
            <div key={item.step} className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="text-4xl mb-4">{item.icon}</div>
              <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="text-center py-8 text-slate-600 text-sm border-t border-slate-800">
        CertChain · SDG 9 & SDG 16 · Built with Ethereum + AI + Supabase
      </footer>
    </main>
  );
}
