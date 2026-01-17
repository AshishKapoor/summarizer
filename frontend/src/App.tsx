import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  ArrowUpRight,
  Loader2,
  Radio,
  RefreshCw,
} from "lucide-react";

import { ArticlesTable } from "@/components/articles-table";
import { Button } from "@/components/ui/button";
import { API_BASE, fetchArticles, triggerRefresh } from "@/lib/api";

function App() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // Fetch articles with React Query - auto-refetch every 1 hour (3600000ms)
  const { data, isLoading } = useQuery({
    queryKey: ["articles"],
    queryFn: fetchArticles,
    refetchInterval: 3600000, // 1 hour in milliseconds
    refetchIntervalInBackground: true,
    staleTime: 300000, // Consider data stale after 5 minutes
  });

  const articles = useMemo(() => data?.results || [], [data?.results]);

  // Mutation for manual refresh
  const refreshMutation = useMutation({
    mutationFn: triggerRefresh,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      setError(null);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Refresh failed");
    },
  });

  const handleRefresh = () => {
    setError(null);
    refreshMutation.mutate();
  };

  const stats = useMemo(() => {
    const totalPoints = articles.reduce((sum, a) => sum + a.points, 0);
    const totalComments = articles.reduce(
      (sum, a) => sum + a.comments_count,
      0,
    );
    return { totalPoints, totalComments };
  }, [articles]);

  const hero = (
    <div className="hero-gradient relative overflow-hidden rounded-[28px] p-8 shadow-soft text-white">
      <div className="absolute inset-0]" />
      <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3 md:max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em]">
            <Radio className="h-4 w-4" /> Daily Hacker News distillations
          </div>
          <h1 className="text-3xl font-semibold leading-tight md:text-4xl">
            All the signal. None of the noise.
          </h1>
          <p className="text-sm text-white/80 md:text-base">
            We scrape the top 30 Hacker News stories each day, summarize them
            locally on your Mac GPU, and surface the essentials in one sleek
            feed.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshMutation.isPending}
            >
              {refreshMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {refreshMutation.isPending ? "Refreshing…" : "Refresh now"}
            </Button>
            <Button variant="outline" asChild>
              <a
                href={`${API_BASE}/api/docs/`}
                target="_blank"
                rel="noreferrer"
              >
                Open API Explorer
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
        <div className="grid w-full max-w-sm grid-cols-2 gap-3 text-sm font-semibold text-slate-900 md:max-w-md">
          <div className="glass-card rounded-2xl p-4 text-center text-slate-900">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
              Stories tracked
            </p>
            <div className="mt-2 text-3xl font-semibold text-slate-900">30</div>
            <p className="text-[12px] text-slate-500">Top of Hacker News</p>
          </div>
          <div className="glass-card rounded-2xl p-4 text-center text-slate-900">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
              Total points
            </p>
            <div className="mt-2 text-3xl font-semibold text-slate-900">
              {stats.totalPoints}
            </div>
            <p className="text-[12px] text-slate-500">
              Across today&apos;s picks
            </p>
          </div>
          <div className="glass-card col-span-2 rounded-2xl p-4 text-center text-slate-900">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
              Comments
            </p>
            <div className="mt-2 text-3xl font-semibold text-slate-900">
              {stats.totalComments}
            </div>
            <p className="text-[12px] text-slate-500">
              Conversation volume right now
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const listSection = (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Today&apos;s batch
          </p>
          <h2 className="text-2xl font-semibold text-slate-900">
            Top 30 from Hacker News
          </h2>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-xs font-semibold text-slate-600 shadow-soft">
          <Activity className="h-4 w-4 text-indigo-500" /> Live summaries
        </div>
      </div>
      {error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}
      {isLoading ? (
        <div className="space-y-4">
          <div className="h-64 rounded-2xl bg-slate-100 animate-pulse" />
          <div className="h-16 rounded-2xl bg-slate-100 animate-pulse" />
        </div>
      ) : (
        <ArticlesTable articles={articles} />
      )}
    </section>
  );

  return (
    <div className="text-slate-900">
      <div className="mx-auto space-y-10 px-4 py-10 md:py-16">
        {hero}
        {listSection}
      </div>
    </div>
  );
}

export default App;
