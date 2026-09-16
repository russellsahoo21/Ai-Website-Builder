import MarketingShell from "@/src/components/MarketingShell";
import ChangelogPage from "@/src/views/ChangelogPage";

export const metadata = {
  title: "Product Changelog & Engine Updates",
  description:
    "Follow the evolution of AetherCraft Engine. Release notes, performance improvements, Babel updates, and new AI model additions.",
  alternates: {
    canonical: "/changelog",
  },
  openGraph: {
    title: "AetherCraft Product Changelog",
    description: "Latest features, bug fixes, and performance updates across the platform.",
    url: "/changelog",
  },
};

export default function ChangelogRoute() {
  return (
    <MarketingShell currentRoute="changelog">
      <ChangelogPage />
    </MarketingShell>
  );
}

