import { Suspense } from "react";
import { SkeletonRows } from "@/components/ui";
import { SearchView } from "./search-view";

export const metadata = { title: "Search" };

export default function Page() {
  return (
    <Suspense fallback={<SkeletonRows count={4} />}>
      <SearchView />
    </Suspense>
  );
}
