import MarketingShell from "@/src/components/MarketingShell";
import ShowcasePage from "@/src/views/ShowcasePage";

export const metadata = {
  title: "Community & Verified Showcase",
  description:
    "See what founders and designers are building with AetherCraft. Real interactive React 18 applications built and deployed in minutes.",
  alternates: {
    canonical: "/showcase",
  },
  openGraph: {
    title: "AetherCraft Showcase — Built with AI Code Synthesis",
    description: "Explore high-fidelity web applications created and exported with AetherCraft.",
    url: "/showcase",
  },
};

export default function ShowcaseRoute() {
  return (
    <MarketingShell currentRoute="showcase">
      <ShowcasePage />
    </MarketingShell>
  );
}

