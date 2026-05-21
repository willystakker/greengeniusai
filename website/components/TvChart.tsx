"use client";

import { useEffect, useRef, useMemo } from "react";

export type OhlcQuote = { timestamp: number; o: number | null; h: number | null; l: number | null; c: number; v: number | null };

export type ChartType = "candlestick" | "line" | "area";
export type Indicator = "MA20" | "MA50" | "RSI" | "MACD" | "BB";

interface Props {
  quotes: OhlcQuote[];
  chartType: ChartType;
  indicators: Indicator[];
  height?: number;
}

// ── Technical Analysis helpers ──────────────────────────────────────────────

function sma(values: number[], period: number): (number | null)[] {
  return values.map((_, i) => {
    if (i < period - 1) return null;
    return values.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
  });
}

function ema(values: number[], period: number): (number | null)[] {
  const k = 2 / (period + 1);
  const result: (number | null)[] = new Array(values.length).fill(null);
  let prev: number | null = null;
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) { prev = null; continue; }
    if (prev === null) {
      prev = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
      result[i] = prev;
    } else {
      prev = values[i] * k + prev * (1 - k);
      result[i] = prev;
    }
  }
  return result;
}

function rsi(closes: number[], period = 14): (number | null)[] {
  const result: (number | null)[] = new Array(closes.length).fill(null);
  if (closes.length < period + 1) return result;
  let avgGain = 0, avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d > 0) avgGain += d; else avgLoss += Math.abs(d);
  }
  avgGain /= period; avgLoss /= period;
  result[period] = 100 - 100 / (1 + avgGain / (avgLoss || 0.001));
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(d, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-d, 0)) / period;
    result[i] = 100 - 100 / (1 + avgGain / (avgLoss || 0.001));
  }
  return result;
}

function macd(closes: number[]): { line: (number|null)[]; signal: (number|null)[]; hist: (number|null)[] } {
  const e12 = ema(closes, 12);
  const e26 = ema(closes, 26);
  const line = closes.map((_, i) => (e12[i] != null && e26[i] != null) ? +(e12[i]! - e26[i]!).toFixed(4) : null);
  const lineValues = line.map((v, i) => v ?? closes[i]);
  const signal = ema(lineValues, 9);
  const hist = line.map((v, i) => (v != null && signal[i] != null) ? +(v - signal[i]!).toFixed(4) : null);
  return { line, signal, hist };
}

function bollingerBands(closes: number[], period = 20, mult = 2) {
  const mid = sma(closes, period);
  const upper: (number|null)[] = [], lower: (number|null)[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (mid[i] == null) { upper.push(null); lower.push(null); continue; }
    const slice = closes.slice(i - period + 1, i + 1);
    const mean = mid[i]!;
    const std = Math.sqrt(slice.reduce((s, v) => s + (v - mean) ** 2, 0) / period);
    upper.push(+(mean + mult * std).toFixed(2));
    lower.push(+(mean - mult * std).toFixed(2));
  }
  return { upper, mid, lower };
}

