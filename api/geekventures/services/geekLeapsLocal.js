import fs from "fs";
import path from "path";

const LOCAL_PATH = path.join(process.cwd(), "api", "geekventures", "data", "geek-leaps.json");

export async function fetchGeekLeapsLocal({ limit = 50 } = {}) {
  try {
    if (!fs.existsSync(LOCAL_PATH)) throw new Error("geek-leaps.json not found");
    const raw = JSON.parse(fs.readFileSync(LOCAL_PATH, "utf-8"));
    const items = Array.isArray(raw) ? raw.slice(0, limit) : [];
    return { success: true, items };
  } catch (error) {
    return { success: false, items: [], error: error.message };
  }
}
