import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
        <Card className="rounded-[2rem]">
          <CardHeader className="space-y-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-10 w-64 max-w-full" />
            <Skeleton className="h-5 w-full max-w-2xl" />
          </CardHeader>
        </Card>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardHeader className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-28" />
                  </div>
                  <Skeleton className="h-11 w-11 rounded-2xl" />
                </div>
                <Skeleton className="h-4 w-full" />
              </CardHeader>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <Card key={index}>
              <CardHeader className="space-y-3">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-full max-w-lg" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[280px] w-full rounded-2xl sm:h-[320px]" />
              </CardContent>
            </Card>
          ))}
          <Card className="xl:col-span-2">
            <CardHeader className="space-y-3">
              <Skeleton className="h-6 w-44" />
              <Skeleton className="h-4 w-full max-w-xl" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[280px] w-full rounded-2xl sm:h-[320px]" />
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Card>
            <CardHeader className="space-y-3">
              <Skeleton className="h-6 w-36" />
              <Skeleton className="h-4 w-full max-w-md" />
            </CardHeader>
            <CardContent className="flex items-center gap-5">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="space-y-3">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-4 w-64 max-w-full" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-3">
              <Skeleton className="h-6 w-52" />
              <Skeleton className="h-4 w-full max-w-lg" />
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="space-y-3 rounded-2xl border border-border/70 bg-background/40 p-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-24 w-full rounded-2xl" />
                </div>
              ))}
              <div className="space-y-3 rounded-2xl border border-border/70 bg-background/40 p-4 md:col-span-2">
                <Skeleton className="h-4 w-32" />
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Skeleton key={index} className="h-8 w-24 rounded-full" />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index}>
              <CardHeader className="space-y-3">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-full max-w-lg" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-3 rounded-2xl border border-border/70 bg-background/40 p-4">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-5 w-8" />
                  </div>
                  {Array.from({ length: 3 }).map((__, itemIndex) => (
                    <div key={itemIndex} className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/70 px-3 py-2">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                      <Skeleton className="h-5 w-10" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <Card>
          <CardHeader className="space-y-3">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-full max-w-xl" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="rounded-2xl border border-border/70 bg-background/40 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-52" />
                  </div>
                  <div className="space-y-2 text-right">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="mt-4 h-2 w-full rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>

        <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <Card>
            <CardHeader className="space-y-3">
              <Skeleton className="h-6 w-36" />
              <Skeleton className="h-4 w-full max-w-lg" />
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="rounded-2xl border border-border/70 bg-background/40 p-4">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="mt-3 h-5 w-32" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-3">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-full max-w-sm" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-20 w-full rounded-2xl" />
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
