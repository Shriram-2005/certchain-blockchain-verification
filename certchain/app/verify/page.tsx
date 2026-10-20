"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Building2,
  User,
  Award,
  ExternalLink,
  ChevronLeft,
  Copy,
  Check,
  RotateCcw,
  Download,
} from "lucide-react";

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
  pdfUrl?:      string;
  certHash?:    string;
}

export default function VerifyPage() {
  const [certId,  setCertId]  = useState("");
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState<VerifyResult | null>(null);
  const [error,   setError]   = useState("");
  const [copied,  setCopied]  = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("id");
      if (id) {
        setCertId(id);
        handleVerify(id);
      }
    }
  }, []);

  async function handleVerify(id?: string) {
    const queryId = id ?? certId;
    if (!queryId.trim()) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch(`/api/verify?certId=${encodeURIComponent(queryId.trim())}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Failed to query blockchain record");
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <main className="min-h-screen bg-[#070b14] text-slate-100 p-6 sm:p-10 selection:bg-blue-600/30 selection:text-white flex flex-col justify-between">
      <div className="max-w-2xl mx-auto w-full">
        {/* Navigation */}
        <header className="flex items-center justify-between py-4 mb-10 border-b border-slate-800/80">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:border-blue-500/40 transition-colors">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="font-bold text-white tracking-tight">CertChain</span>
          </Link>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-500 hidden sm:inline">Decentralized Verifier</span>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <Link href="/login" className="text-slate-400 hover:text-white transition-colors">
              Issuer Login
            </Link>
          </div>
        </header>

        {/* Hero Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs px-3 py-1 rounded-full mb-3 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Zero-Knowledge Read-Only Protocol</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Public Credential Verifier</h1>
          <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
            Verify academic degrees, government certificates, and professional accreditations directly against the Ethereum blockchain ledger.
          </p>
        </div>

        {/* Search Bar Input */}
        <div className="bg-[#0c1322] border border-slate-800/90 rounded-2xl p-6 mb-6 shadow-xl shadow-black/30">
          <label className="block text-xs font-medium text-slate-300 mb-2">
            Enter Certificate ID
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={certId}
                onChange={(e) => setCertId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                className="w-full bg-[#080d19] border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all uppercase"
                placeholder="CERT-2026-XXXXXXXX"
              />
            </div>
            <button
              onClick={() => handleVerify()}
              disabled={loading || !certId.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl font-medium text-xs transition-all shadow-md shadow-blue-600/20 flex items-center gap-1.5"
            >
              {loading ? (
                <span>Querying RPC...</span>
              ) : (
                <>
                  <span>Verify</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-xs mb-6 flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Verification Result Card */}
        {result && (
          <div
            className={`rounded-2xl border p-7 mb-6 shadow-2xl transition-all ${
              result.valid
                ? "bg-[#09151c]/90 border-emerald-500/30"
                : result.status === "NOT_FOUND"
                ? "bg-[#0e121e] border-slate-800"
                : "bg-[#180f14]/90 border-red-500/30"
            }`}
          >
            {/* Header Badge */}
            <div className="flex items-center justify-between pb-5 border-b border-slate-800/80 mb-6">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    result.valid
                      ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                      : result.status === "NOT_FOUND"
                      ? "bg-slate-800 text-slate-400"
                      : "bg-red-500/10 border border-red-500/20 text-red-400"
                  }`}
                >
                  {result.valid ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : result.status === "NOT_FOUND" ? (
                    <Search className="w-5 h-5" />
                  ) : (
                    <XCircle className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h2
                    className={`text-base font-bold tracking-tight ${
                      result.valid
                        ? "text-emerald-400"
                        : result.status === "NOT_FOUND"
                        ? "text-slate-300"
                        : "text-red-400"
                    }`}
                  >
                    {result.valid
                      ? "Cryptographically Valid & Active"
                      : result.status === "NOT_FOUND"
                      ? "No Blockchain Record Found"
                      : `Credential ${result.status}`}
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-xs text-slate-400">{result.certId}</span>
                    <button
                      onClick={() => copyToClipboard(result.certId ?? "")}
                      className="text-slate-500 hover:text-white transition-colors"
                      title="Copy ID"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="hidden sm:block text-right">
                <span className="text-[10px] uppercase font-semibold text-slate-500 block">Ledger State</span>
                <span className="text-xs font-mono text-slate-300">Ethereum Sepolia</span>
              </div>
            </div>

            {/* Valid Details */}
            {result.valid && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-[#080d19]/80 border border-slate-800/80 rounded-xl p-3.5 flex items-start gap-3">
                    <User className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-500 text-[11px] block">Credential Holder</span>
                      <span className="text-white font-semibold text-sm">{result.holderName}</span>
                    </div>
                  </div>

                  <div className="bg-[#080d19]/80 border border-slate-800/80 rounded-xl p-3.5 flex items-start gap-3">
                    <Building2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-500 text-[11px] block">Accredited Authority</span>
                      <span className="text-white font-semibold text-sm">{result.institution}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#080d19]/80 border border-slate-800/80 rounded-xl p-4 flex items-start gap-3">
                  <Award className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-500 text-[11px] block">Degree & Academic Qualification</span>
                    <span className="text-white font-medium text-xs">{result.degree}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between text-slate-400 text-[11px] pt-1">
                  <span>
                    Conferment Date:{" "}
                    <span className="text-slate-200 font-medium">
                      {result.issuedAt
                        ? new Date(result.issuedAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })
                        : "—"}
                    </span>
                  </span>
                  <span>
                    Credential Class: <span className="text-slate-200 font-medium">{result.certType}</span>
                  </span>
                </div>

                {/* Cryptographic Keccak-256 Proof */}
                {result.certHash && (
                  <div className="bg-[#080d19] border border-slate-800 rounded-xl p-3.5 space-y-1.5 font-mono text-xs">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-sans font-semibold text-slate-300">Ethereum Keccak-256 State Proof</span>
                      <span className="text-emerald-400 font-sans text-[10px] bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                        Tamper-Evident
                      </span>
                    </div>
                    <div className="text-blue-400 break-all text-[11px] select-all">
                      {result.certHash}
                    </div>
                    <p className="text-[10px] font-sans text-slate-500 leading-normal pt-1">
                      Cryptographic guarantee: Any modification to the candidate name, degree, or grade causes the hash to diverge from the Ethereum Sepolia ledger.
                    </p>
                  </div>
                )}

                {/* Download Certificate PDF */}
                {result.pdfUrl && (
                  <div className="pt-2">
                    <a
                      href={result.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="w-full bg-[#0c1a2e] hover:bg-[#12243d] border border-blue-500/30 text-blue-400 hover:text-blue-300 font-medium py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Official Certificate PDF</span>
                    </a>
                  </div>
                )}

                {/* Blockchain Proof Link */}
                {result.txHash && (
                  <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">Immutable State Anchored</span>
                    <a
                      href={`https://sepolia.etherscan.io/tx/${result.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-medium text-xs transition-colors"
                    >
                      <span>View Blockchain Proof on Etherscan</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Revoked Notice */}
            {result.status === "REVOKED" && (
              <div className="text-xs text-red-300/90 leading-relaxed bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                This credential was officially revoked by the issuing institution. Revocation events are cryptographically recorded in the smart contract audit trail.
              </div>
            )}

            {/* Not Found Guidance */}
            {result.status === "NOT_FOUND" && (
              <div className="text-xs text-slate-400 leading-relaxed bg-slate-900 border border-slate-800 rounded-xl p-4">
                The identifier <code className="text-blue-400">{result.certId}</code> does not match any certificate in the decentralized registry. Please verify the ID or contact the issuing authority.
              </div>
            )}
          </div>
        )}

        {/* Reset Search Button */}
        {result && (
          <button
            onClick={() => {
              setResult(null);
              setCertId("");
              setError("");
            }}
            className="w-full bg-[#0c1322] hover:bg-slate-800 text-slate-300 font-medium py-3 rounded-xl border border-slate-800 text-xs transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Verify Another Certificate</span>
          </button>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center py-6 text-slate-600 text-[11px] mt-12 border-t border-slate-800/80">
        CertChain Protocol · Verifier calls execute free of gas charges via read-only EVM RPC
      </footer>
    </main>
  );
}
