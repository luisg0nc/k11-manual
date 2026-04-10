import type { Metadata } from "next";
import { Barlow, JetBrains_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TopNav } from "@/components/layout/top-nav";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { PageNavProvider } from "@/components/layout/page-nav-context";
import { SearchDialogProvider } from "@/components/search/search-dialog";
import "./globals.css";

const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nissan Micra K11 — Service Manual",
  description:
    "Interactive service manual for the Nissan Micra (K11) — searchable diagnostic flowcharts, specs, and procedures.",
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${barlow.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>
          <PageNavProvider>
            <TooltipProvider>
              <SearchDialogProvider>
                <TopNav />
                <main className="flex-1 overflow-x-hidden">{children}</main>
              </SearchDialogProvider>
            </TooltipProvider>
          </PageNavProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
