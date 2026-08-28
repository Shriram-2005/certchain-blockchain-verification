"use client";

import { useState } from "react";
import Link from "next/link";

interface VerifyResult {
  valid:        boolean;
  status:       string;
  certId?:      string;
  holderName?:  string;
  certType?:    string;
  institution?: string;
  degree?:      string;
  issuedAt?:    string;
  txHash?:      string;
  etherscanUrl?: string;
  reason?:      string;
  expiredAt?:   string;
}

export default function VerifyPage() {
  const [certId,  setCertId]  = useState("");
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState<VerifyResult | null>(null);
  const [error,   setError]   = useState("");

  // Check if we have a ?id= query param on mount
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id && !certId) setCertId(id);
  }

  async function handleVerify(id?: string) {
    const queryId = id ?? certId;
    if (!queryId.trim()) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch(`/api/verify?certId=${encodeURIComponent(queryId.trim())}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Verification failed");
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Auto-verify if id is in URL
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id && !result && !loading && !error) {
      handleVerify(id);
    }
  }

  const statusConfig = {
    ACTIVE:   { color: "green",  icon: "✅", label: "Valid & Active" },
    REVOKED:  { color: "red",    icon: "❌", label: "Revoked" },
    SUSPENDED:{ color: "yellow", icon: "⚠️", label: "Suspended" },
    EXPIRED:  { color: "orange", icon: "⏰", label: "Expired" },
    NOT_FOUND:{ color: "gray",   icon: "🔍", label: "Not Found" },
  } as const;

  const cfg = result ? (statusConfig[result.status as keyof typeof statusConfig] ?? statusConfig.NOT_FOUND) : null;

  return (
    <main className="min-h-screen bg-slate-950 p-6">
      {/* Header */}
      <header className="max-w-2xl mx-auto flex items-center justify-between py-4 mb-12">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl">🔐</span>
          <span className="font-bold text-white">CertChain</span>
        </Link>
        <span className="text-slate-500 text-sm">Public Verifier</span>
      </header>

      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white mb-3">Verify a Certificate</h1>
          <p className="text-slate-400">
            Enter a certificate ID or scan its QR code to verify authenticity on the blockchain
          </p>
        </div>

        {/* Input */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
          <label className="block text-sm text-slate-400 mb-3">Certificate ID</label>
          <div className="flex gap-3">
            <input
              type="text"
              value={certId}
              onChange={e => setCertId(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleVerify()}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono text-sm transition-colors"
              placeholder="CERT-2025-XXXXXXXX"
            />
            <button
              onClick={() => handleVerify()}
              disabled={loading || !certId.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white px-6 py-3 rounded-xl font-semibold transition-colors whitespace-nowrap"
            >
              {loading ? "Checking..." : "Verify"}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm mb-6">
            {error}
          </div>
        )}

        {/* Result Card */}
        {result && cfg && (
          <div className={`rounded-2xl border p-6 mb-6 ${
            result.valid
              ? "bg-green-500/5 border-green-500/30"
              : result.status === "NOT_FOUND"
              ? "bg-slate-800 border-slate-700"
              : "bg-red-500/5 border-red-500/30"
          }`}>
            {/* Status badge */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-4xl">{cfg.icon}</span>
              <div>
                <div className={`text-xl font-bold ${
                  result.valid ? "text-green-400" : "text-red-400"
                }`}>
                  {cfg.label}
                </div>
                <div className="text-slate-500 text-sm">
                  {result.certId}
                </div>
              </div>
            </div>

            {/* Certificate details */}
            {result.valid && (
              <div className="space-y-3">
                <Row label="Holder Name"  value={result.holderName} />
                <Row label="Type"         value={result.certType} />
                <Row label="Institution"  value={result.institution} />
                <Row label="Degree"       value={result.degree} />
                <Row label="Issued"       value={result.issuedAt ? new Date(result.issuedAt).toLocaleDateString("en-IN", { dateStyle: "long" }) : undefined} />
              </div>
            )}

            {result.status === "REVOKED" && (
              <p className="text-red-400 text-sm mt-4">
                This certificate has been revoked by the issuing authority.
              </p>
            )}

            {/* Blockchain proof */}
            {result.txHash && (
              <div className="mt-6 pt-4 border-t border-slate-700">
                <a
                  href={result.etherscanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-sm transition-colors flex items-center gap-2"
                >
                  🔗 View blockchain proof on Etherscan →
                </a>
              </div>
            )}
          </div>
        )}

        {/* Verify another */}
        {result && (
          <button
            onClick={() => { setResult(null); setCertId(""); setError(""); }}
            className="w-full border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white py-3 rounded-xl transition-colors text-sm"
          >
            Verify another certificate
          </button>
        )}
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-4">
      <span className="text-slate-500 text-sm min-w-28">{label}</span>
      <span className="text-white text-sm font-medium">{value}</span>
    </div>
  );
}
