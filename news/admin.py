from django.contrib import admin

from .models import Article, Summary


@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
	list_display = ('id', 'rank', 'title', 'author', 'points', 'comments_count', 'scraped_at')
	search_fields = ('title', 'author')
	list_filter = ('scraped_at',)


@admin.register(Summary)
class SummaryAdmin(admin.ModelAdmin):
	list_display = ('id', 'article', 'model_name', 'generated_at')
	search_fields = ('summary_text',)
	list_filter = ('model_name', 'generated_at')

# Register your models here.
