"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  LayoutDashboard,
  PlusCircle,
  LogOut,
  FileText,
  CheckCircle2,
  XCircle,
  Cpu,
  ExternalLink,
  ChevronRight,
  Search,
} from "lucide-react";

interface Certificate {
  cert_id:     string;
  holder_name: string;
  cert_type:   string;
  institution: string;
  status:      string;
  issued_at:   string;
  tx_hash:     string;
  fraud_score: number;
}

interface Stats {
  total:    number;
  active:   number;
  revoked:  number;
  avgFraud: number;
}

export default function IssuerDashboard() {
  const router   = useRouter();
  const supabase = createClient();
  const [certs,   setCerts]   = useState<Certificate[]>([]);
  const [stats,   setStats]   = useState<Stats>({ total: 0, active: 0, revoked: 0, avgFraud: 0 });
  const [loading, setLoading] = useState(true);
  const [user,    setUser]    = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }
      setUser(user);
    });
    loadCertificates();
  }, []);

  async function loadCertificates() {
    const res  = await fetch("/api/certificates?limit=50");
    const data = await res.json();
    if (data.certificates) {
      setCerts(data.certificates);
      const active  = data.certificates.filter((c: Certificate) => c.status === "ACTIVE").length;
      const revoked = data.certificates.filter((c: Certificate) => c.status === "REVOKED").length;
      const avgFraud = data.certificates.reduce((a: number, c: Certificate) => a + (c.fraud_score || 0), 0) / (data.certificates.length || 1);
      setStats({ total: data.total ?? data.certificates.length, active, revoked, avgFraud: Math.round(avgFraud * 10) / 10 });
    }
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const filteredCerts = certs.filter(c =>
    c.cert_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.holder_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.institution.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col selection:bg-blue-600/30 selection:text-white">
      {/* Top Navbar */}
      <header className="h-16 border-b border-slate-800/80 bg-[#0a0f1d] px-8 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="font-bold text-white text-base tracking-tight">CertChain</span>
          </Link>
          <span className="text-slate-600">/</span>
          <span className="text-xs text-slate-400 font-medium">Issuer Management Console</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-xs text-white font-medium">{user?.email}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Authorized Registrar</div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-500/30 px-3 py-1.5 rounded-lg transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex max-w-7xl mx-auto w-full p-8 gap-8">
        {/* Sidebar Nav */}
        <aside className="w-56 shrink-0 hidden md:block">
          <nav className="space-y-1">
            <Link
              href="/issuer"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium bg-blue-600/10 text-blue-400 border border-blue-500/20"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Registry Overview</span>
            </Link>
            <Link
              href="/issuer/issue"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Issue Credential</span>
            </Link>
            <Link
              href="/verify"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent transition-all"
            >
              <Search className="w-4 h-4" />
              <span>Public Verifier</span>
            </Link>
          </nav>
        </aside>

        {/* Dashboard Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Institutional Dashboard</h1>
              <p className="text-slate-400 text-xs mt-1">Cryptographic credential issuance ledger and AI telemetry</p>
            </div>
            <Link
              href="/issuer/issue"
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-md shadow-blue-600/20 flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Issue New Credential</span>
            </Link>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total Minted", value: stats.total, icon: FileText, sub: "Recorded on Sepolia" },
              { label: "Active Credentials", value: stats.active, icon: CheckCircle2, sub: "Valid & verified", color: "text-emerald-400" },
              { label: "Revoked Certificates", value: stats.revoked, icon: XCircle, sub: "Flagged on-chain", color: "text-red-400" },
              { label: "Mean Anomaly Score", value: `${stats.avgFraud}%`, icon: Cpu, sub: "AI pre-screening mean", color: "text-blue-400" },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="bg-[#0c1322] border border-slate-800/80 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-slate-400">{stat.label}</span>
                    <Icon className={`w-4 h-4 ${stat.color ?? "text-slate-500"}`} />
                  </div>
                  <div className="text-2xl font-bold text-white tracking-tight">{stat.value}</div>
                  <div className="text-[11px] text-slate-500 mt-1">{stat.sub}</div>
                </div>
              );
            })}
          </div>

          {/* Table Container */}
          <div className="bg-[#0c1322] border border-slate-800/90 rounded-2xl overflow-hidden shadow-xl shadow-black/20">
            <div className="px-6 py-4 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-white">Issued Credentials Ledger</h2>
                <p className="text-xs text-slate-500">Real-time sync with Ethereum state mapping</p>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter by ID, Holder, Institution..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-[#080d19] border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-64 transition-all"
                />
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center text-xs text-slate-500">Retrieving blockchain records...</div>
            ) : filteredCerts.length === 0 ? (
              <div className="p-16 text-center">
                <FileText className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm font-medium">No certificates found</p>
                <p className="text-slate-600 text-xs mt-1">Start by issuing a new credential to the Ethereum ledger.</p>
                <Link
                  href="/issuer/issue"
                  className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 text-xs font-medium mt-4"
                >
                  <span>Issue your first certificate</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800/80 text-slate-400 font-medium bg-[#090f1d]/50">
                      <th className="px-6 py-3">Certificate ID</th>
                      <th className="px-6 py-3">Recipient Name</th>
                      <th className="px-6 py-3">Credential Type</th>
                      <th className="px-6 py-3">Issuing Authority</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Forensic Score</th>
                      <th className="px-6 py-3">Timestamp</th>
                      <th className="px-6 py-3 text-right">Explorer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {filteredCerts.map((cert) => (
                      <tr key={cert.cert_id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-3.5 font-mono text-blue-400 font-medium">{cert.cert_id}</td>
                        <td className="px-6 py-3.5 text-slate-200 font-medium">{cert.holder_name}</td>
                        <td className="px-6 py-3.5 text-slate-400">{cert.cert_type}</td>
                        <td className="px-6 py-3.5 text-slate-400">{cert.institution}</td>
                        <td className="px-6 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                              cert.status === "ACTIVE"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : cert.status === "REVOKED"
                                ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                cert.status === "ACTIVE" ? "bg-emerald-400" : "bg-red-400"
                              }`}
                            />
                            {cert.status}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 font-mono text-slate-300">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              cert.fraud_score < 25
                                ? "bg-emerald-500/10 text-emerald-400"
                                : cert.fraud_score < 65
                                ? "bg-amber-500/10 text-amber-400"
                                : "bg-red-500/10 text-red-400"
                            }`}
                          >
                            {cert.fraud_score}%
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-slate-500 text-[11px]">
                          {new Date(cert.issued_at).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          {cert.tx_hash ? (
                            <a
                              href={`https://sepolia.etherscan.io/tx/${cert.tx_hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-slate-400 hover:text-blue-400 transition-colors text-xs font-mono"
                            >
                              <span>Proof</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
