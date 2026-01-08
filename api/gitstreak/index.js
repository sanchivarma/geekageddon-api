import fs from "fs";
import path from "path";
import { getBorderSVG } from "../../lib/borders.js";

const GITHUB_GRAPHQL_URL = "https://api.github.com/graphql";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const applyCors = (res) => {
  Object.entries(CORS_HEADERS).forEach(([key, value]) => res.setHeader(key, value));
};

const parseBoolean = (value) => {
  if (value == null) return false;
  const normalized = String(value).trim().toLowerCase();
  return ["1", "true", "yes", "y", "on"].includes(normalized);
};

const startOfMonth = (date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));

const monthsAgo = (date, count) => {
  const base = startOfMonth(date);
  return new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() - count, 1));
};

const monthsAhead = (date, count) => {
  const base = startOfMonth(date);
  return new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + count, 1));
};

const toIsoDate = (date) => date.toISOString();

const ensureUser = (user) => String(user ?? "").trim();
const isLightColor = (hex) => {
  const value = String(hex || "").replace("#", "");
  if (value.length !== 6) return false;
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return false;
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.7;
};


const getCustomTheme = (query, themes) => {
  const defaultTheme = themes.default || {
    bgColor: "#0f172a",
    textColor: "#e2e8f0",
    borderColor: "#22d3ee",
    qColor: "#fbbf24",
    aColor: "#34d399",
  };

  const {
    bgColor,
    textColor,
    borderColor,
    qColor,
    aColor,
    theme: themeName = "default",
  } = query;

  const baseTheme = themes[themeName] || defaultTheme;
  const isValidHex = (color) => /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);

  return {
    bgColor: bgColor && isValidHex(bgColor) ? bgColor : baseTheme.bgColor,
    textColor: textColor && isValidHex(textColor) ? textColor : baseTheme.textColor,
    borderColor: borderColor && isValidHex(borderColor) ? borderColor : baseTheme.borderColor,
    qColor: qColor && isValidHex(qColor) ? qColor : baseTheme.qColor,
    aColor: aColor && isValidHex(aColor) ? aColor : baseTheme.aColor,
  };
};

const buildQuery = () => `
query($login: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $login) {
    contributionsCollection(from: $from, to: $to) {
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            date
            contributionCount
          }
        }
      }
    }
  }
}
`;

