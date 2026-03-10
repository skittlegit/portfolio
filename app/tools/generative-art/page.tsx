"use client";

import { useState, useRef, useEffect } from "react";
import { RefreshCw, Download, Play, Pause, Plus, X, Lock, Unlock } from "lucide-react";
import ToolLayout from "../../components/ToolLayout";
import ColorPicker from "../../components/ColorPicker";
import { useTheme } from "../../context/ThemeContext";

type Preset = "cells" | "flow" | "roots" | "coral" | "spores" | "mycelium";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function noise(x: number, y: number, t: number) {
  return (
    Math.sin(x * 0.01 + t) * Math.cos(y * 0.01 + t) +
    Math.sin((x + y) * 0.005 + t * 0.5) * 0.5
  );
}

function createParticles(count: number, w: number, h: number, seed: number): Particle[] {
  const rng = seededRandom(seed);
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const maxLife = 100 + rng() * 400;
    particles.push({
      x: rng() * w,
      y: rng() * h,
      vx: (rng() - 0.5) * 2,
      vy: (rng() - 0.5) * 2,
      life: rng() * maxLife,
      maxLife,
      size: 1 + rng() * 3,
    });
  }
  return particles;
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * c).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function parseColor(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

export default function BiomPage() {
  const { fg, fgMuted, isDark } = useTheme();
  const [preset, setPreset] = useState<Preset>("flow");
  const [colors, setColors] = useState<string[]>(() => [
    isDark ? "#ffffff" : "#000000",
    isDark ? "#4a9eff" : "#2563eb",
  ]);
  const [locked, setLocked] = useState<boolean[]>(() => [false, false]);
  const [bgColor, setBgColor] = useState(isDark ? "#000000" : "#ffffff");
  const [particleCount, setParticleCount] = useState(200);
  const [speed, setSpeed] = useState(1);
  const [seed, setSeed] = useState(42);
  const [isPlaying, setIsPlaying] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const stateRef = useRef({ preset, colors, bgColor, speed, seed });

  // Keep stateRef in sync
  useEffect(() => {
    stateRef.current = { preset, colors, bgColor, speed, seed };
  }, [preset, colors, bgColor, speed, seed]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    const st = stateRef.current;
    const t = Date.now() * 0.001 * st.speed;

    ctx.fillStyle = st.bgColor + "08";
    ctx.fillRect(0, 0, w, h);

    const particles = particlesRef.current;
    const parsedColors = st.colors.map(parseColor);
    const numColors = parsedColors.length;

    for (let pi = 0; pi < particles.length; pi++) {
      const p = particles[pi];
      const lifeRatio = p.life / p.maxLife;
      const alpha = Math.sin(lifeRatio * Math.PI) * 0.8;
      // Interpolate across multiple colors
      const colorPos = lifeRatio * (numColors - 1);
      const ci = Math.min(Math.floor(colorPos), numColors - 2);
      const ct = colorPos - ci;
      const [cr1, cg1, cb1] = parsedColors[ci];
      const [cr2, cg2, cb2] = parsedColors[ci + 1];
      const r = Math.round(cr1 + (cr2 - cr1) * ct);
      const g = Math.round(cg1 + (cg2 - cg1) * ct);
      const b = Math.round(cb1 + (cb2 - cb1) * ct);

      ctx.fillStyle = `rgba(${r},${g},${b},${alpha.toFixed(2)})`;

      if (st.preset === "cells") {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1.5 + Math.sin(lifeRatio * Math.PI) * 2), 0, Math.PI * 2);
        ctx.fill();
        const n = noise(p.x, p.y, t);
        p.vx += Math.cos(n * Math.PI * 2) * 0.3;
        p.vy += Math.sin(n * Math.PI * 2) * 0.3;
        p.vx *= 0.95;
        p.vy *= 0.95;
      } else if (st.preset === "flow") {
        const n = noise(p.x, p.y, t * 0.5);
        const angle = n * Math.PI * 4;
        p.vx = Math.cos(angle) * st.speed * 1.5;
        p.vy = Math.sin(angle) * st.speed * 1.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.8, 0, Math.PI * 2);
        ctx.fill();
      } else if (st.preset === "roots") {
        const n = noise(p.x * 0.5, p.y * 0.5, t * 0.2);
        p.vy += 0.1 * st.speed;
        p.vx += Math.sin(n * Math.PI * 6) * 0.5;
        p.vx *= 0.98;
        p.vy *= 0.99;
        ctx.fillRect(p.x, p.y, p.size, p.size * 2);
      } else if (st.preset === "coral") {
        const n = noise(p.x, p.y, t * 0.3);
        const angle = n * Math.PI * 3;
        p.vx += Math.cos(angle) * 0.2;
        p.vy -= Math.abs(Math.sin(angle)) * 0.15 * st.speed;
        p.vx *= 0.97;
        p.vy *= 0.97;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 + lifeRatio), 0, Math.PI * 2);
        ctx.fill();
      } else if (st.preset === "spores") {
        const cx = w / 2, cy = h / 2;
        const dx = p.x - cx, dy = p.y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const n = noise(p.x, p.y, t);
        p.vx = (dx / (dist + 1)) * 0.5 + Math.cos(n * Math.PI * 4) * 0.3;
        p.vy = (dy / (dist + 1)) * 0.5 + Math.sin(n * Math.PI * 4) * 0.3;
        p.vx *= st.speed;
        p.vy *= st.speed;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 1.2, 0, Math.PI * 2);
        ctx.fill();
      } else if (st.preset === "mycelium") {
        const n1 = noise(p.x * 2, p.y * 2, t * 0.1);
        const n2 = noise(p.y, p.x, t * 0.15);
        p.vx = Math.cos(n1 * Math.PI * 6) * st.speed;
        p.vy = Math.sin(n2 * Math.PI * 6) * st.speed;
        ctx.globalAlpha = alpha * 0.5;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 3, p.y - p.vy * 3);
        ctx.strokeStyle = ctx.fillStyle;
        ctx.lineWidth = p.size * 0.5;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      p.x += p.vx;
      p.y += p.vy;
      p.life += 1;

      if (p.life > p.maxLife || p.x < -10 || p.x > w + 10 || p.y < -10 || p.y > h + 10) {
        const rng = seededRandom(st.seed + p.life);
        p.x = rng() * w;
        p.y = rng() * h;
        p.life = 0;
        p.vx = (rng() - 0.5) * 2;
        p.vy = (rng() - 0.5) * 2;
      }
    }
  };

  const animate = () => {
    draw();
    animRef.current = requestAnimationFrame(animate);
  };

  const start = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    particlesRef.current = createParticles(particleCount, canvas.width, canvas.height, seed);
    setIsPlaying(true);
    animRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const togglePlay = () => {
    if (isPlaying) {
      cancelAnimationFrame(animRef.current);
      setIsPlaying(false);
    } else {
      animRef.current = requestAnimationFrame(animate);
      setIsPlaying(true);
    }
  };

  const regenerate = () => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    const newSeed = Math.floor(Math.random() * 99999);
    setSeed(newSeed);
    setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      particlesRef.current = createParticles(particleCount, canvas.width, canvas.height, newSeed);
      setIsPlaying(true);
      animRef.current = requestAnimationFrame(animate);
    }, 50);
  };

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.download = `biom-${preset}.png`;
    a.href = canvas.toDataURL("image/png");
    a.click();
  };

  return (
    <ToolLayout title="Generative Bio Art" description="Create organic, biology-inspired generative art.">
      <div className="max-w-4xl">
        {/* Controls */}
        <div className="flex flex-wrap gap-4 items-end mb-6">
          <div>
            <label className="tool-label">Preset</label>
            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value as Preset)}
              className="tool-select"
            >
              <option value="flow">Flow Field</option>
              <option value="cells">Cells</option>
              <option value="roots">Roots</option>
              <option value="coral">Coral</option>
              <option value="spores">Spores</option>
              <option value="mycelium">Mycelium</option>
            </select>
          </div>
          <div>
            <label className="tool-label">Particles</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={50}
                max={500}
                value={particleCount}
                onChange={(e) => setParticleCount(Number(e.target.value))}
                style={{ width: 80, accentColor: fg }}
              />
              <span className="text-xs" style={{ color: fgMuted }}>{particleCount}</span>
            </div>
          </div>
          <div>
            <label className="tool-label">Speed</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0.2}
                max={3}
                step={0.1}
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                style={{ width: 80, accentColor: fg }}
              />
              <span className="text-xs" style={{ color: fgMuted }}>{speed.toFixed(1)}x</span>
            </div>
          </div>
          <ColorPicker label="Background" value={bgColor} onChange={setBgColor} />
        </div>

        {/* Color Palette */}
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-3">
            <label className="tool-label" style={{ marginBottom: 0 }}>
              Colors ({colors.length})
            </label>
            {colors.length < 8 && (
              <button
                onClick={() => {
                  setColors((prev) => [...prev, hslToHex(Math.random() * 360, 60, 50)]);
                  setLocked((prev) => [...prev, false]);
                }}
                className="tool-icon-btn"
              >
                <Plus size={16} />
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            {colors.map((c, i) => (
              <div key={i} className="flex items-center gap-1">
                <ColorPicker
                  value={c}
                  onChange={(hex) => setColors((prev) => prev.map((cc, idx) => idx === i ? hex : cc))}
                />
                <button
                  onClick={() => setLocked((prev) => prev.map((l, idx) => idx === i ? !l : l))}
                  title={locked[i] ? "Unlock color" : "Lock color"}
                  className="tool-icon-btn"
                  style={{
                    color: locked[i] ? fg : undefined,
                    opacity: locked[i] ? 1 : 0.4,
                  }}
                >
                  {locked[i] ? <Lock size={12} /> : <Unlock size={12} />}
                </button>
                {colors.length > 2 && (
                  <button
                    onClick={() => {
                      setColors((prev) => prev.filter((_, idx) => idx !== i));
                      setLocked((prev) => prev.filter((_, idx) => idx !== i));
                    }}
                    className="tool-icon-btn"
                    style={{ opacity: 0.5 }}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mb-4">
          <button onClick={isPlaying ? togglePlay : start} className="tool-btn" style={{ color: fg }}>
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            {isPlaying ? "Pause" : "Generate"}
          </button>
          <button onClick={regenerate} className="tool-btn">
            <RefreshCw size={14} /> Randomize
          </button>
          <button onClick={download} className="tool-btn">
            <Download size={14} /> Save
          </button>
        </div>

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          style={{
            width: "100%",
            height: 450,
            borderRadius: 14,
            border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
            backgroundColor: bgColor,
          }}
        />
      </div>
    </ToolLayout>
  );
}
