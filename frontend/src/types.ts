export interface Summary {
  id: number;
  summary_text: string;
  model_name: string;
  generated_at: string;
}

export interface Article {
  id: number;
  hn_id: number;
  title: string;
  url: string;
  author: string;
  points: number;
  comments_count: number;
  rank: number;
  content_text: string;
  scraped_at: string;
  posted_at: string | null;
  latest_summary?: Summary | null;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
