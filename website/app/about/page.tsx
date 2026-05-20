"use client";

import Link from "next/link";
import {
  Brain, CheckCircle, X, TrendingUp, Clock, DollarSign,
  Users, Zap, Shield, AlertTriangle, ChevronRight, Star,
  BarChart3, Heart, Target, Lightbulb, ArrowUpRight,
} from "lucide-react";

const ADVISOR_VS = [
  {
    category: "Annual Cost",
    advisor: "$2,500 – $12,000+",
    advisorSub: "1% AUM + hourly fees",
    ggai: "$120 – $600/yr",
    ggaiSub: "$10–$49.99/month",
    winner: "ggai",
  },
  {
    category: "Availability",
    advisor: "Business hours only",
    advisorSub: "Appointments required",
    ggai: "24 / 7 / 365",
    ggaiSub: "Never sleeps. Never off-duty.",
    winner: "ggai",
  },
  {
    category: "Response to Market Events",
    advisor: "Next business day",
    advisorSub: "Or whenever they check in",
    ggai: "< 50 milliseconds",
    ggaiSub: "Reacts before you blink",
    winner: "ggai",
  },
  {
    category: "Emotional Bias",
    advisor: "Human — fear & greed apply",
    advisorSub: "Commission incentives exist",
    ggai: "Zero",
    ggaiSub: "Pure data. No agenda.",
    winner: "ggai",
  },
  {
    category: "Portfolio Transparency",
    advisor: "Quarterly statements",
    advisorSub: "Often hard to interpret",
    ggai: "Real-time, plain English",
    ggaiSub: "Every trade explained",
    winner: "ggai",
  },
  {
    category: "Minimum Portfolio Size",
    advisor: "$50,000 – $250,000+",
    advisorSub: "Many won't take you below this",
    ggai: "$0",
    ggaiSub: "Start with any amount",
    winner: "ggai",
  },
  {
    category: "Personalization",
    advisor: "Annual review meeting",
    advisorSub: "Generic model portfolios",
    ggai: "Continuous AI adaptation",
    ggaiSub: "Adjusts to your risk profile daily",
    winner: "ggai",
  },
];

const PROBLEMS = [
  {
    icon: DollarSign,
    title: "Financial Advisors Are Gatekeeping Wealth",
    body: "The average financial advisor charges 1% of your assets under management every year. On a $100,000 portfolio that's $1,000 gone — before you see a single dollar of returns. For those with smaller portfolios, most advisors won't even take the meeting.",
  },
  {
    icon: Clock,
    title: "Slow Humans Can't Keep Up With Fast Markets",
    body: "Markets move in milliseconds. A breaking news event, an earnings surprise, a Fed announcement — any of these can swing a stock 15% in minutes. Your advisor is checking email. GreenGeniusAI is already executing.",
  },
  {
    icon: Users,
    title: "You're Not Their Only Client",
    body: "The average financial advisor manages 100+ clients. You're one file in a stack. You get a quarterly call if you're lucky. Your portfolio gets the same cookie-cutter model allocation as everyone else on their roster.",
  },
  {
    icon: AlertTriangle,
    title: "Hidden Conflicts of Interest",
    body: "Many advisors are incentivized to recommend products that earn them commissions — not the products best for you. Fiduciary rules help, but they don't eliminate the structural conflict between advisor compensation and your best interests.",
  },
];

const VALUES = [
  {
    icon: Heart,
    title: "Built for Everyone",
    body: "We built GreenGeniusAI for the nurse, the teacher, the contractor — people who deserve institutional-grade investing tools, not just those with $500K to hand over to a wealth manager.",
  },
  {
    icon: Target,
    title: "Radical Transparency",
    body: "Every trade comes with a plain-English reason. No black boxes, no jargon walls. You'll always know exactly what your money is doing and why.",
  },
  {
    icon: Lightbulb,
    title: "Intelligence Without the Price Tag",
    body: "We use the same data signals — earnings calls, options flow, macro indicators, sentiment analysis — that hedge funds pay millions to access. We've made it available for the price of a streaming subscription.",
  },
  {
    icon: Shield,
    title: "Your Money, Your Rules",
    body: "The bot is a tool, not a takeover. Flip it off anytime and manage your own trades with our research dashboard. You are always in control.",
  },
];

