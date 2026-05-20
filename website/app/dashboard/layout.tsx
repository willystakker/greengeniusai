"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Brain, Bell, Settings, LogOut, BarChart3, Activity,
  Shield, PieChart, Zap, ToggleLeft, ToggleRight, CreditCard,
} from "lucide-react";
import { getUser, clearUser } from "@/lib/auth";
import { getBotConfig } from "@/lib/bot-config";

const NAV = [
  { icon: BarChart3,   label: "Portfolio",     href: "/dashboard" },
  { icon: Activity,    label: "Live Trades",   href: "/dashboard/trades" },
  { icon: Brain,       label: "AI Insights",   href: "/dashboard/insights" },
  { icon: PieChart,    label: "Allocation",    href: "/dashboard/allocation" },
  { icon: Shield,      label: "Risk Settings", href: "/dashboard/risk" },
  { icon: Bell,        label: "Alerts",        href: "/dashboard/alerts" },
  { icon: CreditCard,  label: "Billing",       href: "/dashboard/billing" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [botActive,   setBotActive]   = useState(true);
  const [riskLevel,   setRiskLevel]   = useState<"conservative"|"moderate"|"aggressive">("moderate");
  const [threshold,   setThreshold]   = useState(80);
  const [notifications] = useState(3);

  useEffect(() => {
    const user = getUser();
    if (!user) { router.push("/auth"); return; }
    setRiskLevel((user as any).riskProfile || "moderate");
    setBotActive((user as any).botActive ?? true);
    const cfg = getBotConfig();
    setThreshold(cfg.confidenceThreshold);
    setBotActive(cfg.botActive);
  }, [router]);

  const handleSignOut = async () => { await clearUser(); router.push("/"); };

  return (
    <div className="min-h-screen bg-genius-black text-genius-text flex">
      {/* ── SIDEBAR ── */}
      <aside className="w-64 border-r border-genius-border bg-genius-dark flex flex-col fixed top-0 left-0 bottom-0 z-30">
        {/* Logo */}
        <div className="p-5 border-b border-genius-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-genius-green flex items-center justify-center">
              <Brain size={18} className="text-genius-black" />
            </div>
            <span className="font-black text-lg text-white">
              Green<span className="text-genius-green">Genius</span>AI
            </span>
          </div>
        </div>

        {/* Bot Status */}
        <div className="p-4 border-b border-genius-border">
          <div className="genius-card rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-genius-muted">AI BOT STATUS</span>
              <button
                onClick={() => setBotActive(b => !b)}
                className={`transition-colors ${botActive ? "text-genius-green" : "text-genius-muted"}`}
              >
                {botActive ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
              </button>
            </div>
            <div className="flex items-center gap-2">
              {botActive ? (
                <><div className="live-dot" /><span className="text-xs font-bold text-genius-green font-mono">ACTIVE</span></>
              ) : (
                <><div className="w-2 h-2 rounded-full bg-genius-muted" /><span className="text-xs font-bold text-genius-muted font-mono">PAUSED</span></>
              )}
            </div>
            {botActive && (
              <div className="mt-1.5 flex items-center gap-1.5">
                <div className="flex-1 h-1 bg-genius-border rounded-full overflow-hidden">
                  <div className="h-full bg-genius-green rounded-full" style={{width:`${threshold}%`}} />
                </div>
                <span className="text-xs text-genius-muted font-mono">{threshold}% conf</span>
              </div>
            )}
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 p-4 flex flex-col gap-1 overflow-y-auto">
          {NAV.map(item => {
            const active = pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  active
                    ? "bg-genius-green/10 text-genius-green border border-genius-green/20"
                    : "text-genius-muted hover:text-white hover:bg-genius-card"
                }`}
              >
                <item.icon size={16} />
                {item.label}
                {item.label === "Alerts" && notifications > 0 && (
                  <span className="ml-auto w-5 h-5 bg-genius-green text-genius-black text-xs font-black rounded-full flex items-center justify-center">
                    {notifications}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Risk Profile */}
        <div className="p-4 border-t border-genius-border">
          <p className="text-xs text-genius-muted font-mono mb-2">RISK PROFILE</p>
          <div className="flex gap-1">
            {(["conservative","moderate","aggressive"] as const).map(r => (
              <button
                key={r}
                onClick={() => setRiskLevel(r)}
                className={`flex-1 py-1.5 rounded text-xs font-bold transition-all capitalize ${
                  riskLevel === r
                    ? "bg-genius-green text-genius-black"
                    : "bg-genius-border text-genius-muted hover:text-white"
                }`}
              >
                {r === "conservative" ? "Low" : r === "moderate" ? "Med" : "High"}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="p-4 border-t border-genius-border flex flex-col gap-1">
          <Link
            href="/dashboard/settings"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
              pathname.startsWith("/dashboard/settings")
                ? "bg-genius-green/10 text-genius-green border border-genius-green/20"
                : "text-genius-muted hover:text-white hover:bg-genius-card"
            }`}
          >
            <Settings size={16} /> Settings
          </Link>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-genius-muted hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── PAGE CONTENT ── */}
      <main className="ml-64 flex-1 p-6 min-h-screen">
        {children}
      </main>
    </div>
  );
}
