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

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }
      setUser(user);
    });
    loadCertificates();
  }, []);

  async function loadCertificates() {
    const res  = await fetch("/api/certificates?limit=10");
    const data = await res.json();
    if (data.certificates) {
      setCerts(data.certificates);
      const active  = data.certificates.filter((c: Certificate) => c.status === "ACTIVE").length;
      const revoked = data.certificates.filter((c: Certificate) => c.status === "REVOKED").length;
      const avgFraud = data.certificates.reduce((a: number, c: Certificate) => a + (c.fraud_score || 0), 0) / (data.certificates.length || 1);
      setStats({ total: data.total ?? 0, active, revoked, avgFraud: Math.round(avgFraud) });
    }
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const statusColors: Record<string, string> = {
    ACTIVE:    "text-green-400  bg-green-400/10",
    REVOKED:   "text-red-400    bg-red-400/10",
    SUSPENDED: "text-yellow-400 bg-yellow-400/10",
  };

  return (
    <main className="min-h-screen bg-slate-950">
      {/* Sidebar nav */}
      <div className="flex">
        <aside className="w-64 min-h-screen bg-slate-900 border-r border-slate-800 p-6 flex flex-col">
          <Link href="/" className="flex items-center gap-2 mb-8">
            <span className="text-xl">🔐</span>
            <span className="font-bold text-white">CertChain</span>
          </Link>

          <nav className="flex-1 space-y-1">
            {[
              { href: "/issuer",       icon: "📊", label: "Dashboard" },
              { href: "/issuer/issue", icon: "➕", label: "Issue Certificate" },
            ].map(item => (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-sm">
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="border-t border-slate-800 pt-4 mt-4">
            <p className="text-slate-500 text-xs mb-3 truncate">{user?.email}</p>
            <button onClick={handleLogout}
              className="text-slate-500 hover:text-red-400 text-sm transition-colors">
              Sign out
            </button>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white">Dashboard</h1>
              <p className="text-slate-500 text-sm mt-1">Manage your issued certificates</p>
            </div>
            <Link href="/issuer/issue"
              className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors">
              + Issue Certificate
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total Issued",  value: stats.total,    icon: "📋" },
              { label: "Active",        value: stats.active,   icon: "✅" },
              { label: "Revoked",       value: stats.revoked,  icon: "❌" },
              { label: "Avg Fraud Score", value: `${stats.avgFraud}/100`, icon: "🧠" },
            ].map(stat => (
              <div key={stat.label} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="text-2xl mb-1">{stat.icon}</div>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-slate-500 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Certificate table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-white font-semibold">Recent Certificates</h2>
            </div>

            {loading ? (
              <div className="p-8 text-center text-slate-500">Loading...</div>
            ) : certs.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-slate-500 mb-4">No certificates issued yet</p>
                <Link href="/issuer/issue"
                  className="text-blue-400 hover:text-blue-300 text-sm">
                  Issue your first certificate →
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-800">
                      {["Cert ID", "Holder", "Type", "Institution", "Status", "Fraud Score", "Issued", ""].map(h => (
                        <th key={h} className="text-left px-6 py-3 font-normal">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {certs.map(cert => (
                      <tr key={cert.cert_id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 font-mono text-blue-400 text-xs">{cert.cert_id}</td>
                        <td className="px-6 py-4 text-white">{cert.holder_name}</td>
                        <td className="px-6 py-4 text-slate-400">{cert.cert_type}</td>
                        <td className="px-6 py-4 text-slate-400">{cert.institution}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[cert.status] ?? "text-slate-400 bg-slate-800"}`}>
                            {cert.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`font-mono ${cert.fraud_score > 70 ? "text-red-400" : cert.fraud_score > 30 ? "text-yellow-400" : "text-green-400"}`}>
                            {cert.fraud_score}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-xs">
                          {new Date(cert.issued_at).toLocaleDateString("en-IN")}
                        </td>
                        <td className="px-6 py-4">
                          <a href={`https://sepolia.etherscan.io/tx/${cert.tx_hash}`}
                            target="_blank" rel="noopener noreferrer"
                            className="text-slate-500 hover:text-blue-400 transition-colors text-xs">
                            View →
                          </a>
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
