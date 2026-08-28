"use client";

import { useState } from "react";
import Link from "next/link";

interface AiResult {
  fraudScore:     number;
  recommendation: string;
  flags:          string[];
}

export default function IssueCertificatePage() {
  const [form, setForm] = useState({
    holderName:  "",
    holderEmail: "",
    certType:    "DEGREE",
    institution: "",
    degree:      "",
    grade:       "",
    year:        new Date().getFullYear().toString(),
    expiresAt:   "",
  });
  const [imageFile,  setImageFile]  = useState<File | null>(null);
  const [aiResult,   setAiResult]   = useState<AiResult | null>(null);
  const [aiLoading,  setAiLoading]  = useState(false);
  const [issuing,    setIssuing]    = useState(false);
  const [success,    setSuccess]    = useState<any>(null);
  const [error,      setError]      = useState("");
  const [step,       setStep]       = useState<"form" | "ai" | "issue" | "done">("form");

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function runAiValidation() {
    setAiLoading(true);
    setAiResult(null);

    let imageBase64 = "";
    if (imageFile) {
      const buf = await imageFile.arrayBuffer();
      imageBase64 = "data:image/jpeg;base64," + Buffer.from(buf).toString("base64");
    }

    try {
      const res = await fetch("/api/ai/validate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          certText: {
            holderName:  form.holderName,
            institution: form.institution,
            degree:      form.degree,
            year:        form.year,
          },
          imageBase64,
        }),
      });
      const data = await res.json();
      setAiResult(data);
      setStep("ai");
    } catch {
      setAiResult({ fraudScore: 0, recommendation: "APPROVE", flags: ["ai_unavailable"] });
      setStep("ai");
    } finally {
      setAiLoading(false);
    }
  }

  async function issueCertificate() {
    if (!aiResult) return;
    if (aiResult.fraudScore > 70) return;
    setIssuing(true);
    setError("");

    try {
      const res = await fetch("/api/certificates", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ ...form, fraudScore: aiResult.fraudScore }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to issue certificate");
      setSuccess(data);
      setStep("done");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIssuing(false);
    }
  }

  const fraudColor =
    (aiResult?.fraudScore ?? 0) < 30 ? "green" :
    (aiResult?.fraudScore ?? 0) < 70 ? "yellow" : "red";

  return (
    <main className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/issuer" className="text-slate-500 hover:text-white transition-colors text-sm">
            ← Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-white">Issue New Certificate</h1>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8 text-sm">
          {["Fill Details", "AI Validation", "Issue on Blockchain", "Done"].map((s, i) => {
            const stepKeys = ["form", "ai", "issue", "done"];
            const current  = stepKeys.indexOf(step);
            return (
              <div key={s} className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  i <= current ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-500"
                }`}>{i + 1}</span>
                <span className={i <= current ? "text-white" : "text-slate-600"}>{s}</span>
                {i < 3 && <span className="text-slate-700 mx-1">→</span>}
              </div>
            );
          })}
        </div>

        {/* ── STEP 1: Form ──────────────────────────────── */}
        {step === "form" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <Row2 label="Full Name" required>
              <input value={form.holderName} onChange={e => update("holderName", e.target.value)}
                className={input} placeholder="Certificate holder's full name" />
            </Row2>
            <Row2 label="Email Address" required>
              <input type="email" value={form.holderEmail} onChange={e => update("holderEmail", e.target.value)}
                className={input} placeholder="holder@email.com" />
            </Row2>
            <Row2 label="Certificate Type" required>
              <select value={form.certType} onChange={e => update("certType", e.target.value)} className={input}>
                <option>DEGREE</option>
                <option>PROFESSIONAL_LICENSE</option>
                <option>BIRTH_CERTIFICATE</option>
                <option>COMPLETION_CERTIFICATE</option>
                <option>GOVERNMENT_ID</option>
                <option>OTHER</option>
              </select>
            </Row2>
            <Row2 label="Institution / Authority" required>
              <input value={form.institution} onChange={e => update("institution", e.target.value)}
                className={input} placeholder="e.g. Anna University, Ministry of Education" />
            </Row2>
            <Row2 label="Degree / Title">
              <input value={form.degree} onChange={e => update("degree", e.target.value)}
                className={input} placeholder="e.g. B.Tech Computer Science" />
            </Row2>
            <div className="grid grid-cols-2 gap-4">
              <Row2 label="Grade / Score">
                <input value={form.grade} onChange={e => update("grade", e.target.value)}
                  className={input} placeholder="e.g. 8.5 CGPA" />
              </Row2>
              <Row2 label="Year">
                <input type="number" value={form.year} onChange={e => update("year", e.target.value)}
                  className={input} placeholder="2025" />
              </Row2>
            </div>
            <Row2 label="Expiry Date (optional)">
              <input type="date" value={form.expiresAt} onChange={e => update("expiresAt", e.target.value)}
                className={input} />
            </Row2>
            <Row2 label="Supporting Document (optional)">
              <input type="file" accept="image/*,application/pdf"
                onChange={e => setImageFile(e.target.files?.[0] ?? null)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-400 text-sm file:mr-3 file:bg-blue-600 file:text-white file:border-0 file:rounded file:px-3 file:py-1 file:text-xs cursor-pointer" />
            </Row2>

            <button
              onClick={runAiValidation}
              disabled={!form.holderName || !form.institution || aiLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-colors mt-2"
            >
              {aiLoading ? "🧠 Validating with AI..." : "🧠 Validate with AI →"}
            </button>
          </div>
        )}

        {/* ── STEP 2: AI Result ──────────────────────────────── */}
        {step === "ai" && aiResult && (
          <div className="space-y-4">
            <div className={`bg-slate-900 border rounded-2xl p-6 ${
              fraudColor === "green" ? "border-green-500/40" :
              fraudColor === "yellow" ? "border-yellow-500/40" : "border-red-500/40"
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-semibold">AI Fraud Detection Result</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                  fraudColor === "green"  ? "bg-green-500/20  text-green-400"  :
                  fraudColor === "yellow" ? "bg-yellow-500/20 text-yellow-400" :
                                           "bg-red-500/20    text-red-400"
                }`}>
                  {aiResult.recommendation}
                </span>
              </div>

              {/* Score bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-slate-500 mb-2">
                  <span>Fraud Score</span>
                  <span className="font-mono font-bold text-white">{aiResult.fraudScore}/100</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      fraudColor === "green" ? "bg-green-500" : fraudColor === "yellow" ? "bg-yellow-500" : "bg-red-500"
                    }`}
                    style={{ width: `${aiResult.fraudScore}%` }}
                  />
                </div>
              </div>

              {aiResult.flags.length > 0 && (
                <div>
                  <p className="text-slate-500 text-xs mb-2">Flags detected:</p>
                  <div className="flex flex-wrap gap-2">
                    {aiResult.flags.map(f => (
                      <span key={f} className="bg-slate-800 text-slate-300 px-2 py-1 rounded text-xs font-mono">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {aiResult.fraudScore > 70 ? (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <p className="text-red-400 font-semibold mb-2">❌ Issuance Blocked</p>
                <p className="text-red-400/80 text-sm">
                  The AI detected signs of fraud. This certificate cannot be issued.
                  Please review the uploaded document.
                </p>
                <button onClick={() => { setStep("form"); setAiResult(null); }}
                  className="text-sm text-red-400 hover:text-red-300 underline mt-3">
                  ← Edit and retry
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <button onClick={() => { setStep("form"); setAiResult(null); }}
                  className="flex-1 border border-slate-700 text-slate-400 hover:text-white py-3 rounded-xl text-sm transition-colors">
                  ← Edit Details
                </button>
                <button
                  onClick={issueCertificate}
                  disabled={issuing}
                  className="flex-2 flex-1 bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  {issuing ? "⏳ Issuing on Blockchain..." : "⛓️ Issue on Blockchain →"}
                </button>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
                {error}
              </div>
            )}
          </div>
        )}

        {/* ── STEP DONE ──────────────────────────────── */}
        {step === "done" && success && (
          <div className="bg-green-500/5 border border-green-500/30 rounded-2xl p-8 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-xl font-bold text-white mb-2">Certificate Issued!</h2>
            <p className="text-slate-400 mb-6">
              Successfully anchored on the Ethereum Sepolia blockchain.
            </p>

            <div className="bg-slate-900 rounded-xl p-4 text-left mb-6 space-y-2">
              <div className="flex gap-3 text-sm">
                <span className="text-slate-500 min-w-28">Certificate ID</span>
                <span className="font-mono text-blue-400">{success.certId}</span>
              </div>
              <div className="flex gap-3 text-sm">
                <span className="text-slate-500 min-w-28">Transaction</span>
                <a href={`https://sepolia.etherscan.io/tx/${success.txHash}`}
                  target="_blank" rel="noopener noreferrer"
                  className="font-mono text-blue-400 hover:text-blue-300 truncate">
                  {success.txHash?.slice(0, 20)}...
                </a>
              </div>
            </div>

            <div className="flex gap-3">
              <a href={success.pdfUrl} target="_blank" rel="noopener noreferrer"
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl text-sm font-semibold transition-colors">
                📄 Download PDF
              </a>
              <Link href="/issuer/issue"
                className="flex-1 border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white py-3 rounded-xl text-sm transition-colors text-center">
                Issue Another
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

const input = "w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors text-sm";

function Row2({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label className="block text-sm text-slate-400 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}
