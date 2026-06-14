import type { StaticImageData } from "next/image";
// Static imports → content-hashed URLs that bust caches automatically whenever
// the source file changes (drop a new PNG in public/work and rebuild).
import mcseShot from "@/public/work/mcse.png";
import vellumShot from "@/public/work/vellum.png";
import lightsoutShot from "@/public/work/lightsout.png";
import reddysShot from "@/public/work/reddys.png";
import chunksShot from "@/public/work/chunks.png";

export type Project = {
  slug: string;
  idx: string;
  /** short display name — set huge on index rows / case-study hero */
  name: string;
  /** full title for metadata */
  title: string;
  status: "Shipped" | "Building";
  /** what kind of thing it is — mono tag on rows */
  kind: string;
  /** one-paragraph brief */
  summary: string;
  /** key facts, decomposed for the case-study sheet */
  points: string[];
  stack: string[];
  href: string;
  linkLabel: string;
  img?: StaticImageData;
  /** featured on the home overview */
  featured?: boolean;
};

export const PROJECTS: Project[] = [
  {
    slug: "mcse",
    idx: "01",
    name: "MCSE",
    title: "MCSE — Stock Trading Sim",
    status: "Shipped",
    kind: "Trading simulator",
    summary:
      "Real-time stock trading simulator — 400+ participants with 250+ concurrent users at peak. Order execution, a stock screener, watchlists, and an IPO module, packaged as a PWA + TWA.",
    points: [
      "400+ participants, 250+ concurrent users",
      "Real-time order execution engine",
      "Stock screener & watchlist",
      "IPO module",
      "Packaged as PWA + TWA",
    ],
    stack: ["Next.js", "Convex", "TypeScript"],
    href: "https://mcse.in",
    linkLabel: "mcse.in",
    img: mcseShot,
    featured: true,
  },
  {
    slug: "vellum",
    idx: "02",
    name: "Vellum",
    title: "Vellum Health",
    status: "Shipped",
    kind: "Telemedicine platform",
    summary:
      "Telemedicine platform with live video consultations, paid booking, and a security-first architecture across every role of the clinic.",
    points: [
      "WebRTC + Socket.IO video consultations",
      "Stripe-powered booking",
      "AES-256-GCM encryption",
      "Multi-role NextAuth with edge role-gating",
      "Audit logs",
    ],
    stack: ["Next.js", "MongoDB", "Stripe", "WebRTC"],
    href: "https://vellumhealth.vercel.app/",
    linkLabel: "vellumhealth.vercel.app",
    img: vellumShot,
    featured: true,
  },
  {
    slug: "lightsout",
    idx: "03",
    name: "Lightsout",
    title: "Lightsout — F1 Prediction",
    status: "Shipped",
    kind: "F1 prediction dashboard",
    summary:
      "Full-stack Formula 1 prediction dashboard — machine-learning race forecasts backed by eight seasons of data.",
    points: [
      "3 LightGBM quantile-regression models",
      "Trained on 8 seasons of race data",
      "Monte Carlo simulation — ~10K orderings per race",
      "Win / podium / points odds per driver",
    ],
    stack: ["Next.js", "FastAPI", "LightGBM", "FastF1"],
    href: "https://lightsout-web.vercel.app/",
    linkLabel: "lightsout-web.vercel.app",
    img: lightsoutShot,
    featured: true,
  },
  {
    slug: "reddys",
    idx: "04",
    name: "Reddys Digital",
    title: "Reddys Digital",
    status: "Shipped",
    kind: "Corporate website",
    summary:
      "Corporate website built from scratch during my internship at Reddys Digital — six pages end-to-end for a firm serving 100+ clients across 50+ cities.",
    points: [
      "Built from scratch, end-to-end",
      "6 pages designed & shipped",
      "Client serves 100+ clients across 50+ cities",
      "Built during my internship at the firm",
    ],
    stack: ["Next.js", "TypeScript", "Tailwind", "Framer Motion"],
    href: "https://rdpl.vercel.app",
    linkLabel: "rdpl.vercel.app",
    img: reddysShot,
  },
  {
    slug: "chunks",
    idx: "05",
    name: "Chunks",
    title: "Chunks — Satellite Scheduler",
    status: "Shipped",
    kind: "Satellite imaging scheduler",
    summary:
      "Full-stack satellite imaging scheduler built for the Lost in Space hackathon — planning spacecraft attitude to maximise mission score.",
    points: [
      "Built for the Lost in Space hackathon",
      "Two-pass attitude planner",
      "Composite mission score 1.18",
      "Passed all 3 test cases",
    ],
    stack: ["Next.js", "FastAPI", "Zustand"],
    href: "https://chunkyweb.vercel.app/",
    linkLabel: "chunkyweb.vercel.app",
    img: chunksShot,
  },
  {
    slug: "crossmint",
    idx: "06",
    name: "Crossmint",
    title: "Crossmint — Workplace Automation",
    status: "Building",
    kind: "Field-ops app",
    summary:
      "Workplace-automation field-ops app — on-site capture with photos and metadata, built offline-first for crews in the field. Currently in development.",
    points: [
      "On-site capture with photos & metadata",
      "Role-based access across 3 tiers",
      "Offline-first storage",
      "Admin dashboard with exports",
    ],
    stack: ["Flutter", "Supabase", "Riverpod", "Hive"],
    href: "https://github.com/skittlegit/crossmint",
    linkLabel: "github.com/skittlegit/crossmint",
  },
];

export const SOCIALS = [
  { label: "GitHub", handle: "skittlegit", href: "https://github.com/skittlegit" },
  { label: "LinkedIn", handle: "in/deepakaeleni", href: "https://linkedin.com/in/deepakaeleni" },
  { label: "X / Twitter", handle: "itsnotskittle", href: "https://x.com/itsnotskittle" },
  { label: "Instagram", handle: "skittlllle", href: "https://instagram.com/skittlllle" },
];

export const EMAIL = "deepakrdy7@gmail.com";
export const PHONE = "+91 88850 15899";
export const PHONE_HREF = "tel:+918885015899";
export const COORDS = "17.3850° N / 78.4867° E";