const fetchContributionCalendar = async ({ token, login, from, to }) => {
  const response = await fetch(GITHUB_GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "geekageddon-gitstreak",
    },
    body: JSON.stringify({
      query: buildQuery(),
      variables: { login, from, to },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    const err = new Error(`GitHub API request failed (${response.status})`);
    err.body = body;
    throw err;
  }

  const payload = await response.json();
  if (payload.errors?.length) {
    const err = new Error(payload.errors[0]?.message ?? "GitHub API error");
    err.details = payload.errors;
    throw err;
  }

  return payload.data?.user?.contributionsCollection?.contributionCalendar ?? null;
};

const flattenDays = (calendar) => {
  const weeks = calendar?.weeks ?? [];
  const days = [];
  weeks.forEach((week) => {
    (week?.contributionDays ?? []).forEach((day) => {
      if (!day?.date) return;
      days.push({
        date: day.date,
        count: Number(day.contributionCount ?? 0),
      });
    });
  });
  return days.sort((a, b) => a.date.localeCompare(b.date));
};

const diffDays = (a, b) => {
  const aDate = new Date(`${a}T00:00:00Z`);
  const bDate = new Date(`${b}T00:00:00Z`);
  return Math.round((bDate - aDate) / 86400000);
};

const computeStreaks = (days, todayIso) => {
  const trimmed = days.filter((day) => day.date <= todayIso);
  let current = 0;
  let longest = 0;
  let streak = 0;
  let prevDate = null;

  trimmed.forEach((day) => {
    if (day.count > 0) {
      if (prevDate && diffDays(prevDate, day.date) === 1) {
        streak += 1;
      } else {
        streak = 1;
      }
      longest = Math.max(longest, streak);
    } else {
      streak = 0;
    }
    prevDate = day.date;
  });

  let i = trimmed.length - 1;
  while (i >= 0 && trimmed[i].count === 0) i -= 1;
  while (i >= 0) {
    if (trimmed[i].count <= 0) break;
    if (i < trimmed.length - 1) {
      const nextDate = trimmed[i + 1].date;
      if (diffDays(trimmed[i].date, nextDate) !== 1) break;
    }
    current += 1;
    i -= 1;
  }

  return { current, longest };
};

const bucketLevel = (count, maxCount) => {
  if (count <= 0) return 0;
  if (maxCount <= 3) return 1;
  const ratio = count / maxCount;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
};

const buildSvg = ({ login, currentStreak, longestStreak, days, showGraph, theme, borderAnimation, reduceMotion }) => {
  const padding = 16;
  const currentRadius = 58;
  const longestRadius = 46;
  const rowGap = 80;
  const rowWidth = currentRadius * 2 + longestRadius * 2 + rowGap;
  const cardWidth = rowWidth + padding * 2;
  const rowCenterY = 100;
  const labelOffset = 22;
  const labelY = rowCenterY + currentRadius + labelOffset;
  const headerHeight = labelY + 28;
  const cellSize = 12;
  const cellGap = 3;
  const graphYOffset = headerHeight + 10;
  const colors = ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"];

  const weeks = [];
  let weekIndex = -1;
  days.forEach((day, idx) => {
    if (idx % 7 === 0) {
      weekIndex += 1;
      weeks[weekIndex] = [];
    }
    weeks[weekIndex].push(day);
  });

  const maxCount = days.reduce((acc, day) => Math.max(acc, day.count), 0);
  const graphWidth = weeks.length * (cellSize + cellGap) + padding * 2;
  const graphHeight = 7 * (cellSize + cellGap);
  const svgWidth = Math.max(Math.ceil(cardWidth), graphWidth);
  const rowStartX = (svgWidth - rowWidth) / 2;
  const currentCenterX = rowStartX + currentRadius;
  const longestCenterX = currentCenterX + currentRadius + longestRadius + rowGap;
  const svgHeight = showGraph ? graphYOffset + graphHeight + padding : headerHeight + padding;

  let rects = "";
  if (showGraph) {
    weeks.forEach((week, wIdx) => {
      week.forEach((day, dIdx) => {
        const level = bucketLevel(day.count, maxCount);
        const x = padding + wIdx * (cellSize + cellGap);
        const y = graphYOffset + dIdx * (cellSize + cellGap);
        const formatDate = (iso) => {
          const [year, month, dayNum] = String(iso).split("-");
          return `${dayNum}-${month}-${year.slice(-2)}`;
        };
        const tooltip = `${formatDate(day.date)} • ${day.count} contributions`;
        rects += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="2" fill="${colors[level]}"><title>${tooltip}</title></rect>`;
      });
    });
  }

  const border = getBorderSVG(borderAnimation, theme, svgWidth, svgHeight, padding, reduceMotion);
  const useRainbow = String(borderAnimation || "").includes("rainbow");
  const currentStroke = useRainbow ? "url(#circleGradient)" : theme.borderColor;
  const longestStroke = currentStroke;
  const circleDash = ["ants", "ants-color", "ants-mono", "double", "double-dash", "dots", "rainbow-ants", "rainbow-dots"]
    .includes(borderAnimation)
    ? 'stroke-dasharray="10 8" class="anim stroke-anim"'
    : "";
  const textAnim = ["pulse", "corner-pulse"].includes(borderAnimation) ? 'class="anim text-pulse"' : "";
  const isLightTheme = isLightColor(theme.bgColor);
  const glowStrong = isLightTheme ? "0.25" : "0.35";
  const glowMid = isLightTheme ? "0.08" : "0.12";
  const dotCount = 40;
  const dotStep = (Math.PI * 2) / dotCount;
  const dotRadius = 2.2;
  const dotRing = Array.from({ length: dotCount }).map((_, idx) => {
    const angle = idx * dotStep;
    const x = longestCenterX + Math.cos(angle) * longestRadius;
    const y = rowCenterY + Math.sin(angle) * longestRadius;
    const delay = (idx * 0.2).toFixed(2);
    return `<circle cx="${x}" cy="${y}" r="${dotRadius}" fill="${theme.borderColor}" class="blink" style="animation-delay:${delay}s"></circle>`;
  }).join("");

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">
  <defs>
    ${border.defs}
    ${useRainbow ? `
    <linearGradient id="circleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ff3d00"/>
      <stop offset="16%" stop-color="#ff9100"/>
      <stop offset="33%" stop-color="#ffea00"/>
      <stop offset="50%" stop-color="#00e676"/>
      <stop offset="66%" stop-color="#00b0ff"/>
      <stop offset="83%" stop-color="#7c4dff"/>
      <stop offset="100%" stop-color="#f50057"/>
    </linearGradient>` : ""}
    <radialGradient id="haloCurrent" cx="50%" cy="50%" r="60%">
      <stop offset="0%" stop-color="${theme.borderColor}" stop-opacity="${glowStrong}"/>
      <stop offset="70%" stop-color="${theme.borderColor}" stop-opacity="${glowMid}"/>
      <stop offset="100%" stop-color="${theme.borderColor}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="haloLongest" cx="50%" cy="50%" r="60%">
      <stop offset="0%" stop-color="${theme.borderColor}" stop-opacity="${glowStrong}"/>
      <stop offset="70%" stop-color="${theme.borderColor}" stop-opacity="${glowMid}"/>
      <stop offset="100%" stop-color="${theme.borderColor}" stop-opacity="0"/>
    </radialGradient>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&amp;display=swap');
      text { font-family: 'Inter', sans-serif; }
      @keyframes dashMove { to { stroke-dashoffset: -32; } }
      @keyframes pulseText { 0%,100%{opacity:0.8;} 50%{opacity:1;} }
      @keyframes blinkDot { 0%,100% { opacity:0.2; } 50% { opacity:1; } }
      @media (prefers-reduced-motion: reduce) {
        .anim { animation: none !important; }
        .blink { animation: none !important; }
      }
      .stroke-anim { animation: dashMove 1.8s linear infinite; }
      .text-pulse { animation: pulseText 2s ease-in-out infinite; }
      .blink { animation: blinkDot 1.6s ease-in-out infinite; }
    </style>
  </defs>
  <rect x="0" y="0" width="${svgWidth}" height="${svgHeight}" fill="${theme.bgColor}" rx="16"></rect>
  ${border.element}
  <circle cx="${currentCenterX}" cy="${rowCenterY}" r="${currentRadius + 14}" fill="url(#haloCurrent)"></circle>
  <circle cx="${longestCenterX}" cy="${rowCenterY}" r="${longestRadius + 12}" fill="url(#haloLongest)"></circle>
  <circle cx="${currentCenterX}" cy="${rowCenterY}" r="${currentRadius}" fill="none" stroke="${currentStroke}" stroke-width="4" ${circleDash}></circle>
  <text x="${currentCenterX}" y="${rowCenterY + 10}" font-size="48" font-weight="700" fill="${theme.textColor}" text-anchor="middle" ${textAnim}>${currentStreak}</text>
  <text x="${currentCenterX}" y="${labelY}" font-size="14" fill="${theme.textColor}" text-anchor="middle">Current streak</text>

  <circle cx="${longestCenterX}" cy="${rowCenterY}" r="${longestRadius}" fill="none" stroke="${longestStroke}" stroke-width="2" ${circleDash}></circle>
  ${dotRing}
  <text x="${longestCenterX}" y="${rowCenterY + 8}" font-size="36" font-weight="700" fill="${theme.textColor}" text-anchor="middle">${longestStreak}</text>
  <text x="${longestCenterX}" y="${labelY}" font-size="14" fill="${theme.textColor}" text-anchor="middle">Longest streak</text>

  ${rects}
</svg>
`.trim();
};

export default async function handler(req, res) {
  applyCors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const login = ensureUser(req.query.user ?? process.env.GITHUB_USERNAME);
  if (!login) {
    return res.status(400).json({ success: false, message: "Missing user parameter" });
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return res.status(500).json({ success: false, message: "Missing GITHUB_TOKEN" });
  }

  const showGraph = parseBoolean(req.query.showgraph ?? req.query.showGraph);
  const format = String(req.query.format ?? "").toLowerCase();
  const borderAnimation = String(req.query.borderAnimation ?? req.query.border ?? "none");
  const reduceMotion = parseBoolean(req.query.reduceMotion ?? req.query.reducedMotion);
  const themesPath = path.join(process.cwd(), "lib", "themes.json");
  const themes = JSON.parse(fs.readFileSync(themesPath, "utf8"));
  const theme = getCustomTheme(req.query, themes);

  const today = new Date();
  const from = monthsAgo(today, 5);
  const to = today;

  try {
    const calendar = await fetchContributionCalendar({
      token,
      login,
      from: toIsoDate(from),
      to: toIsoDate(to),
    });

    if (!calendar) {
      return res.status(404).json({ success: false, message: "GitHub user not found" });
    }

    const days = flattenDays(calendar);
    const todayIso = today.toISOString().slice(0, 10);
    const { current, longest } = computeStreaks(days, todayIso);

    const stats = {
      success: true,
      user: login,
      range: { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) },
      totalContributions: calendar.totalContributions ?? 0,
      currentStreak: current,
      longestStreak: longest,
      dailyUsage: days,
    };

    const svg = buildSvg({
      login,
      currentStreak: current,
      longestStreak: longest,
      days,
      showGraph,
      theme,
      borderAnimation,
      reduceMotion,
    });

    if (format === "json") {
      return res.status(200).json({ ...stats, svg });
    }

    res.setHeader("Content-Type", "image/svg+xml");
    return res.status(200).send(svg);
  } catch (error) {
    console.error("[gitstreak] error", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch GitHub data",
      error: error.message,
    });
  }
}
