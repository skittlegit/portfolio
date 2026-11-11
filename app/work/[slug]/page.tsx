import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PROJECTS } from "../../lib/projects";
import CaseStudy from "./CaseStudy";
import { pageMeta } from "../../lib/seo";

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = PROJECTS.find((x) => x.slug === slug);
  if (!p) return {};
  return pageMeta({ title: p.title, description: p.summary, path: `/work/${p.slug}` });
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const idx = PROJECTS.findIndex((x) => x.slug === slug);
  if (idx === -1) notFound();
  const project = PROJECTS[idx];
  const next = PROJECTS[(idx + 1) % PROJECTS.length];
  return <CaseStudy project={project} next={next} total={PROJECTS.length} />;
}
