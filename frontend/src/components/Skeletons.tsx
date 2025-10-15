import { Skeleton } from "./ui/skeleton";

export default function Skeletons() {
  return (
    <div className="space-y-6 mt-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-6 w-20" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-[100px] rounded-lg" />
        ))}
      </div>

      <div>
        <Skeleton className="h-6 w-40 mb-3" />
        <Skeleton className="h-[200px] w-full rounded-md" />
      </div>

      <div className="flex justify-end">
        <Skeleton className="h-10 w-40 rounded-md" />
      </div>
    </div>
  );
}
