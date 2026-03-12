"use client";

import { useEffect, useState, useCallback } from "react";
import { useTheme } from "../../context/ThemeContext";
import { getMyBalance, getAllBalances, getMyTransactions, getAllTransactions, transferCurrency, type UserBalance, type CurrencyTransaction } from "@/lib/currency";
import { getWhitelistedUsers } from "@/lib/chat";

type Profile = { id: string; display_name: string | null; username: string | null; avatar_url: string | null };

export default function CurrencyPage() {
  const { fg, fgMuted, isDark } = useTheme();

  const borderSubtle = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const bgSubtle = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";

  const [myBalance, setMyBalance] = useState<number | null>(null);
  const [leaderboard, setLeaderboard] = useState<(UserBalance & { profile?: Profile })[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [myId, setMyId] = useState<string | null>(null);

  // Transfer form
  const [toUserId, setToUserId] = useState("");
  const [transferAmount, setTransferAmount] = useState(10);
  const [transferNote, setTransferNote] = useState("");
  const [transferring, setTransferring] = useState(false);
  const [transferMsg, setTransferMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Transactions feed
  const [transactions, setTransactions] = useState<CurrencyTransaction[]>([]);

  const loadData = useCallback(async () => {
    const [usersRaw, balancesRaw, txnsRaw] = await Promise.all([
      getWhitelistedUsers(),
      getAllBalances(),
      getAllTransactions(30),
    ]);

    const userProfiles: Profile[] = (usersRaw as Profile[]);
    setProfiles(userProfiles);
    setTransactions(txnsRaw);

    // Merge balances with profiles
    const merged = balancesRaw
      .map((b) => ({ ...b, profile: userProfiles.find((u) => u.id === b.user_id) }))
      .sort((a, z) => z.balance - a.balance);
    setLeaderboard(merged);

    // Get own balance + id via Supabase client
    const { createClient } = await import("@/lib/supabase/client");
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (user) {
      setMyId(user.id);
      const own = balancesRaw.find((b) => b.user_id === user.id);
      setMyBalance(own?.balance ?? null);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleTransfer = async () => {
    if (!toUserId || transferAmount <= 0 || myBalance === null) return;
    if (transferAmount > myBalance) { setTransferMsg({ ok: false, text: "Insufficient balance" }); return; }
    setTransferring(true);
    setTransferMsg(null);
    try {
      await transferCurrency(toUserId, transferAmount, transferNote || undefined);
      setTransferMsg({ ok: true, text: `Sent ${transferAmount} coins!` });
      setTransferNote("");
      setToUserId("");
      setTransferAmount(10);
      loadData();
    } catch (err) {
      setTransferMsg({ ok: false, text: err instanceof Error ? err.message : "Transfer failed" });
    } finally {
      setTransferring(false);
    }
  };

  const nameOf = (uid: string) => {
    const p = profiles.find((u) => u.id === uid);
    return p?.display_name || p?.username || uid.slice(0, 8);
  };

  const formatTime = (ts: string) => new Date(ts).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

  const otherUsers = profiles.filter((u) => u.id !== myId);

  return (
    <div>
      {/* Balance header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <p className="text-xs" style={{ color: fgMuted }}>Your balance</p>
          <p className="text-2xl font-medium" style={{ color: fg }}>{myBalance === null ? "…" : myBalance.toLocaleString()} <span style={{ color: fgMuted, fontSize: 14 }}>coins</span></p>
        </div>
        <div style={{ fontSize: 36 }}>💰</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Leaderboard */}
        <div>
          <h3 className="text-sm font-medium mb-3" style={{ color: fgMuted }}>Standings</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {leaderboard.map((entry, i) => {
              const isMe = entry.user_id === myId;
              const name = entry.profile?.display_name || entry.profile?.username || entry.user_id.slice(0, 8);
              const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`;
              return (
                <div
                  key={entry.user_id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 14px",
                    borderRadius: 12,
                    border: `1px solid ${isMe ? fg : borderSubtle}`,
                    backgroundColor: isMe ? isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)" : bgSubtle,
                  }}
                >
                  <span style={{ fontSize: 16, minWidth: 28 }}>{medal}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="text-sm font-medium truncate" style={{ color: fg }}>{name}{isMe ? " (you)" : ""}</p>
                  </div>
                  <p className="text-sm font-medium" style={{ color: fgMuted }}>{entry.balance.toLocaleString()}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          {/* Transfer form */}
          <div style={{ border: `1px solid ${borderSubtle}`, borderRadius: 16, padding: "20px", marginBottom: 20 }}>
            <h3 className="text-sm font-medium mb-4" style={{ color: fgMuted }}>Send Coins</h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label className="text-xs mb-1 block" style={{ color: fgMuted }}>Recipient</label>
                <select
                  className="tool-input"
                  value={toUserId}
                  onChange={(e) => setToUserId(e.target.value)}
                  style={{ fontSize: 14, padding: "9px 12px" }}
                >
                  <option value="">Select person…</option>
                  {otherUsers.map((u) => (
                    <option key={u.id} value={u.id}>{u.display_name || u.username}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs mb-1 block" style={{ color: fgMuted }}>Amount</label>
                <input
                  type="number"
                  className="tool-input"
                  min={1}
                  max={myBalance ?? undefined}
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(Math.max(1, Number(e.target.value)))}
                  style={{ fontSize: 14, padding: "9px 12px" }}
                />
              </div>

              <div>
                <label className="text-xs mb-1 block" style={{ color: fgMuted }}>Note (optional)</label>
                <input
                  type="text"
                  className="tool-input"
                  placeholder="What's it for?"
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  style={{ fontSize: 14, padding: "9px 12px" }}
                />
              </div>

              {transferMsg && (
                <p className="text-xs" style={{ color: transferMsg.ok ? "#22c55e" : "#ef4444" }}>{transferMsg.text}</p>
              )}

              <button
                onClick={handleTransfer}
                disabled={transferring || !toUserId || !transferAmount}
                style={{
                  padding: "11px",
                  borderRadius: 10,
                  border: "none",
                  backgroundColor: fg,
                  color: isDark ? "#000" : "#fff",
                  fontSize: 14,
                  fontWeight: 500,
                  fontFamily: "inherit",
                  cursor: transferring || !toUserId || !transferAmount ? "default" : "pointer",
                  opacity: transferring || !toUserId || !transferAmount ? 0.5 : 1,
                }}
              >
                {transferring ? "Sending…" : "Send Coins"}
              </button>
            </div>
          </div>

          {/* Transaction feed */}
          {transactions.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-3" style={{ color: fgMuted }}>Recent Transfers</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 5, maxHeight: 320, overflowY: "auto" }}>
                {transactions.filter((t) => t.type === "transfer").map((t) => {
                  const isIncoming = t.to_user_id === myId;
                  const isOutgoing = t.from_user_id === myId;
                  const other = isIncoming ? nameOf(t.from_user_id ?? "") : nameOf(t.to_user_id ?? "");
                  return (
                    <div key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: 10, border: `1px solid ${borderSubtle}`, backgroundColor: bgSubtle }}>
                      <div style={{ minWidth: 0 }}>
                        <p className="text-xs truncate" style={{ color: fg }}>
                          {isIncoming ? `From ${other}` : isOutgoing ? `To ${other}` : `${nameOf(t.from_user_id ?? "")} → ${nameOf(t.to_user_id ?? "")}`}
                        </p>
                        {t.note && <p className="text-xs truncate" style={{ color: fgMuted }}>{t.note}</p>}
                        <p className="text-xs" style={{ color: fgMuted, opacity: 0.7 }}>{formatTime(t.created_at)}</p>
                      </div>
                      <span className="text-xs font-medium" style={{ color: isIncoming ? "#22c55e" : isOutgoing ? "#ef4444" : fgMuted, marginLeft: 8 }}>
                        {isIncoming ? "+" : isOutgoing ? "-" : ""}{t.amount}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
