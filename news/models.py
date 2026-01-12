from django.db import models


class Article(models.Model):
	hn_id = models.PositiveIntegerField(unique=True)
	title = models.CharField(max_length=500)
	url = models.URLField(max_length=1000, blank=True)
	author = models.CharField(max_length=150, blank=True)
	points = models.PositiveIntegerField(default=0)
	comments_count = models.PositiveIntegerField(default=0)
	rank = models.PositiveIntegerField(default=0)
	content_text = models.TextField(blank=True)
	created_at = models.DateTimeField(auto_now_add=True)
	scraped_at = models.DateTimeField(auto_now=True)
	posted_at = models.DateTimeField(null=True, blank=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		ordering = ['rank', '-points']

	def __str__(self) -> str:  # pragma: no cover - convenience
		return f"{self.rank}. {self.title}" if self.rank else self.title


class Summary(models.Model):
	article = models.ForeignKey(Article, on_delete=models.CASCADE, related_name='summaries')
	summary_text = models.TextField()
	model_name = models.CharField(max_length=200, default='local-gpu')
	generated_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ['-generated_at']

	def __str__(self) -> str:  # pragma: no cover - convenience
		return f"Summary for {self.article_id} ({self.model_name})"

# Create your models here.