export default function TvChart({ quotes, chartType, indicators, height = 320 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rsiRef       = useRef<HTMLDivElement>(null);
  const macdRef      = useRef<HTMLDivElement>(null);
  const chartsRef    = useRef<any[]>([]);

  const closes    = useMemo(() => quotes.map(q => q.c), [quotes]);
  const showRSI   = indicators.includes("RSI");
  const showMACD  = indicators.includes("MACD");

  useEffect(() => {
    if (!containerRef.current || quotes.length < 2) return;

    let cancelled = false;

    import("lightweight-charts").then(({ createChart, CandlestickSeries: candlestickSeries, LineSeries: lineSeries, AreaSeries: areaSeries, HistogramSeries: histogramSeries }) => {
      if (cancelled || !containerRef.current) return;

      // Destroy old charts
      chartsRef.current.forEach(c => { try { c.remove(); } catch {} });
      chartsRef.current = [];

      const BASE_OPTS = {
        layout: {
          background: { color: "#0a0f0a" },
          textColor: "#4A7A4A",
          fontFamily: "JetBrains Mono, monospace",
        },
        grid: { vertLines: { color: "#111d11" }, horzLines: { color: "#111d11" } },
        crosshair: { mode: 1 },
        rightPriceScale: { borderColor: "#1a2a1a" },
        timeScale: { borderColor: "#1a2a1a", timeVisible: true, secondsVisible: false },
        handleScroll: true,
        handleScale: true,
      };

      // ── Main chart ──────────────────────────────────────────────────────────
      const chart = createChart(containerRef.current!, { ...BASE_OPTS, height, width: containerRef.current!.clientWidth });
      chartsRef.current.push(chart);

      const times = quotes.map(q => q.timestamp);

      // Main series
      if (chartType === "candlestick") {
        const cs = chart.addSeries(candlestickSeries, {
          upColor: "#00FF41", downColor: "#FF4444",
          borderVisible: false, wickUpColor: "#00FF41", wickDownColor: "#FF4444",
        });
        cs.setData(quotes.map(q => ({
          time: q.timestamp as any,
          open: q.o ?? q.c, high: q.h ?? q.c, low: q.l ?? q.c, close: q.c,
        })));
      } else if (chartType === "line") {
        const ls = chart.addSeries(lineSeries, { color: "#00FF41", lineWidth: 2 });
        ls.setData(quotes.map(q => ({ time: q.timestamp as any, value: q.c })));
      } else {
        const as = chart.addSeries(areaSeries, {
          lineColor: "#00FF41", topColor: "rgba(0,255,65,0.25)", bottomColor: "rgba(0,255,65,0)",
          lineWidth: 2,
        });
        as.setData(quotes.map(q => ({ time: q.timestamp as any, value: q.c })));
      }

      // Volume
      if (quotes.some(q => q.v)) {
        const vs = chart.addSeries(histogramSeries, {
          priceFormat: { type: "volume" },
          priceScaleId: "vol",
        });
        chart.priceScale("vol").applyOptions({ scaleMargins: { top: 0.82, bottom: 0 }, borderVisible: false });
        vs.setData(quotes.map((q, i) => ({
          time: q.timestamp as any,
          value: q.v ?? 0,
          color: (q.c >= (q.o ?? q.c)) ? "rgba(0,255,65,0.25)" : "rgba(255,68,68,0.25)",
        })));
      }

      // MA20
      if (indicators.includes("MA20")) {
        const ma20 = sma(closes, 20);
        const s = chart.addSeries(lineSeries, { color: "#FFD700", lineWidth: 1, title: "MA20" });
        s.setData(times.filter((_, i) => ma20[i] != null).map((t, _, arr) => {
          const idx = times.indexOf(t);
          return { time: t as any, value: ma20[idx]! };
        }));
      }

      // MA50
      if (indicators.includes("MA50")) {
        const ma50 = sma(closes, 50);
        const s = chart.addSeries(lineSeries, { color: "#38BDF8", lineWidth: 1, title: "MA50" });
        s.setData(times.filter((_, i) => ma50[i] != null).map(t => {
          const idx = times.indexOf(t);
          return { time: t as any, value: ma50[idx]! };
        }));
      }

      // Bollinger Bands
      if (indicators.includes("BB")) {
        const bb = bollingerBands(closes);
        const filteredIdxs = times.map((t, i) => i).filter(i => bb.upper[i] != null);
        const setLine = (vals: (number|null)[], color: string) => {
          const s = chart.addSeries(lineSeries, { color, lineWidth: 1, lineStyle: 2 });
          s.setData(filteredIdxs.map(i => ({ time: times[i] as any, value: vals[i]! })));
        };
        setLine(bb.upper, "rgba(200,132,252,0.6)");
        setLine(bb.mid,   "rgba(200,132,252,0.3)");
        setLine(bb.lower, "rgba(200,132,252,0.6)");
      }

      chart.timeScale().fitContent();

      // ── RSI pane ────────────────────────────────────────────────────────────
      if (showRSI && rsiRef.current) {
        const rsiChart = createChart(rsiRef.current, {
          ...BASE_OPTS, height: 120, width: rsiRef.current.clientWidth,
          rightPriceScale: { ...BASE_OPTS.rightPriceScale, autoScale: false, minimumWidth: 60 },
        });
        chartsRef.current.push(rsiChart);
        rsiChart.priceScale("right").applyOptions({ autoScale: false, minimum: 0, maximum: 100 } as any);

        const rsiVals = rsi(closes);
        const s = rsiChart.addSeries(lineSeries, { color: "#C084FC", lineWidth: 2 });
        const filtered = times.filter((_, i) => rsiVals[i] != null);
        s.setData(filtered.map(t => { const i = times.indexOf(t); return { time: t as any, value: rsiVals[i]! }; }));

        // Overbought / oversold lines
        const ob = rsiChart.addSeries(lineSeries, { color: "rgba(239,68,68,0.4)", lineWidth: 1, lineStyle: 2 });
        const os = rsiChart.addSeries(lineSeries, { color: "rgba(0,255,65,0.4)",  lineWidth: 1, lineStyle: 2 });
        if (filtered.length >= 2) {
          const t0 = filtered[0] as any, t1 = filtered[filtered.length - 1] as any;
          ob.setData([{ time: t0, value: 70 }, { time: t1, value: 70 }]);
          os.setData([{ time: t0, value: 30 }, { time: t1, value: 30 }]);
        }
        rsiChart.timeScale().fitContent();

        // Sync crosshair
        chart.subscribeCrosshairMove(p => { if (p.time) rsiChart.setCrosshairPosition(0, p.time as any, s); });
      }

      // ── MACD pane ───────────────────────────────────────────────────────────
      if (showMACD && macdRef.current) {
        const macdChart = createChart(macdRef.current, {
          ...BASE_OPTS, height: 120, width: macdRef.current.clientWidth,
        });
        chartsRef.current.push(macdChart);

        const m = macd(closes);
        const filteredIdxs = times.map((_, i) => i).filter(i => m.line[i] != null);

        const histS = macdChart.addSeries(histogramSeries, { color: "#00FF41" });
        histS.setData(filteredIdxs.map(i => ({
          time: times[i] as any,
          value: m.hist[i] ?? 0,
          color: (m.hist[i] ?? 0) >= 0 ? "rgba(0,255,65,0.6)" : "rgba(255,68,68,0.6)",
        })));

        const lineS   = macdChart.addSeries(lineSeries, { color: "#00FF41",  lineWidth: 1, title: "MACD" });
        const signalS = macdChart.addSeries(lineSeries, { color: "#FF6B6B",  lineWidth: 1, title: "Signal" });
        lineS.setData(filteredIdxs.map(i => ({ time: times[i] as any, value: m.line[i]! })));
        signalS.setData(filteredIdxs.map(i => ({ time: times[i] as any, value: m.signal[i] ?? 0 })));
        macdChart.timeScale().fitContent();
      }

      // Resize observer
      const ro = new ResizeObserver(() => {
        if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth });
        if (rsiRef.current && chartsRef.current[1]) chartsRef.current[1].applyOptions({ width: rsiRef.current.clientWidth });
        if (macdRef.current && chartsRef.current[chartsRef.current.length - 1]) {
          chartsRef.current[chartsRef.current.length - 1].applyOptions({ width: macdRef.current.clientWidth });
        }
      });
      ro.observe(containerRef.current!);
      return () => ro.disconnect();
    });

    return () => { cancelled = true; chartsRef.current.forEach(c => { try { c.remove(); } catch {} }); chartsRef.current = []; };
  }, [quotes, chartType, indicators, height, closes, showRSI, showMACD]);

  return (
    <div className="flex flex-col gap-0">
      <div ref={containerRef} />
      {showRSI  && (
        <div>
          <div className="px-3 py-1 text-[10px] text-genius-muted font-mono border-t border-genius-border/30">RSI (14)</div>
          <div ref={rsiRef} />
        </div>
      )}
      {showMACD && (
        <div>
          <div className="px-3 py-1 text-[10px] text-genius-muted font-mono border-t border-genius-border/30">MACD (12,26,9)</div>
          <div ref={macdRef} />
        </div>
      )}
    </div>
  );
}
