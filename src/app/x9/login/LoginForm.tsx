"use client";

import { useState } from "react";
import { adminLogin } from "./actions";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await adminLogin(formData);

    if (result.success) {
      router.push("/x9");
    } else {
      setError(result.error || "Login failed");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="pop p-3 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm">
          {error}
        </div>
      )}
      
      <div className="space-y-2">
        <label className="text-sm font-semibold text-[var(--ink)]">Admin Email</label>
        <input 
          type="email" 
          name="email" 
          required 
          className="w-full px-4 py-3 border rounded-lg outline-none focus:border-[var(--ink)] focus:ring-4 focus:ring-[var(--hi-soft)] transition-all"
          style={{ borderColor: "var(--rule)", background: "var(--paper)" }}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-[var(--ink)]">Password</label>
        <div className="relative">
          <input 
            type={showPassword ? "text" : "password"} 
            name="password" 
            required 
            className="w-full px-4 py-3 border rounded-lg outline-none focus:border-[var(--ink)] focus:ring-4 focus:ring-[var(--hi-soft)] transition-all pr-12"
            style={{ borderColor: "var(--rule)", background: "var(--paper)" }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--mute)] hover:text-[var(--ink)] transition-colors"
          >
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
            )}
          </button>
        </div>
      </div>

      <button 
        type="submit" 
        disabled={loading}
        className="press w-full py-3 bg-[var(--hi)] text-[var(--ink)] rounded-lg font-bold hover:brightness-95 disabled:opacity-50 mt-4"
      >
        {loading ? "Authenticating..." : "Login to Dashboard"}
      </button>
    </form>
  );
}
