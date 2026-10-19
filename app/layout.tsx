import type { Metadata, Viewport } from "next";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/figtree";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Mealwise", template: "%s · Mealwise" },
  description: "Decide what to eat next, with your weight goal in mind.",
  applicationName: "Mealwise",
  appleWebApp: { capable: true, title: "Mealwise", statusBarStyle: "default" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0d1411",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-NG" className="antialiased">
      <body>
        {children}
      </body>
    </html>
  );
}
