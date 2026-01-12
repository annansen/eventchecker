"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const onboardingComplete = localStorage.getItem("onboardingComplete");
    if (!onboardingComplete) {
      router.replace("/onboarding");
    }
  }, [router]);

  return <>{children}</>;
}
