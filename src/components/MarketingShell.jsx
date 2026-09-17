"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Navigation from "./Navigation";
import Footer from "./Footer";

export default function MarketingShell({ currentRoute = "landing", children }) {
  const router = useRouter();

  const handleNavigate = (route, params = {}) => {
    const cleanRoute = (route || "").replace(/^\//, "");
    let target = cleanRoute === "landing" || cleanRoute === "" ? "/" : `/${cleanRoute}`;
    if (params && typeof params === "object") {
      const searchParams = new URLSearchParams();
      if (params.plan) searchParams.set("plan", params.plan);
      if (params.cycle) searchParams.set("cycle", params.cycle);
      const queryString = searchParams.toString();
      if (queryString) target += `?${queryString}`;
    }
    if (router && typeof router.push === "function") {
      try {
        router.push(target);
      } catch (e) {
        if (typeof window !== "undefined") {
          window.location.href = target;
        }
      }
    } else if (typeof window !== "undefined") {
      window.location.href = target;
    }
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
