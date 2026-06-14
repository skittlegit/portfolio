import type { Metadata } from "next";
import AboutContent from "./AboutContent";

export const metadata: Metadata = {
  title: "About",
  description:
    "Deepak Aeleni — internet generalist in Hyderabad. CS undergrad at Mahindra University, UI/UX-focused full-stack & app developer.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return <AboutContent />;
}
