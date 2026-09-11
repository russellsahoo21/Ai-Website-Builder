import { ClerkProvider } from '@clerk/react';
import { dark } from '@clerk/themes';
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY} 
      afterSignOutUrl="/"
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: '#ffffff',
          colorPrimaryForeground: '#000000',
          colorBackground: '#0d0f14',
          colorInput: '#181b22',
          colorInputBackground: '#181b22',
          colorInputForeground: '#ffffff',
          colorInputText: '#ffffff',
          colorForeground: '#ffffff',
          colorNeutral: '#ffffff',
          colorText: '#f4f4f5',
          colorTextSecondary: '#a1a1aa',
          colorMuted: '#1f242d',
          colorMutedForeground: '#a1a1aa',
          colorTextOnPrimaryBackground: '#000000',
          borderRadius: '0.5rem'
        },
        elements: {
          // Popover
          userButtonPopoverCard: 'bg-[#0d0f14] border border-zinc-800 text-zinc-100 shadow-2xl',
          userPreviewMainIdentifier: 'text-zinc-100 font-semibold text-sm',
          userPreviewSecondaryIdentifier: 'text-zinc-400 text-xs',
          userButtonPopoverActionButton: 'text-zinc-200 hover:text-white hover:bg-zinc-800 transition',
          userButtonPopoverActionButtonText: 'text-zinc-200 font-medium',
          userButtonPopoverActionButtonIcon: 'text-zinc-400',
          // UserProfile Modal & Card
          card: 'bg-[#0d0f14] border border-zinc-800 text-zinc-100',
          modalContent: 'bg-[#0d0f14] text-zinc-100 border border-zinc-800',
          modalCloseButton: 'text-zinc-400 hover:text-white',
          navbar: 'border-r border-zinc-800 bg-[#090a0f]',
          navbarTitleText: 'text-white font-bold',
          navbarSubtitleText: 'text-zinc-400',
          navbarButton: 'text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition',
          navbarButtonIcon: 'text-zinc-400',
          headerTitle: 'text-white font-bold',
          headerSubtitle: 'text-zinc-400 text-xs',
          profileSection: 'border-b border-zinc-800/60',
          profileSectionTitle: 'text-zinc-200 font-medium',
          profileSectionTitleText: 'text-zinc-200 font-medium',
          profileSectionSubtitle: 'text-zinc-400 text-xs',
          profileSectionSubtitleText: 'text-zinc-400 text-xs',
          profileSectionContent: 'text-zinc-100',
          profileSectionPrimaryButton: 'text-white hover:text-zinc-200 font-semibold',
          formFieldLabel: 'text-zinc-300 text-xs',
          formFieldInput: 'bg-zinc-900 border-zinc-700 text-zinc-100 placeholder-zinc-500',
          formButtonPrimary: 'bg-white hover:bg-zinc-200 text-black font-semibold',
          footerActionText: 'text-zinc-400',
          footerActionLink: 'text-white hover:underline font-medium',
          identityPreviewText: 'text-zinc-200 font-medium',
          badge: 'bg-zinc-800 text-zinc-300 border border-zinc-700'
        }
      }}
    >
      <App />
    </ClerkProvider>
  </React.StrictMode>,
)
