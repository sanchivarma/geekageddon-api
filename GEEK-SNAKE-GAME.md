# Geek Snake Game API

Endpoint: https://geekageddon-api.vercel.app/snake-game

Animated, grid-based Snake rendered entirely with green blocks that form your text.

### Parameters
Use query params to control the output.

| Param | Type | Default | Description |
|------|------|---------|-------------|
| `text` | string | `SNAKE` | Text to render in 5x7 pixel-block letters (letters, digits, spaces) |
| `size` | number | `2` | Block scale from `1` (smallest) to `5` (largest) |
| `static` | boolean | `false` | When `true`, returns a static SVG preview (for Markdown `<img>`) |

### Previews

- Basic example (Markdown-safe static preview):
  
  ![Snake Game](https://geekageddon-api.vercel.app/snake-game.svg?text=TEST&size=2&static=1)

- Larger blocks (Markdown-safe static preview):
  
  ![Snake Game Large](https://geekageddon-api.vercel.app/snake-game.svg?text=TEST&size=4&static=1)

### Behavior
- Renders text as solid 5x7 pixel-block letters with a 1-cell border around the name.
- Snake starts length 3, moves randomly on the grid, and avoids its body where possible.
- When it eats a green block, that block immediately turns to background (black).
- Grows by +1 segment after every 5 eaten blocks.
- When all green blocks are eaten, the text reappears and the loop restarts.

### Embedding Notes
- For Markdown `<img>` (like GitHub README), use `&static=1` to render a static preview. Markdown renderers do not execute SVG scripts.
- For live animation on web pages, embed with `<object>` or `<embed>`.
- CORS headers are open (`Access-Control-Allow-Origin: *`).

### Sample Endpoints

| Description | Example |
|------------|---------|
| Basic (animated) | ![](https://geekageddon-api.vercel.app/snake-game.svg?text=TEST&size=2&static=1) |
| Smallest blocks | ![](https://geekageddon-api.vercel.app/snake-game.svg?text=TEST&size=1&static=1) |
| Largest blocks | ![](https://geekageddon-api.vercel.app/snake-game.svg?text=TEST&size=5&static=1) |
| Static preview (Markdown) | ![](https://geekageddon-api.vercel.app/snake-game.svg?text=TEST&size=2&static=1) |

### Response Format
Returns a self-contained SVG. For animation, the SVG includes inline script; for Markdown static previews, pass `&static=1` to render without script.



