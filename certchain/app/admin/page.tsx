"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

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

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || user.user_metadata?.role !== "admin") {
        router.push("/login");
        return;
      }
    });
    loadAll();
  }, []);

  async function loadAll() {
    const res  = await fetch("/api/certificates?limit=50");
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

  const filtered = filter === "ALL" ? certs : certs.filter(c => c.status === filter);

  const statusColors: Record<string, string> = {
    ACTIVE:    "text-green-400  bg-green-400/10",
    REVOKED:   "text-red-400    bg-red-400/10",
    SUSPENDED: "text-yellow-400 bg-yellow-400/10",
  };

  const stats = {
    total:   certs.length,
    active:  certs.filter(c => c.status === "ACTIVE").length,
    revoked: certs.filter(c => c.status === "REVOKED").length,
    flagged: certs.filter(c => c.fraud_score > 30).length,
  };

  return (
    <main className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl">🔐</span>
              <span className="font-bold text-white">CertChain</span>
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-slate-400 text-sm">Admin Panel</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Certificates", value: stats.total,   icon: "📋", color: "blue"  },
            { label: "Active",             value: stats.active,  icon: "✅", color: "green" },
            { label: "Revoked",            value: stats.revoked, icon: "❌", color: "red"   },
            { label: "AI Flagged (>30)",   value: stats.flagged, icon: "🚩", color: "yellow"},
          ].map(s => (
            <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-slate-500 text-sm">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4">
          {["ALL", "ACTIVE", "REVOKED", "SUSPENDED"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f ? "bg-blue-600 text-white" : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}>
              {f}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-800">
                    {["Cert ID", "Holder", "Type", "Institution", "Status", "Fraud", "Date", "Actions"].map(h => (
                      <th key={h} className="text-left px-6 py-3 font-normal">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(cert => (
                    <tr key={cert.cert_id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4 font-mono text-blue-400 text-xs">{cert.cert_id}</td>
                      <td className="px-6 py-4 text-white">{cert.holder_name}</td>
                      <td className="px-6 py-4 text-slate-400 text-xs">{cert.cert_type}</td>
                      <td className="px-6 py-4 text-slate-400">{cert.institution}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[cert.status] ?? "text-slate-400 bg-slate-800"}`}>
                          {cert.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-mono text-sm ${cert.fraud_score > 70 ? "text-red-400" : cert.fraud_score > 30 ? "text-yellow-400" : "text-green-400"}`}>
                          {cert.fraud_score}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        {new Date(cert.issued_at).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <a href={`https://sepolia.etherscan.io/tx/${cert.tx_hash}`}
                            target="_blank" rel="noopener noreferrer"
                            className="text-slate-500 hover:text-blue-400 text-xs transition-colors">
                            Chain ↗
                          </a>
                          {cert.status === "ACTIVE" && (
                            <button onClick={() => setRevokeModal(cert.cert_id)}
                              className="text-red-500 hover:text-red-400 text-xs transition-colors">
                              Revoke
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Revoke Modal */}
      {revokeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-white font-semibold text-lg mb-2">Revoke Certificate</h3>
            <p className="text-slate-400 text-sm mb-4">
              Revoke <span className="font-mono text-blue-400">{revokeModal}</span>?
              This action is <strong className="text-red-400">permanent</strong> and recorded on the blockchain.
            </p>
            <textarea
              value={revokeReason}
              onChange={e => setRevokeReason(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm resize-none mb-4"
              rows={3}
              placeholder="Reason for revocation (required)"
            />
            <div className="flex gap-3">
              <button onClick={() => { setRevokeModal(null); setRevokeReason(""); }}
                className="flex-1 border border-slate-700 text-slate-400 py-2.5 rounded-xl text-sm transition-colors hover:text-white">
                Cancel
              </button>
              <button onClick={handleRevoke} disabled={revoking || !revokeReason.trim()}
                className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors">
                {revoking ? "Revoking..." : "Confirm Revoke"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
