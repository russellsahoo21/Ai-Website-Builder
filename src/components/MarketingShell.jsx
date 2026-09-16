"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Navigation from "./Navigation";
import Footer from "./Footer";

export default function MarketingShell({ currentRoute = "landing", children }) {
  const router = useRouter();

  const handleNavigate = (route, params = {}) => {
    let target = route === "landing" ? "/" : `/${route}`;
    if (params.plan) {
      target += `?plan=${params.plan}`;
      if (params.cycle) target += `&cycle=${params.cycle}`;
    }
    router.push(target);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080a0f] text-zinc-100 font-sans">
      <Navigation
        currentRoute={currentRoute}
        navigateTo={handleNavigate}
      />
      <main className="flex-1 flex flex-col">
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, { navigateTo: handleNavigate });
          }
          return child;
        })}
      </main>
      <Footer navigateTo={handleNavigate} />
    </div>
  );
}
