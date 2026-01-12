import logging
from dataclasses import dataclass
from typing import List
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

HN_URL = "https://news.ycombinator.com/"
USER_AGENT = "ynews-scraper/0.1 (+https://news.ycombinator.com/)"

logger = logging.getLogger(__name__)


@dataclass
class Story:
    hn_id: int
    title: str
    url: str
    author: str
    points: int
    comments_count: int
    rank: int
    content_text: str = ""


def _fetch_article_body(url: str, max_chars: int = 4000) -> str:
    try:
        response = requests.get(url, timeout=10, headers={"User-Agent": USER_AGENT})
        response.raise_for_status()
    except Exception as exc:  # noqa: BLE001
        logger.warning("Could not fetch article body", extra={"url": url, "error": str(exc)})
        return ""

    soup = BeautifulSoup(response.text, "html.parser")
    paragraphs = [p.get_text(strip=True) for p in soup.find_all("p")]
    text = "\n".join(paragraphs)
    return text[:max_chars]


def fetch_top_stories(limit: int = 30, include_body: bool = True) -> List[Story]:
    response = requests.get(HN_URL, timeout=10, headers={"User-Agent": USER_AGENT})
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")

    stories: List[Story] = []
    for row in soup.select("tr.athing")[:limit]:
        title_el = row.select_one("span.titleline a")
        rank_el = row.select_one("span.rank")
        story_id = row.get("id")
        subtext_row = row.find_next_sibling("tr")
        subtext = subtext_row.select_one("td.subtext") if subtext_row else None
        author_el = subtext.select_one("a.hnuser") if subtext else None
        score_el = subtext.select_one("span.score") if subtext else None
        comments_el = subtext.find_all("a")[-1] if subtext else None

        if not title_el or not story_id:
            continue

        url = title_el.get("href")
        if url and url.startswith("item?id="):
            url = urljoin(HN_URL, url)

        try:
            rank = int(rank_el.get_text(strip=True).replace(".", "")) if rank_el else 0
        except ValueError:
            rank = 0

        try:
            hn_id = int(story_id)
        except ValueError:
            continue

        points = 0
        if score_el:
            try:
                points = int(score_el.get_text(strip=True).split()[0])
            except ValueError:
                points = 0

        comments_count = 0
        if comments_el:
            text = comments_el.get_text(strip=True)
            if "comment" in text:
                try:
                    comments_count = int(text.split()[0])
                except ValueError:
                    comments_count = 0

        content_text = _fetch_article_body(url) if (include_body and url) else ""

        stories.append(
            Story(
                hn_id=hn_id,
                title=title_el.get_text(strip=True),
                url=url or "",
                author=author_el.get_text(strip=True) if author_el else "",
                points=points,
                comments_count=comments_count,
                rank=rank,
                content_text=content_text,
            )
        )

    logger.info("Fetched %s stories", len(stories), extra={"limit": limit})
    return stories
