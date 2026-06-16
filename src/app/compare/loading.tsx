import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
        <Card className="rounded-[2rem]">
          <CardHeader className="space-y-3">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-10 w-72 max-w-full" />
            <Skeleton className="h-5 w-full max-w-2xl" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-11 w-full rounded-xl" />
          </CardContent>
        </Card>

        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="space-y-3">
              <Skeleton className="h-6 w-44" />
              <Skeleton className="h-4 w-full max-w-lg" />
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((__, metricIndex) => (
                  <div key={metricIndex} className="rounded-2xl border border-border/70 bg-background/40 p-4">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="mt-2 h-8 w-20" />
                    <Skeleton className="mt-2 h-3 w-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
