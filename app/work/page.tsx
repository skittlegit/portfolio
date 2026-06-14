import type { Metadata } from "next";
import WorkIndex from "./WorkIndex";

export const metadata: Metadata = {
  title: "Work",
  description:
    "Selected work by Deepak Aeleni — trading simulators, telemedicine, F1 prediction, satellite scheduling, corporate sites, and field-ops apps.",
  alternates: { canonical: "/work" },
};

export default function WorkPage() {
  return <WorkIndex />;
}
