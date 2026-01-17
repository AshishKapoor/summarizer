# YNews – Hacker News summaries

Daily scrape of the top 30 Hacker News stories, summarized locally and served via Django REST + a Vite/React UI.

<img width="1765" height="1220" alt="Screenshot 2026-01-17 at 5 27 13 PM" src="https://github.com/user-attachments/assets/4a456741-d793-4efb-87f9-292264866062" />

## Stack

- Backend: Django 6, Django REST Framework, drf-spectacular, SQLite, requests + BeautifulSoup scraper
- Frontend: Vite + React + TypeScript, pnpm, Tailwind + shadcn-inspired components
- Summaries: Local GPU (MPS/CUDA) via `transformers`/`torch` with BART-large-CNN model

## Backend quickstart

1. Create/activate the virtualenv (one is already configured at `.venv/`).
2. Install deps: `python -m pip install -r requirements.txt`
3. Apply migrations: `python manage.py migrate`
4. Run the API: `python manage.py runserver`

Endpoints (once running):

- `GET /api/articles/` – paginated list (latest summary included)
- `GET /api/summaries/`
- `POST /api/refresh/` – scrape + summarize now
- `GET /api/schema/` and `GET /api/docs/` – OpenAPI + Swagger UI

Manual fetch/summarize: `python manage.py fetch_hn --limit 30`

The summarizer uses BART-large-CNN with Apple MPS (Metal Performance Shaders) for GPU acceleration on Mac, or CUDA on other systems. Falls back to CPU if neither is available.

## Frontend quickstart

```
cd frontend
pnpm install
pnpm dev
```

- Default API base: `http://localhost:8000`. Override with `VITE_API_BASE`.
- Production build: `pnpm build`

## Scheduling (optional)

Run daily via cron (example):

```
0 7 * * * cd /Users/anton/Developer/ynews && .venv/bin/python manage.py fetch_hn --limit 30
```

## Project layout

- `backend/` – Django project settings/urls
- `news/` – scraping, summarization services, API viewsets, management command
- `frontend/` – Vite React UI consuming the OpenAPI-powered endpoints
