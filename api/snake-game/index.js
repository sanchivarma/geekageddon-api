// ESM Vercel API route that returns a classic block-based snake game SVG.

function escapeXml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
  })[c]);
}

function sanitizeText(input) {
  if (!input) return 'SNAKE';
  const trimmed = String(input).trim();
  const cleaned = trimmed.replace(/[^A-Za-z0-9 ]/g, '').slice(0, 20);
  return cleaned.length ? cleaned : 'SNAKE';
}

function svgForText(text, sizeParam, staticMode) {
  const input = String(text || '').toUpperCase();
  const safe = escapeXml(input);
  const size = Number.isFinite(parseInt(sizeParam, 10)) ? Math.max(1, Math.min(5, parseInt(sizeParam, 10))) : 2;
  const CELL_PX = 6 * size; // base 6px scaled by size 1..5
  const GAP_PX = Math.max(1, Math.floor(CELL_PX / 6));

  // Server-side 5x7 font for static rendering
  const FONT = {
    'A':["01110","10001","10001","11111","10001","10001","10001"],
    'B':["11110","10001","10001","11110","10001","10001","11110"],
    'C':["01111","10000","10000","10000","10000","10000","01111"],
    'D':["11110","10001","10001","10001","10001","10001","11110"],
    'E':["11111","10000","10000","11110","10000","10000","11111"],
    'F':["11111","10000","10000","11110","10000","10000","10000"],
    'G':["01111","10000","10000","10111","10001","10001","01111"],
    'H':["10001","10001","10001","11111","10001","10001","10001"],
    'I':["11111","00100","00100","00100","00100","00100","11111"],
    'J':["00111","00010","00010","00010","00010","10010","01100"],
    'K':["10001","10010","10100","11000","10100","10010","10001"],
    'L':["10000","10000","10000","10000","10000","10000","11111"],
    'M':["10001","11011","10101","10001","10001","10001","10001"],
    'N':["10001","11001","10101","10011","10001","10001","10001"],
    'O':["01110","10001","10001","10001","10001","10001","01110"],
    'P':["11110","10001","10001","11110","10000","10000","10000"],
    'Q':["01110","10001","10001","10001","10101","10010","01101"],
    'R':["11110","10001","10001","11110","10100","10010","10001"],
    'S':["01111","10000","10000","01110","00001","00001","11110"],
    'T':["11111","00100","00100","00100","00100","00100","00100"],
    'U':["10001","10001","10001","10001","10001","10001","01110"],
    'V':["10001","10001","10001","10001","10001","01010","00100"],
    'W':["10001","10001","10001","10101","10101","10101","01010"],
    'X':["10001","01010","00100","00100","00100","01010","10001"],
    'Y':["10001","01010","00100","00100","00100","00100","00100"],
    'Z':["11111","00001","00010","00100","01000","10000","11111"],
    '0':["01110","10001","10011","10101","11001","10001","01110"],
    '1':["00100","01100","00100","00100","00100","00100","01110"],
    '2':["01110","10001","00001","00010","00100","01000","11111"],
    '3':["11110","00001","00001","01110","00001","00001","11110"],
    '4':["00010","00110","01010","10010","11111","00010","00010"],
    '5':["11111","10000","11110","00001","00001","10001","01110"],
    '6':["01110","10000","11110","10001","10001","10001","01110"],
    '7':["11111","00001","00010","00100","01000","01000","01000"],
    '8':["01110","10001","10001","01110","10001","10001","01110"],
    '9':["01110","10001","10001","01111","00001","00001","01110"],
    ' ':["00000","00000","00000","00000","00000","00000","00000"]
  };

  if (staticMode) {
    const CHAR_W=5, CHAR_H=7, SP=1, BORDER=1;
    let textCols = 0; for (let i=0;i<input.length;i++){ textCols += CHAR_W; if (i<input.length-1) textCols += SP; }
    const cols = (input.length?textCols:CHAR_W) + BORDER*2;
    const rows = CHAR_H + BORDER*2;
    const w = cols*(CELL_PX+GAP_PX) - GAP_PX;
    const h = rows*(CELL_PX+GAP_PX) - GAP_PX;

    let grid = '';
    for (let r=0;r<rows;r++){
      for (let c=0;c<cols;c++){
        const x = c*(CELL_PX+GAP_PX);
        const y = r*(CELL_PX+GAP_PX);
        grid += `<rect class="grid-cell" x="${x}" y="${y}" width="${CELL_PX}" height="${CELL_PX}" rx="2" ry="2" data-row="${r}" data-col="${c}"/>`;
      }
    }
    let food = '';
    let cursor = BORDER;
    for (let i=0;i<input.length;i++){
      const ch = input[i]; const pat = FONT[ch] || FONT[' '];
      for (let r=0;r<CHAR_H;r++){
        for (let c=0;c<CHAR_W;c++){
          if (pat[r][c]==='1'){
            const row = BORDER + r;
            const col = cursor + c;
            const x = col*(CELL_PX+GAP_PX);
            const y = row*(CELL_PX+GAP_PX);
            food += `<rect class="food-cell" x="${x}" y="${y}" width="${CELL_PX}" height="${CELL_PX}" rx="2" ry="2" data-row="${row}" data-col="${col}" data-active="1"/>`;
          }
        }
      }
      cursor += CHAR_W; if (i<input.length-1) cursor += SP;
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs></defs>
  <rect x="0" y="0" width="100%" height="100%" fill="#0b1220"/>
  <g id="grid" data-layer="grid">${grid}</g>
  <g id="food" data-layer="food">${food}</g>
  <g id="snake" data-layer="snake"></g>
  <rect id="board-border" x="0.5" y="0.5" width="${Math.max(1,w-1)}" height="${Math.max(1,h-1)}" fill="none" stroke="#1B5E20" stroke-width="1"/>
  <style>
    .grid-cell { fill: #000000; }
    .food-cell { fill: #00C853; stroke: #087F23; stroke-width: 1; }
  </style>
</svg>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="900" height="260" viewBox="0 0 900 260">
  <defs></defs>

  <rect x="0" y="0" width="100%" height="100%" fill="#0b1220"/>

  <g id="grid" data-layer="grid"></g>
  <g id="food" data-layer="food"></g>
  <g id="snake" data-layer="snake"></g>

  <rect id="board-border" x="0.5" y="0.5" width="899" height="259" fill="none" stroke="#1B5E20" stroke-width="1"/>

  <style>
    .grid-cell { fill: #000000; }
    .grid-line { stroke: #12243c; stroke-width: 1; opacity: 0.35; }
    .food-cell { fill: #00C853; stroke: #087F23; stroke-width: 1; }
    .snake-head { fill: #2F7D32; stroke: #1B5E20; stroke-width: 1; }
    .snake-body { fill: #43A047; stroke: #1B5E20; stroke-width: 1; }
  </style>

  <script><![CDATA[(function(){
    const svg = document.documentElement;
    const gridLayer = document.getElementById('grid');
    const foodLayer = document.getElementById('food');
    const snakeLayer = document.getElementById('snake');
    const border = document.getElementById('board-border');

    // Grid config
    const CELL = ${CELL_PX}; // px per cell
    const GAP = ${GAP_PX};   // px gap to show grid lines
    const STEP_MS = 180; // snake step interval
    const CHAR_W = 5, CHAR_H = 7, SP = 1; // pixel font
    const BORDER = 1; // one-cell border around text

    function randInt(n){ return Math.floor(Math.random()*n); }

    function layout() {
      const TEXT = '${safe}'.toUpperCase();
      // Measure text in pixel-font columns
      let textCols = 0; for (let i=0;i<TEXT.length;i++){ textCols += CHAR_W; if (i<TEXT.length-1) textCols += SP; }
      const cols = (TEXT.length?textCols:CHAR_W) + BORDER*2;
      const rows = CHAR_H + BORDER*2;
      const w = cols*(CELL+GAP) - GAP;
      const h = rows*(CELL+GAP) - GAP;
      svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      svg.setAttribute('width', w);
      svg.setAttribute('height', h);
      border.setAttribute('width', Math.max(1,w-1));
      border.setAttribute('height', Math.max(1,h-1));

      // Draw background grid blocks and subtle grid lines
      const frGrid = document.createDocumentFragment();
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * (CELL + GAP);
          const y = r * (CELL + GAP);
          const cell = document.createElementNS('http://www.w3.org/2000/svg','rect');
          cell.setAttribute('x', x);
          cell.setAttribute('y', y);
          cell.setAttribute('width', CELL);
          cell.setAttribute('height', CELL);
          cell.setAttribute('rx', 2);
          cell.setAttribute('ry', 2);
          cell.setAttribute('class', 'grid-cell');
          cell.setAttribute('data-row', r);
          cell.setAttribute('data-col', c);
          frGrid.appendChild(cell);
        }
      }
      gridLayer.textContent = '';
      gridLayer.appendChild(frGrid);

      // Build pixel font for TEXT into food layer (offset by BORDER)
      const FONT=(function(){
        const m={}; const D=(ch,rows)=>m[ch]=rows;
        D('A',["01110","10001","10001","11111","10001","10001","10001"]);
        D('B',["11110","10001","10001","11110","10001","10001","11110"]);
        D('C',["01111","10000","10000","10000","10000","10000","01111"]);
        D('D',["11110","10001","10001","10001","10001","10001","11110"]);
        D('E',["11111","10000","10000","11110","10000","10000","11111"]);
        D('F',["11111","10000","10000","11110","10000","10000","10000"]);
        D('G',["01111","10000","10000","10111","10001","10001","01111"]);
        D('H',["10001","10001","10001","11111","10001","10001","10001"]);
        D('I',["11111","00100","00100","00100","00100","00100","11111"]);
        D('J',["00111","00010","00010","00010","00010","10010","01100"]);
        D('K',["10001","10010","10100","11000","10100","10010","10001"]);
        D('L',["10000","10000","10000","10000","10000","10000","11111"]);
        D('M',["10001","11011","10101","10001","10001","10001","10001"]);
        D('N',["10001","11001","10101","10011","10001","10001","10001"]);
        D('O',["01110","10001","10001","10001","10001","10001","01110"]);
        D('P',["11110","10001","10001","11110","10000","10000","10000"]);
        D('Q',["01110","10001","10001","10001","10101","10010","01101"]);
        D('R',["11110","10001","10001","11110","10100","10010","10001"]);
        D('S',["01111","10000","10000","01110","00001","00001","11110"]);
        D('T',["11111","00100","00100","00100","00100","00100","00100"]);
        D('U',["10001","10001","10001","10001","10001","10001","01110"]);
        D('V',["10001","10001","10001","10001","10001","01010","00100"]);
        D('W',["10001","10001","10001","10101","10101","10101","01010"]);
        D('X',["10001","01010","00100","00100","00100","01010","10001"]);
        D('Y',["10001","01010","00100","00100","00100","00100","00100"]);
        D('Z',["11111","00001","00010","00100","01000","10000","11111"]);
        D('0',["01110","10001","10011","10101","11001","10001","01110"]);
        D('1',["00100","01100","00100","00100","00100","00100","01110"]);
        D('2',["01110","10001","00001","00010","00100","01000","11111"]);
        D('3',["11110","00001","00001","01110","00001","00001","11110"]);
        D('4',["00010","00110","01010","10010","11111","00010","00010"]);
        D('5',["11111","10000","11110","00001","00001","10001","01110"]);
        D('6',["01110","10000","11110","10001","10001","10001","01110"]);
        D('7',["11111","00001","00010","00100","01000","01000","01000"]);
        D('8',["01110","10001","10001","01110","10001","10001","01110"]);
        D('9',["01110","10001","10001","01111","00001","00001","01110"]);
        D(' ',["00000","00000","00000","00000","00000","00000","00000"]);
        return m;
      })();

      const frFood = document.createDocumentFragment();
      const foodCells = [];
      let cursor = BORDER;
      for (let i=0;i<TEXT.length;i++){
        const ch = TEXT[i]; const pat = FONT[ch] || FONT[' '];
        for (let r=0;r<CHAR_H;r++){
          for (let c=0;c<CHAR_W;c++){
            if (pat[r][c]==='1'){
              const row = BORDER + r;
              const col = cursor + c;
              const x = col * (CELL + GAP);
              const y = row * (CELL + GAP);
              const rect = document.createElementNS('http://www.w3.org/2000/svg','rect');
              rect.setAttribute('x', x);
              rect.setAttribute('y', y);
              rect.setAttribute('width', CELL);
              rect.setAttribute('height', CELL);
              rect.setAttribute('rx', 2);
              rect.setAttribute('ry', 2);
              rect.setAttribute('class', 'food-cell');
              rect.setAttribute('data-row', row);
              rect.setAttribute('data-col', col);
              rect.setAttribute('data-active','1');
              frFood.appendChild(rect);
              foodCells.push(rect);
            }
          }
        }
        cursor += CHAR_W; if (i<TEXT.length-1) cursor += SP;
      }
      foodLayer.textContent = '';
      foodLayer.appendChild(frFood);

      function restoreFood(){
        for (const el of foodCells){
          el.setAttribute('data-active','1');
          el.style.fill = '#00C853';
          el.style.stroke = '#087F23';
          el.style.opacity = '1';
        }
      }

      // Snake state
      let snake = [];// array of {r,c}
      let SNAKE_LEN = 3; // starting length
      let EAT_COUNT = 0; // eaten since last growth

      function key(rc){ return rc.r + ',' + rc.c; }
      function occupiedSet(excludeTail){
        const s = new Set();
        for (let i=0; i<snake.length - (excludeTail?1:0); i++) s.add(key(snake[i]));
        return s;
      }
      function foodMap(){
        const m = new Map();
        for (const el of foodCells) if (el.getAttribute('data-active')==='1') m.set(el.getAttribute('data-row')+','+el.getAttribute('data-col'), el);
        return m;
      }

      // Render snake rectangles
      function renderSnake(){
        // Rebuild snake nodes each frame to avoid any residual trail artifacts
        while (snakeLayer.firstChild) snakeLayer.removeChild(snakeLayer.firstChild);
        for (let i=0;i<snake.length;i++){
          const seg = snake[i];
          const rect = document.createElementNS('http://www.w3.org/2000/svg','rect');
          rect.setAttribute('x', seg.c * (CELL + GAP));
          rect.setAttribute('y', seg.r * (CELL + GAP));
          rect.setAttribute('width', CELL);
          rect.setAttribute('height', CELL);
          rect.setAttribute('rx', 3);
          rect.setAttribute('ry', 3);
          rect.setAttribute('data-segment-index', i);
          rect.setAttribute('class', i===0 ? 'snake-head' : 'snake-body');
          snakeLayer.appendChild(rect);
        }
      }

      function resetSnake(){
        snake = [];
        // find a start not on food
        const fmap = foodMap();
        let sr=0, sc=0; let tries=0;
        do { sr = randInt(rows); sc = randInt(cols); tries++; if (tries>2000) break; } while (fmap.has(sr+','+sc));
        // Try right direction; if at right edge use left; else down; else up
        const options = [];
        if (sc+1<cols) options.push({r:sr,c:sc+1});
        if (sc-1>=0) options.push({r:sr,c:sc-1});
        if (sr+1<rows) options.push({r:sr+1,c:sc});
        if (sr-1>=0) options.push({r:sr-1,c:sc});
        const next = options[0] || {r:sr,c:Math.max(0,sc-1)};
        const dx = next.c - sc; const dy = next.r - sr;
        let third = { r: next.r + dy, c: next.c + dx };
        if (third.r<0||third.r>=rows||third.c<0||third.c>=cols || fmap.has(third.r+','+third.c)) {
          // fallback: try opposite direction for third
          third = { r: sr - dy, c: sc - dx };
          if (third.r<0||third.r>=rows||third.c<0||third.c>=cols || fmap.has(third.r+','+third.c)) {
            third = { r: sr, c: sc };
          }
        }
        snake.push({r:sr,c:sc});
        snake.push(next);
        if (snake.length<3) snake.push(third); else snake.splice(2,0,third);
        renderSnake();
      }

      function step(){
        const fmap = foodMap();
        if (!snake.length) resetSnake();
        // Determine next move randomly among valid neighbors
        const head = snake[0];
        const dirs = [ {dr:-1,dc:0}, {dr:1,dc:0}, {dr:0,dc:-1}, {dr:0,dc:1} ];
        // shuffle directions
        for (let i=dirs.length-1;i>0;i--){ const j=(Math.random()*(i+1))|0; const tmp=dirs[i]; dirs[i]=dirs[j]; dirs[j]=tmp; }
        const candidates = [];
        for (const d of dirs){
          const nr = head.r + d.dr, nc = head.c + d.dc;
          if (nr<0||nr>=rows||nc<0||nc>=cols) continue;
          candidates.push({nr,nc});
        }

        // Avoid immediate collision (allow stepping into current tail if not growing)
        const occ = occupiedSet(true);
        let chosen = null;
        for (const c of candidates){
          const keyc = c.nr+','+c.nc;
          if (!occ.has(keyc)) { chosen = c; break; }
        }
        if (!chosen) { // dead-end: reset board state
          resetSnake();
          return;
        }

        // Advance snake with variable length
        snake.unshift({r: chosen.nr, c: chosen.nc});
        const foodKey = chosen.nr+','+chosen.nc;
        if (fmap.has(foodKey)) {
          // Eat food: turn to background immediately and count it
          const fel = fmap.get(foodKey);
          fel.setAttribute('data-active','0');
          fel.style.fill = '#000000';
          fel.style.stroke = 'none';
          fel.style.opacity = '1';
          EAT_COUNT += 1;
          if (EAT_COUNT % 5 === 0) {
            SNAKE_LEN += 1;
            EAT_COUNT = 0;
          }
        }
        while (snake.length > SNAKE_LEN) snake.pop();
        renderSnake();

        // If all food eaten, restore and reset
        const remaining = foodCells.some(function(el){ return el.getAttribute('data-active')==='1'; });
        if (!remaining) {
          restoreFood();
          SNAKE_LEN = 3;
          EAT_COUNT = 0;
          resetSnake();
        }
      }

      resetSnake();
      setInterval(step, STEP_MS);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', layout);
    else layout();
  })();]]></script>
</svg>`;
}

export default function handler(req, res) {
  try {
    const text = sanitizeText(req.query.text);
    const size = req.query.size;
    const isStatic = (String(req.query.static).toLowerCase()==='1' || String(req.query.static).toLowerCase()==='true' || String(req.query.poster).toLowerCase()==='1' || String(req.query.poster).toLowerCase()==='true');
    const body = svgForText(text, size, isStatic);
    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).send(body);
  } catch (e) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.status(500).send('Server error');
  }
}
