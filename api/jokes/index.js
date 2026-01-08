import fs from "fs";
import path from "path";

import { getBorderSVG } from "../../lib/borders.js";

function generateJokeSVG(joke, theme, opts = {}) {
  // Allow layout overrides from theme (getCustomTheme provides defaults)
  const padding = theme.padding || 24;
  const width = theme.width || 480;
  const lineHeight = theme.lineHeight || 20;
  const fontSize = theme.fontSize || 14;
  
  const charsPerLine = Math.floor((width - (padding * 2)) / (fontSize * 0.6));
  
  let lines = [];
  
  // Check if joke is Q&A format or text object
  const isQnA = typeof joke === 'object' && joke.hasOwnProperty('q') && joke.hasOwnProperty('a');
  const isTextObj = typeof joke === 'object' && joke.hasOwnProperty('text');
  const jokeText = isTextObj ? joke.text : typeof joke === 'string' ? joke : '';
  
  if (isQnA) {
    // Process question
    const qWords = joke.q.split(' ');
    let qLine = '';
    
    qWords.forEach(word => {
      if ((qLine + ' ' + word).length > charsPerLine) {
        lines.push({ text: qLine, type: 'q' });
        qLine = word;
      } else {
        qLine = qLine ? `${qLine} ${word}` : word;
      }
    });
    if (qLine) {
      lines.push({ text: qLine, type: 'q' });
    }
    
    // Add spacing line
    lines.push({ text: '', type: 'space' });
    
    // Process answer
    const aWords = joke.a.split(' ');
    let aLine = '';
    
    aWords.forEach(word => {
      if ((aLine + ' ' + word).length > charsPerLine) {
        lines.push({ text: aLine, type: 'a' });
        aLine = word;
      } else {
        aLine = aLine ? `${aLine} ${word}` : word;
      }
    });
    if (aLine) {
      lines.push({ text: aLine, type: 'a' });
    }
  } else {
    // Handle regular jokes (both string and text object)
    const words = jokeText.split(' ');
    let currentLine = '';
    
    words.forEach(word => {
      if ((currentLine + ' ' + word).length > charsPerLine) {
        lines.push({ text: currentLine, type: 'regular' });
        currentLine = word;
      } else {
        currentLine = currentLine ? `${currentLine} ${word}` : word;
      }
    });
    if (currentLine) {
      lines.push({ text: currentLine, type: 'regular' });
    }
  }

  const height = (lines.length * lineHeight) + (padding * 2);

  // Border generation (defs + element) based on opts
  const borderAnimation = opts.borderAnimation || 'none';
  const borderImage = opts.borderImage || null;
  const reduceMotion = opts.reduceMotion === 'true' || opts.reduceMotion === true;

  const { defs: borderDefs, element: borderElement } = getBorderSVG(
    borderAnimation,
    theme,
    width,
    height,
    padding,
    reduceMotion,
    borderImage
  );

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Joke card">
    <defs>${borderDefs}</defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter&amp;display=swap');
      text { font-family: 'Inter', sans-serif; }
      /* Respect reduced motion preference by defaulting animations off when requested */
      @media (prefers-reduced-motion: reduce) {
        .anim { animation: none !important; }
      }
    </style>
    <rect width="100%" height="100%" fill="${theme.bgColor}" rx="8"/>
    ${borderElement}
    ${lines.map((line, i) => {
      if (line.type === 'space') return '';
      const color = line.type === 'q' ? theme.qColor : 
                   line.type === 'a' ? theme.aColor : 
                   theme.textColor;
      return `<text x="${padding}" y="${padding + (i * lineHeight)}" 
             font-size="${fontSize}" fill="${color}"
             font-weight="${line.type === 'q' || line.type === 'a' ? 'bold' : 'normal'}"
             dominant-baseline="hanging">${line.text}</text>`;
    }).join('')}
  </svg>`;
}

function generateQuoteSVG(quote, theme, opts = {}) {
  const padding = theme.padding || 24;
  const width = theme.width || 480;
  const lineHeight = theme.lineHeight || 20;
  const fontSize = theme.fontSize || 14;

  const charsPerLine = Math.floor((width - padding * 2) / (fontSize * 0.6));
  const text = typeof quote === "string" ? quote : quote.text || "";
  const author = (typeof quote === "object" && quote.author) ? quote.author : "";

  const esc = (value = "") => String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const words = text.split(" ");
  const lines = [];
  let current = "";

  words.forEach((word) => {
    if ((current + " " + word).length > charsPerLine) {
      lines.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  });
  if (current) lines.push(current);

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
    ? `<text x="${padding}" y="${authorY}" font-size="${fontSize}" fill="${authorColor}" font-style="italic" dominant-baseline="hanging">- ${esc(author)}</text>`
    : "";

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Quote card">
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
  const defaultTheme = themes.default;
  
  // Custom color parameters
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
    theme: themeName = "default"
  } = query;

  // Start with theme colors (if specified) or default theme
  const baseTheme = themes[themeName] || defaultTheme;

  // Override with any custom colors provided (checking for valid hex colors)
  const isValidHex = (color) => /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  
  return {
    bgColor: bgColor && isValidHex(bgColor) ? bgColor : baseTheme.bgColor,
    textColor: textColor && isValidHex(textColor) ? textColor : baseTheme.textColor,
    borderColor: borderColor && isValidHex(borderColor) ? borderColor : baseTheme.borderColor,
    qColor: qColor && isValidHex(qColor) ? qColor : baseTheme.qColor,
    aColor: aColor && isValidHex(aColor) ? aColor : baseTheme.aColor,
    codeColor: codeColor && isValidHex(codeColor) ? codeColor : baseTheme.codeColor,
    // Layout customization
    fontSize: parseInt(fontSize) || 14,
    width: parseInt(width) || 480,
    padding: parseInt(padding) || 24,
    lineHeight: parseInt(lineHeight) || 20
  };
}

export default function handler(req, res) {
  const jokesPath = path.join(process.cwd(), "data", "jokes.json");
  const quotesPath = path.join(process.cwd(), "data", "motivational-quotes.json");
  const themesPath = path.join(process.cwd(), "lib", "themes.json");
  
  const jokes = JSON.parse(fs.readFileSync(jokesPath, "utf8"));
  const quotes = JSON.parse(fs.readFileSync(quotesPath, "utf8"));
  const themes = JSON.parse(fs.readFileSync(themesPath, "utf8"));
  const { category } = req.query;
  const type = String(req.query.type ?? req.query.mode ?? "jokes").trim().toLowerCase();

  let filtered = type === "quotes" || type === "quote" ? quotes : jokes;
  if (category) {
    const categories = category.split(",").map((c) => c.trim().toLowerCase());
    filtered = filtered.filter((item) =>
      (item.categories || []).some((c) => categories.includes(String(c).toLowerCase()))
    );
  }

  if (!filtered.length) {
    res.status(404);
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.send(type === "quotes" || type === "quote" ? "No quotes found for given category." : "No jokes found for given category.");
  }

  const selected = filtered[Math.floor(Math.random() * filtered.length)];
  const customTheme = getCustomTheme(req.query, themes);

  // Read border and motion options from query params
  const borderAnimation = req.query.borderAnimation || req.query.border || 'none';
  const borderImage = req.query.borderImage || null;
  const reduceMotion = req.query.reduceMotion || req.query.reducedMotion || false;

  // Pass the entire joke object to generateJokeSVG along with options
  // It will handle both Q&A format (joke.q & joke.a) and text format (joke.text)
  const svg = (type === "quotes" || type === "quote")
    ? generateQuoteSVG(selected, customTheme, { borderAnimation, borderImage, reduceMotion })
    : generateJokeSVG(selected, customTheme, { borderAnimation, borderImage, reduceMotion });

  res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.status(200).send(svg);
}

// Export generateJokeSVG for lightweight testing and local generation
export { generateJokeSVG };
