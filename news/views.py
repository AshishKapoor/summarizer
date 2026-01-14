from django.db.models import Max
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from drf_spectacular.utils import extend_schema
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Article, Summary
from .serializers import ArticleSerializer, SummarySerializer
from .services.pipeline import refresh_top_articles_and_summaries


class ArticleViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ArticleSerializer
    
    def get_queryset(self):
        """Return only the 30 articles from the most recent scrape batch."""
        # Get the most recent scrape time
        latest_scrape = Article.objects.aggregate(Max('scraped_at'))['scraped_at__max']
        
        if latest_scrape is None:
            return Article.objects.none()
        
        # Get all articles scraped within 5 minutes of the latest scrape
        # (they're part of the same batch)
        from datetime import timedelta
        cutoff_time = latest_scrape - timedelta(minutes=5)
        
        # Return only articles from the latest scrape batch, ordered by rank
        queryset = Article.objects.prefetch_related("summaries").filter(
            scraped_at__gte=cutoff_time
        ).order_by("rank")
        
        # For list view, limit to 30
        if self.action == 'list':
            return queryset[:30]
        
        # For detail view, return all articles (not filtered by scrape time)
        return Article.objects.prefetch_related("summaries").order_by("rank")


class SummaryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Summary.objects.select_related("article").order_by("generated_at")
    serializer_class = SummarySerializer


@method_decorator(csrf_exempt, name="dispatch")
class RefreshView(APIView):
    """Trigger a scrape + summarize cycle on demand."""

    @extend_schema(responses={200: dict})
    def post(self, request):
        results = refresh_top_articles_and_summaries()
        return Response(
            {
                "created": results.created,
                "updated": results.updated,
                "summarized": results.summarized,
            }
        )


# Create your views here.
