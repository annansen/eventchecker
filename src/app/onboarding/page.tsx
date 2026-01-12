import { OnboardingFlow } from "@/components/onboarding-flow";

export default function OnboardingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <header className="text-center">
          <h1 className="text-2xl font-semibold text-black">Välkommen!</h1>
          <p className="mt-2 text-sm text-black/60">
            Anpassa upplevelsen – välj plats och intressen
          </p>
        </header>
        <OnboardingFlow />
      </div>
    </main>
  );
}
