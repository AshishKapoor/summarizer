from datetime import datetime, timedelta

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase

from .models import Article, Summary


class ArticleModelTest(TestCase):
    def setUp(self):
        self.article = Article.objects.create(
            hn_id=12345,
            title="Test Article",
            url="https://example.com",
            author="testuser",
            points=100,
            comments_count=50,
            rank=1,
        )

    def test_article_creation(self):
        """Test that an article is created correctly."""
        self.assertEqual(self.article.hn_id, 12345)
        self.assertEqual(self.article.title, "Test Article")
        self.assertEqual(self.article.rank, 1)

    def test_article_string_representation(self):
        """Test the string representation of an article."""
        self.assertEqual(str(self.article), "1. Test Article")


class SummaryModelTest(TestCase):
    def setUp(self):
        self.article = Article.objects.create(
            hn_id=12345,
            title="Test Article",
            url="https://example.com",
        )

    def test_summary_creation(self):
        """Test that a summary is created correctly."""
        summary = Summary.objects.create(
            article=self.article,
            summary_text="This is a test summary.",
            model_name="test-model",
        )
        self.assertEqual(summary.article, self.article)
        self.assertEqual(summary.summary_text, "This is a test summary.")
        self.assertEqual(summary.model_name, "test-model")


class ArticleOrderingTest(APITestCase):
    def setUp(self):
        """Create test articles from the same scrape batch."""
        now = timezone.now()
        
        # Create articles from the same scrape batch (within seconds of each other)
        self.article1 = Article.objects.create(
            hn_id=1,
            title="Article Rank 1",
            rank=1,
            points=100,
        )
        Article.objects.filter(pk=self.article1.pk).update(
            scraped_at=now
        )
        
        self.article2 = Article.objects.create(
            hn_id=2,
            title="Article Rank 2",
            rank=2,
            points=90,
        )
        Article.objects.filter(pk=self.article2.pk).update(
            scraped_at=now + timedelta(seconds=1)
        )
        
        self.article3 = Article.objects.create(
            hn_id=3,
            title="Article Rank 3",
            rank=3,
            points=80,
        )
        Article.objects.filter(pk=self.article3.pk).update(
            scraped_at=now + timedelta(seconds=2)
        )
        
        # Create an old article from a previous scrape (should not appear)
        self.old_article = Article.objects.create(
            hn_id=999,
            title="Old Article",
            rank=1,
            points=200,
        )
        Article.objects.filter(pk=self.old_article.pk).update(
            scraped_at=now - timedelta(hours=2)
        )
        
        # Refresh from database to get updated scraped_at values
        self.article1.refresh_from_db()
        self.article2.refresh_from_db()
        self.article3.refresh_from_db()
        self.old_article.refresh_from_db()

    def test_articles_ordered_by_rank_ascending(self):
        """Test that only articles from latest batch are shown, ordered by rank."""
        url = '/api/articles/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        
        # Handle paginated response
        if isinstance(response.data, dict) and 'results' in response.data:
            articles = response.data['results']
        else:
            articles = response.data
        
        # Should only get articles from the latest batch (not the old one)
        self.assertEqual(len(articles), 3, "Should only return articles from latest batch")
        
        # Verify the old article is not included
        article_ids = [a['hn_id'] for a in articles]
        self.assertNotIn(999, article_ids, "Old article should not be included")
        
        # Verify order: rank 1, 2, 3
        self.assertEqual(articles[0]['hn_id'], 1, "First article should be rank 1")
        self.assertEqual(articles[1]['hn_id'], 2, "Second article should be rank 2")
        self.assertEqual(articles[2]['hn_id'], 3, "Third article should be rank 3")
        
        # Verify ranks are in ascending order
        ranks = [article['rank'] for article in articles]
        for i in range(len(ranks) - 1):
            self.assertLessEqual(
                ranks[i],
                ranks[i + 1],
                f"Article {i} should have rank <= article {i+1}"
            )


