import MarketingShell from "@/src/components/MarketingShell";
import IntegrationsPage from "@/src/views/IntegrationsPage";

export const metadata = {
  title: "Integrations Ecosystem — Supabase, Clerk, Razorpay & OpenRouter",
  description:
    "Connect AetherCraft seamlessly with modern backend infrastructure including Supabase PostgreSQL, Clerk Authentication, OpenRouter, and Razorpay.",
  alternates: {
    canonical: "/integrations",
  },
  openGraph: {
    title: "AetherCraft Integrations — Supabase, Clerk, Razorpay & AI Models",
    description: "Plug into production databases, auth systems, and payment infrastructure.",
    url: "/integrations",
  },
};

export default function IntegrationsRoute() {
  return (
    <MarketingShell currentRoute="integrations">
      <IntegrationsPage />
    </MarketingShell>
  );
}

