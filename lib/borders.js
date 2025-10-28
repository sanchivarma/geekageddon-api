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
  const escAttr = (s = '') => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const strokeW = 3;
  const innerX = 2;
  const innerY = 2;
  const innerW = Math.max(0, width - 4);
  const innerH = Math.max(0, height - 4);
  const rx = 8;

  const borderColor = theme.borderColor || '#2563eb';
  const accent1 = shadeColor(borderColor, 20);
  const accent2 = shadeColor(borderColor, -30);

  // Monochrome "marching ants" border
  if (type === 'ants' || type === 'ants-mono' || type === 'ants-color') {
    const c1 = (type === 'ants-mono') ? '#000000' : borderColor;
    const c2 = (type === 'ants-mono') ? '#ffffff' : accent1;
    const defs = `
      <style>
        @keyframes antsMove { to { stroke-dashoffset: -16; } }
      </style>
    `;
    const anim = reduceMotion ? '' : 'class="anim" style="animation: antsMove 1.2s linear infinite;"';
    const r1 = `<rect x="${innerX}" y="${innerY}" width="${innerW}" height="${innerH}" rx="${rx}" fill="none" stroke="${c1}" stroke-width="${strokeW}" stroke-dasharray="4 6" ${anim} />`;
    // Offset second dash phase for alternating effect
    const r2 = `<rect x="${innerX}" y="${innerY}" width="${innerW}" height="${innerH}" rx="${rx}" fill="none" stroke="${c2}" stroke-width="${strokeW}" stroke-dasharray="4 6" stroke-dashoffset="5" ${anim} />`;
    return { defs, element: `<g>${r1}${r2}</g>` };
  }

  // Double animated dashed border (two strokes, opposite directions)
  if (type === 'double' || type === 'double-dash') {
    const defs = `
      <style>
        @keyframes dashFwd { to { stroke-dashoffset: -32; } }
        @keyframes dashRev { to { stroke-dashoffset: 32; } }
      </style>
    `;
    const animF = reduceMotion ? '' : 'class="anim" style="animation: dashFwd 2s linear infinite;"';
    const animR = reduceMotion ? '' : 'class="anim" style="animation: dashRev 2s linear infinite;"';
    const inner = `<rect x="${innerX}" y="${innerY}" width="${innerW}" height="${innerH}" rx="${rx}" fill="none" stroke="${borderColor}" stroke-width="${strokeW}" stroke-dasharray="12 8" ${animF} />`;
    const inset = 5;
    const outer = `<rect x="${innerX + inset}" y="${innerY + inset}" width="${Math.max(0, innerW - inset*2)}" height="${Math.max(0, innerH - inset*2)}" rx="${Math.max(0, rx - 3)}" fill="none" stroke="${accent1}" stroke-width="${Math.max(1, strokeW - 1)}" stroke-dasharray="12 8" ${animR} />`;
    return { defs, element: `<g>${inner}${outer}</g>` };
  }

  // Rainbow gradient border (rotating gradient)
  if (type === 'rainbow' || type === 'rainbow-gradient') {
    const gid = 'g_rainbow_border';
    const anim = reduceMotion ? '' : `<animateTransform attributeName="gradientTransform" type="rotate" from="0 0.5 0.5" to="360 0.5 0.5" dur="8s" repeatCount="indefinite" />`;
    const defs = `
      <linearGradient id="${gid}" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%"   stop-color="#ff3d00" />
        <stop offset="16%"  stop-color="#ff9100" />
        <stop offset="33%"  stop-color="#ffea00" />
        <stop offset="50%"  stop-color="#00e676" />
        <stop offset="66%"  stop-color="#00b0ff" />
        <stop offset="83%"  stop-color="#7c4dff" />
        <stop offset="100%" stop-color="#f50057" />
        ${anim}
      </linearGradient>
    `;
    const rect = `<rect x="${innerX}" y="${innerY}" width="${innerW}" height="${innerH}" rx="${rx}" fill="none" stroke="url(#${gid})" stroke-width="${strokeW}" />`;
    return { defs, element: rect };
  }

  // Corner pulse markers (decorative animated corner dots)
  if (type === 'corner-pulse' || type === 'corners') {
    const defs = `
      <style>
        @keyframes pulseDot { 0%,100%{opacity:0.4; r:1} 50%{opacity:1; r:3} }
      </style>
    `;
    const anim = reduceMotion ? '' : 'class="anim" style="animation: pulseDot 2s ease-in-out infinite;"';
    const r = 2;
    const ox = innerX + r + 2;
    const oy = innerY + r + 2;
    const ix = innerX + innerW - r - 2;
    const iy = innerY + innerH - r - 2;
    const dots = `
      <circle cx="${ox}" cy="${oy}" r="${r}" fill="${accent1}" ${anim} />
      <circle cx="${ix}" cy="${oy}" r="${r}" fill="${borderColor}" ${anim} />
      <circle cx="${ox}" cy="${iy}" r="${r}" fill="${borderColor}" ${anim} />
      <circle cx="${ix}" cy="${iy}" r="${r}" fill="${accent2}" ${anim} />
    `;
    const base = `<rect x="${innerX}" y="${innerY}" width="${innerW}" height="${innerH}" rx="${rx}" fill="none" stroke="${borderColor}" stroke-width="1.5" />`;
    return { defs, element: `<g>${base}${dots}</g>` };
  }

  // Scanning highlight segment around the border
  if (type === 'scan' || type === 'scanner') {
    const defs = `
      <style>
        @keyframes scanMove { to { stroke-dashoffset: -600; } }
      </style>
    `;
    const anim = reduceMotion ? '' : 'class="anim" style="animation: scanMove 3s linear infinite;"';
    // faint base
    const base = `<rect x="${innerX}" y="${innerY}" width="${innerW}" height="${innerH}" rx="${rx}" fill="none" stroke="${shadeColor(borderColor, -40)}" stroke-width="1.5" />`;
    // bright moving segment (long dash then long gap)
    const seg = `<rect x="${innerX}" y="${innerY}" width="${innerW}" height="${innerH}" rx="${rx}" fill="none" stroke="${accent1}" stroke-width="${strokeW}" stroke-dasharray="120 520" ${anim} />`;
    return { defs, element: `<g>${base}${seg}</g>` };
  }

  // Simple themed dots (rounded caps) marching around
  if (type === 'dots') {
    const defs = `
      <style>
        @keyframes dashMove { to { stroke-dashoffset: -32; } }
      </style>
    `;
    const animAttr = reduceMotion ? '' : 'class="anim" style="animation: dashMove 2s linear infinite;"';
    const rect = `<rect x="${innerX}" y="${innerY}" width="${innerW}" height="${innerH}" rx="${rx}" fill="none" stroke="${borderColor}" stroke-width="${strokeW}" stroke-dasharray="1 14" stroke-linecap="round" ${animAttr} />`;
    return { defs, element: rect };
  }

  // Rainbow ants (dashed gradient stroke that marches)
  if (type === 'rainbow-ants') {
    const gid = 'g_rainbow_ants';
    const animGrad = reduceMotion ? '' : `<animateTransform attributeName="gradientTransform" type="rotate" from="0 0.5 0.5" to="360 0.5 0.5" dur="10s" repeatCount="indefinite" />`;
    const defs = `
      <linearGradient id="${gid}" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%"   stop-color="#ff3d00" />
        <stop offset="16%"  stop-color="#ff9100" />
        <stop offset="33%"  stop-color="#ffea00" />
        <stop offset="50%"  stop-color="#00e676" />
        <stop offset="66%"  stop-color="#00b0ff" />
        <stop offset="83%"  stop-color="#7c4dff" />
        <stop offset="100%" stop-color="#f50057" />
        ${animGrad}
      </linearGradient>
      <style>
        @keyframes dashMove { to { stroke-dashoffset: -24; } }
      </style>
    `;
    const animAttr = reduceMotion ? '' : 'class="anim" style="animation: dashMove 1.6s linear infinite;"';
    const rect = `<rect x="${innerX}" y="${innerY}" width="${innerW}" height="${innerH}" rx="${rx}" fill="none" stroke="url(#${gid})" stroke-width="${strokeW}" stroke-dasharray="8 8" ${animAttr} />`;
    return { defs, element: rect };
  }

  // Rainbow dots (rounded, marching, gradient stroke)
  if (type === 'rainbow-dots') {
    const gid = 'g_rainbow_dots';
    const animGrad = reduceMotion ? '' : `<animateTransform attributeName=\"gradientTransform\" type=\"rotate\" from=\"0 0.5 0.5\" to=\"360 0.5 0.5\" dur=\"10s\" repeatCount=\"indefinite\" />`;
    const defs = `
      <linearGradient id="${gid}" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%"   stop-color="#ff3d00" />
        <stop offset="16%"  stop-color="#ff9100" />
        <stop offset="33%"  stop-color="#ffea00" />
        <stop offset="50%"  stop-color="#00e676" />
        <stop offset="66%"  stop-color="#00b0ff" />
        <stop offset="83%"  stop-color="#7c4dff" />
        <stop offset="100%" stop-color="#f50057" />
        ${animGrad}
      </linearGradient>
      <style>
        @keyframes dashMove { to { stroke-dashoffset: -32; } }
      </style>
    `;
    const animAttr = reduceMotion ? '' : 'class="anim" style="animation: dashMove 2s linear infinite;"';
    const rect = `<rect x="${innerX}" y="${innerY}" width="${innerW}" height="${innerH}" rx="${rx}" fill="none" stroke="url(#${gid})" stroke-width="${strokeW}" stroke-dasharray="1 14" stroke-linecap="round" ${animAttr} />`;
    return { defs, element: rect };
  }

  // Alternating rainbow pulsating dots covering the entire border
  if (type === 'rainbow-pulse-dots' || type === 'alt-rainbow-dots') {
    const defs = `
      <style>
        @keyframes pulseDot { 0%,100%{opacity:0.4; r:1} 50%{opacity:1; r:3} }
        @keyframes colorCycle {
          0% { fill: #ff3d00; }
          16%{ fill: #ff9100; }
          33%{ fill: #ffea00; }
          50%{ fill: #00e676; }
          66%{ fill: #00b0ff; }
          83%{ fill: #7c4dff; }
          100%{ fill: #f50057; }
        }
      </style>
    `;
    const anim = reduceMotion ? '' : 'class="anim" style="animation: pulseDot 2s ease-in-out infinite, colorCycle 6s linear infinite;"';
    const r = 2;
    const inset = 6;

    // Compute evenly spaced dots around the inner rectangle perimeter
    const tw = Math.max(0, innerW - inset * 2); // top width usable
    const th = Math.max(0, innerH - inset * 2); // side height usable
    const perim = 2 * (tw + th);
    const spacing = 16; // px between dots
    const count = Math.max(12, Math.floor(perim / spacing));

    const positions = [];
    for (let i = 0; i < count; i++) {
      let d = (perim * i) / count; // distance along perimeter
      if (d <= tw) {
        // top edge L -> R
        positions.push([innerX + inset + d, innerY + inset]);
      } else if (d <= tw + th) {
        // right edge T -> B
        const yd = d - tw;
        positions.push([innerX + innerW - inset, innerY + inset + yd]);
      } else if (d <= tw + th + tw) {
        // bottom edge R -> L
        const xd = d - (tw + th);
        positions.push([innerX + innerW - inset - xd, innerY + innerH - inset]);
      } else {
        // left edge B -> T
        const yd = d - (tw + th + tw);
        positions.push([innerX + inset, innerY + innerH - inset - yd]);
      }
    }

    const base = `<rect x="${innerX}" y="${innerY}" width="${innerW}" height="${innerH}" rx="${rx}" fill="none" stroke="${shadeColor(borderColor, -40)}" stroke-width="1.5" />`;
    const dots = positions
      .map(([cx, cy], idx) => {
        const delay = reduceMotion ? '' : `animation-delay: ${idx * 80}ms;`;
        return `<circle cx="${cx}" cy="${cy}" r="${r}" ${anim.replace('";', `; ${delay}"`)} />`;
      })
      .join('');
    return { defs, element: `<g>${base}${dots}</g>` };
  }

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
    const img = `<image id="${imgId}" href="${escAttr(borderImage)}" x="-10" y="-10" width="${width + 20}" height="${height + 20}" preserveAspectRatio="xMidYMid slice" mask="url(#${mid})" />`;
    return { defs, element: img };
  }

  // Default static border
  const defs = '';
  const rect = `<rect x="${innerX}" y="${innerY}" width="${innerW}" height="${innerH}" rx="${rx}" fill="none" stroke="${borderColor}" stroke-width="1.5" />`;
  return { defs, element: rect };
}

export default getBorderSVG;
