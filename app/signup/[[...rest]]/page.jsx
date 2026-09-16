import MarketingShell from "@/src/components/MarketingShell";
import AuthPage from "@/src/views/AuthPage";

export const metadata = {
  title: "Create Account — AetherCraft Studio",
  description: "Create an account to start synthesizing React 18 applications.",
};

export default function SignupPage() {
  return (
    <MarketingShell currentRoute="signup">
      <AuthPage mode="signup" />
    </MarketingShell>
  );
}
