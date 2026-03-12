/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Pencil, X, Check, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
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

type PositionedNode = TreeNode & { px: number; py: number };

const NODE_W = 150;
const NODE_H = 84;
const LEVEL_GAP = 120;
const SIBLING_GAP = 170;

function calcSubtreeWidth(node: TreeNode): number {
  if (!node.children.length) return 1;
  return node.children.reduce((s, c) => s + calcSubtreeWidth(c), 0);
}

function buildTree(profiles: Profile[], nodes: FamilyNode[]): { layouted: PositionedNode[]; svgW: number; svgH: number } {
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

  const positioned: PositionedNode[] = [];
  let col = 0;

  function place(node: TreeNode, depth: number) {
    const w = calcSubtreeWidth(node);
    const centerCol = col + (w - 1) / 2;
    positioned.push({ ...node, px: centerCol * SIBLING_GAP + NODE_W / 2 + 40, py: depth * LEVEL_GAP + 40 });
    for (const child of node.children) {
      place(child, depth + 1);
    }
    col += w;
  }

  for (const root of roots) {
    place(root, 0);
  }

  const maxX = positioned.length ? Math.max(...positioned.map((n) => n.px)) : 200;
  const maxY = positioned.length ? Math.max(...positioned.map((n) => n.py)) : 100;
  return { layouted: positioned, svgW: maxX + NODE_W / 2 + 60, svgH: maxY + NODE_H + 40 };
}

