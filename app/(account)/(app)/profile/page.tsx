import { Suspense } from "react";
import { SkeletonRows } from "@/components/ui";
import { ProfileView } from "./profile-view";

export const metadata = { title: "Profile" };

export default function Page() {
  return (
    <Suspense fallback={<SkeletonRows count={4} />}>
      <ProfileView />
    </Suspense>
  );
}
