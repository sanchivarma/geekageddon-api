const ENTITY_MAP = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
};

const decodeEntity = (match, entity) => {
  if (!entity) return match;
  if (entity.startsWith("#x")) {
    const codePoint = parseInt(entity.slice(2), 16);
    if (!Number.isNaN(codePoint)) return String.fromCodePoint(codePoint);
  } else if (entity.startsWith("#")) {
    const codePoint = parseInt(entity.slice(1), 10);
    if (!Number.isNaN(codePoint)) return String.fromCodePoint(codePoint);
  } else if (ENTITY_MAP[entity]) {
    return ENTITY_MAP[entity];
  }
  return match;
};

const decodeHtmlEntities = (input = "") => input.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, decodeEntity);

const stripTags = (input = "") => decodeHtmlEntities(input.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());

const cleanCdata = (value = "") => value.replace(/<!\[CDATA\[/g, "").replace(/]]>/g, "");

const extractTag = (block, tag) => {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = block.match(regex);
  if (!match) return null;
  return stripTags(cleanCdata(match[1]));
};

const extractTags = (block, tag) => {
  const regex = new RegExp(`<${tag}([^>]*)>([\\s\\S]*?)<\\/${tag}>`, "gi");
  const matches = [];
  let match;
  while ((match = regex.exec(block))) {
    const attrs = match[1];
    const body = stripTags(cleanCdata(match[2] ?? ""));
    if (attrs && /term="([^"]+)"/i.test(attrs)) {
      matches.push(RegExp.$1.trim());
    } else if (attrs && /label="([^"]+)"/i.test(attrs)) {
      matches.push(RegExp.$1.trim());
    } else if (body) {
      matches.push(body.trim());
    }
  }
  return matches.filter(Boolean);
};

const extractAtomLink = (block) => {
  const relMatch = block.match(/<link[^>]*rel="alternate"[^>]*href="([^"]+)"[^>]*>/i);
  if (relMatch) return decodeHtmlEntities(relMatch[1]);
  const hrefMatch = block.match(/<link[^>]*href="([^"]+)"[^>]*>/i);
  if (hrefMatch) return decodeHtmlEntities(hrefMatch[1]);
  const linkTag = extractTag(block, "link");
  return linkTag;
};

const extractAuthor = (block, isAtom) => {
  if (isAtom) {
    const name = extractTag(block, "name");
    if (name) return name;
  }
  const dcCreator = extractTag(block, "dc:creator");
  if (dcCreator) return dcCreator;
  const creator = extractTag(block, "creator");
  if (creator) return creator;
  const author = extractTag(block, "author");
  if (author) return author;
  return null;
};

const parseBlock = (block, isAtom) => {
  const title = extractTag(block, "title");
  const link = isAtom ? extractAtomLink(block) : extractTag(block, "link");
  const description = extractTag(block, isAtom ? "summary" : "description") || extractTag(block, "content") || "";
  const publishedAt = extractTag(block, isAtom ? "updated" : "pubDate") || extractTag(block, "published");
  const categories = Array.from(new Set(extractTags(block, "category")));
  return {
    title,
    link,
    summary: stripTags(description),
    rawSummary: description,
    publishedAt,
    categories,
    author: extractAuthor(block, isAtom),
  };
};

export const parseFeed = (xml, limit = 10) => {
  if (!xml) return { items: [] };
  const normalizedXml = xml.replace(/\r\n/g, "\n");
  const isAtom = /<entry[\s>]/i.test(normalizedXml) || /<feed[\s>]/i.test(normalizedXml);
  const tag = isAtom ? "entry" : "item";
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
  const items = [];
  let match;
  while ((match = regex.exec(normalizedXml)) && items.length < limit * 2) {
    const parsed = parseBlock(match[1], isAtom);
    if (parsed.title || parsed.link) {
      items.push(parsed);
    }
  }
  return { items: items.slice(0, limit) };
};

export { stripTags, decodeHtmlEntities };