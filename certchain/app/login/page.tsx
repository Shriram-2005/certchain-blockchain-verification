"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ShieldCheck, Lock, Mail, KeyRound, ArrowRight, Building2, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const router   = useRouter();
  const supabase = createClient();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { role: "issuer" }
        }
      });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      router.push("/issuer");
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      const role = data.user?.user_metadata?.role ?? "issuer";
      if (role === "admin") {
        router.push("/admin");
      } else {
        router.push("/issuer");
      }
    }
  }

  return (
    <main className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center p-6 selection:bg-blue-600/30 selection:text-white">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:border-blue-500/40 transition-colors">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">CertChain</span>
          </Link>
          <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-400 font-medium">
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Institutional Authority & Issuer Portal</span>
          </div>
        </div>

        {/* Authentication Card */}
        <div className="bg-[#0c1322] border border-slate-800/90 rounded-2xl p-8 shadow-xl shadow-black/40">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-white tracking-tight">
              {isSignUp ? "Register Issuer Account" : "Authorized Officer Login"}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {isSignUp
                ? "Provision credentials for university registrar or government authority"
                : "Sign in with your institutional credentials to mint and audit records"}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Official Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#080d19] border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono text-xs"
                  placeholder="officer@institution.gov"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Security Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#080d19] border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono text-xs"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-xs">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-all shadow-md shadow-blue-600/20 text-sm flex items-center justify-center gap-2 mt-2"
            >
              <span>{loading ? "Verifying Credentials..." : isSignUp ? "Create Issuer Account" : "Access Portal"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            
            <div className="pt-3 border-t border-slate-800/80 text-center">
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setIsSignUp(!isSignUp);
                }}
                className="text-slate-400 hover:text-white text-xs font-medium transition-colors"
              >
                {isSignUp
                  ? "Already have an authorized account? Sign in"
                  : "Need to provision a new issuer account? Sign up"}
              </button>
            </div>
          </form>
        </div>

        {/* Security Disclaimers */}
        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <Lock className="w-3.5 h-3.5 text-slate-600" />
          <span>Role-Based Access Control enforced via Supabase JWT Authentication</span>
        </div>
      </div>
    </main>
  );
}
