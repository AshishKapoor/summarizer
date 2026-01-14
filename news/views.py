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
    queryset = Article.objects.prefetch_related("summaries").order_by(
        "-scraped_at", "rank"
    )[:30]
    serializer_class = ArticleSerializer


class SummaryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Summary.objects.select_related("article").order_by("-generated_at")
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
