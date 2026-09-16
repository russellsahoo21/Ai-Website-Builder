"use client";

import React, { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import CheckoutPage from "@/src/views/CheckoutPage";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const plan = searchParams.get("plan") || "pro";
  const cycle = searchParams.get("cycle") || "annual";

  const handleNavigate = (route, params = {}) => {
    let target = route === "landing" ? "/" : `/${route}`;
    if (params.plan) {
      target += `?plan=${params.plan}`;
      if (params.cycle) target += `&cycle=${params.cycle}`;
    }
    router.push(target);
  };

  return (
    <CheckoutPage
      initialPlanId={plan}
      initialBillingCycle={cycle}
      returnRoute="pricing"
      navigateTo={handleNavigate}
    />
  );
}

export default function CheckoutRoute() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#090a0f] flex items-center justify-center text-zinc-400 font-mono text-xs">
          Loading Checkout...
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}

