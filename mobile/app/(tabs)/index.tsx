/**
 * GreenGeniusAI Mobile — Home / Portfolio Screen
 */

import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Animated, Switch, RefreshControl, StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const COLORS = {
  black: "#050A05",
  dark: "#0A120A",
  card: "#0F1A0F",
  border: "#1A2E1A",
  green: "#00FF41",
  emerald: "#00D97E",
  gold: "#FFD700",
  muted: "#4A7A4A",
  text: "#B8D4B8",
  white: "#FFFFFF",
  red: "#FF4444",
};

const RECENT_TRADES = [
  { action: "BUY", sym: "NVDA", amount: "$2,100", time: "2m ago", confidence: 94, reason: "Earnings beat 18%. AI GPU demand accelerating. Options flow 87% bullish." },
  { action: "SELL", sym: "TSLA", amount: "$1,100", time: "14m ago", confidence: 81, reason: "Delivery miss signals demand softening. Moving avg bearish crossover." },
  { action: "BUY", sym: "BTC", amount: "$850", time: "31m ago", confidence: 88, reason: "Halving cycle bull signal. Institutional inflows at 3-month high." },
];

export default function HomeScreen() {
  const [botActive, setBotActive] = useState(true);
  const [portfolioValue, setPortfolioValue] = useState(12847.33);
  const [refreshing, setRefreshing] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Live pulse on bot dot
  useEffect(() => {
    if (!botActive) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.4, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [botActive]);

  // Live portfolio tick
  useEffect(() => {
    const iv = setInterval(() => {
      setPortfolioValue((v) => Math.max(11000, +(v + (Math.random() - 0.3) * 10).toFixed(2)));
    }, 3000);
    return () => clearInterval(iv);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 1200));
    setRefreshing(false);
  };

  const gain = portfolioValue - 11000;
  const gainPct = ((gain / 11000) * 100).toFixed(2);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>
            <Text style={{ color: COLORS.green }}>Green</Text>GeniusAI
          </Text>
          <View style={styles.liveRow}>
            <Animated.View style={[styles.liveDot, { transform: [{ scale: pulseAnim }], opacity: botActive ? 1 : 0.3 }]} />
            <Text style={[styles.liveText, { color: botActive ? COLORS.green : COLORS.muted }]}>
              {botActive ? "AI ACTIVE" : "MANUAL MODE"}
            </Text>
          </View>
        </View>
        <Switch
          value={botActive}
          onValueChange={setBotActive}
          trackColor={{ false: COLORS.border, true: "rgba(0,255,65,0.3)" }}
          thumbColor={botActive ? COLORS.green : COLORS.muted}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.green} />}
      >
        {/* Portfolio card */}
        <View style={styles.portfolioCard}>
          <Text style={styles.portfolioLabel}>TOTAL PORTFOLIO</Text>
          <Text style={styles.portfolioValue}>
            ${portfolioValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          <View style={styles.gainRow}>
            <Text style={styles.gainText}>+${gain.toFixed(2)}</Text>
            <View style={styles.gainBadge}>
              <Text style={styles.gainBadgeText}>+{gainPct}%</Text>
            </View>
          </View>

          {/* Mini bar chart */}
          <View style={styles.miniChart}>
            {[40, 55, 45, 70, 60, 80, 65, 90, 75, 95, 85, 100].map((h, i) => (
              <View
                key={i}
                style={[
                  styles.chartBar,
                  {
                    height: h * 0.4,
                    backgroundColor: i >= 8 ? COLORS.green : "rgba(0,255,65,0.2)",
                  },
                ]}
              />
            ))}
          </View>
        </View>

        {/* KPIs */}
        <View style={styles.kpiRow}>
          {[
            { label: "Today", value: "+$342", sub: "+2.7%" },
            { label: "Trades (30d)", value: "47", sub: "78% win rate" },
            { label: "Positions", value: "6", sub: "active" },
          ].map((k, i) => (
            <View key={i} style={styles.kpiCard}>
              <Text style={styles.kpiValue}>{k.value}</Text>
              <Text style={styles.kpiLabel}>{k.label}</Text>
              <Text style={styles.kpiSub}>{k.sub}</Text>
            </View>
          ))}
        </View>

        {/* AI Trade Feed */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>AI Trade Feed</Text>
            <View style={styles.liveRow}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>

          {RECENT_TRADES.map((t, i) => (
            <TouchableOpacity key={i} style={styles.tradeCard} activeOpacity={0.8}>
              <View style={[styles.tradeBadge, { backgroundColor: t.action === "BUY" ? "rgba(0,255,65,0.15)" : "rgba(255,68,68,0.15)" }]}>
                <Text style={[styles.tradeBadgeText, { color: t.action === "BUY" ? COLORS.green : COLORS.red }]}>
                  {t.action}
                </Text>
              </View>
              <View style={styles.tradeInfo}>
                <View style={styles.tradeTopRow}>
                  <Text style={styles.tradeSym}>{t.sym}</Text>
                  <Text style={styles.tradeAmount}>{t.amount}</Text>
                  <Text style={styles.tradeTime}>{t.time}</Text>
                </View>
                <Text style={styles.tradeReason} numberOfLines={2}>{t.reason}</Text>
                <View style={styles.confidenceRow}>
                  <View style={styles.confidenceBar}>
                    <View style={[styles.confidenceFill, { width: `${t.confidence}%` }]} />
                  </View>
                  <Text style={styles.confidenceText}>{t.confidence}%</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Positions preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Positions</Text>
          {[
            { sym: "NVDA", value: "$2,100", change: "+4.8%", up: true },
            { sym: "BTC", value: "$2,115", change: "+3.4%", up: true },
            { sym: "MSFT", value: "$1,700", change: "+1.1%", up: true },
            { sym: "SOL", value: "$1,730", change: "+5.1%", up: true },
          ].map((p, i) => (
            <View key={i} style={styles.positionRow}>
              <View style={styles.positionIcon}>
                <Text style={styles.positionIconText}>{p.sym[0]}</Text>
              </View>
              <Text style={styles.positionSym}>{p.sym}</Text>
              <Text style={styles.positionValue}>{p.value}</Text>
              <Text style={[styles.positionChange, { color: p.up ? COLORS.green : COLORS.red }]}>
                {p.change}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.black },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  logo: { fontSize: 20, fontWeight: "900", color: COLORS.white, letterSpacing: -0.5 },
  liveRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.green },
  liveText: { fontSize: 10, fontWeight: "700", letterSpacing: 1 },
  scroll: { paddingBottom: 100 },
  portfolioCard: { margin: 16, padding: 20, backgroundColor: COLORS.card, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border },
  portfolioLabel: { fontSize: 10, color: COLORS.muted, fontWeight: "700", letterSpacing: 1.5, marginBottom: 6 },
  portfolioValue: { fontSize: 36, fontWeight: "900", color: COLORS.white, fontVariant: ["tabular-nums"] },
  gainRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  gainText: { fontSize: 14, color: COLORS.green, fontWeight: "700" },
  gainBadge: { backgroundColor: "rgba(0,255,65,0.1)", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  gainBadgeText: { fontSize: 12, color: COLORS.green, fontWeight: "700" },
  miniChart: { flexDirection: "row", alignItems: "flex-end", gap: 3, marginTop: 16, height: 40 },
  chartBar: { flex: 1, borderRadius: 2 },
  kpiRow: { flexDirection: "row", gap: 10, paddingHorizontal: 16, marginBottom: 6 },
  kpiCard: { flex: 1, backgroundColor: COLORS.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: COLORS.border, alignItems: "center" },
  kpiValue: { fontSize: 20, fontWeight: "900", color: COLORS.white, marginBottom: 2 },
  kpiLabel: { fontSize: 10, color: COLORS.muted, fontWeight: "700", letterSpacing: 0.5 },
  kpiSub: { fontSize: 10, color: COLORS.green, marginTop: 2 },
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: COLORS.white },
  tradeCard: { backgroundColor: COLORS.card, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border, flexDirection: "row", gap: 10 },
  tradeBadge: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8, alignSelf: "flex-start" },
  tradeBadgeText: { fontSize: 11, fontWeight: "900", letterSpacing: 1 },
  tradeInfo: { flex: 1 },
  tradeTopRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  tradeSym: { fontSize: 14, fontWeight: "800", color: COLORS.white, flex: 1 },
  tradeAmount: { fontSize: 12, fontWeight: "700", color: COLORS.white },
  tradeTime: { fontSize: 10, color: COLORS.muted },
  tradeReason: { fontSize: 11, color: COLORS.text, lineHeight: 16 },
  confidenceRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  confidenceBar: { flex: 1, height: 4, backgroundColor: COLORS.border, borderRadius: 2, overflow: "hidden" },
  confidenceFill: { height: "100%", backgroundColor: COLORS.green, borderRadius: 2 },
  confidenceText: { fontSize: 10, color: COLORS.green, fontWeight: "700" },
  positionRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: 10 },
  positionIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.border, alignItems: "center", justifyContent: "center" },
  positionIconText: { fontSize: 14, fontWeight: "900", color: COLORS.green },
  positionSym: { flex: 1, fontSize: 14, fontWeight: "700", color: COLORS.white },
  positionValue: { fontSize: 13, color: COLORS.white, fontWeight: "600", marginRight: 8 },
  positionChange: { fontSize: 12, fontWeight: "700", minWidth: 50, textAlign: "right" },
});