export default function FamilyTreePage() {
  const { fg, fgMuted, isDark } = useTheme();
  const { user } = useAuth();

  const borderSubtle = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const bgSubtle = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
  const bgHover = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [fnodes, setFnodes] = useState<FamilyNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editParent, setEditParent] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<PositionedNode | null>(null);

  // Pan & zoom
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

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

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setPan({
      x: dragStart.current.panX + (e.clientX - dragStart.current.x),
      y: dragStart.current.panY + (e.clientY - dragStart.current.y),
    });
  };

  const handleMouseUp = () => setDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((z) => Math.min(2, Math.max(0.3, z + delta)));
  };

  // Touch support for pan
  const touchStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      touchStart.current = { x: t.clientX, y: t.clientY, panX: pan.x, panY: pan.y };
    }
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      setPan({
        x: touchStart.current.panX + (t.clientX - touchStart.current.x),
        y: touchStart.current.panY + (t.clientY - touchStart.current.y),
      });
    }
  };

  if (loading) return <p className="text-sm" style={{ color: fgMuted }}>Loading family tree…</p>;

  const { layouted, svgW, svgH } = buildTree(profiles, fnodes);
  const posMap = new Map(layouted.map((n) => [n.id, n]));

  return (
    <div>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
        <p className="text-sm" style={{ color: fgMuted }}>
          Set your title and parent to build the tree.
        </p>
        <button
          onClick={startEdit}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "7px 14px", borderRadius: 8,
            border: `1px solid ${borderSubtle}`,
            background: "none", fontSize: 13, color: fg,
            fontFamily: "inherit", transition: "all 0.15s",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = bgHover)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          <Pencil size={13} />
          Edit my node
        </button>
      </div>

      {/* Edit panel */}
      {editing && (
        <div style={{
          padding: "16px 20px",
          border: `1px solid ${borderSubtle}`,
          borderRadius: 12,
          marginBottom: 16,
          backgroundColor: bgSubtle,
          animation: "fadeIn 0.15s ease",
        }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ flex: 1, minWidth: 160 }}>
              <label className="text-xs" style={{ color: fgMuted, display: "block", marginBottom: 4, letterSpacing: "0.06em", textTransform: "uppercase" }}>My title / role</label>
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
              <label className="text-xs" style={{ color: fgMuted, display: "block", marginBottom: 4, letterSpacing: "0.06em", textTransform: "uppercase" }}>Reports to (parent)</label>
              <select
                className="tool-select"
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
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "8px 14px", borderRadius: 8, border: "none",
                  backgroundColor: fg, color: isDark ? "#000" : "#fff",
                  fontSize: 13, fontFamily: "inherit",
                  opacity: saving ? 0.6 : 1, transition: "opacity 0.15s",
                }}
              >
                <Check size={13} />{saving ? "Saving…" : "Save"}
              </button>
              <button
                onClick={() => setEditing(false)}
                style={{
                  padding: "8px 12px", borderRadius: 8,
                  border: `1px solid ${borderSubtle}`,
                  background: "none", fontSize: 13,
                  color: fgMuted, fontFamily: "inherit",
                }}
              >
                <X size={13} />
              </button>
            </div>
          </div>
          {saveError && <p className="text-xs mt-2" style={{ color: "#ef4444" }}>{saveError}</p>}
        </div>
      )}

      {/* Tree canvas */}
      <div
        style={{
          position: "relative",
          border: `1px solid ${borderSubtle}`,
          borderRadius: 12,
          overflow: "hidden",
          height: "calc(100dvh - 340px)",
          minHeight: 300,
          backgroundColor: bgSubtle,
        }}
      >
        {/* Zoom controls */}
        <div style={{
          position: "absolute", top: 12, right: 12, zIndex: 10,
          display: "flex", flexDirection: "column", gap: 4,
        }}>
          {[
            { icon: <ZoomIn size={14} />, action: () => setZoom((z) => Math.min(2, z + 0.15)), label: "Zoom in" },
            { icon: <ZoomOut size={14} />, action: () => setZoom((z) => Math.max(0.3, z - 0.15)), label: "Zoom out" },
            { icon: <Maximize2 size={14} />, action: resetView, label: "Reset view" },
          ].map((btn) => (
            <button
              key={btn.label}
              onClick={btn.action}
              title={btn.label}
              style={{
                width: 32, height: 32, borderRadius: 8,
                border: `1px solid ${borderSubtle}`,
                backgroundColor: isDark ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.8)",
                color: fgMuted, display: "flex", alignItems: "center",
                justifyContent: "center", transition: "color 0.15s",
                backdropFilter: "blur(8px)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = fg)}
              onMouseLeave={(e) => (e.currentTarget.style.color = fgMuted)}
            >
              {btn.icon}
            </button>
          ))}
        </div>

        {/* Zoom level badge */}
        <div style={{
          position: "absolute", bottom: 12, right: 12, zIndex: 10,
          fontSize: 10, color: fgMuted, letterSpacing: "0.06em",
          backgroundColor: isDark ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.7)",
          backdropFilter: "blur(8px)", padding: "4px 8px", borderRadius: 6,
        }}>
          {Math.round(zoom * 100)}%
        </div>

        {/* Pannable / zoomable area */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          style={{
            width: "100%", height: "100%",
            cursor: dragging ? "grabbing" : "grab",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "0 0",
              position: "relative",
              width: svgW,
              height: svgH,
              transition: dragging ? "none" : "transform 0.15s ease",
            }}
          >
            {/* SVG connector lines */}
            <svg style={{ position: "absolute", inset: 0, width: svgW, height: svgH, pointerEvents: "none" }}>
              {layouted.map((node) => {
                if (!node.parent_user_id) return null;
                const parent = posMap.get(node.parent_user_id);
                if (!parent) return null;
                const x1 = parent.px;
                const y1 = parent.py + NODE_H;
                const x2 = node.px;
                const y2 = node.py;
                const midY = (y1 + y2) / 2;
                return (
                  <path
                    key={`line-${parent.id}-${node.id}`}
                    d={`M${x1},${y1} C${x1},${midY} ${x2},${midY} ${x2},${y2}`}
                    fill="none"
                    stroke={isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)"}
                    strokeWidth={1.5}
                    strokeDasharray="4 3"
                  />
                );
              })}
            </svg>

            {/* Nodes */}
            {layouted.map((node) => {
              const isMe = node.id === user?.id;
              const isSelected = selectedNode?.id === node.id;
              return (
                <div
                  key={node.id}
                  onClick={(e) => { e.stopPropagation(); setSelectedNode(isSelected ? null : node); }}
                  style={{
                    position: "absolute",
                    left: node.px - NODE_W / 2,
                    top: node.py,
                    width: NODE_W,
                    height: NODE_H,
                    border: `1px solid ${isMe ? fg : isSelected ? fgMuted : borderSubtle}`,
                    borderRadius: 14,
                    backgroundColor: isDark ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.9)",
                    backdropFilter: "blur(12px)",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    cursor: "pointer",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                    boxShadow: isSelected
                      ? isDark ? "0 0 0 1px rgba(255,255,255,0.15)" : "0 0 0 1px rgba(0,0,0,0.1)"
                      : "none",
                  }}
                >
                  {/* Avatar */}
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    {node.avatar_url ? (
                      <img
                        src={node.avatar_url}
                        alt=""
                        style={{
                          width: 36, height: 36, borderRadius: "50%",
                          objectFit: "cover",
                          border: `1px solid ${borderSubtle}`,
                        }}
                      />
                    ) : (
                      <div style={{
                        width: 36, height: 36, borderRadius: "50%",
                        backgroundColor: bgHover,
                        border: `1px solid ${borderSubtle}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 15, color: fgMuted,
                      }}>
                        {(node.display_name || node.username || "U").charAt(0).toUpperCase()}
                      </div>
                    )}
                    {isMe && (
                      <div style={{
                        position: "absolute", bottom: -1, right: -1,
                        width: 10, height: 10, borderRadius: "50%",
                        backgroundColor: "#22c55e",
                        border: `2px solid ${isDark ? "#000" : "#fff"}`,
                      }} />
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ overflow: "hidden", flex: 1, minWidth: 0 }}>
                    <p className="truncate" style={{
                      fontSize: 13, fontWeight: 500, color: fg,
                      lineHeight: 1.3,
                    }}>
                      {node.display_name || node.username || "User"}
                    </p>
                    <p className="truncate" style={{
                      fontSize: 11, color: fgMuted,
                      lineHeight: 1.4, marginTop: 1,
                    }}>
                      {node.title}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected member detail panel */}
      {selectedNode && (
        <div style={{
          marginTop: 12, padding: "16px 20px",
          border: `1px solid ${borderSubtle}`,
          borderRadius: 12,
          backgroundColor: bgSubtle,
          display: "flex", alignItems: "center", gap: 16,
          animation: "fadeIn 0.15s ease",
        }}>
          {/* Avatar */}
          {selectedNode.avatar_url ? (
            <img
              src={selectedNode.avatar_url}
              alt=""
              style={{
                width: 48, height: 48, borderRadius: "50%",
                objectFit: "cover", border: `1px solid ${borderSubtle}`,
                flexShrink: 0,
              }}
            />
          ) : (
            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              backgroundColor: bgHover, border: `1px solid ${borderSubtle}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, color: fgMuted, flexShrink: 0,
            }}>
              {(selectedNode.display_name || selectedNode.username || "U").charAt(0).toUpperCase()}
            </div>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <p className="text-sm font-medium" style={{ color: fg }}>
              {selectedNode.display_name || selectedNode.username || "User"}
            </p>
            <p className="text-xs" style={{ color: fgMuted, marginTop: 2 }}>
              {selectedNode.title}
            </p>
            {selectedNode.parent_user_id && (() => {
              const parent = posMap.get(selectedNode.parent_user_id);
              return parent ? (
                <p className="text-xs" style={{ color: fgMuted, marginTop: 4, opacity: 0.7 }}>
                  Reports to {parent.display_name || parent.username || "User"}
                </p>
              ) : null;
            })()}
            {selectedNode.children.length > 0 && (
              <p className="text-xs" style={{ color: fgMuted, marginTop: 2, opacity: 0.7 }}>
                {selectedNode.children.length} direct {selectedNode.children.length === 1 ? "report" : "reports"}
              </p>
            )}
          </div>

          <button
            onClick={() => setSelectedNode(null)}
            style={{
              padding: "6px", borderRadius: 6,
              border: `1px solid ${borderSubtle}`,
              background: "none", color: fgMuted,
              flexShrink: 0, transition: "color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = fg)}
            onMouseLeave={(e) => (e.currentTarget.style.color = fgMuted)}
          >
            <X size={14} />
          </button>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
