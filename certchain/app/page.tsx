import Link from "next/link";
import {
  ShieldCheck,
  Search,
  Building2,
  Lock,
  Cpu,
  Database,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Layers,
  FileCheck2,
  Sparkles,
} from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col selection:bg-blue-600/30 selection:text-white">
      {/* Top Protocol Telemetry Bar */}
      <div className="w-full bg-[#0a0f1d] border-b border-slate-800/80 px-6 py-2 text-xs text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-medium text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Sepolia Testnet Active
          </span>
          <span className="text-slate-600">|</span>
          <span className="hidden sm:inline font-mono text-slate-400">
            Contract: 0xfbE80a8e42a9c141f615A82EFf3c1403Ce4f5E95
          </span>
        </div>
        <a
          href="https://sepolia.etherscan.io/address/0xfbE80a8e42a9c141f615A82EFf3c1403Ce4f5E95"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-slate-400 hover:text-blue-400 transition-colors"
        >
          <span>Etherscan Explorer</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-slate-800/60 backdrop-blur-md sticky top-0 z-50 bg-[#070b14]/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-lg text-white tracking-tight">CertChain</span>
            <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-semibold tracking-wider text-blue-400/90 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
              Decentralized Credential Protocol
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/verify"
            className="flex items-center gap-2 text-slate-300 hover:text-white text-sm font-medium transition-colors px-3 py-2"
          >
            <Search className="w-4 h-4 text-slate-400" />
            <span>Verify Credential</span>
          </Link>
          <Link
            href="/login"
            className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-lg text-sm transition-all shadow-sm shadow-blue-500/20 hover:shadow-blue-500/30 flex items-center gap-1.5"
          >
            <span>Issuer Portal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 max-w-5xl mx-auto w-full">
        <div className="inline-flex items-center gap-2 bg-slate-900/80 border border-slate-800 rounded-full px-3.5 py-1.5 mb-8 text-xs text-slate-300 shadow-inner">
          <Cpu className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-medium">Dual-Engine Verification: Neural Forensic Screening & Ethereum Anchoring</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white mb-6 leading-[1.15]">
          Cryptographic Integrity for Academic & Professional Credentials
        </h1>

        <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mb-10 leading-relaxed font-normal">
          Immutable certificate minting anchored to the Ethereum Virtual Machine. Pre-screened with Error Level Analysis and OCR, accessible worldwide for zero-cost public verification.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link
            href="/verify"
            className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-8 py-3.5 rounded-xl text-base transition-all flex items-center justify-center gap-2.5 shadow-lg shadow-blue-600/20 hover:scale-[1.02]"
          >
            <Search className="w-4 h-4" />
            <span>Public Verification Portal</span>
          </Link>
          <Link
            href="/login"
            className="bg-[#0e1628] hover:bg-[#131d33] border border-slate-800 hover:border-slate-700 text-slate-200 font-medium px-8 py-3.5 rounded-xl text-base transition-all flex items-center justify-center gap-2.5"
          >
            <Building2 className="w-4 h-4 text-slate-400" />
            <span>Authorized Institution Login</span>
          </Link>
        </div>

        {/* Protocol Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20 max-w-4xl w-full">
          {[
            { metric: "< 2.8s", label: "On-Chain Resolution Time", desc: "Instant RPC lookup" },
            { metric: "100%", label: "Public Read Accessibility", desc: "Zero gas & zero wallet needed" },
            { metric: "Keccak-256", label: "Cryptographic Tamper-Proofing", desc: "State-anchored hashing" },
            { metric: "3-Factor", label: "AI Pre-Screening Protocol", desc: "ELA, OCR & NLP consistency" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-[#0b1120] border border-slate-800/80 rounded-xl p-5 text-left flex flex-col justify-between"
            >
              <div className="text-2xl font-bold text-white mb-1 tracking-tight">{stat.metric}</div>
              <div>
                <div className="text-slate-300 text-xs font-semibold mb-0.5">{stat.label}</div>
                <div className="text-slate-500 text-[11px]">{stat.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Protocol Architecture Workflow */}
      <section className="px-8 py-20 border-t border-slate-800/80 bg-[#090e1a]/50">
        <div className="max-w-5xl mx-auto w-full">
          <div className="text-center mb-14">
            <span className="text-xs uppercase font-semibold tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded">
              Architecture & Lifecycle
            </span>
            <h2 className="text-3xl font-bold text-white mt-4 tracking-tight">The Three-Pillar Trust Infrastructure</h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto mt-2">
              Combining pre-issuance machine intelligence, decentralized smart contracts, and high-performance relational storage.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: "Phase 01",
                icon: Cpu,
                title: "Forensic Pre-Screening",
                desc: "Uploaded certificates undergo Error Level Analysis (ELA) for image compression variance, optical character extraction, and NLP curriculum verification.",
              },
              {
                step: "Phase 02",
                icon: Layers,
                title: "Ethereum Minting",
                desc: "Verified metadata generates an immutable Keccak-256 hash anchored to the Solidity CertificateRegistry contract with real-time audit event logging.",
              },
              {
                step: "Phase 03",
                icon: FileCheck2,
                title: "Instant Public Verification",
                desc: "Third parties, employers, and background checkers verify authenticity via Certificate ID or digital QR scan with instant live explorer validation.",
              },
            ].map((col) => {
              const Icon = col.icon;
              return (
                <div
                  key={col.step}
                  className="bg-[#0c1322] border border-slate-800/90 rounded-2xl p-7 flex flex-col justify-between hover:border-slate-700 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div className="w-10 h-10 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-mono font-medium text-slate-500">{col.step}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2.5 tracking-tight">{col.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{col.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Security & Standards Footnote */}
      <footer className="border-t border-slate-800/80 bg-[#070b14] py-10 px-8 text-xs text-slate-500">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-400" />
            <span className="text-slate-400 font-medium">Enterprise Web3 Credential Infrastructure</span>
          </div>
          <div className="flex items-center gap-6">
            <span>Solidity 0.8.20</span>
            <span>OpenZeppelin Ownable</span>
            <span>Ethereum Sepolia Testnet</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
