"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sun, Moon, Menu, X, ArrowUpRight } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import Magnetic from "./Magnetic";

type Lenis = { scrollTo: (t: string | number | HTMLElement, o?: object) => void };

const LINKS = [
  { label: "Work", href: "/#work" },
  { label: "Tools", href: "/tools" },
  { label: "Résumé", href: "/resume" },
];

export default function Nav() {
  const { isDark, toggle } = useTheme();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  function onAnchor(e: React.MouseEvent, href: string) {
    if (!href.startsWith("/#")) { setOpen(false); return; }
    const id = href.slice(2);
    if (pathname === "/") {
      e.preventDefault();
      setOpen(false);
      const el = document.getElementById(id);
      const lenis = (window as unknown as { __lenis?: Lenis }).__lenis;
      if (lenis && el) lenis.scrollTo(el, { offset: -80 });
      else el?.scrollIntoView({ behavior: "smooth" });
    } else setOpen(false);
  }

  const Monogram = (
    <span
      aria-hidden
      className="heading"
      style={{ width: 34, height: 34, background: "var(--fg)", color: "var(--bg)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, letterSpacing: "-0.04em", flexShrink: 0 }}
    >
      DA
    </span>
  );

  return (
    <>
      <header
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 90,
          borderBottom: `1px solid ${scrolled ? "var(--line)" : "transparent"}`,
          background: scrolled ? (isDark ? "rgba(10,10,11,0.66)" : "rgba(244,242,234,0.72)") : "transparent",
          backdropFilter: scrolled ? "blur(16px) saturate(150%)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(16px) saturate(150%)" : "none",
          transition: "background 0.4s var(--ease-out), border-color 0.4s var(--ease-out)",
        }}
      >
        <nav className="flex items-center justify-between" style={{ padding: "13px clamp(20px,5vw,64px)", height: 62 }}>
          {/* wordmark */}
          <Link href="/" data-cursor="home" className="flex items-center" style={{ gap: 12, textDecoration: "none", color: "var(--fg)" }}>
            {Monogram}
            <span className="hidden sm:flex flex-col" style={{ lineHeight: 1.05 }}>
              <span className="heading" style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.02em" }}>Deepak Aeleni</span>
              <span className="mono" style={{ fontSize: 9.5, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--fg-muted)" }}>Internet Generalist</span>
            </span>
          </Link>

          {/* desktop right */}
          <div className="hidden md:flex items-center" style={{ gap: 26 }}>
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} onClick={(e) => onAnchor(e, l.href)} data-cursor={l.label} className="link-trace mono" style={{ fontSize: 12, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--fg-muted)" }}>
                {l.label}
              </Link>
            ))}
            <button onClick={toggle} data-cursor={isDark ? "light" : "dark"} aria-label="Toggle theme" style={{ background: "transparent", border: "none", color: "var(--fg-muted)", lineHeight: 0, padding: 6 }}>
              {isDark ? <Sun size={16} strokeWidth={1.5} /> : <Moon size={16} strokeWidth={1.5} />}
            </button>
            <Magnetic strength={0.45}>
              <Link href="/#contact" onClick={(e) => onAnchor(e, "/#contact")} data-cursor="say hi" className="mono inline-flex items-center gap-2" style={{ background: "var(--fg)", color: "var(--bg)", padding: "10px 16px", fontSize: 11.5, letterSpacing: "0.06em", textTransform: "uppercase", textDecoration: "none" }}>
                Contact <ArrowUpRight size={13} strokeWidth={2} />
              </Link>
            </Magnetic>
          </div>

          {/* mobile right */}
          <div className="flex md:hidden items-center" style={{ gap: 2 }}>
            <button onClick={toggle} aria-label="Toggle theme" style={{ background: "transparent", border: "none", color: "var(--fg-muted)", lineHeight: 0, padding: 8 }}>
              {isDark ? <Sun size={16} strokeWidth={1.5} /> : <Moon size={16} strokeWidth={1.5} />}
            </button>
            <button onClick={() => setOpen(true)} aria-label="Open menu" style={{ background: "transparent", border: "none", color: "var(--fg)", lineHeight: 0, padding: 8 }}>
              <Menu size={20} strokeWidth={1.5} />
            </button>
          </div>
        </nav>
      </header>

      {/* mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
            style={{ position: "fixed", inset: 0, zIndex: 95, background: "var(--bg)", display: "flex", flexDirection: "column", padding: "16px clamp(20px,6vw,48px) 32px" }}
          >
            <div className="flex items-center justify-between" style={{ height: 36 }}>
              {Monogram}
              <button onClick={() => setOpen(false)} aria-label="Close menu" style={{ background: "transparent", border: "none", color: "var(--fg)", lineHeight: 0, padding: 8 }}>
                <X size={22} strokeWidth={1.5} />
              </button>
            </div>
            <div className="flex flex-col" style={{ marginTop: "auto", marginBottom: "auto" }}>
              {[...LINKS, { label: "Contact", href: "/#contact" }].map((l, i) => (
                <Link key={l.href} href={l.href} onClick={(e) => onAnchor(e, l.href)} className="display" style={{ fontSize: "clamp(2.6rem,13vw,5rem)", color: "var(--fg)", textDecoration: "none", borderTop: "1px solid var(--line)", padding: "16px 0", display: "flex", alignItems: "baseline", gap: 18 }}>
                  <span className="mono" style={{ fontSize: 13, color: "var(--accent)" }}>0{i + 1}</span>
                  {l.label}
                </Link>
              ))}
            </div>
            <a href="mailto:deepakrdy7@gmail.com" className="mono" style={{ fontSize: 12, color: "var(--fg-muted)", textDecoration: "none" }}>deepakrdy7@gmail.com</a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
