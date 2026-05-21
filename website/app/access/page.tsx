"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Brain, Lock, RefreshCw } from "lucide-react";

export default function AccessPage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setError("Invalid access code.");
      setCode("");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-genius-black flex items-center justify-center p-4"
      style={{ backgroundImage: "linear-gradient(rgba(0,255,65,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,65,0.03) 1px, transparent 1px)", backgroundSize: "40px 40px" }}>
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-genius-green flex items-center justify-center">
              <Brain size={22} className="text-genius-black" />
            </div>
            <span className="font-black text-2xl text-white">Green<span className="text-genius-green">Genius</span>AI</span>
          </div>
        </div>
        <div className="genius-card rounded-2xl p-8 border border-genius-border">
          <div className="flex justify-center mb-5">
            <div className="w-14 h-14 rounded-2xl bg-genius-green/10 border border-genius-green/30 flex items-center justify-center">
              <Lock size={26} className="text-genius-green" />
            </div>
          </div>
          <h1 className="text-xl font-black text-white text-center mb-1">Private Access</h1>
          <p className="text-xs text-genius-muted text-center font-mono mb-6">Enter your access code to continue</p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="password"
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="Access code"
              required
              autoFocus
              className="w-full bg-genius-black border border-genius-border rounded-xl px-4 py-3.5 text-white text-center text-2xl font-mono tracking-widest placeholder-genius-muted/40 focus:outline-none focus:border-genius-green transition-colors"
            />
            {error && <p className="text-red-400 text-xs text-center font-mono">{error}</p>}
            <button type="submit" disabled={loading || !code}
              className="btn-genius w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <><RefreshCw size={15} className="animate-spin" /> Verifying...</> : "Enter →"}
            </button>
          </form>
        </div>
        <p className="text-center text-xs text-genius-muted/40 font-mono mt-6">© 2026 GreenGeniusAI · Private</p>
      </div>
    </div>
  );
}
