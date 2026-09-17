import MarketingShell from "@/src/components/MarketingShell";
import TemplatesPage from "@/src/views/TemplatesPage";

export const metadata = {
  title: "Production Starter Blueprints & Templates",
  description:
    "Explore battle-tested React 18 starter blueprints for Fintech Dashboards, SaaS Billing, Architectural Portfolios, and E-commerce Storefronts.",
  alternates: {
    canonical: "/templates",
  },
  openGraph: {
    title: "Production Starter Blueprints — AetherCraft",
    description:
      "Pre-engineered React 18 + Tailwind CSS application architectures ready for instant generation and customization.",
    url: "/templates",
  },
};

export default function TemplatesRoute() {
  return (
    <MarketingShell currentRoute="templates">
      <TemplatesPage />
    </MarketingShell>
  );
}

