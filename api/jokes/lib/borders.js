// Helper to produce SVG defs and border element for various border effects.
// Exports: getBorderSVG(type, theme, width, height, padding, reduceMotion, borderImage)

function ensureHash(hex) {
  if (!hex) return '#ffffff';
  return hex.startsWith('#') ? hex : `#${hex}`;
}

function shadeColor(hex, percent) {
  // simple shade function: percent between -100 and 100
  try {
    let col = ensureHash(hex).substring(1);
    if (col.length === 3) {
      col = col.split('').map(c => c + c).join('');
    }
    const num = parseInt(col, 16);
    let r = (num >> 16) + Math.round(255 * (percent / 100));
    let g = ((num >> 8) & 0x00FF) + Math.round(255 * (percent / 100));
    let b = (num & 0x0000FF) + Math.round(255 * (percent / 100));
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
  } catch (e) {
    return hex;
  }
}

export function getBorderSVG(type = 'none', theme = {}, width = 480, height = 160, padding = 24, reduceMotion = false, borderImage = null) {
  const strokeW = 3;
  const innerX = 2;
  const innerY = 2;
  const innerW = Math.max(0, width - 4);
  const innerH = Math.max(0, height - 4);
  const rx = 8;

  const borderColor = theme.borderColor || '#2563eb';
  const accent1 = shadeColor(borderColor, 20);
  const accent2 = shadeColor(borderColor, -30);

  if (type === 'dash') {
    const defs = `
      <style>
        @keyframes dash { to { stroke-dashoffset: -24; } }
      </style>
    `;
    const anim = reduceMotion ? '' : 'class="anim" style="animation: dash 2s linear infinite;"';
    const rect = `<rect x="${innerX}" y="${innerY}" width="${innerW}" height="${innerH}" rx="${rx}" fill="none" stroke="${borderColor}" stroke-width="${strokeW}" stroke-dasharray="8 8" ${anim} />`;
    return { defs, element: rect };
  }

  // Colorful blinking dashed or dotted border (new option)
  if (type === 'colorful' || type === 'colorful-dash' || type === 'colorful-dots') {
    const isDots = type === 'colorful-dots';
    // Dots use very short dash + larger gap and rounded linecaps
    const dashArray = isDots ? '1 14' : '12 8';
    const linecap = isDots ? 'round' : 'butt';

    const defs = `
      <style>
        /* move the dashes/dots along the path */
        @keyframes dashMove { to { stroke-dashoffset: -32; } }
        /* cycle through three accent colors for a colorful blink */
        @keyframes colorBlink {
          0% { stroke: ${borderColor}; }
          33% { stroke: ${accent1}; }
          66% { stroke: ${accent2}; }
          100% { stroke: ${borderColor}; }
        }
      </style>
    `;

    const animAttr = reduceMotion ? '' : 'class="anim" style="animation: dashMove 2s linear infinite, colorBlink 1.2s linear infinite;"';
    const rect = `<rect x="${innerX}" y="${innerY}" width="${innerW}" height="${innerH}" rx="${rx}" fill="none" stroke="${borderColor}" stroke-width="${strokeW}" stroke-dasharray="${dashArray}" stroke-linecap="${linecap}" ${animAttr} />`;
    return { defs, element: rect };
  }

  if (type === 'gradient') {
    const gid = 'g_grad_border';
    const defs = `
      <linearGradient id="${gid}" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${accent2}" />
        <stop offset="50%" stop-color="${borderColor}" />
        <stop offset="100%" stop-color="${accent1}" />
      </linearGradient>
      <style>
        @keyframes sweep { to { transform: translateX(100%); } }
      </style>
    `;
    const animStyle = reduceMotion ? '' : 'class="anim" style="animation: sweep 3s linear infinite; transform-origin: 50% 50%;"';
    const rect = `<rect x="${innerX}" y="${innerY}" width="${innerW}" height="${innerH}" rx="${rx}" fill="none" stroke="url(#${gid})" stroke-width="${strokeW}" ${animStyle} />`;
    return { defs, element: rect };
  }

  if (type === 'neon') {
    const fid = 'f_neon';
    const defs = `
      <filter id="${fid}" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="6" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <style>
        @keyframes pulse { 0%,100%{opacity:0.5} 50%{opacity:1} }
      </style>
    `;
    const animAttr = reduceMotion ? '' : 'class="anim" style="animation: pulse 2.5s ease-in-out infinite;"';
    const rect = `<rect x="${innerX}" y="${innerY}" width="${innerW}" height="${innerH}" rx="${rx}" fill="none" stroke="${borderColor}" stroke-width="${strokeW}" filter="url(#${fid})" ${animAttr} />`;
    return { defs, element: rect };
  }

  if (type === 'gif' && borderImage) {
    // Use mask to show only border area of the gif
    const mid = 'm_border';
    const imgId = 'img_border';
    const defs = `
      <mask id="${mid}">
        <rect width="100%" height="100%" fill="white" rx="${rx}" />
        <rect x="${innerX + 6}" y="${innerY + 6}" width="${Math.max(0, innerW - 12)}" height="${Math.max(0, innerH - 12)}" rx="${Math.max(0, rx - 4)}" fill="black" />
      </mask>
    `;
    // position the image slightly larger than the card
    const img = `<image id="${imgId}" href="${borderImage}" x="-10" y="-10" width="${width + 20}" height="${height + 20}" preserveAspectRatio="xMidYMid slice" mask="url(#${mid})" />`;
    return { defs, element: img };
  }

  // Default static border
  const defs = '';
  const rect = `<rect x="${innerX}" y="${innerY}" width="${innerW}" height="${innerH}" rx="${rx}" fill="none" stroke="${borderColor}" stroke-width="1.5" />`;
  return { defs, element: rect };
}

export default getBorderSVG;
