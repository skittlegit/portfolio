"use client";

import { useEffect, useState, useCallback } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { getMyBalance, getMyTransactions, playCoinFlip, type CurrencyTransaction } from "@/lib/currency";

type FlipResult = { result: string; won: boolean; bet: number; new_balance: number };

export default function GamePage() {
  const { fg, fgMuted, isDark } = useTheme();
  const { profile } = useAuth();

  const borderSubtle = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const bgSubtle = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";

  const [balance, setBalance] = useState<number | null>(null);
  const [bet, setBet] = useState(10);
  const [choice, setChoice] = useState<"heads" | "tails">("heads");
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState<FlipResult | null>(null);
  const [history, setHistory] = useState<CurrencyTransaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [coinFace, setCoinFace] = useState<"heads" | "tails">("heads");

  const loadData = useCallback(async () => {
    const [bal, txns] = await Promise.all([
      getMyBalance(),
      getMyTransactions(20),
    ]);
    setBalance(bal);
    setHistory(txns.filter((t) => t.type === "game_win" || t.type === "game_loss"));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleFlip = async () => {
    if (flipping || balance === null) return;
    if (bet <= 0 || bet > balance) { setError("Invalid bet amount"); return; }
    setError(null);
    setResult(null);
    setFlipping(true);

    // Animate coin - rapid face switching
    let ticks = 0;
    const interval = setInterval(() => {
      setCoinFace((f) => (f === "heads" ? "tails" : "heads"));
      ticks++;
      if (ticks >= 12) clearInterval(interval);
    }, 100);

    try {
      // Small delay so animation plays while RPC runs
      const [res] = await Promise.all([
        playCoinFlip(bet, choice),
        new Promise((r) => setTimeout(r, 1400)),
      ]);
      clearInterval(interval);
      setCoinFace(res.result as "heads" | "tails");
      setResult(res);
      setBalance(res.new_balance);
      loadData();
    } catch (err) {
      clearInterval(interval);
      setError(err instanceof Error ? err.message : "Flip failed");
    } finally {
      setFlipping(false);
    }
  };

  const formatTime = (ts: string) => new Date(ts).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

  return (
    <div style={{ maxWidth: 560 }}>
      {/* Balance header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <p className="text-xs" style={{ color: fgMuted }}>Your balance</p>
          <p className="text-2xl font-medium" style={{ color: fg }}>{balance === null ? "…" : balance.toLocaleString()} <span style={{ color: fgMuted, fontSize: 14 }}>coins</span></p>
        </div>
        <div style={{ fontSize: 36 }}>🎰</div>
      </div>

      {/* Game card */}
      <div style={{ border: `1px solid ${borderSubtle}`, borderRadius: 16, padding: "28px 24px", marginBottom: 24 }}>
        {/* Coin display */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: "50%",
              margin: "0 auto",
              backgroundColor: coinFace === "heads"
                ? isDark ? "rgba(255,215,0,0.15)" : "rgba(255,215,0,0.3)"
                : isDark ? "rgba(192,192,192,0.15)" : "rgba(192,192,192,0.3)",
              border: `2px solid ${coinFace === "heads" ? "#FFD700" : "#C0C0C0"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 44,
              transition: flipping ? "none" : "all 0.3s",
              animation: flipping ? "coinSpin 0.2s linear infinite" : "none",
            }}
          >
            {coinFace === "heads" ? "👑" : "🌀"}
          </div>
          <p className="text-xs mt-2 font-medium" style={{ color: fgMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {flipping ? "Flipping…" : result ? (result.result === "heads" ? "Heads" : "Tails") : "Coin"}
          </p>
        </div>

        {/* Result banner */}
        {result && !flipping && (
          <div style={{ textAlign: "center", padding: "12px 16px", borderRadius: 10, marginBottom: 20, backgroundColor: result.won ? isDark ? "rgba(34,197,94,0.1)" : "rgba(34,197,94,0.08)" : isDark ? "rgba(239,68,68,0.1)" : "rgba(239,68,68,0.08)", border: `1px solid ${result.won ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}` }}>
            <p className="text-lg font-medium" style={{ color: result.won ? "#22c55e" : "#ef4444" }}>
              {result.won ? `+${result.bet} coins!` : `-${result.bet} coins`}
            </p>
            <p className="text-xs" style={{ color: fgMuted, marginTop: 2 }}>
              {result.result === choice ? "You called it right!" : "Better luck next time."} Balance: {result.new_balance.toLocaleString()}
            </p>
          </div>
        )}

        {error && (
          <div className="text-sm text-center mb-4" style={{ color: "#ef4444" }}>{error}</div>
        )}

        {/* Choice */}
        <div style={{ marginBottom: 16 }}>
          <p className="text-xs mb-2" style={{ color: fgMuted }}>Pick a side</p>
          <div style={{ display: "flex", gap: 8 }}>
            {(["heads", "tails"] as const).map((side) => (
              <button
                key={side}
                onClick={() => setChoice(side)}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: 10,
                  border: `1px solid ${choice === side ? fg : borderSubtle}`,
                  backgroundColor: choice === side ? isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" : "transparent",
                  color: choice === side ? fg : fgMuted,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: 14,
                  fontWeight: choice === side ? 500 : 400,
                  textTransform: "capitalize",
                }}
              >
                {side === "heads" ? "👑 Heads" : "🌀 Tails"}
              </button>
            ))}
          </div>
        </div>

        {/* Bet */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <p className="text-xs" style={{ color: fgMuted }}>Bet amount</p>
            <p className="text-xs" style={{ color: fgMuted }}>Max: {Math.min(balance ?? 0, 200)}</p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="number"
              className="tool-input"
              style={{ flex: 1, fontSize: 15, padding: "9px 12px", textAlign: "center" }}
              min={1}
              max={Math.min(balance ?? 0, 200)}
              value={bet}
              onChange={(e) => setBet(Math.max(1, Math.min(Number(e.target.value), Math.min(balance ?? 0, 200))))}
            />
            {[10, 25, 50, 100].map((v) => (
              <button
                key={v}
                onClick={() => setBet(Math.min(v, balance ?? 0))}
                style={{ padding: "8px 10px", borderRadius: 8, border: `1px solid ${borderSubtle}`, background: "none", cursor: "pointer", fontSize: 12, color: fgMuted, fontFamily: "inherit" }}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Flip button */}
        <button
          onClick={handleFlip}
          disabled={flipping || !bet || bet > (balance ?? 0)}
          style={{
            width: "100%",
            padding: "13px",
            borderRadius: 12,
            border: "none",
            backgroundColor: fg,
            color: isDark ? "#000" : "#fff",
            fontSize: 15,
            fontWeight: 500,
            fontFamily: "inherit",
            cursor: flipping || !bet || bet > (balance ?? 0) ? "default" : "pointer",
            opacity: flipping || !bet || bet > (balance ?? 0) ? 0.5 : 1,
            transition: "opacity 0.15s",
          }}
        >
          {flipping ? "Flipping…" : "Flip the Coin"}
        </button>
      </div>

      {/* Game history */}
      {history.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-3" style={{ color: fgMuted }}>Recent Games</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {history.map((t) => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 14px", border: `1px solid ${borderSubtle}`, borderRadius: 10, backgroundColor: bgSubtle }}>
                <div>
                  <p className="text-sm" style={{ color: fg }}>{t.note || (t.type === "game_win" ? "Win" : "Loss")}</p>
                  <p className="text-xs" style={{ color: fgMuted }}>{formatTime(t.created_at)}</p>
                </div>
                <span className="text-sm font-medium" style={{ color: t.type === "game_win" ? "#22c55e" : "#ef4444" }}>
                  {t.type === "game_win" ? "+" : "-"}{t.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes coinSpin {
          0% { transform: rotateY(0deg); }
          100% { transform: rotateY(360deg); }
        }
      `}</style>
    </div>
  );
}
