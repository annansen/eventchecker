import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./leaflet.css";
import "maplibre-gl/dist/maplibre-gl.css";
import { OnboardingGuard } from "@/components/onboarding-guard";
import { GeolocationProvider } from "@/components/geolocation-provider";
import { ErrorBoundary } from "@/components/error-boundary";

// Fix for Leaflet SSR issues
if (typeof window !== "undefined") {
  delete (window as any).Leaflet;
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Saker att göra i Linköping",
  description: "Upptäck evenemang i Linköping – nära dig och i helgen.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-50 text-black`}
      >
        <ErrorBoundary>
          <OnboardingGuard>
            <GeolocationProvider>
              <div className="mx-auto min-h-dvh w-full max-w-md px-4 pb-20 pt-4">
                {children}
              </div>
              <nav className="fixed inset-x-0 bottom-0 border-t border-black/10 bg-white">
                <div className="mx-auto flex w-full max-w-md items-center justify-around px-4 py-3 text-sm font-medium">
                  <a className="text-black" href="/">
                    Nära mig
                  </a>
                  <a className="text-black/70" href="/saved">
                    Sparade
                  </a>
                  <a className="text-black/70" href="/tips">
                    Tips
                  </a>
                </div>
              </nav>
            </GeolocationProvider>
          </OnboardingGuard>
        </ErrorBoundary>
      </body>
    </html>
  );
}
