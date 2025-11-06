import { fetchText } from "./http.js";
import { parseFeed } from "./rssParser.js";
import { normalizeItem } from "./normalize.js";
import { dedupeStrings } from "./text.js";

const USER_AGENT = "GeekFeedBot/1.0 (+https://geekageddon.com)";

export async function fetchRssSource({
  sourceId,
  sourceName,
  sourceUrl,
  feedUrl,
  limit = 10,
  language = null,
  defaultTags = [],
  defaultBadges = [],
  mapItem,
}) {
  if (!feedUrl) throw new Error("feedUrl is required");
  const { text } = await fetchText(feedUrl, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/rss+xml, application/atom+xml, application/xml;q=0.9, */*;q=0.8",
    },
  });
  const { items } = parseFeed(text, limit);
  return items.slice(0, limit).map((item, index) => {
    const mapped = mapItem ? mapItem(item, index) : item;
    const categories = dedupeStrings([...(item.categories ?? []), ...(mapped.categories ?? [])]);
    return normalizeItem({
      sourceId,
      sourceName,
      sourceUrl,
      sourceType: "rss",
      id: mapped.id ?? null,
      title: mapped.title ?? item.title ?? null,
      url: mapped.link ?? item.link ?? null,
      summary: mapped.summary ?? item.summary ?? null,
      rawSummary: mapped.rawSummary ?? item.rawSummary ?? null,
      author: mapped.author ?? item.author ?? null,
      publishedAt: mapped.publishedAt ?? item.publishedAt ?? null,
      categories,
      tags: dedupeStrings([...(mapped.tags ?? []), ...categories, ...defaultTags]),
      badges: dedupeStrings([...(mapped.badges ?? []), ...defaultBadges]),
      imageUrl: mapped.imageUrl ?? null,
      language: mapped.language ?? language,
      extras: {
        feedUrl,
        position: index,
        ...mapped.extras,
      },
      raw: mapped.raw ?? item,
    });
  });
}