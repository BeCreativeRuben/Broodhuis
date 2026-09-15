import { Skeleton } from "@/components/ui/skeleton";

export default function ShopLoading() {
  return (
    <div className="page-shell py-10">
      <Skeleton className="h-4 w-24 rounded-full" />
      <Skeleton className="mt-3 h-9 w-64 rounded-full" />
      <Skeleton className="mt-3 h-5 w-full max-w-md rounded-full" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-48 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
