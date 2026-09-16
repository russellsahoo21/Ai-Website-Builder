"use client";
import React from 'react';
import Navigation from '@/src/components/Navigation';
import FeedbackView from '@/src/views/FeedbackView';
import { useUser } from '@clerk/react';

export default function FeedbackPage() {
  const { user } = useUser();
  const userEmail = user?.primaryEmailAddress?.emailAddress || '';
  const userName = user?.fullName || user?.firstName || '';

  return (
    <div className="min-h-screen bg-[#07090e] text-zinc-100 flex flex-col">
      <Navigation
        currentRoute="feedback"
        navigateTo={(route) => {
          if (route === 'landing') window.location.href = '/';
          else window.location.href = `/${route}`;
        }}
      />
      <div className="flex-1 py-6 sm:py-10">
        <FeedbackView userEmail={userEmail} userName={userName} />
      </div>
    </div>
  );
}
