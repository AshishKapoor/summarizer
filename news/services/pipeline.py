import logging
from dataclasses import dataclass
from typing import List

from django.db import transaction
from django.utils import timezone

from ..models import Article, Summary
from .scraper import Story, fetch_top_stories
from .summarizer import LocalSummarizer

logger = logging.getLogger(__name__)


@dataclass
class RefreshResult:
    created: int
    updated: int
    summarized: int


@transaction.atomic
def refresh_top_articles_and_summaries(limit: int = 30) -> RefreshResult:
    try:
        stories: List[Story] = fetch_top_stories(limit=limit)
    except Exception as exc:  # noqa: BLE001
        logger.error("Scrape failed", extra={"error": str(exc)})
        return RefreshResult(created=0, updated=0, summarized=0)
    summarizer = LocalSummarizer()

    created = 0
    updated = 0
    summarized = 0

    for story in stories:
        article, created_flag = Article.objects.update_or_create(
            hn_id=story.hn_id,
            defaults={
                'title': story.title,
                'url': story.url,
                'author': story.author,
                'points': story.points,
                'comments_count': story.comments_count,
                'rank': story.rank,
                'content_text': story.content_text,
                'scraped_at': timezone.now(),
            },
        )

        created += 1 if created_flag else 0
        updated += 0 if created_flag else 1

        # Generate a summary when one does not exist for this scrape cycle.
        latest = article.summaries.order_by('-generated_at').first()
        if latest:
            continue

        summary_result = summarizer.summarize(article.content_text or article.title)
        Summary.objects.create(
            article=article,
            summary_text=summary_result.text,
            model_name=summary_result.model_name,
        )
        summarized += 1

    logger.info(
        "Refreshed top stories",
        extra={"articles_created": created, "articles_updated": updated, "summaries_generated": summarized},
    )
    return RefreshResult(created=created, updated=updated, summarized=summarized)
