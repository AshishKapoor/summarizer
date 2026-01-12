import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Loader2,
  Radio,
  RefreshCw,
} from "lucide-react";

import { ArticleCard } from "@/components/article-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { API_BASE, fetchArticles, triggerRefresh } from "@/lib/api";
import type { Article } from "@/types";

function App() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadArticles = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchArticles();
      setArticles(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load articles");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      await triggerRefresh();
      await loadArticles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Refresh failed");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, []);

  const stats = useMemo(() => {
    const totalPoints = articles.reduce((sum, a) => sum + a.points, 0);
    const totalComments = articles.reduce(
      (sum, a) => sum + a.comments_count,
      0
    );
    return { totalPoints, totalComments };
  }, [articles]);

  const hero = (
    <div className="hero-gradient relative overflow-hidden rounded-[28px] p-8 shadow-soft text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.25),transparent_30%)]" />
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
            <Button onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {refreshing ? "Refreshing…" : "Refresh now"}
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
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Skeleton key={idx} className="h-48" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </section>
  );

  return (
    <div className="min-h-screen bg-transparent text-slate-900">
      <div className="mx-auto max-w-6xl space-y-10 px-4 py-10 md:py-14">
        {hero}
        {listSection}
      </div>
    </div>
  );
}

export default App;
