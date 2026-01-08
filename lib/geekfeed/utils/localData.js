import { join } from "node:path";
import { readFile } from "node:fs/promises";

const DATA_ROOT = join(process.cwd(), "api", "geekfeed", "data");

const safeReadJson = async (fileName, fallback = []) => {
  try {
    const content = await readFile(join(DATA_ROOT, fileName), "utf8");
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch (_) {
    return fallback;
  }
};

export const loadFeaturedNews = () => safeReadJson("featured-news.json", []);
export const loadLocalNews = () => safeReadJson("local-news.json", []);