"use client";

import { useEffect, useState, useCallback } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import {
  getMyBalance,
  getMyTransactions,
  playCoinFlip,
  playDiceRoll,
  playNumberGuess,
  getCustomBets,
  getBetEntries,
  createCustomBet,
  joinBet,
  resolveBet,
  closeBet,
  editBet,
  cancelBet,
  adminCancelBet,
  adminResolveBet,
  adminEditBet,
  type CurrencyTransaction,
  type CustomBet,
  type BetEntry,
} from "@/lib/currency";
import { getWhitelistedUsers } from "@/lib/chat";
import { isAdmin } from "@/lib/whitelist";
import { Plus, Dice1, Hash, Users, ChevronDown, X, Pencil, Ban, Lock } from "lucide-react";

type GameTab = "coin" | "dice" | "guess" | "bets";

type FlipResult = { result: string; won: boolean; bet: number; new_balance: number };
type DiceResult = { roll: number; won: boolean; bet: number; new_balance: number };
type GuessResult = { number: number; won: boolean; bet: number; new_balance: number };

export default function GamePage() {
  const { fg, fgMuted, isDark } = useTheme();
  const { user, profile } = useAuth();
  const userIsAdmin = isAdmin(profile?.username);

  const borderSubtle = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const bgSubtle = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";

  const [tab, setTab] = useState<GameTab>("coin");
  const [balance, setBalance] = useState<number | null>(null);
  const [history, setHistory] = useState<CurrencyTransaction[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Coin flip state
  const [coinBet, setCoinBet] = useState(10);
  const [coinChoice, setCoinChoice] = useState<"heads" | "tails">("heads");
  const [flipping, setFlipping] = useState(false);
  const [flipResult, setFlipResult] = useState<FlipResult | null>(null);
  const [coinFace, setCoinFace] = useState<"heads" | "tails">("heads");

  // Dice state
  const [diceBet, setDiceBet] = useState(10);
  const [diceTarget, setDiceTarget] = useState(7);
  const [rolling, setRolling] = useState(false);
  const [diceResult, setDiceResult] = useState<DiceResult | null>(null);
  const [diceDisplay, setDiceDisplay] = useState(7);

  // Number guess state
  const [guessBet, setGuessBet] = useState(10);
  const [guessNum, setGuessNum] = useState(5);
  const [guessing, setGuessing] = useState(false);
  const [guessResult, setGuessResult] = useState<GuessResult | null>(null);

  // Custom bets state
  const [bets, setBets] = useState<CustomBet[]>([]);
  const [betEntries, setBetEntries] = useState<Record<string, BetEntry[]>>({});
  const [profiles, setProfiles] = useState<Record<string, { username: string; avatar_url: string | null }>>({});
  const [showCreateBet, setShowCreateBet] = useState(false);
  const [newBetTitle, setNewBetTitle] = useState("");
  const [newBetDesc, setNewBetDesc] = useState("");
  const [newBetAmount, setNewBetAmount] = useState(50);
  const [joiningSide, setJoiningSide] = useState<Record<string, "for" | "against">>({});
  const [joiningAmount, setJoiningAmount] = useState<Record<string, number>>({});
  const [expandedBet, setExpandedBet] = useState<string | null>(null);

  // Edit bet state
  const [editingBet, setEditingBet] = useState<CustomBet | null>(null);
  const [editBetTitle, setEditBetTitle] = useState("");
  const [editBetDesc, setEditBetDesc] = useState("");

  const maxBet = Math.min(balance ?? 0, 200);

  const loadData = useCallback(async () => {
    const [bal, txns] = await Promise.all([
      getMyBalance(),
      getMyTransactions(20),
    ]);
    setBalance(bal);
    setHistory(txns.filter((t) => t.type === "game_win" || t.type === "game_loss" || t.type === "bet_entry"));
  }, []);

  const loadBets = useCallback(async () => {
    try {
      const [allBets, users] = await Promise.all([
        getCustomBets(),
        getWhitelistedUsers(),
      ]);
      setBets(allBets);
      const profileMap: Record<string, { username: string; avatar_url: string | null }> = {};
      users.forEach((u) => { profileMap[u.id] = { username: u.username, avatar_url: u.avatar_url }; });
      setProfiles(profileMap);
      // Load entries for each bet
      const entriesMap: Record<string, BetEntry[]> = {};
      await Promise.all(allBets.map(async (b) => {
        const entries = await getBetEntries(b.id);
        entriesMap[b.id] = entries;
      }));
      setBetEntries(entriesMap);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { if (tab === "bets") loadBets(); }, [tab, loadBets]);

  /* ── Coin Flip ── */
  const handleFlip = async () => {
    if (flipping || balance === null) return;
    if (coinBet <= 0 || coinBet > balance) { setError("Invalid bet"); return; }
    setError(null); setFlipResult(null); setFlipping(true);
    let ticks = 0;
    const interval = setInterval(() => {
      setCoinFace((f) => (f === "heads" ? "tails" : "heads"));
      ticks++;
      if (ticks >= 12) clearInterval(interval);
    }, 100);
    try {
      const [res] = await Promise.all([playCoinFlip(coinBet, coinChoice), new Promise((r) => setTimeout(r, 1400))]);
      clearInterval(interval);
      setCoinFace(res.result as "heads" | "tails");
      setFlipResult(res); setBalance(res.new_balance); loadData();
    } catch (err) {
      clearInterval(interval);
      setError(err instanceof Error ? err.message : "Flip failed");
    } finally { setFlipping(false); }
  };

  /* ── Dice Roll ── */
  const handleDice = async () => {
    if (rolling || balance === null) return;
    if (diceBet <= 0 || diceBet > balance) { setError("Invalid bet"); return; }
    setError(null); setDiceResult(null); setRolling(true);
    let ticks = 0;
    const interval = setInterval(() => {
      setDiceDisplay(Math.floor(Math.random() * 11) + 2);
      ticks++;
      if (ticks >= 14) clearInterval(interval);
    }, 100);
    try {
      const [res] = await Promise.all([playDiceRoll(diceBet, diceTarget), new Promise((r) => setTimeout(r, 1600))]);
      clearInterval(interval);
      setDiceDisplay(res.roll); setDiceResult(res); setBalance(res.new_balance); loadData();
    } catch (err) {
      clearInterval(interval);
      setError(err instanceof Error ? err.message : "Roll failed");
    } finally { setRolling(false); }
  };

  /* ── Number Guess ── */
  const handleGuess = async () => {
    if (guessing || balance === null) return;
    if (guessBet <= 0 || guessBet > balance) { setError("Invalid bet"); return; }
    setError(null); setGuessResult(null); setGuessing(true);
    try {
      const res = await playNumberGuess(guessBet, guessNum);
      setGuessResult(res); setBalance(res.new_balance); loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Guess failed");
    } finally { setGuessing(false); }
  };

  /* ── Custom Bets ── */
  const handleCreateBet = async () => {
    if (!newBetTitle.trim()) { setError("Title is required"); return; }
    setError(null);
    try {
      await createCustomBet(newBetTitle, newBetDesc, newBetAmount);
      setNewBetTitle(""); setNewBetDesc(""); setNewBetAmount(50);
      setShowCreateBet(false); loadBets(); loadData();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to create bet"); }
  };

  const handleJoinBet = async (betId: string) => {
    const side = joiningSide[betId] || "for";
    const amount = joiningAmount[betId] || 10;
    setError(null);
    try {
      await joinBet(betId, side, amount);
      loadBets(); loadData();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to join bet"); }
  };

  const handleCloseBet = async (betId: string) => {
    setError(null);
    try {
      await closeBet(betId);
      loadBets();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to close bet"); }
  };

  const handleEditBet = async () => {
    if (!editingBet) return;
    setError(null);
    try {
      const isCreator = editingBet.creator_id === user?.id;
      if (isCreator) {
        await editBet(editingBet.id, editBetTitle, editBetDesc);
      } else {
        await adminEditBet(editingBet.id, editBetTitle, editBetDesc);
      }
      setEditingBet(null);
      loadBets();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to edit bet"); }
  };

  const handleCancelBet = async (betId: string) => {
    setError(null);
    try {
      const bet = bets.find((b) => b.id === betId);
      const isCreator = bet?.creator_id === user?.id;
      if (isCreator) {
        await cancelBet(betId);
      } else {
        await adminCancelBet(betId);
      }
      loadBets(); loadData();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to cancel bet"); }
  };

  const handleResolveBet = async (betId: string, side: "for" | "against") => {
    setError(null);
    try {
      const bet = bets.find((b) => b.id === betId);
      const isCreator = bet?.creator_id === user?.id;
      if (isCreator) {
        await resolveBet(betId, side);
      } else {
        await adminResolveBet(betId, side);
      }
      loadBets(); loadData();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to resolve bet"); }
  };

  const payoutMultipliers: Record<number, number> = {
    2: 1.1, 3: 1.2, 4: 1.4, 5: 1.6, 6: 1.9, 7: 2.4, 8: 3.0, 9: 4.0, 10: 6.0, 11: 12.0,
  };

  const formatTime = (ts: string) => new Date(ts).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

  const tabItems: { key: GameTab; label: string; icon: React.ReactNode }[] = [
    { key: "coin", label: "Coin", icon: "🪙" },
    { key: "dice", label: "Dice", icon: <Dice1 size={14} /> },
    { key: "guess", label: "Guess", icon: <Hash size={14} /> },
    { key: "bets", label: "Bets", icon: <Users size={14} /> },
  ];

  /* ── Shared components ── */

  const ResultBanner = ({ won, amount, subtitle }: { won: boolean; amount: number; subtitle: string }) => (
    <div className="s165-fade-in" style={{ textAlign: "center", padding: "12px 16px", borderRadius: 10, marginBottom: 20, backgroundColor: won ? isDark ? "rgba(34,197,94,0.1)" : "rgba(34,197,94,0.08)" : isDark ? "rgba(239,68,68,0.1)" : "rgba(239,68,68,0.08)", border: `1px solid ${won ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}` }}>
      <p className="text-lg font-medium" style={{ color: won ? "#22c55e" : "#ef4444" }}>
        {won ? `+${amount} coins!` : `-${amount} coins`}
      </p>
      <p className="text-xs" style={{ color: fgMuted, marginTop: 2 }}>{subtitle}</p>
    </div>
  );

  const BetInput = ({ value, onChange, label }: { value: number; onChange: (v: number) => void; label?: string }) => (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <p className="text-xs" style={{ color: fgMuted }}>{label || "Bet amount"}</p>
        <p className="text-xs" style={{ color: fgMuted }}>Max: {maxBet}</p>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <input
          type="number"
          className="tool-input"
          style={{ flex: 1, minWidth: 80, fontSize: 15, padding: "9px 12px", textAlign: "center" }}
          min={1}
          max={maxBet}
          value={value}
          onChange={(e) => onChange(Math.max(1, Math.min(Number(e.target.value), maxBet)))}
        />
        {[10, 25, 50, 100].map((v) => (
          <button key={v} onClick={() => onChange(Math.min(v, balance ?? 0))} className="s165-btn-ghost" style={{ padding: "8px 10px", fontSize: 12 }}>
            {v}
          </button>
        ))}
      </div>
    </div>
  );

  const PlayButton = ({ onClick, disabled, loading, label }: { onClick: () => void; disabled: boolean; loading: boolean; label: string }) => (
    <button onClick={onClick} disabled={disabled || loading} className="s165-btn-primary" style={{ width: "100%", padding: "13px", fontSize: 15, opacity: disabled || loading ? 0.5 : 1 }}>
      {loading ? "Playing…" : label}
    </button>
  );

  return (
    <div style={{ maxWidth: 600 }}>
      {/* Balance header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <p className="text-xs" style={{ color: fgMuted }}>Your balance</p>
          <p className="text-2xl font-medium" style={{ color: fg }}>
            {balance === null ? "…" : balance.toLocaleString()}{" "}
            <span style={{ color: fgMuted, fontSize: 14 }}>coins</span>
          </p>
        </div>
        <div style={{ fontSize: 32 }}>🎰</div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        {tabItems.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setError(null); }}
            style={{
              flex: 1,
              minWidth: 0,
              padding: "10px 6px",
              border: `1px solid ${tab === t.key ? fg : borderSubtle}`,
              borderRadius: 10,
              backgroundColor: tab === t.key ? (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)") : "transparent",
              color: tab === t.key ? fg : fgMuted,
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 13,
              fontWeight: tab === t.key ? 500 : 400,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
              whiteSpace: "nowrap",
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {error && <div className="text-sm text-center mb-4" style={{ color: "#ef4444" }}>{error}</div>}

      {/* ── Coin Flip ── */}
      {tab === "coin" && (
        <div className="s165-card" style={{ padding: "28px 24px", marginBottom: 24 }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{
              width: 100, height: 100, borderRadius: "50%", margin: "0 auto",
              backgroundColor: coinFace === "heads" ? (isDark ? "rgba(255,215,0,0.15)" : "rgba(255,215,0,0.3)") : (isDark ? "rgba(192,192,192,0.15)" : "rgba(192,192,192,0.3)"),
              border: `2px solid ${coinFace === "heads" ? "#FFD700" : "#C0C0C0"}`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44,
              transition: flipping ? "none" : "all 0.3s",
              animation: flipping ? "s165CoinSpin 0.2s linear infinite" : "none",
            }}>
              {coinFace === "heads" ? "👑" : "🌀"}
            </div>
            <p className="text-xs mt-2 font-medium" style={{ color: fgMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {flipping ? "Flipping…" : flipResult ? (flipResult.result === "heads" ? "Heads" : "Tails") : "Coin Flip"}
            </p>
          </div>

          {flipResult && !flipping && (
            <ResultBanner won={flipResult.won} amount={flipResult.bet} subtitle={`${flipResult.result === coinChoice ? "You called it right!" : "Better luck next time."} Balance: ${flipResult.new_balance.toLocaleString()}`} />
          )}

          <div style={{ marginBottom: 16 }}>
            <p className="text-xs mb-2" style={{ color: fgMuted }}>Pick a side</p>
            <div style={{ display: "flex", gap: 8 }}>
              {(["heads", "tails"] as const).map((side) => (
                <button key={side} onClick={() => setCoinChoice(side)} style={{
                  flex: 1, padding: "10px", borderRadius: 10,
                  border: `1px solid ${coinChoice === side ? fg : borderSubtle}`,
                  backgroundColor: coinChoice === side ? (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)") : "transparent",
                  color: coinChoice === side ? fg : fgMuted, cursor: "pointer", fontFamily: "inherit", fontSize: 14,
                  fontWeight: coinChoice === side ? 500 : 400,
                }}>
                  {side === "heads" ? "👑 Heads" : "🌀 Tails"}
                </button>
              ))}
            </div>
          </div>

          <BetInput value={coinBet} onChange={setCoinBet} />
          <PlayButton onClick={handleFlip} disabled={!coinBet || coinBet > (balance ?? 0)} loading={flipping} label="Flip the Coin" />
        </div>
      )}

      {/* ── Dice Roll ── */}
      {tab === "dice" && (
        <div className="s165-card" style={{ padding: "28px 24px", marginBottom: 24 }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{
              width: 100, height: 100, borderRadius: 16, margin: "0 auto",
              backgroundColor: isDark ? "rgba(139,92,246,0.12)" : "rgba(139,92,246,0.08)",
              border: "2px solid rgba(139,92,246,0.4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: rolling ? 28 : 36, fontWeight: 700, color: fg,
              transition: rolling ? "none" : "all 0.3s",
              animation: rolling ? "s165CoinSpin 0.15s linear infinite" : "none",
            }}>
              {rolling ? diceDisplay : diceResult ? diceResult.roll : "🎲"}
            </div>
            <p className="text-xs mt-2 font-medium" style={{ color: fgMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {rolling ? "Rolling…" : diceResult ? `Rolled ${diceResult.roll}` : "Dice Roll"}
            </p>
          </div>

          {diceResult && !rolling && (
            <ResultBanner won={diceResult.won} amount={diceResult.won ? Math.floor(diceResult.bet * (payoutMultipliers[diceTarget] || 2)) : diceResult.bet} subtitle={`Rolled ${diceResult.roll} (needed > ${diceTarget}). Balance: ${diceResult.new_balance.toLocaleString()}`} />
          )}

          <div style={{ marginBottom: 16 }}>
            <p className="text-xs mb-2" style={{ color: fgMuted }}>Roll over target (2d6, higher target = higher payout)</p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {[3, 5, 7, 9, 11].map((t) => (
                <button key={t} onClick={() => setDiceTarget(t)} style={{
                  flex: 1, minWidth: 50, padding: "10px 4px", borderRadius: 10,
                  border: `1px solid ${diceTarget === t ? fg : borderSubtle}`,
                  backgroundColor: diceTarget === t ? (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)") : "transparent",
                  color: diceTarget === t ? fg : fgMuted, cursor: "pointer", fontFamily: "inherit", fontSize: 13,
                  fontWeight: diceTarget === t ? 500 : 400,
                }}>
                  &gt;{t} <span style={{ fontSize: 10, opacity: 0.6 }}>×{payoutMultipliers[t]}</span>
                </button>
              ))}
            </div>
          </div>

          <BetInput value={diceBet} onChange={setDiceBet} />
          <PlayButton onClick={handleDice} disabled={!diceBet || diceBet > (balance ?? 0)} loading={rolling} label="Roll the Dice" />
        </div>
      )}

      {/* ── Number Guess ── */}
      {tab === "guess" && (
        <div className="s165-card" style={{ padding: "28px 24px", marginBottom: 24 }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{
              width: 100, height: 100, borderRadius: 16, margin: "0 auto",
              backgroundColor: isDark ? "rgba(234,179,8,0.1)" : "rgba(234,179,8,0.08)",
              border: "2px solid rgba(234,179,8,0.35)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 36, fontWeight: 700, color: fg,
            }}>
              {guessing ? "?" : guessResult ? guessResult.number : "#"}
            </div>
            <p className="text-xs mt-2 font-medium" style={{ color: fgMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {guessing ? "Picking…" : guessResult ? `It was ${guessResult.number}` : "Number Guess"}
            </p>
          </div>

          {guessResult && !guessing && (
            <ResultBanner won={guessResult.won} amount={guessResult.won ? guessResult.bet * 8 : guessResult.bet} subtitle={`You picked ${guessNum}, it was ${guessResult.number}. ${guessResult.won ? "8× payout!" : ""} Balance: ${guessResult.new_balance.toLocaleString()}`} />
          )}

          <div style={{ marginBottom: 16 }}>
            <p className="text-xs mb-2" style={{ color: fgMuted }}>Pick a number (1-10) — 8× payout if correct</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <button key={n} onClick={() => setGuessNum(n)} style={{
                  padding: "12px 4px", borderRadius: 10,
                  border: `1px solid ${guessNum === n ? fg : borderSubtle}`,
                  backgroundColor: guessNum === n ? (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)") : "transparent",
                  color: guessNum === n ? fg : fgMuted, cursor: "pointer", fontFamily: "inherit", fontSize: 16,
                  fontWeight: guessNum === n ? 600 : 400,
                }}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          <BetInput value={guessBet} onChange={setGuessBet} />
          <PlayButton onClick={handleGuess} disabled={!guessBet || guessBet > (balance ?? 0)} loading={guessing} label="Guess!" />
        </div>
      )}

      {/* ── Custom Bets ── */}
      {tab === "bets" && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h3 className="s165-section-title" style={{ margin: 0 }}>Custom Bets</h3>
            <button onClick={() => setShowCreateBet(true)} className="s165-btn-ghost" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13 }}>
              <Plus size={14} /> New Bet
            </button>
          </div>

          {/* Create bet modal */}
          {showCreateBet && (
            <div className="s165-modal-backdrop" onClick={() => setShowCreateBet(false)}>
              <div className="s165-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440, width: "92vw" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <h3 className="text-base font-medium" style={{ color: fg }}>Create a Bet</h3>
                  <button onClick={() => setShowCreateBet(false)} style={{ background: "none", border: "none", cursor: "pointer", color: fgMuted, padding: 4 }}><X size={18} /></button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <input
                    className="tool-input"
                    placeholder="Bet title (e.g. 'Team A wins tomorrow')"
                    value={newBetTitle}
                    onChange={(e) => setNewBetTitle(e.target.value)}
                    maxLength={100}
                  />
                  <textarea
                    className="tool-input"
                    placeholder="Description / rules (optional)"
                    value={newBetDesc}
                    onChange={(e) => setNewBetDesc(e.target.value)}
                    rows={3}
                    style={{ resize: "vertical" }}
                    maxLength={500}
                  />
                  <div>
                    <p className="text-xs mb-1" style={{ color: fgMuted }}>Entry amount (1-500 coins)</p>
                    <input
                      type="number"
                      className="tool-input"
                      value={newBetAmount}
                      onChange={(e) => setNewBetAmount(Math.max(1, Math.min(500, Number(e.target.value))))}
                      min={1}
                      max={500}
                    />
                  </div>
                  <button onClick={handleCreateBet} className="s165-btn-primary" style={{ padding: "12px", fontSize: 14 }}>
                    Create Bet
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Bet list */}
          {bets.length === 0 ? (
            <div className="s165-card" style={{ padding: "32px 20px", textAlign: "center" }}>
              <p className="text-sm" style={{ color: fgMuted }}>No bets yet. Create the first one!</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {bets.map((bet) => {
                const entries = betEntries[bet.id] || [];
                const forEntries = entries.filter((e) => e.side === "for");
                const againstEntries = entries.filter((e) => e.side === "against");
                const forTotal = forEntries.reduce((s, e) => s + e.amount, 0);
                const againstTotal = againstEntries.reduce((s, e) => s + e.amount, 0);
                const pool = forTotal + againstTotal;
                const isCreator = bet.creator_id === user?.id;
                const alreadyJoined = entries.some((e) => e.user_id === user?.id);
                const isExpanded = expandedBet === bet.id;
                const isOpen = bet.status === "open";
                const isClosed = bet.status === "closed";
                const isCancelled = bet.status === "cancelled";
                const isResolved = bet.status === "resolved";
                const canJoin = isOpen && !alreadyJoined && !isCreator;

                const statusColor = isOpen ? "#22c55e" : isCancelled ? "#f59e0b" : isResolved ? "#3b82f6" : fgMuted;
                const statusBg = isOpen ? (isDark ? "rgba(34,197,94,0.12)" : "rgba(34,197,94,0.08)")
                  : isCancelled ? (isDark ? "rgba(245,158,11,0.12)" : "rgba(245,158,11,0.08)")
                  : isResolved ? (isDark ? "rgba(59,130,246,0.12)" : "rgba(59,130,246,0.08)")
                  : (isDark ? "rgba(161,161,170,0.12)" : "rgba(0,0,0,0.06)");
                const statusLabel = isOpen ? "Open" : isClosed ? "Closed" : isCancelled ? "Cancelled" : bet.outcome ? `${bet.outcome} won` : "Resolved";

                return (
                  <div key={bet.id} className="s165-card" style={{ padding: 0, overflow: "hidden" }}>
                    {/* Bet header */}
                    <button
                      onClick={() => setExpandedBet(isExpanded ? null : bet.id)}
                      style={{
                        width: "100%", padding: "14px 16px", border: "none", background: "none",
                        display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
                        fontFamily: "inherit", textAlign: "left",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                          <p className="text-sm font-medium" style={{ color: fg, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {bet.title}
                          </p>
                          <span style={{
                            fontSize: 10, padding: "2px 6px", borderRadius: 6, fontWeight: 500, flexShrink: 0,
                            backgroundColor: statusBg,
                            color: statusColor,
                          }}>
                            {statusLabel}
                          </span>
                        </div>
                        <p className="text-xs" style={{ color: fgMuted }}>
                          by {profiles[bet.creator_id]?.username || "?"} · {entries.length} participant{entries.length !== 1 ? "s" : ""} · {pool} coins in pool
                        </p>
                      </div>
                      <ChevronDown size={16} style={{ color: fgMuted, transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }} />
                    </button>

                    {/* Expanded content */}
                    {isExpanded && (
                      <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${borderSubtle}` }}>
                        {bet.description && (
                          <p className="text-sm" style={{ color: fgMuted, marginTop: 12, marginBottom: 12 }}>{bet.description}</p>
                        )}

                        {/* Sides bar */}
                        <div style={{ marginBottom: 12, marginTop: bet.description ? 0 : 12 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <span className="text-xs" style={{ color: "#22c55e" }}>For ({forEntries.length})</span>
                            <span className="text-xs" style={{ color: "#ef4444" }}>Against ({againstEntries.length})</span>
                          </div>
                          <div style={{ height: 6, borderRadius: 3, backgroundColor: bgSubtle, display: "flex", overflow: "hidden" }}>
                            {pool > 0 && <div style={{ width: `${(forTotal / pool) * 100}%`, backgroundColor: "#22c55e", borderRadius: 3, transition: "width 0.3s" }} />}
                            {pool > 0 && <div style={{ width: `${(againstTotal / pool) * 100}%`, backgroundColor: "#ef4444", borderRadius: 3, transition: "width 0.3s" }} />}
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
                            <span className="text-xs" style={{ color: fgMuted }}>{forTotal} coins</span>
                            <span className="text-xs" style={{ color: fgMuted }}>{againstTotal} coins</span>
                          </div>
                        </div>

                        {/* Participants */}
                        {entries.length > 0 && (
                          <div style={{ marginBottom: 12 }}>
                            <p className="text-xs mb-1 font-medium" style={{ color: fgMuted }}>Participants</p>
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                              {entries.map((e) => (
                                <div key={e.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 0" }}>
                                  <span className="text-xs" style={{ color: fg }}>{profiles[e.user_id]?.username || "?"}</span>
                                  <span className="text-xs" style={{ color: e.side === "for" ? "#22c55e" : "#ef4444" }}>
                                    {e.side} · {e.amount} coins
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Join controls */}
                        {canJoin && (
                          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                            <div style={{ display: "flex", gap: 4 }}>
                              {(["for", "against"] as const).map((s) => (
                                <button key={s} onClick={() => setJoiningSide({ ...joiningSide, [bet.id]: s })} style={{
                                  padding: "6px 12px", borderRadius: 8, fontSize: 12, fontFamily: "inherit", cursor: "pointer",
                                  border: `1px solid ${(joiningSide[bet.id] || "for") === s ? (s === "for" ? "#22c55e" : "#ef4444") : borderSubtle}`,
                                  backgroundColor: (joiningSide[bet.id] || "for") === s ? (s === "for" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)") : "transparent",
                                  color: (joiningSide[bet.id] || "for") === s ? (s === "for" ? "#22c55e" : "#ef4444") : fgMuted,
                                  textTransform: "capitalize",
                                }}>
                                  {s}
                                </button>
                              ))}
                            </div>
                            <input
                              type="number"
                              className="tool-input"
                              style={{ width: 80, fontSize: 13, padding: "6px 8px", textAlign: "center" }}
                              min={1}
                              max={Math.min(balance ?? 0, 500)}
                              value={joiningAmount[bet.id] || bet.amount}
                              onChange={(e) => setJoiningAmount({ ...joiningAmount, [bet.id]: Math.max(1, Math.min(Number(e.target.value), Math.min(balance ?? 0, 500))) })}
                            />
                            <button onClick={() => handleJoinBet(bet.id)} className="s165-btn-primary" style={{ padding: "6px 16px", fontSize: 13 }}>
                              Join
                            </button>
                          </div>
                        )}

                        {alreadyJoined && isOpen && (
                          <p className="text-xs" style={{ color: fgMuted, fontStyle: "italic" }}>You&apos;ve already joined this bet.</p>
                        )}

                        {isCancelled && (
                          <p className="text-xs" style={{ color: "#f59e0b", fontStyle: "italic", marginTop: 8 }}>This bet was cancelled. All entries were refunded.</p>
                        )}

                        {/* Creator / Admin controls */}
                        {(isCreator || userIsAdmin) && (isOpen || isClosed) && (
                          <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${borderSubtle}` }}>
                            <p className="text-xs mb-2 font-medium" style={{ color: fgMuted }}>Manage bet</p>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: entries.length > 0 ? 10 : 0 }}>
                              <button
                                onClick={() => { setEditingBet(bet); setEditBetTitle(bet.title); setEditBetDesc(bet.description); }}
                                className="s165-btn-ghost"
                                style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", fontSize: 12 }}
                              >
                                <Pencil size={12} /> Edit
                              </button>
                              {isOpen && (
                                <button
                                  onClick={() => handleCloseBet(bet.id)}
                                  className="s165-btn-ghost"
                                  style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", fontSize: 12 }}
                                >
                                  <Lock size={12} /> Close entries
                                </button>
                              )}
                              <button
                                onClick={() => handleCancelBet(bet.id)}
                                style={{
                                  display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", fontSize: 12,
                                  borderRadius: 8, fontFamily: "inherit", cursor: "pointer",
                                  border: "1px solid rgba(245,158,11,0.3)", backgroundColor: "rgba(245,158,11,0.06)",
                                  color: "#f59e0b",
                                }}
                              >
                                <Ban size={12} /> Cancel & refund
                              </button>
                            </div>

                            {/* Resolve controls */}
                            {entries.length > 0 && (
                              <div>
                                <p className="text-xs mb-2 font-medium" style={{ color: fgMuted }}>Resolve</p>
                                <div style={{ display: "flex", gap: 8 }}>
                                  <button onClick={() => handleResolveBet(bet.id, "for")} style={{
                                    flex: 1, padding: "8px", borderRadius: 8, fontSize: 13, fontFamily: "inherit", cursor: "pointer",
                                    border: "1px solid rgba(34,197,94,0.3)", backgroundColor: "rgba(34,197,94,0.08)", color: "#22c55e",
                                  }}>
                                    &quot;For&quot; wins
                                  </button>
                                  <button onClick={() => handleResolveBet(bet.id, "against")} style={{
                                    flex: 1, padding: "8px", borderRadius: 8, fontSize: 13, fontFamily: "inherit", cursor: "pointer",
                                    border: "1px solid rgba(239,68,68,0.3)", backgroundColor: "rgba(239,68,68,0.08)", color: "#ef4444",
                                  }}>
                                    &quot;Against&quot; wins
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Edit bet modal */}
          {editingBet && (
            <div className="s165-modal-backdrop" onClick={() => setEditingBet(null)}>
              <div className="s165-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440, width: "92vw" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <h3 className="text-base font-medium" style={{ color: fg }}>Edit Bet</h3>
                  <button onClick={() => setEditingBet(null)} style={{ background: "none", border: "none", cursor: "pointer", color: fgMuted, padding: 4 }}><X size={18} /></button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <input
                    className="tool-input"
                    placeholder="Bet title"
                    value={editBetTitle}
                    onChange={(e) => setEditBetTitle(e.target.value)}
                    maxLength={100}
                  />
                  <textarea
                    className="tool-input"
                    placeholder="Description / rules"
                    value={editBetDesc}
                    onChange={(e) => setEditBetDesc(e.target.value)}
                    rows={3}
                    style={{ resize: "vertical" }}
                    maxLength={500}
                  />
                  <button onClick={handleEditBet} className="s165-btn-primary" style={{ padding: "12px", fontSize: 14 }}>
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Game history */}
      {history.length > 0 && (
        <div>
          <h3 className="s165-section-title">Recent Games</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {history.map((t) => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 14px", border: `1px solid ${borderSubtle}`, borderRadius: 10, backgroundColor: bgSubtle }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p className="text-sm" style={{ color: fg, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.note || (t.type === "game_win" ? "Win" : "Loss")}</p>
                  <p className="text-xs" style={{ color: fgMuted }}>{formatTime(t.created_at)}</p>
                </div>
                <span className="text-sm font-medium" style={{ color: t.type === "game_win" ? "#22c55e" : "#ef4444", flexShrink: 0, marginLeft: 8 }}>
                  {t.type === "game_win" ? "+" : "-"}{t.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
