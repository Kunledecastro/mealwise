import { Suspense } from "react";
import { SkeletonRows } from "@/components/ui";
import { ProgressView } from "./progress-view";

export const metadata = { title: "Progress" };

export default function Page() {
  return (
    <Suspense fallback={<SkeletonRows count={4} />}>
      <ProgressView />
    </Suspense>
  );
}
