import { Suspense } from "react";
import { SkeletonRows } from "@/components/ui";
import { MealsView } from "./meals-view";

export const metadata = { title: "Meal ideas" };

export default function Page() {
  return (
    <Suspense fallback={<SkeletonRows count={4} />}>
      <MealsView />
    </Suspense>
  );
}
