import type { Metadata, Viewport } from "next";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/figtree";
import "./globals.css";
import { PrototypeProvider } from "@/lib/prototype-store";

export const metadata: Metadata = {
  title: { default: "Mealwise", template: "%s · Mealwise" },
  description: "Decide what to eat next, with your weight goal in mind.",
  applicationName: "Mealwise",
  appleWebApp: { capable: true, title: "Mealwise", statusBarStyle: "default" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#1e5b3c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-NG" className="antialiased">
      <body>
        <PrototypeProvider>{children}</PrototypeProvider>
      </body>
    </html>
  );
}
