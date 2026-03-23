"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTheme } from "./context/ThemeContext";
import {
  ArrowUpRight,
  Sun,
  Moon,
  Github,
  Linkedin,
  Twitter,
  Instagram,
  Mail,
  Wrench,
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

/* ── Data ── */
const PROJECTS = [
  {
    name: "Stock Trading Sim",
    description:
      "Real-time trading simulator for 400+ users with matching engine & WebSocket updates",
    tech: "Next.js · Firebase · Google Scripts",
    status: "Shipped",
    url: "https://team30-omega.vercel.app",
  },
  {
    name: "F1 Prediction",
    description:
      "ML-powered race predictions achieving 85% accuracy on 10K+ race records",
    tech: "Python · scikit-learn · FastF1",
    status: "Shipped",
    url: "https://github.com/skittlegit/F1_Prediction",
  },
  {
    name: "Reddys Digital",
    description:
      "Full company website redesign — 10+ pages revamped, 20+ bugs fixed",
    tech: "Next.js · Tailwind CSS · Firebase",
    status: "Shipped",
    url: "https://rdpl.vercel.app",
  },
  {
    name: "Workplace Automation",
    description:
      "Internal workflow platform with role-based dashboards and approval flows",
    tech: "Next.js · Firebase · Flutter · Supabase",
    status: "Building",
    url: "#",
  },
];

const SOCIALS = [
  { icon: Github, href: "https://github.com/skittlegit", label: "GitHub" },
  {
    icon: Linkedin,
    href: "https://linkedin.com/in/deepakaeleni",
    label: "LinkedIn",
  },
  {
    icon: Twitter,
    href: "https://x.com/itsnotskittle",
    label: "X / Twitter",
  },
  {
    icon: Instagram,
    href: "https://instagram.com/skittlllle",
    label: "Instagram",
  },
  { icon: Mail, href: "mailto:deepakrdy7@gmail.com", label: "Email" },
];

/* ── Component ── */
export default function Home() {
  const { isDark, toggle } = useTheme();
  const mainRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const aboutRef = useRef<HTMLElement>(null);
  const projectsRef = useRef<HTMLElement>(null);
  const footerRef = useRef<HTMLElement>(null);

  /* ── GSAP Animations ── */
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero text reveal
      gsap.from("[data-hero-line]", {
        y: 80,
        opacity: 0,
        duration: 1.2,
        ease: "power4.out",
        stagger: 0.15,
        delay: 0.3,
      });

      // Hero subtitle
      gsap.from("[data-hero-sub]", {
        y: 30,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        delay: 0.9,
      });

      // Nav items
      gsap.from("[data-nav-item]", {
        y: -20,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.1,
        delay: 0.2,
      });

      // About section
      gsap.from("[data-about-text]", {
        scrollTrigger: {
          trigger: aboutRef.current,
          start: "top 80%",
          end: "top 30%",
          scrub: 1,
        },
        y: 60,
        opacity: 0,
      });

      // About stats
      gsap.from("[data-stat]", {
        scrollTrigger: {
          trigger: "[data-stats]",
          start: "top 85%",
        },
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.12,
      });

      // Projects section heading
      gsap.from("[data-projects-heading]", {
        scrollTrigger: {
          trigger: projectsRef.current,
          start: "top 80%",
        },
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
      });

      // Project cards
      gsap.from("[data-project-card]", {
        scrollTrigger: {
          trigger: "[data-project-list]",
          start: "top 85%",
        },
        y: 50,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.1,
      });

      // Footer
      gsap.from("[data-footer-item]", {
        scrollTrigger: {
          trigger: footerRef.current,
          start: "top 90%",
        },
        y: 30,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.08,
      });
    }, mainRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={mainRef}
      className="relative min-h-screen"
      style={{ background: "var(--bg)", color: "var(--fg)" }}
    >
      {/* ── Navigation ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 sm:px-10 md:px-16 py-5">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            data-nav-item
            className="heading text-lg tracking-tight"
            style={{ color: "var(--fg)", textDecoration: "none" }}
          >
            Deepak
          </Link>
        </div>

        <div className="flex items-center gap-6">
          <Link
            href="/tools"
            data-nav-item
            className="mono flex items-center gap-1.5 text-xs tracking-wider uppercase"
            style={{
              color: "var(--fg-muted)",
              textDecoration: "none",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--accent)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--fg-muted)")
            }
          >
            <Wrench size={13} strokeWidth={1.5} />
            Tools
          </Link>
          <button
            onClick={toggle}
            data-nav-item
            aria-label="Toggle theme"
            className="mono"
            style={{
              background: "none",
              border: "none",
              color: "var(--fg-muted)",
              padding: 8,
              lineHeight: 0,
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--accent)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--fg-muted)")
            }
          >
            {isDark ? (
              <Sun size={16} strokeWidth={1.5} />
            ) : (
              <Moon size={16} strokeWidth={1.5} />
            )}
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section
        ref={heroRef}
        className="relative flex flex-col justify-center min-h-screen px-6 sm:px-10 md:px-16"
      >
        <div className="max-w-5xl pt-24">
          {/* Overline */}
          <div
            data-hero-line
            className="mono text-[10px] sm:text-xs tracking-[0.3em] uppercase mb-8 md:mb-10"
            style={{ color: "var(--fg-muted)" }}
          >
            Builder &amp; Designer
          </div>

          {/* Name as hero */}
          <div className="overflow-hidden">
            <h1
              data-hero-line
              className="heading text-6xl sm:text-8xl md:text-9xl lg:text-[11rem] leading-[0.85] tracking-tighter"
            >
              Deepak
            </h1>
          </div>
          <div className="overflow-hidden mt-1 md:mt-2">
            <h1
              data-hero-line
              className="heading text-6xl sm:text-8xl md:text-9xl lg:text-[11rem] leading-[0.85] tracking-tighter"
            >
              Aeleni
              <span style={{ color: "var(--accent)" }}>.</span>
            </h1>
          </div>

          {/* Bio row + CTA */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mt-10 md:mt-16 gap-8">
            <p
              data-hero-sub
              className="mono text-sm sm:text-base max-w-md leading-relaxed"
              style={{ color: "var(--fg-muted)" }}
            >
              Internet generalist based in Hyderabad, India.
              <br className="hidden sm:block" />
              Building tools, crafting interfaces, and documenting the process.
            </p>

            <div
              data-hero-sub
              className="flex items-center gap-6"
            >
              <a
                href="/resume.pdf"
                target="_blank"
                rel="noopener noreferrer"
                data-cursor-hover
                className="mono text-xs tracking-wider uppercase flex items-center gap-2"
                style={{
                  color: "var(--accent)",
                  textDecoration: "none",
                  transition: "opacity 0.2s",
                }}
              >
                Resume <ArrowUpRight size={14} strokeWidth={1.5} />
              </a>
            </div>
          </div>

          {/* Availability indicator */}
          <div
            data-hero-sub
            className="flex items-center gap-2.5 mt-8 mono text-xs tracking-wider"
            style={{ color: "var(--fg-muted)" }}
          >
            <span className="relative flex h-2 w-2">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ background: "var(--accent)" }}
              />
              <span
                className="relative inline-flex rounded-full h-2 w-2"
                style={{ background: "var(--accent)" }}
              />
            </span>
            Available for projects
          </div>

          {/* Scroll indicator */}
          <div
            data-hero-sub
            className="absolute bottom-10 left-6 sm:left-10 md:left-16 flex items-center gap-3 mono text-xs tracking-widest uppercase"
            style={{ color: "var(--fg-muted)" }}
          >
            <span
              className="inline-block w-6 h-px"
              style={{ background: "var(--fg-muted)" }}
            />
            Scroll
          </div>
        </div>
      </section>

      {/* ── About ── */}
      <section
        ref={aboutRef}
        className="relative px-6 sm:px-10 md:px-16 py-24 md:py-40"
      >
        {/* Section label */}
        <div
          className="mono text-xs tracking-widest uppercase mb-12"
          style={{ color: "var(--fg-muted)" }}
        >
          About
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20">
          <div data-about-text>
            <p className="heading text-2xl sm:text-3xl md:text-4xl leading-snug tracking-tight">
              CS undergrad at Mahindra University — I build useful tools and
              design interfaces that feel good to use.
            </p>
          </div>
          <div data-about-text>
            <p
              className="mono text-sm sm:text-base leading-relaxed"
              style={{ color: "var(--fg-muted)" }}
            >
              Interned at Reddys Digital, where I revamped their website with
              Next.js and Tailwind. I head tech &amp; design for the Mathematics
              Society and served as design representative for AEON 2026 Tech
              Fest.
            </p>
            <p
              className="mono text-sm sm:text-base leading-relaxed mt-6"
              style={{ color: "var(--fg-muted)" }}
            >
              Currently building workplace automation tools and contributing to
              open-source. When I&apos;m not coding, you&apos;ll find me
              reading, watching F1, or on a long train ride somewhere.
            </p>
          </div>
        </div>

        {/* Stats strip */}
        <div
          data-stats
          className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-20 pt-12"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          {[
            { number: "11+", label: "Public repos" },
            { number: "3+", label: "Years building" },
            { number: "400+", label: "Users served" },
            { number: "∞", label: "Cups of coffee" },
          ].map((stat) => (
            <div key={stat.label} data-stat>
              <div
                className="heading text-3xl sm:text-4xl tracking-tight"
                style={{ color: "var(--accent)" }}
              >
                {stat.number}
              </div>
              <div
                className="mono text-xs tracking-wider uppercase mt-2"
                style={{ color: "var(--fg-muted)" }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Projects ── */}
      <section
        ref={projectsRef}
        className="relative px-6 sm:px-10 md:px-16 py-24 md:py-40"
      >
        <div
          className="mono text-xs tracking-widest uppercase mb-4"
          style={{ color: "var(--fg-muted)" }}
        >
          Projects
        </div>
        <h2
          data-projects-heading
          className="heading text-3xl sm:text-4xl md:text-5xl tracking-tight mb-16"
        >
          What I&apos;m working on
        </h2>

        <div
          data-project-list
          className="space-y-0"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          {PROJECTS.map((project) => (
            <a
              key={project.name}
              href={project.url}
              target={project.url !== "#" ? "_blank" : undefined}
              rel={project.url !== "#" ? "noopener noreferrer" : undefined}
              data-project-card
              data-cursor-hover
              className="group block py-8 md:py-10"
              style={{
                borderBottom: "1px solid var(--border)",
                textDecoration: "none",
                color: "inherit",
                transition: "padding-left 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.paddingLeft = "16px";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.paddingLeft = "0px";
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-2">
                    <span className="heading text-xl sm:text-2xl md:text-3xl tracking-tight">
                      {project.name}
                    </span>
                    <span
                      className="mono text-[10px] tracking-widest uppercase px-3 py-1 rounded-full"
                      style={{
                        border: "1px solid var(--border)",
                        color:
                          project.status === "Building"
                            ? "var(--accent)"
                            : "var(--fg-muted)",
                      }}
                    >
                      {project.status}
                    </span>
                  </div>
                  <p
                    className="mono text-xs sm:text-sm"
                    style={{ color: "var(--fg-muted)" }}
                  >
                    {project.description}
                  </p>
                  <p
                    className="mono text-[10px] sm:text-xs mt-2"
                    style={{ color: "var(--fg-muted)", opacity: 0.6 }}
                  >
                    {project.tech}
                  </p>
                </div>
                <ArrowUpRight
                  size={18}
                  strokeWidth={1.5}
                  className="mt-2 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  style={{ color: "var(--fg-muted)" }}
                />
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ── Tools CTA Banner ── */}
      <section className="relative px-6 sm:px-10 md:px-16 py-16 md:py-24">
        <Link
          href="/tools"
          data-cursor-hover
          className="group block rounded-2xl p-8 md:p-14 transition-colors duration-300"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            textDecoration: "none",
            color: "inherit",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--accent)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
          }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div
                className="mono text-xs tracking-widest uppercase mb-4"
                style={{ color: "var(--fg-muted)" }}
              >
                Free & Open
              </div>
              <h3 className="heading text-2xl sm:text-3xl md:text-4xl tracking-tight">
                Design & Dev Tools
              </h3>
              <p
                className="mono text-sm mt-3 max-w-md"
                style={{ color: "var(--fg-muted)" }}
              >
                QR codes, color palettes, gradient generators, image
                compressors, and more — all in your browser.
              </p>
            </div>
            <div
              className="flex items-center gap-2 mono text-sm"
              style={{ color: "var(--accent)" }}
            >
              Explore tools
              <ArrowUpRight size={16} strokeWidth={1.5} />
            </div>
          </div>
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer
        ref={footerRef}
        className="relative px-6 sm:px-10 md:px-16 pt-20 md:pt-32 pb-12"
      >
        <div
          style={{ borderTop: "1px solid var(--border)" }}
          className="pt-16"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Contact */}
            <div data-footer-item>
              <div
                className="mono text-xs tracking-widest uppercase mb-4"
                style={{ color: "var(--fg-muted)" }}
              >
                Get in touch
              </div>
              <a
                href="mailto:deepakrdy7@gmail.com"
                className="heading text-xl sm:text-2xl tracking-tight"
                style={{
                  color: "var(--fg)",
                  textDecoration: "none",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "var(--accent)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "var(--fg)")
                }
              >
                deepakrdy7@gmail.com
              </a>
            </div>

            {/* Socials */}
            <div data-footer-item>
              <div
                className="mono text-xs tracking-widest uppercase mb-4"
                style={{ color: "var(--fg-muted)" }}
              >
                Connect
              </div>
              <div className="flex flex-wrap gap-4">
                {SOCIALS.map(({ icon: Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="flex items-center gap-2 mono text-sm transition-colors duration-200"
                    style={{
                      color: "var(--fg-muted)",
                      textDecoration: "none",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "var(--accent)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "var(--fg-muted)")
                    }
                  >
                    <Icon size={15} strokeWidth={1.5} />
                    {label}
                  </a>
                ))}
              </div>
            </div>

            {/* Status */}
            <div data-footer-item>
              <div
                className="mono text-xs tracking-widest uppercase mb-4"
                style={{ color: "var(--fg-muted)" }}
              >
                Currently
              </div>
              <p
                className="mono text-sm leading-relaxed"
                style={{ color: "var(--fg-muted)" }}
              >
                Building workplace automation tools.
                <br />
                Open to new projects and collaborations.
              </p>
            </div>
          </div>

          {/* Bottom bar */}
          <div
            data-footer-item
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-16 pt-8 gap-4"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <div
              className="mono text-xs"
              style={{ color: "var(--fg-muted)" }}
            >
              &copy; {new Date().getFullYear()} Deepak. All rights reserved.
            </div>
            <div
              className="mono text-xs"
              style={{ color: "var(--fg-muted)" }}
            >
              Built with Next.js, GSAP & good taste.
            </div>
          </div>
        </div>
      </footer>

      {/* ── Noise texture overlay ── */}
      <div
        className="pointer-events-none fixed inset-0 z-[60] opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
        }}
      />
    </div>
  );
}

