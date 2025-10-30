# Geek Snake Game API

Endpoint: https://geekageddon-api.vercel.app/api/snake-game

Animated, grid-based classic Snake-Game rendered with provided input text.

### Parameters
Use query params to control the output.

| Param | Type | Default | Description |
|------|------|---------|-------------|
| `text` | string | `SNAKE` | Text to render in 5×7 pixel-block letters (letters, digits, spaces) |
| `size` | number | `2` | Block scale from `1` (smallest) to `5` (largest) |

### Previews

- Basic example (name + smaller blocks):
  
  ![Snake Game](https://geekageddon-api.vercel.app/api/snake-game?text=Sanchi&size=2)

- Larger blocks:
  
  ![Snake Game Large](https://geekageddon-api.vercel.app/api/snake-game?text=Sanchi&size=4)

- Different text:
  
  ![Snake Game Varma](https://geekageddon-api.vercel.app/api/snake-game?text=Varma&size=2)

### Behavior
- Renders text as solid 5×7 pixel-block letters with a 1-cell border around the name.
- Snake starts length 3, moves randomly on the grid, and avoids its body where possible.
- When it eats a green block, that block immediately turns to background (black).
- Grows by +1 segment after every 5 eaten blocks.
- When all green blocks are eaten, the text reappears and the loop restarts.

### Embedding Notes
- This is an animated SVG with inline script. For animation to run, embed with `<object>` or `<embed>`.
- Browsers generally do not execute SVG scripts inside an `<img>` tag.
- CORS headers are open (`Access-Control-Allow-Origin: *`) for easy embedding.

### Sample Endpoints

| Description | Example |
|------------|---------|
| Basic | https://geekageddon-api.vercel.app/api/snake-game?text=TEST&size=2 |
| Smallest blocks | https://geekageddon-api.vercel.app/api/snake-game?text=test&size=1 |
| Largest blocks | https://geekageddon-api.vercel.app/api/snake-game?text=Test&size=5 |


### Response Format
Returns a self-contained animated SVG. Layers are grouped for convenience (`data-layer="grid"`, `food`, `snake`).
