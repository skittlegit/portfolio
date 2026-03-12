"use client";

import { useEffect, useState, useCallback } from "react";
import { Pencil, X, Check } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { getWhitelistedUsers } from "@/lib/chat";
import { getFamilyTree, upsertFamilyNode, type FamilyNode } from "@/lib/currency";

type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

type TreeNode = Profile & {
  title: string;
  parent_user_id: string | null;
  children: TreeNode[];
};

const NODE_W = 130;
const NODE_H = 72;
const LEVEL_GAP = 110;
const SIBLING_GAP = 150;

function calcSubtreeWidth(node: TreeNode): number {
  if (!node.children.length) return 1;
  return node.children.reduce((s, c) => s + calcSubtreeWidth(c), 0);
}

function layoutNodes(
  roots: TreeNode[],
): (TreeNode & { px: number; py: number })[] {
  const result: (TreeNode & { px: number; py: number })[] = [];
  let col = 0;

  function place(node: TreeNode, depth: number) {
    const w = calcSubtreeWidth(node);
    const center = (col + col + w - 1) / 2;
    result.push({ ...node, px: center * SIBLING_GAP + SIBLING_GAP / 2, py: depth * LEVEL_GAP + 20 });
    const childStart = col;
    for (const child of node.children) {
      place(child, depth + 1);
    }
    col += w;
  }

  for (const root of roots) {
    place(root, 0);
    col += calcSubtreeWidth(root) - calcSubtreeWidth(root) + calcSubtreeWidth(root);
    col = result.filter(n => !roots.some(r => r.id !== root.id || result.findIndex(x => x.id === root.id) < result.findIndex(x => x.id === n.id))).length;
  }

  return result;
}

function buildTree(profiles: Profile[], nodes: FamilyNode[]): { layouted: (TreeNode & { px: number; py: number })[]; svgW: number; svgH: number } {
  const nodeMap = new Map<string, FamilyNode>(nodes.map((n) => [n.user_id, n]));
  const treeNodes = new Map<string, TreeNode>();

  for (const p of profiles) {
    const fn = nodeMap.get(p.id);
    treeNodes.set(p.id, { ...p, title: fn?.title || "Member", parent_user_id: fn?.parent_user_id || null, children: [] });
  }

  const roots: TreeNode[] = [];
  for (const tn of treeNodes.values()) {
    if (tn.parent_user_id && treeNodes.has(tn.parent_user_id)) {
      treeNodes.get(tn.parent_user_id)!.children.push(tn);
    } else {
      roots.push(tn);
    }
  }

  // Simple BFS layout
  const positioned: (TreeNode & { px: number; py: number })[] = [];
  let col = 0;

  function place(node: TreeNode, depth: number) {
    const w = calcSubtreeWidth(node);
    const centerCol = col + (w - 1) / 2;
    positioned.push({ ...node, px: centerCol * SIBLING_GAP + 75, py: depth * LEVEL_GAP + 30 });
    for (const child of node.children) {
      place(child, depth + 1);
    }
    col += w;
  }

  for (const root of roots) {
    place(root, 0);
  }

  const maxX = Math.max(...positioned.map((n) => n.px), 200);
  const maxY = Math.max(...positioned.map((n) => n.py), 100);
  return { layouted: positioned, svgW: maxX + 80, svgH: maxY + NODE_H + 20 };
}

