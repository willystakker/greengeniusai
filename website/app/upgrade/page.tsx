"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Brain, Zap, Star, Gift, ChevronRight, X } from "lucide-react";

const SEGMENTS = [
  { label: "10% OFF",      sub: "First month",     discount: 10,  code: "GGAI-SPIN-10", fill: "#0F2A0F", stroke: "#1A4A1A", text: "#00D97E" },
  { label: "25% OFF",      sub: "First month",     discount: 25,  code: "GGAI-SPIN-25", fill: "#1A4A0A", stroke: "#2A6A1A", text: "#00FF41" },
  { label: "15% OFF",      sub: "First month",     discount: 15,  code: "GGAI-SPIN-15", fill: "#0A1F0A", stroke: "#1A3A1A", text: "#00D97E" },
  { label: "FREE MONTH",   sub: "100% off month 1",discount: 100, code: "GGAI-SPIN-FM", fill: "#2A1A00", stroke: "#4A3000", text: "#FFD700" },
  { label: "20% OFF",      sub: "First month",     discount: 20,  code: "GGAI-SPIN-20", fill: "#0F2A0F", stroke: "#1A4A1A", text: "#00FF41" },
  { label: "30% OFF",      sub: "First month",     discount: 30,  code: "GGAI-SPIN-30", fill: "#0A2A0A", stroke: "#1A5A1A", text: "#7FFF00" },
  { label: "10% OFF",      sub: "First month",     discount: 10,  code: "GGAI-SPIN-10", fill: "#0A1F0A", stroke: "#1A3A1A", text: "#00D97E" },
  { label: "50% OFF",      sub: "First month",     discount: 50,  code: "GGAI-SPIN-50", fill: "#1A0A2A", stroke: "#3A1A5A", text: "#C084FC" },
];

const CX = 200; const CY = 200; const R = 188; const TEXT_R = 120;

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function slicePath(cx: number, cy: number, r: number, start: number, end: number) {
  const s = polar(cx, cy, r, start);
  const e = polar(cx, cy, r, end);
  const large = end - start > 180 ? 1 : 0;
  return `M${cx},${cy} L${s.x.toFixed(2)},${s.y.toFixed(2)} A${r},${r} 0 ${large},1 ${e.x.toFixed(2)},${e.y.toFixed(2)} Z`;
}

