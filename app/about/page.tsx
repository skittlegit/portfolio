import type { Metadata } from "next";
import AboutContent from "./AboutContent";
import { pageMeta } from "../lib/seo";

export const metadata: Metadata = pageMeta({
  title: "About",
  description:
    "Deepak Aeleni — internet generalist in Hyderabad. CS undergrad at Mahindra University, UI/UX-focused full-stack & app developer.",
  path: "/about",
});

export default function AboutPage() {
  return <AboutContent />;
}
