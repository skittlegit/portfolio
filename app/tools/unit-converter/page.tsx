"use client";

import { useState } from "react";
import ToolLayout from "../../components/ToolLayout";
import { useTheme } from "../../context/ThemeContext";

const categories = {
  "Length": {
    units: ["px", "rem", "em", "vw", "vh", "%", "cm", "mm", "in", "pt"],
    base: {
      px: 1,
      rem: 16,
      em: 16,
      vw: (typeof window !== "undefined" ? window.innerWidth : 1920) / 100,
      vh: (typeof window !== "undefined" ? window.innerHeight : 1080) / 100,
      "%": 1,
      cm: 37.7953,
      mm: 3.77953,
      in: 96,
      pt: 1.3333,
    } as Record<string, number>,
  },
  "Time": {
    units: ["ms", "s"],
    base: { ms: 1, s: 1000 } as Record<string, number>,
  },
  "Angle": {
    units: ["deg", "rad", "grad", "turn"],
    base: {
      deg: 1,
      rad: 180 / Math.PI,
      grad: 0.9,
      turn: 360,
    } as Record<string, number>,
  },
};

type Category = keyof typeof categories;

export default function UnitConverterPage() {
  const { fg, fgMuted, isDark } = useTheme();
  const [category, setCategory] = useState<Category>("Length");
  const [value, setValue] = useState("16");
  const [fromUnit, setFromUnit] = useState("px");

  const cat = categories[category];

  const results = cat.units
    .filter((u) => u !== fromUnit)
    .map((u) => {
      const num = parseFloat(value);
      if (isNaN(num)) return { unit: u, value: "—" };
      const px = num * cat.base[fromUnit];
      const converted = px / cat.base[u];
      return {
        unit: u,
        value: Number.isInteger(converted) ? converted.toString() : converted.toFixed(4).replace(/0+$/, "").replace(/\.$/, ""),
      };
    });

  return (
    <ToolLayout title="CSS Unit Converter" description="Convert between CSS units instantly.">
      <div className="max-w-lg">
        {/* Category tabs */}
        <div className="flex gap-2 mb-6">
          {(Object.keys(categories) as Category[]).map((c) => (
            <button
              key={c}
              onClick={() => {
                setCategory(c);
                setFromUnit(categories[c].units[0]);
              }}
              className="tool-btn"
              style={{
                background: category === c ? (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)") : "transparent",
                color: category === c ? fg : undefined,
              }}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="flex gap-3 mb-8">
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="tool-input flex-1"
          />
          <select
            value={fromUnit}
            onChange={(e) => setFromUnit(e.target.value)}
            className="tool-select"
          >
            {cat.units.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>

        {/* Results */}
        <div className="flex flex-col gap-3">
          {results.map(({ unit, value: val }) => (
            <div
              key={unit}
              className="flex items-center justify-between"
              style={{
                padding: "12px 16px",
                borderRadius: 10,
                border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
              }}
            >
              <span className="text-xs tracking-widest uppercase" style={{ color: fgMuted }}>
                {unit}
              </span>
              <span style={{ fontFamily: "monospace", fontSize: 15 }}>{val}</span>
            </div>
          ))}
        </div>
      </div>
    </ToolLayout>
  );
}
