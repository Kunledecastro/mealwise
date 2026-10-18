import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";

export const metadata = { title: "Choose a new password" };

export default function Page() {
  return (
    <Suspense>
      <AuthForm mode="update-password" />
    </Suspense>
  );
}
