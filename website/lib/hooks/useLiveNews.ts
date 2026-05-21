"use client";

import { useState, useEffect, useCallback } from "react";

export type NewsItem = {
  title: string;
  publisher: string;
  link: string;
  publishedAt: number;
  thumbnail: string | null;
  score: number;
  sentiment: "bullish" | "bearish" | "neutral";
};

export function useLiveNews(sym: string, intervalMs = 60000) {
  const [news,    setNews]    = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(async () => {
    if (!sym) return;
    try {
      const r = await fetch(`/api/news?sym=${encodeURIComponent(sym)}`);
      if (!r.ok) return;
      const d = await r.json();
      setNews(d.news ?? []);
    } catch {}
    finally { setLoading(false); }
  }, [sym]);

  useEffect(() => {
    setLoading(true);
    fetch_();
    const iv = setInterval(fetch_, intervalMs);
    return () => clearInterval(iv);
  }, [sym, fetch_, intervalMs]);

  return { news, loading };
}
