import { loadFeaturedNews } from "../utils/localData.js";
import { normalizeItem } from "../utils/normalize.js";

const SOURCE_ID = "geekageddon-featured";
const SOURCE_NAME = "Geekageddon Featured";
const SOURCE_URL = "https://geekageddon.com";

export async function fetchGeekageddonFeatured(limit = 10) {
  const items = await loadFeaturedNews();
  return items.slice(0, limit).map((item, index) =>
    normalizeItem({
      sourceId: SOURCE_ID,
      sourceName: item.source?.name ?? SOURCE_NAME,
      sourceUrl: SOURCE_URL,
      sourceType: "local",
      id: item.id ?? `feat-${index}`,
      url: item.url ?? null,
      title: item.title ?? null,
      summary: item.summary ?? null,
      author: item.author ?? null,
      publishedAt: item.publishedAt ?? null,
      categories: item.categories ?? ["featured"],
      tags: item.tags ?? ["geekageddon"],
      imageUrl: item.imageUrl ?? null,
      extras: {
        type: "featured",
        position: index,
      },
      raw: item,
    })
  );
}