import { DEMO_RADAR_PROJECTS } from "@/lib/radar-demo";
import { ProjectDetailView } from "@/components/radar/ProjectDetailView";

export function generateStaticParams() {
  return DEMO_RADAR_PROJECTS.map((p) => ({ id: p.id }));
}

export default async function RadarProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProjectDetailView id={id} />;
}
