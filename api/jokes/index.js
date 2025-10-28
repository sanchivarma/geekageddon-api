import fs from "fs";
import path from "path";

function generateJokeSVG(joke, theme) {
  const {
    padding,
    width,
    lineHeight,
    fontSize
  } = theme;
  
  const charsPerLine = Math.floor((width - (padding * 2)) / (fontSize * 0.6));
  
  // Handle Q&A format
  const isQnA = joke.startsWith('Q:');
  let lines = [];
  
  if (isQnA) {
    const [question, answer] = joke.split('\n');
    
    // Split question and answer separately to handle wrapping
    const qWords = question.split(' ');
    const aWords = answer.split(' ');
    let qLine = '';
    let aLine = '';
    
    // Process question
    qWords.forEach(word => {
      if ((qLine + ' ' + word).length > charsPerLine) {
        lines.push({ text: qLine, type: 'q' });
        qLine = word;
      } else {
        qLine = qLine ? `${qLine} ${word}` : word;
      }
    });
    lines.push({ text: qLine, type: 'q' });
    
    // Add spacing line
    lines.push({ text: '', type: 'space' });
    
    // Process answer
    aWords.forEach(word => {
      if ((aLine + ' ' + word).length > charsPerLine) {
        lines.push({ text: aLine, type: 'a' });
        aLine = word;
      } else {
        aLine = aLine ? `${aLine} ${word}` : word;
      }
    });
    lines.push({ text: aLine, type: 'a' });
  } else {
    // Handle regular jokes
    const words = joke.split(' ');
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

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter&amp;display=swap');
      text { font-family: 'Inter', sans-serif; }
    </style>
    <rect width="100%" height="100%" fill="${theme.bgColor}" rx="8"/>
    <rect width="calc(100% - 4px)" height="calc(100% - 4px)" x="2" y="2" 
          fill="none" stroke="${theme.borderColor}" stroke-width="1.5" rx="7"/>
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
  const themesPath = path.join(process.cwd(), "api", "jokes", "lib", "themes.json");
  
  const jokes = JSON.parse(fs.readFileSync(jokesPath, "utf8"));
  const themes = JSON.parse(fs.readFileSync(themesPath, "utf8"));
  const { category } = req.query;

  let filtered = jokes;
  if (category) {
    const categories = category.split(",").map((c) => c.trim().toLowerCase());
    filtered = jokes.filter((j) =>
      j.categories.some((c) => categories.includes(c.toLowerCase()))
    );
  }

  if (!filtered.length) {
    res.status(404);
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.send("No jokes found for given category.");
  }

  const joke = filtered[Math.floor(Math.random() * filtered.length)];
  const customTheme = getCustomTheme(req.query, themes);

  const svg = generateJokeSVG(joke.text, customTheme);

  res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.status(200).send(svg);
}
