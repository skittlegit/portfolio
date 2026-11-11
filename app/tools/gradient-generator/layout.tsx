import { toolMeta } from "../../lib/seo";

// Server-side metadata for this tool (the page itself is a client component).
export const metadata = toolMeta("gradient-generator");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
