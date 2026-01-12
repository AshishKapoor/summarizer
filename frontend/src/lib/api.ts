import type { Article, Paginated } from "@/types";

export const API_BASE = (
  import.meta.env.VITE_API_BASE || "http://localhost:8000"
).replace(/\/$/, "");

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || response.statusText);
  }
  return response.json() as Promise<T>;
}

export async function fetchArticles(): Promise<Paginated<Article>> {
  const res = await fetch(`${API_BASE}/api/articles/`);
  return handleResponse<Paginated<Article>>(res);
}

export async function triggerRefresh(): Promise<void> {
  const res = await fetch(`${API_BASE}/api/refresh/`, { method: "POST" });
  await handleResponse(res);
}
