import type { ReactNode } from "react";
import { AuthProvider } from "@/lib/auth";
import { PrototypeProvider } from "@/lib/prototype-store";

/**
 * Account screens (sign-in, setup and the app itself) share one session and one copy of the user's
 * data. The public landing page sits outside this group, so it never loads the account code.
 */
export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <PrototypeProvider>{children}</PrototypeProvider>
    </AuthProvider>
  );
}
