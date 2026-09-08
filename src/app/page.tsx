"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { doLogin } from "@/app/actions/auth";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await doLogin(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-[#0B0F19] font-sans">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-brand-600/20 mix-blend-screen blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-fuchsia-600/20 mix-blend-screen blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[20%] right-[10%] w-[40vw] h-[40vw] rounded-full bg-blue-600/20 mix-blend-screen blur-[120px] animate-pulse" style={{ animationDelay: '4s' }}></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Glassmorphism Card */}
        <div className="backdrop-blur-2xl bg-white/5 p-8 sm:p-12 rounded-[2.5rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] border border-white/10 relative overflow-hidden">
          
          {/* Inner subtle glow in the card */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-fuchsia-500 mb-6 shadow-lg shadow-brand-500/30">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h1 className="text-[28px] font-extrabold text-white tracking-tight leading-[1.2]">
              HRIS <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 to-fuchsia-300">PT Sahada Laku Utama</span>
            </h1>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-rose-200 backdrop-blur-md">
              <div className="flex gap-3 items-center">
                <svg className="h-5 w-5 shrink-0 text-rose-400" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                </svg>
                <div className="text-sm font-medium">{error}</div>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-slate-300 ml-1 tracking-wide">Email</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-brand-400 text-slate-400">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="admin@ptslu.id"
                  className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-brand-400/50 focus:bg-white/10 focus:ring-4 focus:ring-brand-400/10 transition-all backdrop-blur-md"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-slate-300 ml-1 tracking-wide">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-brand-400 text-slate-400">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  placeholder="••••••••"
                  className="w-full h-14 pl-12 pr-12 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-brand-400/50 focus:bg-white/10 focus:ring-4 focus:ring-brand-400/10 transition-all backdrop-blur-md"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-white transition-colors"
                  aria-label="Toggle password"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.94 10.94 0 0112 19c-6.5 0-10-7-10-7a21.79 21.79 0 014.29-5.36"></path>
                      <path d="M1 1l22 22"></path>
                      <path d="M9.88 9.88a3 3 0 104.24 4.24"></path>
                      <path d="M12 5c6.5 0 10 7 10 7a21.79 21.79 0 01-4.29 5.36"></path>
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-2xl text-white font-bold text-[15px]
                     bg-gradient-to-r from-brand-600 to-fuchsia-600 hover:from-brand-500 hover:to-fuchsia-500
                     disabled:opacity-70 disabled:cursor-not-allowed
                     shadow-[0_8px_20px_-6px_rgba(124,58,237,0.5)]
                     transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-8"
            >
              {loading ? "Authenticating..." : "Sign In"}
              {!loading && (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14"></path>
                  <path d="M12 5l7 7-7 7"></path>
                </svg>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
