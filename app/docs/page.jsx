import MarketingShell from "@/src/components/MarketingShell";
import DocsPage from "@/src/views/DocsPage";

export const metadata = {
  title: "Documentation & Developer Guide",
  description:
    "Comprehensive guides and API reference for AetherCraft Engine. Learn about the Babel runtime, OpenRouter multi-model router, live iframe sandboxing, and project exports.",
  alternates: {
    canonical: "/docs",
  },
  openGraph: {
    title: "AetherCraft Documentation & Architecture Guide",
    description: "Learn how the React 18 in-browser compiler, error auto-repair, and sandbox messaging work.",
    url: "/docs",
  },
};

export default function DocsRoute() {
  return (
    <MarketingShell currentRoute="docs">
      <DocsPage />
    </MarketingShell>
  );
}

