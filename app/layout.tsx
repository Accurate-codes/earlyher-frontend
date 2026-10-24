import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { DemoStatePanel } from "@/components/dev/demo-state-panel";
import { AppHeader } from "@/components/layout/app-header";
import { ServiceWorkerRegistrar } from "@/components/offline/service-worker-registrar";
import { SessionProvider } from "@/components/session/session-provider";
import { ui } from "@/content/en/ui";
import "./globals.css";

// Plus Jakarta Sans (SIL Open Font License), self-hosted so builds and kiosks never
// depend on reaching Google Fonts. Variable font, weights 200–800. The subset covers
// Latin plus the Yoruba letters ẹ, ọ, ṣ, ń and the combining tone marks (U+0300, U+0301,
// U+0323), with the mark-positioning features kept so tones sit correctly over ẹ and ọ.
// The font has no precomposed ǹ or ḿ, so Yoruba text writes them as n or m plus a mark
// (see lib/i18n/yoruba.ts).
const jakarta = localFont({
  src: "./fonts/PlusJakartaSans-latin-yoruba-var.woff2",
  variable: "--font-jakarta",
  weight: "200 800",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "EarlyHer", template: "%s — EarlyHer" },
  description: "Breast-health questions and help finding professional care.",
  applicationName: "EarlyHer",
  // Health guidance for a kiosk; keep it out of search indexes while content is in draft.
  robots: { index: false, follow: false },
};

// Zoom is deliberately left enabled.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fffaf8",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${jakarta.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-5 focus:py-3 focus:text-white"
        >
          {ui.common.skipToContent}
        </a>
        <SessionProvider>
          <AppHeader />
          <main id="main" className="page-glow flex flex-1 flex-col">
            {children}
          </main>
        </SessionProvider>
        <DemoStatePanel />
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
