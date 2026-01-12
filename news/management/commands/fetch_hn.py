from django.core.management.base import BaseCommand

from news.services.pipeline import refresh_top_articles_and_summaries


class Command(BaseCommand):
    help = "Fetch and summarize top Hacker News stories."

    def add_arguments(self, parser):
        parser.add_argument('--limit', type=int, default=30, help='Number of stories to fetch (default: 30).')

    def handle(self, *args, **options):
        limit = options['limit']
        result = refresh_top_articles_and_summaries(limit=limit)
        self.stdout.write(
            self.style.SUCCESS(
                f"Done. created={result.created} updated={result.updated} summarized={result.summarized}"
            )
        )
