from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ArticleViewSet, RefreshView, SummaryViewSet

router = DefaultRouter()
router.register('articles', ArticleViewSet, basename='articles')
router.register('summaries', SummaryViewSet, basename='summaries')

urlpatterns = [
    path('refresh/', RefreshView.as_view(), name='refresh'),
    path('', include(router.urls)),
]
