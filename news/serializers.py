from rest_framework import serializers

from .models import Article, Summary


class SummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Summary
        fields = [
            'id',
            'summary_text',
            'model_name',
            'generated_at',
        ]


class ArticleSerializer(serializers.ModelSerializer):
    latest_summary = serializers.SerializerMethodField()

    class Meta:
        model = Article
        fields = [
            'id',
            'hn_id',
            'title',
            'url',
            'author',
            'points',
            'comments_count',
            'rank',
            'content_text',
            'created_at',
            'scraped_at',
            'posted_at',
            'latest_summary',
        ]

    def get_latest_summary(self, obj: Article):
        summary = obj.summaries.order_by('-generated_at').first()
        return SummarySerializer(summary).data if summary else None
