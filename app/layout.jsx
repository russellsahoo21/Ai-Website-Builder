import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import "../src/index.css";

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://aethercraft.dev"),
  title: {
    default: "AetherCraft — AI Full-Stack React 18 Web App Builder",
    template: "%s | AetherCraft",
  },
  description:
    "Synthesize production-grade, visually stunning React 18 web applications from natural language. Live 60 FPS in-browser sandbox, multi-model engine, and instant 1-click Vite exports.",
  keywords: [
    "AI Website Builder",
    "React 18",
    "Tailwind CSS",
    "AI Code Generator",
    "Full-Stack SaaS",
    "Web App Builder",
    "OpenRouter",
    "Next.js",
    "Vite Export",
    "AetherCraft",
  ],
  authors: [{ name: "AetherCraft Systems Inc." }],
  creator: "AetherCraft Systems",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://aethercraft.dev",
    siteName: "AetherCraft",
    title: "AetherCraft — AI Full-Stack React 18 Web App Builder",
    description:
      "Synthesize production-grade, visually stunning React 18 web applications from natural language. Live 60 FPS sandbox & 1-click export.",
  },
  twitter: {
    card: "summary_large_image",
    title: "AetherCraft — AI Full-Stack React 18 Web App Builder",
    description:
      "Synthesize production-grade, visually stunning React 18 web applications from natural language.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.ico',
    apple: '/icon.png',
  },
};

export const viewport = {
  themeColor: "#090a0f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
      signInForceRedirectUrl="/dashboard"
      signUpForceRedirectUrl="/dashboard"
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#ffffff",
          colorPrimaryForeground: "#000000",
          colorBackground: "#0d0f14",
          colorInput: "#181b22",
          colorInputBackground: "#181b22",
          colorInputForeground: "#ffffff",
          colorInputText: "#ffffff",
          colorForeground: "#ffffff",
          colorNeutral: "#ffffff",
          colorText: "#f4f4f5",
          colorTextSecondary: "#a1a1aa",
          colorMuted: "#1f242d",
          colorMutedForeground: "#a1a1aa",
          colorTextOnPrimaryBackground: "#000000",
          borderRadius: "0.5rem",
        },
        elements: {
          card: "bg-[#0d0f14] border border-zinc-800 shadow-2xl",
          modalContent: "bg-[#0d0f14] border border-zinc-800 shadow-2xl",
          modalBackdrop: "bg-black/75 backdrop-blur-sm",
          navbar: "bg-[#090a0f] border-r border-zinc-800",
          navbarTitleText: "text-white font-bold",
          navbarSubtitleText: "text-zinc-400",
          headerTitle: "text-white font-bold",
          headerSubtitle: "text-zinc-400",
          navbarButton: "text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-md transition-all",
          profileSectionTitle: "text-zinc-300 font-semibold text-sm",
          profileSectionTitleText: "text-zinc-300 font-semibold text-sm",
          profileSectionSubtitle: "text-zinc-400",
          profileSectionSubtitleText: "text-zinc-400",
          profileSectionContent: "text-zinc-100",
          identityPreview: "text-zinc-300",
          identityPreviewText: "text-zinc-300",
          userPreviewSecondaryIdentifier: "text-zinc-300",
          connectedAccount: "text-zinc-300",
          formFieldLabel: "text-zinc-300",
          formFieldInput: "bg-[#181b22] border-zinc-800 text-white",
          formFieldHintText: "text-zinc-400",
          formFieldErrorText: "text-red-400",
          badge: "bg-zinc-800 text-zinc-200 border-zinc-700 text-xs",
          alert: "text-zinc-400",
          alertText: "text-zinc-400",
          userPreviewMainIdentifier: "text-white font-semibold",
          profileSectionPrimaryButton: "text-white font-semibold hover:text-zinc-200",
          modalCloseButton: "text-zinc-400 hover:text-white",
          userButtonPopoverCard: "bg-[#0d0f14] border border-zinc-800 shadow-2xl",
          userButtonPopoverActionButton: "text-zinc-200 hover:bg-zinc-800 hover:text-white rounded-md",
          userButtonPopoverActionButtonText: "text-zinc-200 font-medium",
          userButtonPopoverActionButtonIcon: "text-zinc-400",
          formButtonPrimary: "bg-white text-zinc-950 font-semibold hover:bg-zinc-200",
          dividerLine: "bg-zinc-800",
          dividerText: "text-zinc-400",
          footerActionText: "text-zinc-400",
          footerActionLink: "text-indigo-400 hover:text-indigo-300 font-semibold",
        },
      }}
    >
      <html lang="en" className="dark scroll-smooth">
        <head>
          <link rel="icon" href="/favicon.ico" sizes="any" />
          <link
            rel="icon"
            type="image/svg+xml"
            href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236366f1' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z'/></svg>"
          />
          <link rel="apple-touch-icon" href="/icon.png" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
            rel="stylesheet"
          />
        </head>
        <body className="bg-[#090a0f] text-zinc-100 min-h-screen font-sans antialiased selection:bg-indigo-500 selection:text-white">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
