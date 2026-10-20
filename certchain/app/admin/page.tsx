"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  ChevronLeft,
  Filter,
  Lock,
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

export default function AdminPanel() {
  const router   = useRouter();
  const supabase = createClient();
  const [certs,        setCerts]        = useState<Certificate[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [revokeModal,  setRevokeModal]  = useState<string | null>(null);
  const [revokeReason, setRevokeReason] = useState("");
  const [revoking,     setRevoking]     = useState(false);
  const [filter,       setFilter]       = useState("ALL");
  const [searchTerm,   setSearchTerm]   = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/login");
        return;
      }
    });
    loadAll();
  }, []);

  async function loadAll() {
    const res  = await fetch("/api/certificates?limit=100");
    const data = await res.json();
    setCerts(data.certificates ?? []);
    setLoading(false);
  }

  async function handleRevoke() {
    if (!revokeModal || !revokeReason.trim()) return;
    setRevoking(true);
    try {
      const res = await fetch(`/api/certificates/${revokeModal}/revoke`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ reason: revokeReason }),
      });
      if (!res.ok) throw new Error("Revocation failed");
      setRevokeModal(null);
      setRevokeReason("");
      loadAll();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setRevoking(false);
    }
  }

  const filtered = certs
    .filter(c => filter === "ALL" ? true : c.status === filter)
    .filter(c =>
      c.cert_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.holder_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.institution.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const stats = {
    total:   certs.length,
    active:  certs.filter(c => c.status === "ACTIVE").length,
    revoked: certs.filter(c => c.status === "REVOKED").length,
    flagged: certs.filter(c => c.fraud_score > 30).length,
  };

  return (
    <main className="min-h-screen bg-[#070b14] text-slate-100 p-8 selection:bg-blue-600/30 selection:text-white">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <Link href="/" className="inline-flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:border-blue-500/40 transition-colors">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="font-bold text-white tracking-tight">CertChain</span>
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-xs text-slate-400 font-medium">Protocol Governance & Revocation Authority</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-slate-400 font-mono">Sepolia Testnet</span>
          </div>
        </div>

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight">Institutional Registry Governance</h1>
          <p className="text-xs text-slate-400 mt-1">Audit issued credentials and execute cryptographic revocations on-chain.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Minted", value: stats.total, icon: FileText, color: "text-blue-400" },
            { label: "Active Registry", value: stats.active, icon: CheckCircle2, color: "text-emerald-400" },
            { label: "Revoked On-Chain", value: stats.revoked, icon: XCircle, color: "text-red-400" },
            { label: "Flagged Anomalies", value: stats.flagged, icon: AlertTriangle, color: "text-amber-400" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="bg-[#0c1322] border border-slate-800/80 rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-400">{item.label}</span>
                  <Icon className={`w-4 h-4 ${item.color}`} />
                </div>
                <div className="text-2xl font-bold text-white tracking-tight">{item.value}</div>
              </div>
            );
          })}
        </div>

        {/* Filter Controls & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-1.5 bg-[#0c1322] border border-slate-800 p-1 rounded-xl">
            {["ALL", "ACTIVE", "REVOKED"].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filter === s ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search registry..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0c1322] border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        {/* Certificate Table */}
        <div className="bg-[#0c1322] border border-slate-800/90 rounded-2xl overflow-hidden shadow-xl shadow-black/20">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500">Querying protocol registry...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">No records matching query criteria.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800/80 text-slate-400 font-medium bg-[#090f1d]/50">
                    <th className="px-6 py-3">Certificate ID</th>
                    <th className="px-6 py-3">Recipient</th>
                    <th className="px-6 py-3">Institution</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Anomaly Index</th>
                    <th className="px-6 py-3">Explorer</th>
                    <th className="px-6 py-3 text-right">Governance Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {filtered.map((cert) => (
                    <tr key={cert.cert_id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-3.5 font-mono text-blue-400 font-medium">{cert.cert_id}</td>
                      <td className="px-6 py-3.5 text-slate-200 font-medium">{cert.holder_name}</td>
                      <td className="px-6 py-3.5 text-slate-400">{cert.institution}</td>
                      <td className="px-6 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            cert.status === "ACTIVE"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-red-500/10 text-red-400 border border-red-500/20"
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
                      <td className="px-6 py-3.5">
                        {cert.tx_hash ? (
                          <a
                            href={`https://sepolia.etherscan.io/tx/${cert.tx_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-slate-400 hover:text-blue-400 font-mono text-xs transition-colors"
                          >
                            <span>Etherscan</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        {cert.status === "ACTIVE" ? (
                          <button
                            onClick={() => setRevokeModal(cert.cert_id)}
                            className="text-red-400 hover:text-red-300 text-xs font-medium border border-red-500/20 hover:border-red-500/40 px-2.5 py-1 rounded-lg transition-all"
                          >
                            Revoke On-Chain
                          </button>
                        ) : (
                          <span className="text-slate-600 text-xs">Revoked</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Revocation Modal */}
        {revokeModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-[#0c1322] border border-red-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center gap-2.5 text-red-400">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <h3 className="font-bold text-white text-base">Confirm On-Chain Revocation</h3>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                You are about to cryptographically revoke <span className="font-mono text-blue-400">{revokeModal}</span> on Ethereum. This transaction modifies the state mapping permanently and cannot be undone.
              </p>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Official Revocation Reason</label>
                <textarea
                  rows={3}
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  className="w-full bg-[#080d19] border border-slate-700/80 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition-colors"
                  placeholder="Specify legal or institutional grounds (e.g., Degree cancelled due to academic malpractice)"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setRevokeModal(null);
                    setRevokeReason("");
                  }}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRevoke}
                  disabled={revoking || !revokeReason.trim()}
                  className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white py-2.5 rounded-xl text-xs font-medium transition-all shadow-md shadow-red-600/20"
                >
                  {revoking ? "Broadcasting Revocation..." : "Execute Revocation"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