class SummaryOrderingTest(APITestCase):
    def setUp(self):
        """Create test summaries with different generated_at times."""
        self.article = Article.objects.create(
            hn_id=1,
            title="Test Article",
            rank=1,
        )
        
        now = timezone.now()
        
        # Create summaries with different generation times
        self.summary1 = Summary.objects.create(
            article=self.article,
            summary_text="First summary (oldest)",
            model_name="model-1",
        )
        Summary.objects.filter(pk=self.summary1.pk).update(
            generated_at=now - timedelta(hours=3)
        )
        
        self.summary2 = Summary.objects.create(
            article=self.article,
            summary_text="Second summary (middle)",
            model_name="model-2",
        )
        Summary.objects.filter(pk=self.summary2.pk).update(
            generated_at=now - timedelta(hours=2)
        )
        
        self.summary3 = Summary.objects.create(
            article=self.article,
            summary_text="Third summary (newest)",
            model_name="model-3",
        )
        Summary.objects.filter(pk=self.summary3.pk).update(
            generated_at=now - timedelta(hours=1)
        )
        
        # Refresh from database
        self.summary1.refresh_from_db()
        self.summary2.refresh_from_db()
        self.summary3.refresh_from_db()

    def test_summaries_ordered_by_generated_at_ascending(self):
        """Test that summaries are ordered by generated_at in ascending order."""
        url = '/api/summaries/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        
        # Handle paginated response
        if isinstance(response.data, dict) and 'results' in response.data:
            summaries = response.data['results']
        else:
            summaries = list(response.data)
        
        # Filter to only this article's summaries
        article_summaries = [s for s in summaries if s['model_name'] in ['model-1', 'model-2', 'model-3']]
        
        # Verify we have all 3 summaries
        self.assertEqual(len(article_summaries), 3)
        
        # Verify order: oldest to newest
        self.assertEqual(article_summaries[0]['model_name'], 'model-1', "First summary should be the oldest")
        self.assertEqual(article_summaries[1]['model_name'], 'model-2', "Second summary should be middle")
        self.assertEqual(article_summaries[2]['model_name'], 'model-3', "Third summary should be the newest")
        
        # Verify generated_at timestamps are in ascending order
        generated_times = [
            datetime.fromisoformat(summary['generated_at'].replace('Z', '+00:00'))
            for summary in article_summaries
        ]
        for i in range(len(generated_times) - 1):
            self.assertLessEqual(
                generated_times[i],
                generated_times[i + 1],
                f"Summary {i} should be generated before summary {i+1}"
            )

    def test_summary_model_default_ordering(self):
        """Test that Summary model's Meta.ordering is set to ascending."""
        summaries = list(Summary.objects.all())
        
        # Verify order: oldest to newest
        self.assertEqual(summaries[0].model_name, 'model-1')
        self.assertEqual(summaries[1].model_name, 'model-2')
        self.assertEqual(summaries[2].model_name, 'model-3')
        
        # Verify timestamps are in ascending order
        for i in range(len(summaries) - 1):
            self.assertLessEqual(
                summaries[i].generated_at,
                summaries[i + 1].generated_at,
                f"Summary {i} should be generated before summary {i+1}"
            )


class ArticleSerializerTest(APITestCase):
    def setUp(self):
        """Create article with multiple summaries."""
        self.article = Article.objects.create(
            hn_id=1,
            title="Test Article",
            rank=1,
        )
        
        now = timezone.now()
        
        # Create multiple summaries
        self.old_summary = Summary.objects.create(
            article=self.article,
            summary_text="Old summary",
            model_name="old-model",
        )
        Summary.objects.filter(pk=self.old_summary.pk).update(
            generated_at=now - timedelta(hours=2)
        )
        
        self.new_summary = Summary.objects.create(
            article=self.article,
            summary_text="New summary",
            model_name="new-model",
        )
        Summary.objects.filter(pk=self.new_summary.pk).update(
            generated_at=now - timedelta(hours=1)
        )
        
        self.old_summary.refresh_from_db()
        self.new_summary.refresh_from_db()

    def test_latest_summary_returns_earliest(self):
        """Test that latest_summary returns the earliest (oldest) summary."""
        # Refresh to get the actual ID from database
        self.article.refresh_from_db()
        
        # Check if article exists
        from .models import Article
        all_articles = Article.objects.all()
        self.assertGreater(all_articles.count(), 0, "No articles found in database")
        
        # Try to get the article through the API
        list_response = self.client.get('/api/articles/')
        self.assertEqual(list_response.status_code, 200)
        
        # Handle pagination
        if isinstance(list_response.data, dict) and 'results' in list_response.data:
            articles = list_response.data['results']
        else:
            articles = list_response.data
        
        # Find our test article
        test_article = next((a for a in articles if a['hn_id'] == 1), None)
        self.assertIsNotNone(test_article, "Test article not found in API response")
        
        # Now get the detail view
        url = f'/api/articles/{test_article["id"]}/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        
        # The "latest" summary should be the oldest one (earliest generated_at)
        latest_summary = response.data['latest_summary']
        self.assertIsNotNone(latest_summary)
        self.assertEqual(latest_summary['model_name'], 'old-model')
        self.assertEqual(latest_summary['summary_text'], 'Old summary')

