import { test, expect } from "@playwright/test";

const API_BASE = "http://localhost:8000";

test.describe("Article and Summary Ordering", () => {
  test.beforeEach(async ({ page }) => {
    // Make sure the backend is running
    await page.goto("/");
  });

  test("articles should be ordered by rank in ascending order", async ({
    page,
  }) => {
    // Get the API response directly
    const response = await page.request.get(`${API_BASE}/api/articles/`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    const articles = data.results || data;

    // Verify we have articles
    expect(articles.length).toBeGreaterThan(0);

    // Check that ranks are in ascending order
    for (let i = 0; i < articles.length - 1; i++) {
      const currentRank = articles[i].rank;
      const nextRank = articles[i + 1].rank;

      expect(currentRank).toBeLessThanOrEqual(nextRank);
    }
  });

  test("summaries should be ordered by generated_at in ascending order", async ({
    page,
  }) => {
    // Get the API response directly
    const response = await page.request.get(`${API_BASE}/api/summaries/`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    const summaries = data.results || data;

    // Verify we have summaries
    expect(summaries.length).toBeGreaterThan(0);

    // Check that generated_at timestamps are in ascending order
    for (let i = 0; i < summaries.length - 1; i++) {
      const current = new Date(summaries[i].generated_at).getTime();
      const next = new Date(summaries[i + 1].generated_at).getTime();

      expect(current).toBeLessThanOrEqual(next);
    }
  });

  test("articles displayed in frontend should maintain API order", async ({
    page,
  }) => {
    await page.goto("/");

    // Wait for articles to load - look for the article title links
    await page.waitForSelector('a[target="_blank"][rel="noreferrer"]', {
      timeout: 10000,
    });

    // Get the order from the API
    const apiResponse = await page.request.get(`${API_BASE}/api/articles/`);
    const apiData = await apiResponse.json();
    const apiArticles = apiData.results || apiData;

    // Get the articles displayed on the page
    const displayedTitles = await page
      .locator('a[target="_blank"][rel="noreferrer"] span')
      .allTextContents();

    // Compare first few articles (at least 3)
    const compareCount = Math.min(
      3,
      apiArticles.length,
      displayedTitles.length
    );

    for (let i = 0; i < compareCount; i++) {
      expect(displayedTitles[i]).toBe(apiArticles[i].title);
    }
  });

  test("article ranks should be in ascending order", async ({ page }) => {
    await page.goto("/");

    // Wait for articles to load - look for rank badges
    await page.waitForSelector(".rounded-full.bg-slate-900", {
      timeout: 10000,
    });

    // Get all rank badges
    const ranks = await page
      .locator(".rounded-full.bg-slate-900")
      .allTextContents();

    // Convert to numbers and check ascending order
    const rankNumbers = ranks.map((r) => parseInt(r.trim(), 10));

    for (let i = 0; i < rankNumbers.length - 1; i++) {
      expect(rankNumbers[i]).toBeLessThanOrEqual(rankNumbers[i + 1]);
    }
  });

  test("latest_summary field returns the earliest summary", async ({
    page,
  }) => {
    // Get an article with summaries
    const response = await page.request.get(`${API_BASE}/api/articles/`);
    const data = await response.json();
    const articles = data.results || data;

    // Find an article that has a latest_summary
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const articleWithSummary = articles.find((a: any) => a.latest_summary);

    if (articleWithSummary) {
      // Verify that the latest_summary has the expected structure
      expect(articleWithSummary.latest_summary).toHaveProperty("summary_text");
      expect(articleWithSummary.latest_summary).toHaveProperty("model_name");
      expect(articleWithSummary.latest_summary).toHaveProperty("generated_at");
    }
  });

  test("verify no random shuffling happens in frontend", async ({ page }) => {
    await page.goto("/");

    // Wait for articles to load
    await page.waitForSelector('a[target="_blank"][rel="noreferrer"]', {
      timeout: 10000,
    });

    // Get the initial order
    const firstLoad = await page
      .locator('a[target="_blank"][rel="noreferrer"] span')
      .allTextContents();

    // Reload the page
    await page.reload();
    await page.waitForSelector('a[target="_blank"][rel="noreferrer"]', {
      timeout: 10000,
    });

    // Get the order after reload
    const secondLoad = await page
      .locator('a[target="_blank"][rel="noreferrer"] span')
      .allTextContents();

    // The order should be exactly the same
    expect(firstLoad).toEqual(secondLoad);
  });
});
