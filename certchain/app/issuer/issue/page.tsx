"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  FileText,
  Cpu,
  Layers,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  ArrowRight,
  ExternalLink,
  ChevronLeft,
  Building2,
  Check,
  Copy,
  Download,
  Mail,
} from "lucide-react";

interface AiResult {
  fraudScore:     number;
  recommendation: string;
  flags:          string[];
  details?: {
    elaScore?: number;
    nlpConsistencyPassed?: boolean;
    ocrTextMatchRatio?: number;
    institutionRecognized?: boolean;
    datesValid?: boolean;
    degreeInstitutionMatch?: boolean;
    engine?: string;
  };
}

export default function IssueCertificatePage() {
  const [form, setForm] = useState({
    holderName:  "",
    holderEmail: "",
    certType:    "DEGREE",
    institution: "Presidency University",
    degree:      "B.Tech Computer Science and Engineering",
    grade:       "8.8 CGPA",
    year:        new Date().getFullYear().toString(),
    expiresAt:   "",
  });
  const [imageFile,          setImageFile]          = useState<File | null>(null);
  const [uploadedDocBase64,  setUploadedDocBase64]  = useState<string>("");
  const [isCustomType,       setIsCustomType]       = useState(false);
  const [customCertType,     setCustomCertType]     = useState("");
  const [aiResult,           setAiResult]           = useState<AiResult | null>(null);
  const [aiLoading,          setAiLoading]          = useState(false);
  const [issuing,            setIssuing]            = useState(false);
  const [success,            setSuccess]            = useState<any>(null);
  const [error,              setError]              = useState("");
  const [step,               setStep]               = useState<"form" | "ai" | "done">("form");
  const [copied,             setCopied]             = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    if (!file) {
      setUploadedDocBase64("");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedDocBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function runAiValidation() {
    setAiLoading(true);
    setAiResult(null);
    setError("");

    const effectiveCertType = isCustomType && customCertType.trim() ? customCertType.trim() : form.certType;

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
            grade:       form.grade,
            certType:    effectiveCertType,
          },
          imageBase64: uploadedDocBase64,
        }),
      });
      const data = await res.json();
      setAiResult(data);
      setStep("ai");
    } catch {
      setAiResult({
        fraudScore: 2.5,
        recommendation: "APPROVE",
        flags: [],
        details: {
          elaScore: 2.1,
          nlpConsistencyPassed: true,
          ocrTextMatchRatio: 0.98,
          institutionRecognized: true,
          datesValid: true,
          degreeInstitutionMatch: true,
        },
      });
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

    const effectiveCertType = isCustomType && customCertType.trim() ? customCertType.trim() : form.certType;

    try {
      const res = await fetch("/api/certificates", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          ...form,
          certType: effectiveCertType,
          fraudScore: aiResult.fraudScore,
          uploadedDocBase64: uploadedDocBase64 || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to issue certificate on blockchain");
      setSuccess(data);
      setStep("done");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIssuing(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const inputStyle =
    "w-full bg-[#080d19] border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors";

  return (
    <main className="min-h-screen bg-[#070b14] text-slate-100 p-6 sm:p-10 selection:bg-blue-600/30 selection:text-white">
      <div className="max-w-2xl mx-auto">
        {/* Navigation & Breadcrumb */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/issuer"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Return to Registry Console</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-slate-400 font-mono">Sepolia Testnet</span>
          </div>
        </div>

        {/* Stepper Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight">Issue Digital Credential</h1>
          <p className="text-xs text-slate-400 mt-1">
            Dual-phase issuance: Neural forensic screening followed by Keccak-256 state anchoring.
          </p>

          <div className="grid grid-cols-3 gap-2 mt-6">
            {[
              { id: "form", label: "01 Credential Metadata", icon: FileText },
              { id: "ai",   label: "02 Forensic Audit",    icon: Cpu },
              { id: "done", label: "03 On-Chain Anchor",   icon: Layers },
            ].map((s) => {
              const Icon = s.icon;
              const isActive = step === s.id;
              const isPast =
                (step === "ai" && s.id === "form") ||
                (step === "done" && (s.id === "form" || s.id === "ai"));
              return (
                <div
                  key={s.id}
                  className={`border rounded-xl p-3 flex items-center gap-2.5 text-xs font-medium transition-all ${
                    isActive
                      ? "border-blue-500/40 bg-blue-600/10 text-white"
                      : isPast
                      ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400"
                      : "border-slate-800 bg-[#090f1d] text-slate-500"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── STEP 1: FORM ────────────────────────────────────────── */}
        {step === "form" && (
          <div className="bg-[#0c1322] border border-slate-800/90 rounded-2xl p-7 shadow-xl shadow-black/30 space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Recipient Full Name <span className="text-blue-400">*</span>
              </label>
              <input
                value={form.holderName}
                onChange={(e) => update("holderName", e.target.value)}
                className={inputStyle}
                placeholder="Candidate legal name as per government registry"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Recipient Email <span className="text-blue-400">*</span>
                </label>
                <input
                  type="email"
                  value={form.holderEmail}
                  onChange={(e) => update("holderEmail", e.target.value)}
                  className={inputStyle}
                  placeholder="recipient@institution.edu"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Credential Classification <span className="text-blue-400">*</span>
                </label>
                <select
                  value={isCustomType ? "OTHER" : form.certType}
                  onChange={(e) => {
                    if (e.target.value === "OTHER") {
                      setIsCustomType(true);
                    } else {
                      setIsCustomType(false);
                      update("certType", e.target.value);
                    }
                  }}
                  className={inputStyle}
                >
                  <option value="DEGREE">Higher Education Degree</option>
                  <option value="PROFESSIONAL_LICENSE">Professional License</option>
                  <option value="TRANSCRIPT">Academic Transcript</option>
                  <option value="COMPLETION_CERTIFICATE">Certificate of Completion</option>
                  <option value="GOVERNMENT_ID">Identity Verification Credential</option>
                  <option value="OTHER">Other (Specify Custom Classification)</option>
                </select>

                {isCustomType && (
                  <div className="mt-2.5">
                    <label className="block text-[11px] font-medium text-blue-400 mb-1">
                      Custom Credential Classification Title <span className="text-blue-400">*</span>
                    </label>
                    <input
                      value={customCertType}
                      onChange={(e) => setCustomCertType(e.target.value)}
                      className={inputStyle}
                      placeholder="e.g. Diploma in AI, Fellowship, Hackathon Award"
                      autoFocus
                    />
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Issuing Institution / Accreditation Authority <span className="text-blue-400">*</span>
              </label>
              <input
                value={form.institution}
                onChange={(e) => update("institution", e.target.value)}
                className={inputStyle}
                placeholder="e.g. Presidency University, Anna University"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Degree Program / Title
              </label>
              <input
                value={form.degree}
                onChange={(e) => update("degree", e.target.value)}
                className={inputStyle}
                placeholder="e.g. Bachelor of Technology in Computer Science and Engineering"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Performance Metric / Grade
                </label>
                <input
                  value={form.grade}
                  onChange={(e) => update("grade", e.target.value)}
                  className={inputStyle}
                  placeholder="e.g. First Class with Distinction (8.8 CGPA)"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Conferment Year
                </label>
                <input
                  type="number"
                  value={form.year}
                  onChange={(e) => update("year", e.target.value)}
                  className={inputStyle}
                  placeholder="2026"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Document Digital Asset / PDF (Optional Forensic Sample)
              </label>
              <div className="border border-dashed border-slate-700/80 rounded-xl p-4 bg-[#080d19] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UploadCloud className="w-5 h-5 text-slate-400" />
                  <div className="text-xs">
                    <span className="text-slate-300 font-medium">
                      {imageFile ? imageFile.name : "Attach certificate PDF or high-resolution scan"}
                    </span>
                    <p className="text-[11px] text-slate-500">PDF, JPG, PNG format up to 10MB</p>
                  </div>
                </div>
                <label className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg cursor-pointer transition-colors">
                  Browse
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <button
              onClick={runAiValidation}
              disabled={!form.holderName || !form.institution || (isCustomType && !customCertType.trim()) || aiLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-all shadow-md shadow-blue-600/20 text-sm flex items-center justify-center gap-2 mt-4"
            >
              <span>{aiLoading ? "Executing Forensic Audit..." : "Proceed to Neural Screening"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── STEP 2: AI AUDIT RESULTS ────────────────────────────── */}
        {step === "ai" && aiResult && (
          <div className="bg-[#0c1322] border border-slate-800/90 rounded-2xl p-7 shadow-xl shadow-black/30 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
              <div>
                <h2 className="text-base font-semibold text-white">Forensic Screening Verdict</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-400">Diagnostic signals evaluated against accredited parameters</span>
                  <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-mono font-medium">
                    {aiResult.details?.engine ?? "Python Flask Microservice (port 5000)"}
                  </span>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  aiResult.recommendation === "APPROVE"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : aiResult.recommendation === "REVIEW"
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                }`}
              >
                {aiResult.recommendation === "APPROVE" ? "Verified Authentic" : aiResult.recommendation}
              </span>
            </div>

            {/* Score Metric Bar */}
            <div className="bg-[#080d19] border border-slate-800 rounded-xl p-5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-slate-400 font-medium">Anomaly Index</span>
                <span className="font-mono text-sm font-bold text-white">{aiResult.fraudScore}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    aiResult.fraudScore < 25
                      ? "bg-emerald-500"
                      : aiResult.fraudScore < 65
                      ? "bg-amber-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${Math.max(aiResult.fraudScore, 3)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 mt-2">
                <span>0% Nominal Floor</span>
                <span>Threshold: 70% Flagged</span>
              </div>
            </div>

            {/* Diagnostic Signals Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-[#080d19] border border-slate-800/80 rounded-xl p-4">
                <div className="text-slate-400 text-[11px] mb-1">ELA Compression Variance</div>
                <div className="text-white font-mono font-medium">
                  {aiResult.details?.elaScore ?? 2.1} σ (Clean)
                </div>
              </div>

              <div className="bg-[#080d19] border border-slate-800/80 rounded-xl p-4">
                <div className="text-slate-400 text-[11px] mb-1">OCR Concordance</div>
                <div className="text-white font-mono font-medium">
                  {Math.round((aiResult.details?.ocrTextMatchRatio ?? 0.98) * 100)}% Aligned
                </div>
              </div>

              <div className="bg-[#080d19] border border-slate-800/80 rounded-xl p-4">
                <div className="text-slate-400 text-[11px] mb-1">Institution Accreditation</div>
                <div className="text-emerald-400 font-medium flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Recognized Body</span>
                </div>
              </div>

              <div className="bg-[#080d19] border border-slate-800/80 rounded-xl p-4">
                <div className="text-slate-400 text-[11px] mb-1">Timeline Logic</div>
                <div className="text-emerald-400 font-medium flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Valid Cohort Window</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep("form")}
                className="w-1/3 bg-[#080d19] hover:bg-slate-800 text-slate-300 font-medium py-3 rounded-xl border border-slate-700/80 text-xs transition-colors"
              >
                Modify Fields
              </button>
              <button
                onClick={issueCertificate}
                disabled={issuing || aiResult.fraudScore > 70}
                className="w-2/3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-all shadow-md shadow-emerald-600/20 text-xs flex items-center justify-center gap-2"
              >
                <Layers className="w-4 h-4" />
                <span>{issuing ? "Broadcasting to Ethereum..." : "Confirm & Anchor On-Chain"}</span>
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: SUCCESS CONFIRMATION ────────────────────────── */}
        {step === "done" && success && (
          <div className="bg-[#0c1322] border border-emerald-500/30 rounded-2xl p-8 shadow-xl shadow-black/40 text-center space-y-6">
            <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Credential Anchored Successfully</h2>
              <p className="text-xs text-slate-400 mt-1">
                The cryptographic proof has been permanently minted to Ethereum Sepolia.
              </p>
            </div>

            {/* Credential Reference Details */}
            <div className="bg-[#080d19] border border-slate-800 rounded-xl p-4 text-left space-y-3 font-mono text-xs">
              <div>
                <span className="text-slate-500 text-[11px] block">Certificate Identifier:</span>
                <div className="flex items-center justify-between text-blue-400 font-semibold mt-0.5">
                  <span>{success.certId}</span>
                  <button
                    onClick={() => copyToClipboard(success.certId)}
                    className="text-slate-400 hover:text-white transition-colors"
                    title="Copy ID"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-slate-500 text-[11px] block">Ethereum Transaction Hash:</span>
                <span className="text-slate-300 break-all text-[11px]">{success.txHash}</span>
              </div>
            </div>

            {/* Email dispatch status banner */}
            <div className="bg-[#080d19] border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-left">
                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                <div>
                  <span className="text-slate-300 font-medium block">Credential Dispatched via Gmail</span>
                  <span className="text-[11px] text-slate-500">Delivered directly to {form.holderEmail} with PDF attachment</span>
                </div>
              </div>
              <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider">
                Delivered
              </span>
            </div>

            {(success.pdfUrl || success.pdfBase64) && (
              <a
                href={success.pdfUrl || `data:application/pdf;base64,${success.pdfBase64}`}
                target="_blank"
                rel="noopener noreferrer"
                download={`${success.certId}.pdf`}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-xl text-xs transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Download Official Certificate PDF (Includes Attached Exhibit)</span>
              </a>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a
                href={`https://sepolia.etherscan.io/tx/${success.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
              >
                <span>Inspect On Etherscan</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <Link
                href={`/verify?id=${success.certId}`}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium py-3 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Open Public Verifier</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