export default function UpgradePage() {
  const router  = useRouter();
  const [rotation,  setRotation]  = useState(0);
  const [spinning,  setSpinning]  = useState(false);
  const [winner,    setWinner]    = useState<number | null>(null);
  const [showClaim, setShowClaim] = useState(false);
  const wheelRef = useRef<SVGGElement>(null);

  const GOOD = [1, 3, 5, 7]; // 25%, FREE, 30%, 50%

  const spin = () => {
    if (spinning || winner !== null) return;
    const idx   = GOOD[Math.floor(Math.random() * GOOD.length)];
    const spins = 5;
    const landAngle = 360 - (idx * 45 + 22.5);
    const total = spins * 360 + landAngle;
    setSpinning(true);
    setRotation(r => r + total);
    setTimeout(() => {
      setSpinning(false);
      setWinner(idx);
      setTimeout(() => setShowClaim(true), 600);
    }, 4200);
  };

  const claim = () => {
    if (winner === null) return;
    const seg = SEGMENTS[winner];
    router.push(`/upgrade/checkout?discount=${seg.discount}&code=${seg.code}&label=${encodeURIComponent(seg.label)}`);
  };

  const seg = winner !== null ? SEGMENTS[winner] : null;

  return (
    <div className="min-h-screen bg-genius-black flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-genius-green/5 blur-3xl" />
        <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-genius-emerald/5 blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative z-10 text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-genius-green flex items-center justify-center">
            <Brain size={18} className="text-genius-black" />
          </div>
          <span className="font-black text-xl text-white">Green<span className="text-genius-green">Genius</span>AI</span>
        </div>
        <h1 className="text-4xl font-black text-white mb-2">
          Spin for Your <span className="text-genius-green glow-text">Elite Discount</span>
        </h1>
        <p className="text-genius-muted text-sm">Upgrade to Elite — spin to unlock your exclusive discount</p>
      </div>

      {/* Wheel */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Pointer */}
        <div className="relative z-20 mb-[-12px]">
          <div
            className="w-0 h-0 mx-auto"
            style={{
              borderLeft: "14px solid transparent",
              borderRight: "14px solid transparent",
              borderTop: "28px solid #00FF41",
              filter: "drop-shadow(0 0 8px rgba(0,255,65,0.8))",
            }}
          />
        </div>

        {/* SVG Wheel */}
        <div className="relative">
          <svg width={400} height={400} viewBox="0 0 400 400" className="drop-shadow-2xl">
            {/* Outer glow ring */}
            <circle cx={CX} cy={CY} r={R+6} fill="none" stroke="rgba(0,255,65,0.2)" strokeWidth="12" />
            <circle cx={CX} cy={CY} r={R+2} fill="none" stroke="rgba(0,255,65,0.4)" strokeWidth="2" />

            {/* Spinning group */}
            <g
              ref={wheelRef}
              style={{
                transformOrigin: `${CX}px ${CY}px`,
                transform: `rotate(${rotation}deg)`,
                transition: spinning
                  ? "transform 4.2s cubic-bezier(0.17, 0.67, 0.08, 0.99)"
                  : "none",
              }}
            >
              {SEGMENTS.map((s, i) => {
                const startDeg = i * 45;
                const endDeg   = startDeg + 45;
                const mid      = startDeg + 22.5;
                const tp       = polar(CX, CY, TEXT_R, mid);
                const isWinner = winner === i;
                return (
                  <g key={i}>
                    <path
                      d={slicePath(CX, CY, R, startDeg, endDeg)}
                      fill={isWinner ? (s.fill) : s.fill}
                      stroke={isWinner ? s.text : s.stroke}
                      strokeWidth={isWinner ? 2 : 1}
                    />
                    {/* Segment glow on winner */}
                    {isWinner && (
                      <path
                        d={slicePath(CX, CY, R, startDeg, endDeg)}
                        fill={s.text}
                        fillOpacity={0.12}
                        stroke={s.text}
                        strokeWidth={3}
                      />
                    )}
                    {/* Text */}
                    <text
                      x={tp.x} y={tp.y - 6}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={s.text}
                      fontSize={i === 3 ? 11 : 13}
                      fontWeight="900"
                      fontFamily="JetBrains Mono, monospace"
                      transform={`rotate(${mid}, ${tp.x}, ${tp.y})`}
                    >
                      {s.label}
                    </text>
                    <text
                      x={tp.x} y={tp.y + 10}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={s.text}
                      fillOpacity={0.65}
                      fontSize={8}
                      fontFamily="JetBrains Mono, monospace"
                      transform={`rotate(${mid}, ${tp.x}, ${tp.y})`}
                    >
                      {s.sub}
                    </text>
                    {/* Divider line */}
                    <line
                      x1={CX} y1={CY}
                      x2={polar(CX, CY, R, startDeg).x}
                      y2={polar(CX, CY, R, startDeg).y}
                      stroke="#050A05"
                      strokeWidth={2}
                    />
                  </g>
                );
              })}

              {/* Center hub */}
              <circle cx={CX} cy={CY} r={36} fill="#050A05" stroke="#1A2E1A" strokeWidth={2} />
              <circle cx={CX} cy={CY} r={32} fill="#0A120A" stroke="rgba(0,255,65,0.3)" strokeWidth={1.5} />
            </g>

            {/* Center spin button (non-rotating) */}
            <g onClick={spin} style={{cursor: spinning || winner !== null ? "default" : "pointer"}}>
              <circle
                cx={CX} cy={CY} r={28}
                fill={spinning ? "#0A120A" : winner !== null ? "#0A120A" : "#00FF41"}
                style={{transition:"fill 0.3s"}}
              />
              <text
                x={CX} y={CY}
                textAnchor="middle" dominantBaseline="middle"
                fill={spinning ? "#4A7A4A" : winner !== null ? "#4A7A4A" : "#050A05"}
                fontSize={11} fontWeight="900" fontFamily="JetBrains Mono, monospace"
              >
                {spinning ? "···" : winner !== null ? "✓" : "SPIN"}
              </text>
            </g>
          </svg>

          {/* Spinning particles */}
          {spinning && (
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1.5 h-1.5 rounded-full bg-genius-green"
                  style={{
                    top: `${20 + Math.sin(i * 45 * Math.PI/180) * 42}%`,
                    left: `${50 + Math.cos(i * 45 * Math.PI/180) * 42}%`,
                    opacity: 0.6,
                    animation: `pulse-ring 1s ${i * 0.12}s infinite`,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Spin button below */}
        {winner === null && (
          <button
            onClick={spin}
            disabled={spinning}
            className="mt-8 px-10 py-4 rounded-2xl btn-genius text-lg font-black tracking-wider disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-3"
          >
            {spinning ? (
              <><div className="w-5 h-5 border-2 border-genius-black/30 border-t-genius-black rounded-full animate-spin" /> Spinning...</>
            ) : (
              <><Zap size={20} /> SPIN THE WHEEL</>
            )}
          </button>
        )}

        {/* Elite plan teaser */}
        <div className="mt-6 flex items-center gap-6 text-xs text-genius-muted font-mono">
          {["Unlimited AI trades","All asset classes","Custom strategies","Priority support"].map(f => (
            <div key={f} className="flex items-center gap-1.5">
              <Star size={10} className="text-genius-green" />
              <span>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Winner overlay */}
      {showClaim && seg && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className="relative max-w-md w-full rounded-3xl p-8 text-center border"
            style={{
              background: "linear-gradient(145deg, #0F1A0F, #0A120A)",
              borderColor: seg.text,
              boxShadow: `0 0 60px ${seg.text}40, 0 0 120px ${seg.text}20`,
            }}
          >
            {/* Glow top */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-1 rounded-full" style={{background:`linear-gradient(90deg,transparent,${seg.text},transparent)`}} />

            <div className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center border-2" style={{background:`${seg.text}15`,borderColor:`${seg.text}60`}}>
              <Gift size={28} style={{color:seg.text}} />
            </div>

            <p className="text-genius-muted font-mono text-xs mb-2 tracking-widest">YOU WON</p>
            <h2 className="text-5xl font-black text-white mb-1">{seg.label}</h2>
            <p className="text-sm mb-5" style={{color:seg.text}}>{seg.sub} on Elite</p>

            <div className="mb-6 p-4 rounded-xl border" style={{background:"#050A05",borderColor:`${seg.text}30`}}>
              <p className="text-xs text-genius-muted font-mono mb-1">YOUR COUPON CODE</p>
              <p className="text-2xl font-black font-mono tracking-widest" style={{color:seg.text}}>{seg.code}</p>
            </div>

            <button
              onClick={claim}
              className="w-full py-4 rounded-2xl font-black text-lg text-genius-black flex items-center justify-center gap-2"
              style={{background:`linear-gradient(135deg, ${seg.text}, ${seg.text}CC)`}}
            >
              Claim Discount <ChevronRight size={18} />
            </button>

            <p className="text-xs text-genius-muted mt-3 font-mono">Offer valid for 15 minutes</p>
          </div>
        </div>
      )}
    </div>
  );
}