export default function FamilyTreePage() {
  const { fg, fgMuted, isDark } = useTheme();
  const { user } = useAuth();

  const borderSubtle = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const bgSubtle = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
  const bgHover = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [fnodes, setFnodes] = useState<FamilyNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editParent, setEditParent] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [profs, nodes] = await Promise.all([getWhitelistedUsers(), getFamilyTree()]);
    setProfiles(profs);
    setFnodes(nodes);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const myNode = fnodes.find((n) => n.user_id === user?.id);

  const startEdit = () => {
    setEditTitle(myNode?.title || "Member");
    setEditParent(myNode?.parent_user_id || "");
    setSaveError(null);
    setEditing(true);
  };

  const saveEdit = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await upsertFamilyNode(editTitle.trim() || "Member", editParent || null);
      await load();
      setEditing(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm" style={{ color: fgMuted }}>Loading family tree…</p>;

  const { layouted, svgW, svgH } = buildTree(profiles, fnodes);
  const posMap = new Map(layouted.map((n) => [n.id, n]));

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <p className="text-sm" style={{ color: fgMuted }}>Set your title and parent to build the tree.</p>
        </div>
        <button
          onClick={startEdit}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: `1px solid ${borderSubtle}`, background: "none", cursor: "pointer", fontSize: 13, color: fg, fontFamily: "inherit" }}
        >
          <Pencil size={13} />
          Edit my node
        </button>
      </div>

      {/* Edit panel */}
      {editing && (
        <div style={{ padding: "16px 20px", border: `1px solid ${borderSubtle}`, borderRadius: 12, marginBottom: 20, backgroundColor: bgSubtle }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ flex: 1, minWidth: 160 }}>
              <label className="text-xs" style={{ color: fgMuted, display: "block", marginBottom: 4 }}>My title / role</label>
              <input
                type="text"
                className="tool-input"
                style={{ width: "100%", fontSize: 13 }}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="e.g. Founder, Elder, Baby…"
                maxLength={40}
              />
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <label className="text-xs" style={{ color: fgMuted, display: "block", marginBottom: 4 }}>Reports to (parent)</label>
              <select
                className="tool-input"
                style={{ width: "100%", fontSize: 13 }}
                value={editParent}
                onChange={(e) => setEditParent(e.target.value)}
              >
                <option value="">— none (root) —</option>
                {profiles.filter((p) => p.id !== user?.id).map((p) => (
                  <option key={p.id} value={p.id}>{p.display_name || p.username || "User"}</option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button
                onClick={saveEdit}
                disabled={saving}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 14px", borderRadius: 8, border: "none", backgroundColor: fg, color: isDark ? "#000" : "#fff", cursor: "pointer", fontSize: 13, fontFamily: "inherit", opacity: saving ? 0.6 : 1 }}
              >
                <Check size={13} />{saving ? "Saving…" : "Save"}
              </button>
              <button
                onClick={() => setEditing(false)}
                style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${borderSubtle}`, background: "none", cursor: "pointer", fontSize: 13, color: fgMuted, fontFamily: "inherit" }}
              >
                <X size={13} />
              </button>
            </div>
          </div>
          {saveError && <p className="text-xs mt-2" style={{ color: "#ef4444" }}>{saveError}</p>}
        </div>
      )}

      {/* Tree SVG */}
      <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: "calc(100dvh - 320px)", border: `1px solid ${borderSubtle}`, borderRadius: 12, padding: "8px" }}>
        <div style={{ position: "relative", width: svgW, height: svgH, minWidth: "100%" }}>
          {/* SVG lines */}
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
            {layouted.map((node) => {
              if (!node.parent_user_id) return null;
              const parent = posMap.get(node.parent_user_id);
              if (!parent) return null;
              const x1 = parent.px;
              const y1 = parent.py + NODE_H;
              const x2 = node.px;
              const y2 = node.py;
              return (
                <path
                  key={`${parent.id}-${node.id}`}
                  d={`M${x1},${y1} C${x1},${(y1+y2)/2} ${x2},${(y1+y2)/2} ${x2},${y2}`}
                  fill="none"
                  stroke={borderSubtle}
                  strokeWidth={1.5}
                />
              );
            })}
          </svg>

          {/* Nodes */}
          {layouted.map((node) => {
            const isMe = node.id === user?.id;
            return (
              <div
                key={node.id}
                style={{
                  position: "absolute",
                  left: node.px - NODE_W / 2,
                  top: node.py,
                  width: NODE_W,
                  height: NODE_H,
                  border: `1px solid ${isMe ? fg : borderSubtle}`,
                  borderRadius: 12,
                  backgroundColor: isDark ? "rgba(0,0,0,0.6)" : "#fff",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  padding: "6px 8px",
                  textAlign: "center",
                }}
              >
                {node.avatar_url
                  ? <img src={node.avatar_url} alt="" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }} />
                  : <div style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: bgSubtle, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>👤</div>
                }
                <div>
                  <p className="text-xs font-medium truncate" style={{ color: fg, maxWidth: NODE_W - 16 }}>{node.display_name || node.username || "User"}</p>
                  <p className="text-xs truncate" style={{ color: fgMuted, maxWidth: NODE_W - 16, fontSize: 10 }}>{node.title}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
