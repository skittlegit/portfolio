"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sun, Moon, Menu, X, ArrowUpRight } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import Magnetic from "./Magnetic";
import { EMAIL } from "../lib/projects";

type Lenis = { scrollTo: (t: string | number | HTMLElement, o?: object) => void };

const LINKS = [
  { label: "Work", href: "/work" },
  { label: "About", href: "/about" },
  { label: "Tools", href: "/tools" },
  { label: "Résumé", href: "/resume" },
];

export default function Nav() {
  const { isDark, toggle } = useTheme();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const openBtnRef = useRef<HTMLButtonElement>(null);

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

  // While the mobile menu is open it behaves as a modal dialog: focus moves
  // in, Tab cycles inside it, Escape closes it, and focus returns to the
  // button that opened it.
  useEffect(() => {
    if (!open) return;
    const menu = menuRef.current;
    const opener = openBtnRef.current;
    const focusables = () =>
      Array.from(menu?.querySelectorAll<HTMLElement>("a[href],button:not([disabled])") ?? []);
    focusables()[0]?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      const els = focusables();
      if (els.length === 0) return;
      const first = els[0];
      const last = els[els.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !menu?.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !menu?.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      opener?.focus();
    };
  }, [open]);

  // Contact scrolls to the shared footer when the current page has one;
  // otherwise it navigates home and anchors there.
  function onContact(e: React.MouseEvent) {
    const el = document.getElementById("contact");
    if (el) {
      e.preventDefault();
      setOpen(false);
      const lenis = (window as unknown as { __lenis?: Lenis }).__lenis;
      if (lenis) lenis.scrollTo(el, { offset: -40 });
      else el.scrollIntoView({ behavior: "smooth" });
    } else setOpen(false);
  }

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      <header
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 90,
          borderBottom: `1px solid ${scrolled ? "var(--line)" : "transparent"}`,
          background: scrolled ? (isDark ? "rgba(16,15,12,0.72)" : "rgba(233,228,215,0.78)") : "transparent",
          backdropFilter: scrolled ? "blur(14px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(14px)" : "none",
          transition: "background 0.4s var(--ease-out), border-color 0.4s var(--ease-out)",
        }}
      >
        {/* gutters match the page grid (PAD) so the wordmark sits on the margin */}
        <nav className="flex items-center justify-between px-5 sm:px-8 md:px-12 lg:px-16" style={{ height: 60 }}>
          {/* wordmark */}
          <Link href="/" data-cursor="home" className="flex items-baseline" style={{ gap: 10, textDecoration: "none", color: "var(--fg)" }}>
            <span className="giant" style={{ fontSize: 19, letterSpacing: "0.01em" }}>Deepak Aeleni</span>
            <span className="mono hidden sm:inline" style={{ fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--fg-faint)" }}>©{new Date().getFullYear()}</span>
          </Link>

          {/* desktop right */}
          <div className="hidden md:flex items-center" style={{ gap: 24 }}>
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                data-cursor={l.label}
                aria-current={isActive(l.href) ? "page" : undefined}
                className={`link-trace mono${isActive(l.href) ? " is-active" : ""}`}
                style={{
                  fontSize: 11.5,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: isActive(l.href) ? "var(--fg)" : "var(--fg-muted)",
                }}
              >
                {l.label}
              </Link>
            ))}
            <button onClick={toggle} data-cursor={isDark ? "light" : "dark"} aria-label="Toggle theme" style={{ background: "transparent", border: "none", color: "var(--fg-muted)", lineHeight: 0, padding: 6 }}>
              {isDark ? <Sun size={15} strokeWidth={1.5} /> : <Moon size={15} strokeWidth={1.5} />}
            </button>
            <Magnetic strength={0.45}>
              <Link href="/#contact" onClick={onContact} data-cursor="say hi" className="btn-ink" style={{ padding: "10px 16px", fontSize: 11 }}>
                Contact <ArrowUpRight size={12} strokeWidth={2} />
              </Link>
            </Magnetic>
          </div>

          {/* mobile right */}
          <div className="flex md:hidden items-center" style={{ gap: 2 }}>
            <button onClick={toggle} aria-label="Toggle theme" style={{ background: "transparent", border: "none", color: "var(--fg-muted)", lineHeight: 0, padding: 8 }}>
              {isDark ? <Sun size={16} strokeWidth={1.5} /> : <Moon size={16} strokeWidth={1.5} />}
            </button>
            <button ref={openBtnRef} onClick={() => setOpen(true)} aria-label="Open menu" aria-haspopup="dialog" aria-expanded={open} style={{ background: "transparent", border: "none", color: "var(--fg)", lineHeight: 0, padding: 8 }}>
              <Menu size={20} strokeWidth={1.5} />
            </button>
          </div>
        </nav>
      </header>

      {/* mobile overlay — full-bleed index */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={menuRef}
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.55, ease: [0.76, 0, 0.24, 1] }}
            className="px-5 sm:px-8"
            style={{ position: "fixed", inset: 0, zIndex: 95, background: "var(--bg)", display: "flex", flexDirection: "column", paddingTop: 14, paddingBottom: 30 }}
          >
            <div className="flex items-center justify-between" style={{ height: 36 }}>
              <span className="giant" style={{ fontSize: 19, color: "var(--fg)" }}>Deepak Aeleni</span>
              <button onClick={() => setOpen(false)} aria-label="Close menu" style={{ background: "transparent", border: "none", color: "var(--fg)", lineHeight: 0, padding: 8 }}>
                <X size={22} strokeWidth={1.5} />
              </button>
            </div>
            <div className="flex flex-col" style={{ marginTop: "auto", marginBottom: "auto" }}>
              {[{ label: "Home", href: "/" }, ...LINKS].map((l, i) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="giant"
                  style={{ fontSize: "clamp(3rem,15vw,6rem)", color: isActive(l.href) ? "var(--accent)" : "var(--fg)", textDecoration: "none", borderTop: "1px solid var(--line)", padding: "14px 0", display: "flex", alignItems: "baseline", gap: 18 }}
                >
                  <span className="mono" style={{ fontSize: 12, color: "var(--fg-faint)", letterSpacing: "0.1em" }}>0{i + 1}</span>
                  {l.label}
                </Link>
              ))}
              <Link
                href="/#contact"
                onClick={onContact}
                className="giant"
                style={{ fontSize: "clamp(3rem,15vw,6rem)", color: "var(--fg)", textDecoration: "none", borderTop: "1px solid var(--line)", padding: "14px 0", display: "flex", alignItems: "baseline", gap: 18 }}
              >
                <span className="mono" style={{ fontSize: 12, color: "var(--fg-faint)", letterSpacing: "0.1em" }}>0{LINKS.length + 2}</span>
                Contact
              </Link>
            </div>
            <span className="mono" style={{ fontSize: 11, color: "var(--fg-muted)" }}>{EMAIL}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
