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
          colorBackground: '#0d0f14',
          colorInputBackground: '#181b22',
          colorInputText: '#ffffff',
          colorText: '#f4f4f5',
          colorTextSecondary: '#a1a1aa',
          colorTextOnPrimaryBackground: '#000000',
          borderRadius: '0.5rem'
        },
        elements: {
          userButtonPopoverCard: 'bg-[#0d0f14] border border-zinc-800 text-zinc-100 shadow-2xl',
          userPreviewMainIdentifier: 'text-zinc-100 font-semibold text-sm',
          userPreviewSecondaryIdentifier: 'text-zinc-400 text-xs',
          userButtonPopoverActionButton: 'text-zinc-200 hover:text-white hover:bg-zinc-800 transition',
          userButtonPopoverActionButtonText: 'text-zinc-200 font-medium',
          userButtonPopoverActionButtonIcon: 'text-zinc-400',
          card: 'bg-[#0d0f14] border border-zinc-800 text-zinc-100',
          headerTitle: 'text-zinc-100 font-bold',
          headerSubtitle: 'text-zinc-400 text-xs',
          formFieldLabel: 'text-zinc-300 text-xs',
          formFieldInput: 'bg-zinc-900 border-zinc-700 text-zinc-100 placeholder-zinc-500',
          formButtonPrimary: 'bg-white hover:bg-zinc-200 text-black font-semibold',
          footerActionText: 'text-zinc-400',
          footerActionLink: 'text-white hover:underline font-medium'
        }
      }}
    >
      <App />
    </ClerkProvider>
  </React.StrictMode>,
)
