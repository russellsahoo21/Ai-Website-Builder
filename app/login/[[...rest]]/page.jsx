import MarketingShell from "@/src/components/MarketingShell";
import AuthPage from "@/src/views/AuthPage";

export const metadata = {
  title: "Sign In — AetherCraft Studio",
  description: "Access your AetherCraft workspace and projects.",
};

export default function LoginPage() {
  return (
    <MarketingShell currentRoute="login">
      <AuthPage mode="login" />
    </MarketingShell>
  );
}
