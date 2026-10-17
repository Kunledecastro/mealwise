import { Suspense } from "react";
import { SkeletonRows } from "@/components/ui";
import { SavedView } from "./saved-view";

export const metadata = { title: "Saved meals" };

export default function Page() {
  return (
    <Suspense fallback={<SkeletonRows count={4} />}>
      <SavedView />
    </Suspense>
  );
}
