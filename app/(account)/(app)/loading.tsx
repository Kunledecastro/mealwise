import { SkeletonRows } from "@/components/ui";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="skeleton h-9 w-2/3 rounded" />
      <SkeletonRows count={4} />
    </div>
  );
}
