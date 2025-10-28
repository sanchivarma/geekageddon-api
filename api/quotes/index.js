import fs from "fs";
import path from "path";

// Reuse the same borders and themes as jokes
import { getBorderSVG } from "../../lib/borders.js";

function generateQuoteSVG(quote, theme, opts = {}) {
  const padding = theme.padding || 24;
  const width = theme.width || 480;
  const lineHeight = theme.lineHeight || 20;
  const fontSize = theme.fontSize || 14;

  const charsPerLine = Math.floor((width - padding * 2) / (fontSize * 0.6));

  const text = typeof quote === "string" ? quote : quote.text || "";
  const author = (typeof quote === "object" && quote.author) ? quote.author : "";

  // Basic XML escape for text nodes and attributes
  const esc = (s = "") => String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const words = text.split(" ");
  const lines = [];
  let current = "";

  words.forEach((w) => {
    if ((current + " " + w).length > charsPerLine) {
      lines.push(current);
      current = w;
    } else {
      current = current ? `${current} ${w}` : w;
    }
  });
  if (current) lines.push(current);

  // Add space and author line if present
  const hasAuthor = Boolean(author);
  const authorSpacer = hasAuthor ? 1 : 0;
  const totalLines = lines.length + authorSpacer + (hasAuthor ? 1 : 0);
  const height = totalLines * lineHeight + padding * 2;

  const borderAnimation = opts.borderAnimation || "none";
  const borderImage = opts.borderImage || null;
  const reduceMotion = opts.reduceMotion === "true" || opts.reduceMotion === true;

  const { defs: borderDefs, element: borderElement } = getBorderSVG(
    borderAnimation,
    theme,
    width,
    height,
    padding,
    reduceMotion,
    borderImage
  );

  const quoteColor = theme.textColor;
  const authorColor = theme.aColor || theme.textColor;

  const textElems = lines
    .map(
      (line, i) =>
        `<text x="${padding}" y="${padding + i * lineHeight}" font-size="${fontSize}" fill="${quoteColor}" dominant-baseline="hanging">${esc(line)}</text>`
    )
    .join("");

  const authorY = padding + (lines.length + authorSpacer) * lineHeight;
  const authorElem = hasAuthor
    ? `<text x="${padding}" y="${authorY}" font-size="${fontSize}" fill="${authorColor}" font-style="italic" dominant-baseline="hanging">— ${esc(author)}</text>`
    : "";

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Motivational quote card">
    <defs>${borderDefs}</defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter&amp;display=swap');
      text { font-family: 'Inter', sans-serif; }
      @media (prefers-reduced-motion: reduce) { .anim { animation: none !important; } }
    </style>
    <rect width="100%" height="100%" fill="${theme.bgColor}" rx="8"/>
    ${borderElement}
    ${textElems}
    ${authorElem}
  </svg>`;
}

function getCustomTheme(query, themes) {
  const def = themes.default;
  const {
    bgColor,
    textColor,
    borderColor,
    qColor,
    aColor,
    codeColor,
    fontSize,
    width,
    padding,
    lineHeight,
    theme: themeName = "default",
  } = query;

  const base = themes[themeName] || def;
  const isHex = (c) => /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(c);

  return {
    bgColor: bgColor && isHex(bgColor) ? bgColor : base.bgColor,
    textColor: textColor && isHex(textColor) ? textColor : base.textColor,
    borderColor: borderColor && isHex(borderColor) ? borderColor : base.borderColor,
    qColor: qColor && isHex(qColor) ? qColor : base.qColor,
    aColor: aColor && isHex(aColor) ? aColor : base.aColor,
    codeColor: codeColor && isHex(codeColor) ? codeColor : base.codeColor,
    fontSize: parseInt(fontSize) || 14,
    width: parseInt(width) || 480,
    padding: parseInt(padding) || 24,
    lineHeight: parseInt(lineHeight) || 20,
  };
}

export default function handler(req, res) {
  const quotesPath = path.join(process.cwd(), "data", "motivational-quotes.json");
  const themesPath = path.join(process.cwd(), "lib", "themes.json");

  const quotes = JSON.parse(fs.readFileSync(quotesPath, "utf8"));
  const themes = JSON.parse(fs.readFileSync(themesPath, "utf8"));

  const { category } = req.query;
  let filtered = quotes;

  if (category) {
    const categories = category.split(",").map((c) => c.trim().toLowerCase());
    filtered = quotes.filter((q) =>
      (q.categories || []).some((c) => categories.includes(String(c).toLowerCase()))
    );
  }

  if (!filtered.length) {
    res.status(404);
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.send("No quotes found for given category.");
  }

  const quote = filtered[Math.floor(Math.random() * filtered.length)];
  const customTheme = getCustomTheme(req.query, themes);

  const borderAnimation = req.query.borderAnimation || req.query.border || "none";
  const borderImage = req.query.borderImage || null;
  const reduceMotion = req.query.reduceMotion || req.query.reducedMotion || false;

  const svg = generateQuoteSVG(quote, customTheme, {
    borderAnimation,
    borderImage,
    reduceMotion,
  });

  res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.status(200).send(svg);
}
