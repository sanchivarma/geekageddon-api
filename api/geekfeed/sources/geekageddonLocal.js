import { loadLocalNews } from "../utils/localData.js";
import { normalizeItem } from "../utils/normalize.js";

const SOURCE_ID = "geekageddon-local";
const SOURCE_NAME = "Geek Feed";
const SOURCE_URL = "https://geekageddon.com";

export async function fetchGeekageddonLocal(limit = 10) {
  const items = await loadLocalNews();
  return items.slice(0, limit).map((item, index) =>
    normalizeItem({
      sourceId: SOURCE_ID,
      sourceName: SOURCE_NAME,
      sourceUrl: SOURCE_URL,
      sourceType: "local",
      id: item.id ?? `local-${index}`,
      url: item.url ?? null,
      title: item.title ?? null,
      summary: item.summary ?? null,
      author: item.author ?? null,
      publishedAt: item.publishedAt ?? null,
      categories: item.categories ?? ["local"],
      tags: item.tags ?? ["geekageddon"],
      imageUrl: item.imageUrl ?? null,
      extras: {
        location: item.location ?? null,
        type: "local",
        position: index,
      },
      raw: item,
    })
  );
}