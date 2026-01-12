import { ExternalLink, Flame, MessageCircle, Sparkles } from "lucide-react";

import type { Article } from "@/types";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface ArticleCardProps {
  article: Article;
}

export function ArticleCard({ article }: ArticleCardProps) {
  const summary =
    article.latest_summary?.summary_text || "Summary not generated yet.";
  const hostname = safeHostname(article.url);

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400" />
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-slate-500">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white font-semibold">
            {article.rank}
          </span>
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
            <Badge variant="muted">{hostname}</Badge>
            {article.author && (
              <Badge variant="muted">by {article.author}</Badge>
            )}
          </div>
        </div>
        <CardTitle className="leading-tight text-xl font-semibold text-slate-900">
          <a
            href={article.url}
            className="group inline-flex items-center gap-2 text-slate-900 no-underline"
            target="_blank"
            rel="noreferrer"
          >
            <span className="group-hover:text-indigo-600 transition-colors">
              {article.title}
            </span>
            <ExternalLink className="h-4 w-4 text-slate-400 transition-colors group-hover:text-indigo-500" />
          </a>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed text-slate-700 line-clamp-4">
          {summary}
        </p>
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600">
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-indigo-700">
            <Flame className="h-4 w-4" /> {article.points} points
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-amber-700">
            <MessageCircle className="h-4 w-4" /> {article.comments_count}{" "}
            comments
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-3 py-1 text-cyan-700">
            <Sparkles className="h-4 w-4" /> HN #{article.hn_id}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function safeHostname(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return "news.ycombinator.com";
  }
}
