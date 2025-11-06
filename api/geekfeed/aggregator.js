import { fetchGdeltTechNews } from "./sources/gdelt.js";
import { fetchHackerNewsSearch } from "./sources/hackerNewsSearch.js";
import { fetchProductHunt } from "./sources/productHunt.js";
import { fetchTechCrunch } from "./sources/techCrunch.js";
import { fetchHackerNewsRss } from "./sources/hackerNewsRss.js";
import { fetchGoogleDevelopersBlog } from "./sources/googleDevelopers.js";
import { fetchChromiumBlog } from "./sources/chromiumBlog.js";
import { fetchOpenAiBlog } from "./sources/openAiBlog.js";
import { fetchMetaAiBlog } from "./sources/metaAiBlog.js";
import { fetchAnthropicBlog } from "./sources/anthropicBlog.js";
import { fetchCncfBlog } from "./sources/cncfBlog.js";
import { fetchReactBlog } from "./sources/reactBlog.js";
import { fetchNextJsBlog } from "./sources/nextjsBlog.js";
import { fetchNodeJsBlog } from "./sources/nodeReleases.js";
import { fetchTypeScriptBlog } from "./sources/typescriptBlog.js";
import { mergeAndDedupe, sortByRecency } from "./utils/normalize.js";
import { dedupeStrings } from "./utils/text.js";

export const SOURCE_CATALOG = [
  { id: "gdelt", name: "GDELT 2.0", type: "news-api", url: "https://www.gdeltproject.org", fetch: fetchGdeltTechNews },
  { id: "hacker-news-search", name: "Hacker News (Algolia)", type: "news-api", url: "https://hn.algolia.com", fetch: fetchHackerNewsSearch },
  { id: "product-hunt", name: "Product Hunt", type: "graphql", url: "https://www.producthunt.com", fetch: fetchProductHunt },
  { id: "techcrunch", name: "TechCrunch", type: "rss", url: "https://techcrunch.com", fetch: fetchTechCrunch },
  { id: "hacker-news-rss", name: "Hacker News RSS", type: "rss", url: "https://news.ycombinator.com", fetch: fetchHackerNewsRss },
  { id: "google-developers", name: "Google Developers Blog", type: "rss", url: "https://developers.googleblog.com", fetch: fetchGoogleDevelopersBlog },
  { id: "chromium-blog", name: "Chromium Blog", type: "rss", url: "https://blog.chromium.org", fetch: fetchChromiumBlog },
  { id: "openai-blog", name: "OpenAI Blog", type: "rss", url: "https://openai.com/blog", fetch: fetchOpenAiBlog },
  { id: "meta-ai-blog", name: "Meta AI Blog", type: "rss", url: "https://ai.meta.com/blog", fetch: fetchMetaAiBlog },
  { id: "anthropic-blog", name: "Anthropic Blog", type: "rss", url: "https://www.anthropic.com", fetch: fetchAnthropicBlog },
  { id: "cncf-blog", name: "CNCF Blog", type: "rss", url: "https://www.cncf.io/blog", fetch: fetchCncfBlog },
  { id: "react-blog", name: "React Blog", type: "rss", url: "https://react.dev/blog", fetch: fetchReactBlog },
  { id: "nextjs-blog", name: "Next.js Blog", type: "rss", url: "https://nextjs.org/blog", fetch: fetchNextJsBlog },
  { id: "nodejs-releases", name: "Node.js Blog", type: "rss", url: "https://nodejs.org", fetch: fetchNodeJsBlog },
  { id: "typescript-blog", name: "TypeScript Blog", type: "rss", url: "https://devblogs.microsoft.com/typescript", fetch: fetchTypeScriptBlog },
];

export const SOURCE_IDS = SOURCE_CATALOG.map((source) => source.id);

const filterSources = (ids) => {
  if (!ids || ids.length === 0) return SOURCE_CATALOG;
  const set = new Set(ids);
  return SOURCE_CATALOG.filter((source) => set.has(source.id));
};

const summarizeSources = (results) => {
  const errors = results.filter((entry) => entry.status === "error");
  const skipped = results.filter((entry) => entry.status === "skipped");
  return {
    ok: results.filter((entry) => entry.status === "ok").length,
    skipped: skipped.length,
    errors: errors.length,
    errorMessages: errors.map((item) => item.error?.message).filter(Boolean),
    skippedMessages: skipped.map((item) => item.error?.message).filter(Boolean),
  };
};

export async function aggregateTechNews({ limitPerSource = 10, sourceIds } = {}) {
  const selectedSources = filterSources(sourceIds);
  if (selectedSources.length === 0) {
    return {
      success: false,
      fetchedAt: new Date().toISOString(),
      limitPerSource,
      sources: [],
      items: [],
      message: "No matching sources found",
    };
  }

  const tasks = selectedSources.map(async (source) => {
    const started = Date.now();
    try {
      const items = await source.fetch(limitPerSource);
      return {
        id: source.id,
        name: source.name,
        type: source.type,
        url: source.url,
        status: "ok",
        durationMs: Date.now() - started,
        count: items.length,
        items,
      };
    } catch (error) {
      const status = error.code === "MISSING_TOKEN" ? "skipped" : "error";
      return {
        id: source.id,
        name: source.name,
        type: source.type,
        url: source.url,
        status,
        durationMs: Date.now() - started,
        count: 0,
        items: [],
        error: { message: error.message, code: error.code ?? null },
      };
    }
  });

  const perSource = await Promise.all(tasks);
  const combined = sortByRecency(mergeAndDedupe(perSource.flatMap((entry) => entry.items)));
  const tags = dedupeStrings(combined.flatMap((item) => item.tags ?? []));
  const badges = dedupeStrings(combined.flatMap((item) => item.badges ?? []));
  const categories = dedupeStrings(combined.flatMap((item) => item.categories ?? []));
  const summary = summarizeSources(perSource);

  return {
    success: summary.ok > 0,
    fetchedAt: new Date().toISOString(),
    limitPerSource,
    totalItems: combined.length,
    taxonomy: { tags, badges, categories },
    summary,
    sources: perSource.map(({ items, ...meta }) => meta),
    items: combined,
  };
}