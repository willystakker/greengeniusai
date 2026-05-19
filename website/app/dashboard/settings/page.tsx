"use client";

import { useState, useEffect } from "react";
import {
  User, CreditCard, Brain, Bell, Shield, ChevronRight,
  CheckCircle, ExternalLink, Zap, Globe, Lock, LogOut,
} from "lucide-react";
import { getUser } from "@/lib/auth";

const PLAN_FEATURES: Record<string,{name:string;price:string;features:string[]}> = {
  analyst: {
    name: "Analyst",
    price: "$10/mo",
    features: ["5 AI trades/day","Basic signals","Email alerts","1 asset class"],
  },
  genius: {
    name: "Genius",
    price: "$29.99/mo",
    features: ["Unlimited AI trades","Advanced signals","All asset classes","Priority support","SMS alerts"],
  },
  elite: {
    name: "Elite",
    price: "$49.99/mo",
    features: ["Everything in Genius","Dedicated AI model","Custom strategies","White-glove support","API access"],
  },
};

export default function SettingsPage() {
  const [section, setSection] = useState("profile");
  const [saved,   setSaved]   = useState(false);
  const [profile, setProfile] = useState({ name: "", email: "", phone: "(480) 798-0753" });
  const [plan, setPlan]       = useState("genius");
  const [notifs, setNotifs]   = useState({ email: true, sms: false, push: false, ai: true, trades: true, news: false });

  useEffect(() => {
    const user = getUser();
    if (user) {
      setProfile(p => ({ ...p, name: user.name || "", email: user.email || "" }));
      setPlan((user as any).plan || "genius");
    }
  }, []);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const SECTIONS = [
    { id: "profile",      icon: User,       label: "Profile" },
    { id: "subscription", icon: CreditCard, label: "Subscription" },
    { id: "ai",           icon: Brain,      label: "AI Configuration" },
    { id: "notifications",icon: Bell,       label: "Notifications" },
    { id: "security",     icon: Shield,     label: "Security" },
  ];

  const currentPlan = PLAN_FEATURES[plan] || PLAN_FEATURES.genius;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white">Settings</h1>
        <p className="text-xs text-genius-muted font-mono mt-0.5">Account management · AI configuration · Security</p>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {/* Section nav */}
        <div className="col-span-1">
          <div className="genius-card rounded-xl overflow-hidden">
            {SECTIONS.map(s => (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all border-b border-genius-border/40 last:border-0 ${
                  section===s.id
                    ? "bg-genius-green/10 text-genius-green font-semibold"
                    : "text-genius-muted hover:text-white hover:bg-genius-card"
                }`}
              >
                <s.icon size={15} />
                {s.label}
                {section===s.id && <ChevronRight size={12} className="ml-auto" />}
              </button>
            ))}
          </div>
        </div>

        {/* Section content */}
        <div className="col-span-3">

          {/* Profile */}
          {section === "profile" && (
            <div className="genius-card rounded-xl p-6">
              <h2 className="font-bold text-white mb-5">Profile Information</h2>
              <div className="flex flex-col gap-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-genius-muted font-mono mb-1.5 block">FULL NAME</label>
                    <input
                      value={profile.name}
                      onChange={e => setProfile(p => ({...p, name: e.target.value}))}
                      className="w-full bg-genius-black border border-genius-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-genius-green transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-genius-muted font-mono mb-1.5 block">EMAIL ADDRESS</label>
                    <input
                      value={profile.email}
                      onChange={e => setProfile(p => ({...p, email: e.target.value}))}
                      className="w-full bg-genius-black border border-genius-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-genius-green transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-genius-muted font-mono mb-1.5 block">PHONE NUMBER</label>
                  <input
                    value={profile.phone}
                    onChange={e => setProfile(p => ({...p, phone: e.target.value}))}
                    className="w-full bg-genius-black border border-genius-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-genius-green transition-colors"
                    placeholder="(XXX) XXX-XXXX"
                  />
                </div>
                <div>
                  <label className="text-xs text-genius-muted font-mono mb-1.5 block">TIMEZONE</label>
                  <select className="w-full bg-genius-black border border-genius-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-genius-green">
                    <option>America/Phoenix (MST)</option>
                    <option>America/New_York (EST)</option>
                    <option>America/Chicago (CST)</option>
                    <option>America/Los_Angeles (PST)</option>
                  </select>
                </div>
              </div>
              <button onClick={handleSave} className="px-6 py-2.5 rounded-lg btn-genius text-sm font-bold flex items-center gap-2">
                {saved ? <><CheckCircle size={14} /> Saved!</> : "Save Changes"}
              </button>
            </div>
          )}

          {/* Subscription */}
          {section === "subscription" && (
            <div className="flex flex-col gap-4">
              <div className="genius-card rounded-xl p-6 border border-genius-green/25">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono bg-genius-green/20 text-genius-green border border-genius-green/30 px-2 py-0.5 rounded font-bold">ACTIVE</span>
                      <span className="text-xs text-genius-muted font-mono">Founding Member</span>
                    </div>
                    <h2 className="text-2xl font-black text-white">{currentPlan.name} Plan</h2>
                    <p className="text-genius-green font-mono font-bold text-xl mt-1">{currentPlan.price}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-genius-muted font-mono">Next billing</p>
                    <p className="text-white font-semibold">June 18, 2026</p>
                    <p className="text-xs text-genius-muted mt-1">7-day free trial active</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-5">
                  {currentPlan.features.map(f => (
                    <div key={f} className="flex items-center gap-2">
                      <CheckCircle size={13} className="text-genius-green flex-shrink-0" />
                      <span className="text-sm text-genius-text">{f}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button className="px-5 py-2.5 rounded-lg border border-genius-green/40 text-genius-green text-sm font-bold hover:bg-genius-green/10 transition-colors">
                    Manage Billing
                  </button>
                  {plan !== "elite" && (
                    <button className="px-5 py-2.5 rounded-lg btn-genius text-sm font-bold">
                      Upgrade to Elite
                    </button>
                  )}
                </div>
              </div>

              <div className="genius-card rounded-xl p-5">
                <h3 className="font-bold text-white mb-3">Usage This Month</h3>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "AI Trades Executed", value: "47",  limit: "∞",   pct: 47 },
                    { label: "API Calls",          value: "312", limit: "5,000", pct: 6 },
                    { label: "Alerts Triggered",   value: "18",  limit: "∞",   pct: 18 },
                  ].map(u => (
                    <div key={u.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-genius-muted font-mono">{u.label}</span>
                        <span className="text-white font-mono font-bold">{u.value}<span className="text-genius-muted">/{u.limit}</span></span>
                      </div>
                      <div className="w-full h-1.5 bg-genius-border rounded-full">
                        <div className="h-full bg-genius-green rounded-full" style={{width:`${Math.min(u.pct,100)}%`}} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* AI Configuration */}
          {section === "ai" && (
            <div className="flex flex-col gap-4">
              <div className="genius-card rounded-xl p-6">
                <h2 className="font-bold text-white mb-5">AI Bot Configuration</h2>
                <div className="flex flex-col gap-5">
                  <div>
                    <label className="text-xs text-genius-muted font-mono mb-1.5 block">MINIMUM CONFIDENCE THRESHOLD</label>
                    <div className="flex gap-2">
                      {[70, 80, 90].map(v => (
                        <button key={v}
                          className="flex-1 py-2.5 rounded-lg border border-genius-green/40 text-genius-green text-sm font-bold hover:bg-genius-green/10 transition-colors first:bg-genius-green/10">
                          {v}%
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-genius-muted mt-1.5">AI will only execute trades above this confidence score</p>
                  </div>
                  <div>
                    <label className="text-xs text-genius-muted font-mono mb-1.5 block">REBALANCE FREQUENCY</label>
                    <div className="grid grid-cols-3 gap-2">
                      {["Daily","Weekly","Bi-weekly","Monthly","One-time","Manual"].map(f => (
                        <button key={f}
                          className={`py-2 rounded-lg border text-sm font-semibold transition-colors ${
                            f==="Weekly"
                              ? "border-genius-green/40 bg-genius-green/10 text-genius-green"
                              : "border-genius-border text-genius-muted hover:text-white hover:border-genius-green/30"
                          }`}>
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-genius-muted font-mono mb-3 block">ASSET UNIVERSE</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: "US Tech Stocks",   active: true },
                        { label: "Crypto Assets",     active: true },
                        { label: "Index ETFs",        active: true },
                        { label: "High-Growth",       active: false },
                        { label: "Global Equities",   active: false },
                        { label: "Commodities",       active: false },
                      ].map(a => (
                        <div key={a.label} className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                          a.active ? "border-genius-green/40 bg-genius-green/10" : "border-genius-border"
                        }`}>
                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                            a.active ? "bg-genius-green border-genius-green" : "border-genius-border"
                          }`}>
                            {a.active && <CheckCircle size={10} className="text-genius-black" />}
                          </div>
                          <span className={`text-sm ${a.active ? "text-white" : "text-genius-muted"}`}>{a.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <button onClick={handleSave} className="mt-5 px-6 py-2.5 rounded-lg btn-genius text-sm font-bold flex items-center gap-2">
                  {saved ? <><CheckCircle size={14} /> Saved!</> : "Save AI Settings"}
                </button>
              </div>

              <div className="genius-card rounded-xl p-4 border border-genius-green/15">
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={14} className="text-genius-green" />
                  <h3 className="font-bold text-white text-sm">Re-run Setup Wizard</h3>
                </div>
                <p className="text-xs text-genius-muted mb-3">Redo your full AI onboarding configuration from scratch. This will reset your current AI preferences.</p>
                <button
                  onClick={() => window.location.href = "/onboarding"}
                  className="flex items-center gap-2 text-sm text-genius-green font-semibold hover:underline"
                >
                  Launch Onboarding Wizard <ExternalLink size={12} />
                </button>
              </div>
            </div>
          )}

          {/* Notifications */}
          {section === "notifications" && (
            <div className="genius-card rounded-xl p-6">
              <h2 className="font-bold text-white mb-5">Notification Preferences</h2>
              <div className="flex flex-col gap-1 divide-y divide-genius-border/40">
                {[
                  { key: "trades", label: "Trade Executions",  desc: "Notify when AI places or exits a trade" },
                  { key: "ai",     label: "AI Insights",        desc: "Daily AI market outlook and signal alerts" },
                  { key: "email",  label: "Email Summaries",    desc: "Weekly portfolio performance digest" },
                  { key: "news",   label: "Market News",        desc: "Breaking news that may affect your positions" },
                  { key: "sms",    label: "SMS Alerts",         desc: "Critical alerts via text message" },
                  { key: "push",   label: "Push Notifications", desc: "Mobile app push (requires app install)" },
                ].map(n => (
                  <div key={n.key} className="flex items-center justify-between py-4">
                    <div>
                      <p className="text-sm font-semibold text-white">{n.label}</p>
                      <p className="text-xs text-genius-muted">{n.desc}</p>
                    </div>
                    <button
                      onClick={() => setNotifs(prev => ({...prev, [n.key]: !(prev as any)[n.key]}))}
                      className={`w-11 h-6 rounded-full relative transition-colors ${(notifs as any)[n.key] ? "bg-genius-green" : "bg-genius-border"}`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${(notifs as any)[n.key] ? "translate-x-5" : "translate-x-0.5"}`} />
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={handleSave} className="mt-4 px-6 py-2.5 rounded-lg btn-genius text-sm font-bold flex items-center gap-2">
                {saved ? <><CheckCircle size={14} /> Saved!</> : "Save Preferences"}
              </button>
            </div>
          )}

          {/* Security */}
          {section === "security" && (
            <div className="flex flex-col gap-4">
              <div className="genius-card rounded-xl p-6">
                <h2 className="font-bold text-white mb-5">Security</h2>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between p-4 bg-genius-black rounded-xl border border-genius-border">
                    <div className="flex items-center gap-3">
                      <Lock size={16} className="text-genius-green" />
                      <div>
                        <p className="text-sm font-semibold text-white">Password</p>
                        <p className="text-xs text-genius-muted">Last changed 14 days ago</p>
                      </div>
                    </div>
                    <button className="text-sm text-genius-green font-semibold hover:underline">Change</button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-genius-black rounded-xl border border-genius-border">
                    <div className="flex items-center gap-3">
                      <Shield size={16} className="text-yellow-400" />
                      <div>
                        <p className="text-sm font-semibold text-white">Two-Factor Authentication</p>
                        <p className="text-xs text-genius-muted">Adds an extra layer of protection</p>
                      </div>
                    </div>
                    <button className="text-sm text-genius-green font-semibold hover:underline">Enable</button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-genius-black rounded-xl border border-genius-border">
                    <div className="flex items-center gap-3">
                      <Globe size={16} className="text-genius-muted" />
                      <div>
                        <p className="text-sm font-semibold text-white">Active Sessions</p>
                        <p className="text-xs text-genius-muted">1 active session · Gilbert, AZ</p>
                      </div>
                    </div>
                    <button className="text-sm text-red-400 font-semibold hover:underline">Revoke All</button>
                  </div>
                </div>
              </div>

              <div className="genius-card rounded-xl p-5 border border-red-500/20">
                <h3 className="font-bold text-white mb-1">Danger Zone</h3>
                <p className="text-xs text-genius-muted mb-4">Irreversible account actions</p>
                <div className="flex flex-col gap-2">
                  <button className="flex items-center justify-between p-3 rounded-lg border border-red-500/20 hover:bg-red-500/5 transition-colors">
                    <span className="text-sm text-red-400 font-semibold">Cancel Subscription</span>
                    <ChevronRight size={14} className="text-red-400" />
                  </button>
                  <button className="flex items-center justify-between p-3 rounded-lg border border-red-500/20 hover:bg-red-500/5 transition-colors">
                    <span className="text-sm text-red-400 font-semibold">Delete Account</span>
                    <ChevronRight size={14} className="text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
