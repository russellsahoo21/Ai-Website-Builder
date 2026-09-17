import MarketingShell from "@/src/components/MarketingShell";
import LandingPage from "@/src/views/LandingPage";

export const metadata = {
  title: "AetherCraft — AI Full-Stack React 18 Web App Builder",
  description:
    "Transform ideas into production React 18 SPAs with live 60 FPS in-browser sandboxing, multi-turn AI reasoning, and instant 1-click Vite exports.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "AetherCraft — AI Full-Stack React 18 Web App Builder",
    description:
      "Transform ideas into production React 18 SPAs with live 60 FPS in-browser sandboxing and instant Vite exports.",
    url: "/",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "AetherCraft",
  "operatingSystem": "Web Browser",
  "applicationCategory": "DeveloperApplication",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
  },
  "description":
    "Full-stack AI web development engine. Generate, preview, and deploy production React 18 applications from natural language.",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "ratingCount": "1280",
  },
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MarketingShell currentRoute="landing">
        <LandingPage />
      </MarketingShell>
    </>
  );
}

