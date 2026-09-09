import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ThemeProvider } from "@/components/theme-provider";
import { getSiteConfig } from "@/lib/config/resolve";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const { seoTitle, seoDescription } = await getSiteConfig();
  return { title: seoTitle, description: seoDescription };
}

/**
 * Reading the store here makes every route dynamic, including /picos and
 * /timelapse which used to prerender. That is the cost of a header the CEF can
 * edit without a redeploy — and the dashboard routes were already dynamic.
 */
export default async function RootLayout({ children }: LayoutProps<"/">) {
  const config = await getSiteConfig();

  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <DashboardHeader
            siteName={config.siteName}
            tagline={config.tagline}
            locationLabel={config.locationLabel}
            eyebrow={config.headerEyebrow}
            logoUrl={config.logoUrl}
            navItems={config.navItems}
          />
          <main className="flex-1">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
