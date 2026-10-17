import { Suspense } from "react";
import { SkeletonRows } from "@/components/ui";
import { SettingsView } from "./settings-view";

export const metadata = { title: "Settings" };

export default function Page() {
  return (
    <Suspense fallback={<SkeletonRows count={4} />}>
      <SettingsView />
    </Suspense>
  );
}
