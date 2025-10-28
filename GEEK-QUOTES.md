# Geek Quotes API

Endpoint: https://geekageddon-api.vercel.app/api/quotes

Motivational quotes for makers, devs, and teams. Filter by category and style the SVG with themes and parameters.

### Categories
Use `?category=categoryName` to display a random quote from a category.

| Category | Description |
|----------|-------------|
| `inspiration` | Motivational and inspirational quotes |
| `productivity` | Productivity, deep work, and focus |
| `grit` | Discipline, perseverance, and resilience |
| `mindset` | Belief, confidence, and growth mindset |
| `habits` | Systems and habit building |
| `success` | Achievement and progress |
| `focus` | Concentration and prioritization |
| `team` | Teamwork and collaboration |
| `leadership` | Leadership and strategy |
| `learning` | Learning and improvement |
| `goals` | Goal setting and execution |
| `simplicity` | Simplicity, clarity, and design |
| `start` | Getting started and momentum |

### Theme Options
Use `?theme=themeName` to apply a predefined color scheme.

#### All Themes (with preview)
| Theme | Description | Preview |
|-------|-------------|---------|
| `default` | Dark navy with cyan accents | ![default](https://geekageddon-api.vercel.app/api/quotes?theme=default&category=grit) |
| `terminal` | Terminal style with green accents | ![terminal](https://geekageddon-api.vercel.app/api/quotes?theme=terminal&category=grit) |
| `dracula` | Classic Dracula palette | ![dracula](https://geekageddon-api.vercel.app/api/quotes?theme=dracula&category=grit) |
| `tokyonight` | Tokyo Night inspired | ![tokyonight](https://geekageddon-api.vercel.app/api/quotes?theme=tokyonight&category=grit) |
| `onedark` | One Dark inspired | ![onedark](https://geekageddon-api.vercel.app/api/quotes?theme=onedark&category=grit) |
| `gotham` | Gotham dark tones | ![gotham](https://geekageddon-api.vercel.app/api/quotes?theme=gotham&category=grit) |
| `light` | Light with blue accents | ![light](https://geekageddon-api.vercel.app/api/quotes?theme=light&category=grit) |
| `paper` | Paper-like light theme | ![paper](https://geekageddon-api.vercel.app/api/quotes?theme=paper&category=grit) |
| `milk` | Soft light look | ![milk](https://geekageddon-api.vercel.app/api/quotes?theme=milk&category=grit) |
| `sunny` | Warm light palette | ![sunny](https://geekageddon-api.vercel.app/api/quotes?theme=sunny&category=grit) |
| `matrix` | Green-on-black Matrix | ![matrix](https://geekageddon-api.vercel.app/api/quotes?theme=matrix&category=grit) |
| `cyberpunk` | Neon cyberpunk vibes | ![cyberpunk](https://geekageddon-api.vercel.app/api/quotes?theme=cyberpunk&category=grit) |
| `retro` | Retro arcade colors | ![retro](https://geekageddon-api.vercel.app/api/quotes?theme=retro&category=grit) |
| `hacker` | Hacker terminal green | ![hacker](https://geekageddon-api.vercel.app/api/quotes?theme=hacker&category=grit) |
| `synthwave` | 80s synthwave vibe | ![synthwave](https://geekageddon-api.vercel.app/api/quotes?theme=synthwave&category=grit) |
| `github` | GitHub dark | ![github](https://geekageddon-api.vercel.app/api/quotes?theme=github&category=grit) |
| `vscode` | VS Code dark | ![vscode](https://geekageddon-api.vercel.app/api/quotes?theme=vscode&category=grit) |
| `gameboy` | Game Boy greens | ![gameboy](https://geekageddon-api.vercel.app/api/quotes?theme=gameboy&category=grit) |
| `minecraft` | Minecraft greens | ![minecraft](https://geekageddon-api.vercel.app/api/quotes?theme=minecraft&category=grit) |
| `stackoverflow` | Stack Overflow light | ![stackoverflow](https://geekageddon-api.vercel.app/api/quotes?theme=stackoverflow&category=grit) |
| `pastel` | Soft pastel colors | ![pastel](https://geekageddon-api.vercel.app/api/quotes?theme=pastel&category=grit) |
| `aurora` | Northern lights dark | ![aurora](https://geekageddon-api.vercel.app/api/quotes?theme=aurora&category=grit) |
| `ocean` | Deep ocean blues | ![ocean](https://geekageddon-api.vercel.app/api/quotes?theme=ocean&category=grit) |
| `forest` | Forest greens | ![forest](https://geekageddon-api.vercel.app/api/quotes?theme=forest&category=grit) |
| `candy` | Sweet candy tones | ![candy](https://geekageddon-api.vercel.app/api/quotes?theme=candy&category=grit) |
| `halloween` | Spooky orange/green | ![halloween](https://geekageddon-api.vercel.app/api/quotes?theme=halloween&category=grit) |
| `christmas` | Festive red/green | ![christmas](https://geekageddon-api.vercel.app/api/quotes?theme=christmas&category=grit) |
| `vaporwave` | Vaporwave neon | ![vaporwave](https://geekageddon-api.vercel.app/api/quotes?theme=vaporwave&category=grit) |
| `nord` | Nord cool palette | ![nord](https://geekageddon-api.vercel.app/api/quotes?theme=nord&category=grit) |
| `gruvbox` | Gruvbox warm dark | ![gruvbox](https://geekageddon-api.vercel.app/api/quotes?theme=gruvbox&category=grit) |
| `solarized` | Solarized dark | ![solarized](https://geekageddon-api.vercel.app/api/quotes?theme=solarized&category=grit) |
| `monokai` | Monokai classic | ![monokai](https://geekageddon-api.vercel.app/api/quotes?theme=monokai&category=grit) |
| `sunset` | Sunset purples/orange | ![sunset](https://geekageddon-api.vercel.app/api/quotes?theme=sunset&category=grit) |
| `rainbow` | Bold rainbow accents | ![rainbow](https://geekageddon-api.vercel.app/api/quotes?theme=rainbow&category=grit) |

#### Border options (`?borderAnimation=`)
| Option | Description | Preview |
|-------|-------------|---------|
| `none` | Static outline (default) | ![none](https://geekageddon-api.vercel.app/api/quotes) |
| `dash` | Animated dash | ![dash](https://geekageddon-api.vercel.app/api/quotes?borderAnimation=dash) |
| `dots` | Marching dotted outline | ![dots](https://geekageddon-api.vercel.app/api/quotes?borderAnimation=dots) |
| `gradient` | Animated gradient sweep | ![gradient](https://geekageddon-api.vercel.app/api/quotes?borderAnimation=gradient&reduceMotion=true) |
| `neon` | Neon glow via filter | ![neon](https://geekageddon-api.vercel.app/api/quotes?borderAnimation=neon) |
| `gif` | Image mask border (needs `borderImage`) | ![gif](https://geekageddon-api.vercel.app/api/quotes?borderAnimation=gif&borderImage=https://example.com/overlay.gif) |
| `colorful-dash` | Color-cycling dashed border | ![colorful-dash](https://geekageddon-api.vercel.app/api/quotes?borderAnimation=colorful-dash) |
| `colorful-dots` | Color-cycling dotted border | ![colorful-dots](https://geekageddon-api.vercel.app/api/quotes?borderAnimation=colorful-dots) |
| `rainbow` | Rotating rainbow gradient stroke | ![rainbow](https://geekageddon-api.vercel.app/api/quotes?borderAnimation=rainbow) |
| `rainbow-ants` | Rainbow marching ants | ![rainbow-ants](https://geekageddon-api.vercel.app/api/quotes?borderAnimation=rainbow-ants) |
| `rainbow-dots` | Rainbow marching dots | ![rainbow-dots](https://geekageddon-api.vercel.app/api/quotes?borderAnimation=rainbow-dots) |
| `rainbow-pulse-dots` | Pulsating rainbow dots around border | ![rainbow-pulse-dots](https://geekageddon-api.vercel.app/api/quotes?borderAnimation=rainbow-pulse-dots) |
| `ants` | Marching ants (theme colors) | ![ants](https://geekageddon-api.vercel.app/api/quotes?borderAnimation=ants) |
| `ants-mono` | Marching ants (monochrome) | ![ants-mono](https://geekageddon-api.vercel.app/api/quotes?borderAnimation=ants-mono) |
| `ants-color` | Marching ants (accent mix) | ![ants-color](https://geekageddon-api.vercel.app/api/quotes?borderAnimation=ants-color) |
| `double` | Two dashed borders, counter-moving | ![double](https://geekageddon-api.vercel.app/api/quotes?borderAnimation=double) |
| `scan` | Scanning highlight segment | ![scan](https://geekageddon-api.vercel.app/api/quotes?borderAnimation=scan) |
| `corners` | Pulsing corner dots | ![corners](https://geekageddon-api.vercel.app/api/quotes?borderAnimation=corners) |

Notes:
- `reduceMotion=true` disables animations for accessibility.
- `gif` requires `borderImage` URL (ensure CORS if cross-origin).

### Theme Samples

Some examples of different quote styles with various themes:

#### Quote with Dracula Theme and animated border
![Dracula Quote](https://geekageddon-api.vercel.app/api/quotes?theme=dracula&category=grit&borderAnimation=colorful-dash)

#### Focus Quote with Tokyo Night Theme
![Tokyo Night Quote](https://geekageddon-api.vercel.app/api/quotes?theme=tokyonight&category=focus)

#### Custom Styled Quote
![Custom Quote](https://geekageddon-api.vercel.app/api/quotes?bgColor=%23073b4c&textColor=%2306d6a0&borderColor=%2306d6a0&width=520&fontSize=16)

#### Documentation-friendly Light Theme
![SO Style Quote](https://geekageddon-api.vercel.app/api/quotes?theme=stackoverflow&category=inspiration)

### Custom Styling
Customize the card appearance using URL parameters.

#### Colors (use hex values with #)
- `bgColor` - Background color
- `textColor` - Regular text color
- `borderColor` - Border color
- `aColor` - Author line color (author is styled in italic)

#### Layout
- `fontSize` - Text size (default: 14)
- `width` - Card width (default: 480)
- `padding` - Edge padding (default: 24)
- `lineHeight` - Space between lines (default: 20)

### Sample Endpoints

| Description | Example |
|------------|---------|
| Basic random quote | https://geekageddon-api.vercel.app/api/quotes |
| Filter by category | https://geekageddon-api.vercel.app/api/quotes?category=grit |
| With theme | https://geekageddon-api.vercel.app/api/quotes?theme=dracula |
| Theme + category | https://geekageddon-api.vercel.app/api/quotes?theme=dracula&category=grit |
| Custom colors | https://geekageddon-api.vercel.app/api/quotes?bgColor=%23073b4c&textColor=%2306d6a0&borderColor=%2306d6a0 |
| Custom layout | https://geekageddon-api.vercel.app/api/quotes?fontSize=16&width=600 |

### Response Format
Returns an SVG card with the quote text and optional author line (italic) styled according to the theme or custom parameters.