const TESTIMONIALS = [
  {
    name: "Priya M.",
    role: "Physical Therapist",
    text: "My old advisor charged me $200 an hour and still couldn't beat the S&P. Three months with GreenGeniusAI and I'm up 19%. I fired my advisor.",
    stars: 5,
  },
  {
    name: "DeShawn W.",
    role: "Freelance Videographer",
    text: "I didn't have the $250K minimum to get into the firm everyone recommends. GreenGeniusAI started me with $1,500 and actually grows it. Game changer.",
    stars: 5,
  },
  {
    name: "Erin C.",
    role: "High School Teacher",
    text: "I always thought investing was something rich people paid someone else to do. Now I let the AI handle it and check my dashboard on lunch break. It's honestly that easy.",
    stars: 5,
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-genius-black text-genius-text">
      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-genius-border bg-genius-black/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-genius-green flex items-center justify-center">
                <Brain size={18} className="text-genius-black" />
              </div>
              <span className="font-black text-xl text-white">
                Green<span className="text-genius-green">Genius</span>AI
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/auth" className="text-sm text-genius-muted hover:text-white transition-colors">
                Sign In
              </Link>
              <Link href="/auth?mode=signup" className="btn-genius px-5 py-2 rounded-lg text-sm font-bold">
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative pt-32 pb-24 px-4 overflow-hidden">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: "linear-gradient(rgba(0,255,65,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,65,0.4) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-genius-border bg-genius-card mb-8">
            <span className="text-xs font-mono text-genius-green font-bold">OUR MISSION</span>
          </div>
          <h1 className="text-5xl lg:text-7xl font-black text-white leading-tight mb-8">
            Wealth-Building<br />
            <span className="text-genius-green glow-text">Belongs to Everyone.</span><br />
            Not Just the Wealthy.
          </h1>
          <p className="text-xl text-genius-text leading-relaxed max-w-3xl mx-auto mb-10">
            The financial advisory industry was built for people with half a million dollars and a golf membership. GreenGeniusAI was built for everyone else — a smarter, faster, and radically more affordable alternative that doesn't compromise on results.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth?mode=signup" className="btn-genius px-8 py-4 rounded-xl font-black flex items-center justify-center gap-2">
              Start Free — No Credit Card
              <ChevronRight size={18} />
            </Link>
            <a href="#comparison" className="px-8 py-4 rounded-xl border border-genius-border text-genius-text hover:border-genius-green hover:text-genius-green transition-all font-semibold flex items-center justify-center gap-2">
              See the Comparison
            </a>
          </div>
        </div>
      </section>

      {/* ── THE PROBLEM ── */}
      <section className="py-24 px-4 bg-genius-card border-y border-genius-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-genius-green font-mono text-sm font-bold mb-3">THE PROBLEM</p>
            <h2 className="text-4xl lg:text-5xl font-black text-white mb-4">
              The Financial Advisor Model<br />
              <span className="text-red-400">Is Broken.</span>
            </h2>
            <p className="text-genius-text max-w-2xl mx-auto">
              For decades, regular people have been told to hand their money to a human — pay the fees, wait for the quarterly call, and trust that someone who manages 150 other clients has your best interests at heart.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {PROBLEMS.map((p, i) => (
              <div key={i} className="genius-card rounded-2xl p-8 border border-red-500/10">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5">
                  <p.icon size={22} className="text-red-400" />
                </div>
                <h3 className="font-black text-white text-xl mb-3">{p.title}</h3>
                <p className="text-genius-text leading-relaxed text-sm">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COST REALITY CHECK ── */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-genius-green font-mono text-sm font-bold mb-3">THE MATH DOESN'T LIE</p>
          <h2 className="text-4xl font-black text-white mb-6">
            What a Financial Advisor Actually Costs You
          </h2>
          <p className="text-genius-text mb-16 max-w-2xl mx-auto">
            Most people don't realize how much they're paying — because it's quietly skimmed from returns, not invoiced directly.
          </p>
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {[
              { label: "1% AUM Fee on $100K Portfolio", cost: "$1,000/yr", note: "Taken regardless of performance" },
              { label: "Avg Hourly Financial Planning Rate", cost: "$250/hr", note: "For \"advice\" you may not even follow" },
              { label: "Full Financial Plan Cost", cost: "$2,500+", note: "One-time fee, then annual retainer" },
            ].map((item, i) => (
              <div key={i} className="genius-card rounded-2xl p-7 border border-red-500/20">
                <p className="text-xs text-genius-muted font-mono mb-3">{item.label.toUpperCase()}</p>
                <p className="text-4xl font-black text-red-400 mb-2">{item.cost}</p>
                <p className="text-xs text-genius-muted">{item.note}</p>
              </div>
            ))}
          </div>
          <div className="genius-card rounded-2xl p-8 border border-genius-green/30 bg-genius-green/5">
            <p className="text-genius-green font-mono text-sm font-bold mb-4">GREENGENIUS AI — FULL AI AUTOPILOT</p>
            <p className="text-7xl font-black text-white mb-2">$29<span className="text-genius-green text-4xl">.99</span><span className="text-genius-muted text-2xl font-normal">/mo</span></p>
            <p className="text-genius-muted text-sm">That's <span className="text-white font-bold">$360/year</span> for an AI that watches your portfolio 24/7, executes trades in milliseconds, and explains every decision in plain English. No commissions. No minimums. No waiting room.</p>
          </div>
        </div>
      </section>

      {/* ── HEAD-TO-HEAD COMPARISON ── */}
      <section id="comparison" className="py-24 px-4 bg-genius-card border-y border-genius-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-genius-green font-mono text-sm font-bold mb-3">SIDE BY SIDE</p>
            <h2 className="text-4xl font-black text-white mb-4">
              Financial Advisor vs. <span className="text-genius-green">GreenGeniusAI</span>
            </h2>
          </div>
          {/* Header row */}
          <div className="grid grid-cols-3 gap-px mb-2 px-4">
            <div />
            <div className="text-center py-3 bg-genius-black/50 rounded-t-xl">
              <p className="text-sm font-bold text-genius-muted">Traditional Advisor</p>
            </div>
            <div className="text-center py-3 bg-genius-green/10 rounded-t-xl border border-genius-green/20">
              <p className="text-sm font-bold text-genius-green">GreenGeniusAI</p>
            </div>
          </div>
          <div className="rounded-2xl overflow-hidden border border-genius-border">
            {ADVISOR_VS.map((row, i) => (
              <div key={i} className={`grid grid-cols-3 gap-px ${i % 2 === 0 ? "bg-genius-black" : "bg-genius-dark"}`}>
                <div className="px-5 py-5">
                  <p className="text-sm font-bold text-white">{row.category}</p>
                </div>
                <div className="px-5 py-5 border-l border-genius-border">
                  <p className="text-sm font-bold text-red-400">{row.advisor}</p>
                  <p className="text-xs text-genius-muted mt-0.5">{row.advisorSub}</p>
                </div>
                <div className="px-5 py-5 border-l border-genius-green/20 bg-genius-green/5">
                  <div className="flex items-start gap-2">
                    <CheckCircle size={14} className="text-genius-green mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-genius-green">{row.ggai}</p>
                      <p className="text-xs text-genius-muted mt-0.5">{row.ggaiSub}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── NOT JUST AN APP ── */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-genius-green font-mono text-sm font-bold mb-3">WHY WE'RE DIFFERENT</p>
            <h2 className="text-4xl lg:text-5xl font-black text-white mb-4">
              This Isn't Just Another<br />
              <span className="text-genius-green">Investment App.</span>
            </h2>
            <p className="text-genius-text max-w-3xl mx-auto">
              Robinhood gave everyone a trading account. Acorns rounds up your spare change. Betterment puts you in index funds. All fine tools. But none of them think. None of them adapt. None of them explain themselves. GreenGeniusAI is something else entirely — an intelligence layer that actively works for your portfolio every second of every day.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((v, i) => (
              <div key={i} className="genius-card rounded-2xl p-7 border border-genius-border hover:border-genius-green/30 transition-all">
                <div className="w-12 h-12 rounded-xl bg-genius-green/10 border border-genius-green/20 flex items-center justify-center mb-5">
                  <v.icon size={22} className="text-genius-green" />
                </div>
                <h3 className="font-black text-white text-lg mb-3">{v.title}</h3>
                <p className="text-sm text-genius-text leading-relaxed">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ORIGIN STORY ── */}
      <section className="py-24 px-4 bg-genius-card border-y border-genius-border">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-genius-green font-mono text-sm font-bold mb-3">OUR STORY</p>
            <h2 className="text-4xl font-black text-white mb-6">
              Built by People Who Got<br />Tired of Watching Others Win
            </h2>
          </div>
          <div className="genius-card rounded-2xl p-10 border border-genius-border space-y-6 text-genius-text leading-relaxed">
            <p>
              We watched friends with high incomes fall behind financially — not because they weren't smart, not because they didn't work hard, but because the tools available to them were either too basic (investment apps that park your money and pray) or completely out of reach (wealth managers who charge more per year than most people earn per month).
            </p>
            <p>
              Meanwhile, institutional traders — hedge funds, proprietary desks, family offices — were using AI-powered systems to scan thousands of signals simultaneously, execute in milliseconds, and generate returns that individual investors could never replicate manually.
            </p>
            <p className="text-white font-bold">
              We built GreenGeniusAI to close that gap.
            </p>
            <p>
              Not a robo-advisor that puts you in a generic ETF basket and calls it personalized. Not a stock screener that makes you do all the work. A genuine AI engine that watches markets around the clock, identifies high-probability opportunities, executes with precision, and keeps you fully informed of every decision — for less than the cost of a dinner out.
            </p>
            <p>
              The wealthiest people in the world have always had better financial tools than everyone else. That changes now.
            </p>
          </div>
        </div>
      </section>

      {/* ── WHO IT'S FOR ── */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-genius-green font-mono text-sm font-bold mb-3">WHO IT'S FOR</p>
            <h2 className="text-4xl font-black text-white mb-4">
              Built for Real People<br />With Real Financial Goals
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                who: "The Busy Professional",
                desc: "You earn well but don't have time to study charts or follow earnings calls. You want your money managed intelligently while you focus on your career and family.",
                outcome: "Set it up once. The AI handles everything. Check in when you want.",
              },
              {
                who: "The Self-Directed Investor",
                desc: "You already trade but you want an edge. You want institutional-grade signals, real-time market intelligence, and a transparent partner — not a black box.",
                outcome: "Use Bot Mode or Investor Mode. The AI is your co-pilot, not your replacement.",
              },
              {
                who: "The First-Time Investor",
                desc: "You've been putting off investing because it feels overwhelming, expensive, or risky. You don't know where to start and don't trust the commission-heavy advice out there.",
                outcome: "Start with any amount. The AI explains every move in plain English. You learn while you earn.",
              },
            ].map((item, i) => (
              <div key={i} className="genius-card rounded-2xl p-8 border border-genius-border flex flex-col gap-4">
                <div className="w-10 h-10 rounded-xl bg-genius-green/10 border border-genius-green/20 flex items-center justify-center">
                  <Users size={18} className="text-genius-green" />
                </div>
                <h3 className="font-black text-white text-xl">{item.who}</h3>
                <p className="text-sm text-genius-text leading-relaxed flex-1">{item.desc}</p>
                <div className="pt-4 border-t border-genius-border">
                  <p className="text-xs text-genius-green font-mono font-bold">RESULT</p>
                  <p className="text-sm text-white mt-1">{item.outcome}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-24 px-4 bg-genius-card border-y border-genius-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-genius-green font-mono text-sm font-bold mb-3">REAL MEMBERS</p>
            <h2 className="text-4xl font-black text-white">
              They Made the Switch. <span className="text-genius-green">Here's What Happened.</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="genius-card rounded-2xl p-7 flex flex-col gap-4">
                <div className="flex gap-0.5">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} size={14} className="text-genius-gold fill-genius-gold" />
                  ))}
                </div>
                <p className="text-genius-text text-sm leading-relaxed italic flex-1">"{t.text}"</p>
                <div>
                  <p className="font-bold text-white">{t.name}</p>
                  <p className="text-xs text-genius-muted">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-green-glow opacity-40" />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h2 className="text-5xl font-black text-white mb-6">
            Stop Paying Someone to<br />
            <span className="text-genius-green glow-text">Underperform the Market.</span>
          </h2>
          <p className="text-genius-text text-lg mb-10">
            Join the investors who chose intelligence over tradition. Start free — no credit card, no advisor meeting, no minimum portfolio.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth?mode=signup&plan=genius"
              className="btn-genius inline-flex items-center gap-2 px-10 py-5 rounded-xl text-lg font-black"
            >
              Start Free — Genius Plan
              <ChevronRight size={22} />
            </Link>
            <Link
              href="/#pricing"
              className="inline-flex items-center gap-2 px-10 py-5 rounded-xl border border-genius-border text-genius-text hover:border-genius-green hover:text-genius-green transition-all font-bold"
            >
              Compare All Plans
              <ArrowUpRight size={18} />
            </Link>
          </div>
          <p className="text-xs text-genius-muted mt-5">7-day free trial · Cancel anytime · No hidden fees</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-genius-border py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-genius-green flex items-center justify-center">
                <Brain size={15} className="text-genius-black" />
              </div>
              <span className="font-black text-white">GreenGeniusAI</span>
            </Link>
            <div className="flex flex-wrap gap-6 text-xs text-genius-muted">
              <Link href="/" className="hover:text-genius-green transition-colors">Home</Link>
              <Link href="/about" className="hover:text-genius-green transition-colors text-genius-green">About</Link>
              <a href="#" className="hover:text-genius-green transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-genius-green transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-genius-green transition-colors">Contact</a>
            </div>
            <p className="text-xs text-genius-muted">© 2025 GreenGeniusAI. All rights reserved.</p>
          </div>
          <div className="mt-6 pt-6 border-t border-genius-border">
            <p className="text-xs text-genius-muted leading-relaxed">
              <AlertTriangle size={10} className="inline mr-1" />
              <strong>Disclosure:</strong> Investing involves risk, including possible loss of principal. GreenGeniusAI provides data-driven trade recommendations and execution via licensed broker-dealer infrastructure. Past performance is not indicative of future results. GreenGeniusAI is not a registered investment advisor.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
