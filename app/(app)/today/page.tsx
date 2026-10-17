import { Suspense } from "react";
import { SkeletonRows } from "@/components/ui";
import { TodayView } from "./today-view";

export const metadata = { title: "Today" };

export default function Page() {
  return (
    <Suspense fallback={<SkeletonRows count={4} />}>
      <TodayView />
    </Suspense>
  );
}
