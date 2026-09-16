import MarketingShell from "@/src/components/MarketingShell";
import PricingPage from "@/src/views/PricingPage";

export const metadata = {
  title: "Pricing Plans — Developer Free, Pro Founder & Studio Unlimited",
  description:
    "Transparent pricing for creators and teams. Start free with 5 projects. Upgrade to Pro Founder for 50 projects ($16/mo) or Studio Unlimited for infinite projects.",
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: "Pricing Plans — AetherCraft AI Web App Builder",
    description:
      "Start free with 5 projects. Scale to Pro Founder (50 projects) or Studio Unlimited with frontier models and unlimited generations.",
    url: "/pricing",
  },
};

const pricingJsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "AetherCraft AI Web Builder Subscriptions",
  "description": "AI-powered web app generation engine subscriptions for indie developers and studios.",
  "offers": [
    {
      "@type": "Offer",
      "name": "Developer Free",
      "price": "0",
      "priceCurrency": "USD",
      "description": "5 active projects, 100,000 monthly AI tokens, all AI models unrestricted, live sandbox, community Discord support."
    },
    {
      "@type": "Offer",
      "name": "Pro Founder",
      "price": "16",
      "priceCurrency": "USD",
      "billingDuration": "P1M",
      "description": "Up to 50 active projects, unlimited monthly AI tokens, priority synthesis queue, all frontier models, custom domains."
    },
    {
      "@type": "Offer",
      "name": "Studio Unlimited",
      "price": "40",
      "priceCurrency": "USD",
      "billingDuration": "P1M",
      "description": "Unlimited active projects with no caps, 5 team seats, white-label exports, dedicated SLA."
    }
  ]
};

export default function PricingRoute() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingJsonLd) }}
      />
      <MarketingShell currentRoute="pricing">
        <PricingPage />
      </MarketingShell>
    </>
  );
}

