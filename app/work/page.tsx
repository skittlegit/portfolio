import type { Metadata } from "next";
import WorkIndex from "./WorkIndex";
import { pageMeta } from "../lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Work",
  description:
    "Selected work by Deepak Aeleni — trading simulators, telemedicine, F1 prediction, satellite scheduling, corporate sites, and field-ops apps.",
  path: "/work",
});

export default function WorkPage() {
  return <WorkIndex />;
}
