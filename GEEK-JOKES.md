# Geek Jokes API

Endpoint: https://geekageddon-api.vercel.app/api/jokes

Random humor for developers, office survivors, and caffeine addicts. The jokes can be filtered by category and styled via themes and parameters.

### Categories
Use `?category=categoryName` to display random jokes from a category.

| Category | Description |
|----------|-------------|
| `programmer` | Programming and developer jokes |
| `database` | Database and SQL related humor |
| `office` | Office life and work culture jokes |
| `hr` | Human Resources related humor |
| `qna` | Question and Answer format jokes |
| `javascript` | JavaScript specific jokes |
| `frontend` | Frontend development jokes |
| `C++` | C++ programming jokes |

### Theme Options
Use `?theme=themeName` to apply a predefined color scheme.

#### All Themes (with preview)
| Theme | Description | Preview |
|-------|-------------|---------|
| `default` | Dark navy with cyan accents | ![default](https://geekageddon-api.vercel.app/api/jokes?theme=default&category=programmer) |
| `terminal` | Terminal style with green accents | ![terminal](https://geekageddon-api.vercel.app/api/jokes?theme=terminal&category=programmer) |
| `dracula` | Classic Dracula palette | ![dracula](https://geekageddon-api.vercel.app/api/jokes?theme=dracula&category=programmer) |
| `tokyonight` | Tokyo Night inspired | ![tokyonight](https://geekageddon-api.vercel.app/api/jokes?theme=tokyonight&category=programmer) |
| `onedark` | One Dark inspired | ![onedark](https://geekageddon-api.vercel.app/api/jokes?theme=onedark&category=programmer) |
| `gotham` | Gotham dark tones | ![gotham](https://geekageddon-api.vercel.app/api/jokes?theme=gotham&category=programmer) |
| `light` | Light with blue accents | ![light](https://geekageddon-api.vercel.app/api/jokes?theme=light&category=programmer) |
| `paper` | Paper-like light theme | ![paper](https://geekageddon-api.vercel.app/api/jokes?theme=paper&category=programmer) |
| `milk` | Soft light look | ![milk](https://geekageddon-api.vercel.app/api/jokes?theme=milk&category=programmer) |
| `sunny` | Warm light palette | ![sunny](https://geekageddon-api.vercel.app/api/jokes?theme=sunny&category=programmer) |
| `matrix` | Green-on-black Matrix | ![matrix](https://geekageddon-api.vercel.app/api/jokes?theme=matrix&category=programmer) |
| `cyberpunk` | Neon cyberpunk vibes | ![cyberpunk](https://geekageddon-api.vercel.app/api/jokes?theme=cyberpunk&category=programmer) |
| `retro` | Retro arcade colors | ![retro](https://geekageddon-api.vercel.app/api/jokes?theme=retro&category=programmer) |
| `hacker` | Hacker terminal green | ![hacker](https://geekageddon-api.vercel.app/api/jokes?theme=hacker&category=programmer) |
| `synthwave` | 80s synthwave vibe | ![synthwave](https://geekageddon-api.vercel.app/api/jokes?theme=synthwave&category=programmer) |
| `github` | GitHub dark | ![github](https://geekageddon-api.vercel.app/api/jokes?theme=github&category=programmer) |
| `vscode` | VS Code dark | ![vscode](https://geekageddon-api.vercel.app/api/jokes?theme=vscode&category=programmer) |
| `gameboy` | Game Boy greens | ![gameboy](https://geekageddon-api.vercel.app/api/jokes?theme=gameboy&category=programmer) |
| `minecraft` | Minecraft greens | ![minecraft](https://geekageddon-api.vercel.app/api/jokes?theme=minecraft&category=programmer) |
| `stackoverflow` | Stack Overflow light | ![stackoverflow](https://geekageddon-api.vercel.app/api/jokes?theme=stackoverflow&category=programmer) |
| `pastel` | Soft pastel colors | ![pastel](https://geekageddon-api.vercel.app/api/jokes?theme=pastel&category=programmer) |
| `aurora` | Northern lights dark | ![aurora](https://geekageddon-api.vercel.app/api/jokes?theme=aurora&category=programmer) |
| `ocean` | Deep ocean blues | ![ocean](https://geekageddon-api.vercel.app/api/jokes?theme=ocean&category=programmer) |
| `forest` | Forest greens | ![forest](https://geekageddon-api.vercel.app/api/jokes?theme=forest&category=programmer) |
| `candy` | Sweet candy tones | ![candy](https://geekageddon-api.vercel.app/api/jokes?theme=candy&category=programmer) |
| `halloween` | Spooky orange/green | ![halloween](https://geekageddon-api.vercel.app/api/jokes?theme=halloween&category=programmer) |
| `christmas` | Festive red/green | ![christmas](https://geekageddon-api.vercel.app/api/jokes?theme=christmas&category=programmer) |
| `vaporwave` | Vaporwave neon | ![vaporwave](https://geekageddon-api.vercel.app/api/jokes?theme=vaporwave&category=programmer) |
| `nord` | Nord cool palette | ![nord](https://geekageddon-api.vercel.app/api/jokes?theme=nord&category=programmer) |
| `gruvbox` | Gruvbox warm dark | ![gruvbox](https://geekageddon-api.vercel.app/api/jokes?theme=gruvbox&category=programmer) |
| `solarized` | Solarized dark | ![solarized](https://geekageddon-api.vercel.app/api/jokes?theme=solarized&category=programmer) |
| `monokai` | Monokai classic | ![monokai](https://geekageddon-api.vercel.app/api/jokes?theme=monokai&category=programmer) |
| `sunset` | Sunset purples/orange | ![sunset](https://geekageddon-api.vercel.app/api/jokes?theme=sunset&category=programmer) |
| `rainbow` | Bold rainbow accents | ![rainbow](https://geekageddon-api.vercel.app/api/jokes?theme=rainbow&category=programmer) |

#### Border options (`?borderAnimation=`)
| Option | Description | Preview |
|-------|-------------|---------|
| `none` | Static outline (default) | ![none](https://geekageddon-api.vercel.app/api/jokes) |
| `dash` | Animated dash | ![dash](https://geekageddon-api.vercel.app/api/jokes?borderAnimation=dash) |
| `dots` | Marching dotted outline | ![dots](https://geekageddon-api.vercel.app/api/jokes?borderAnimation=dots) |
| `gradient` | Animated gradient sweep | ![gradient](https://geekageddon-api.vercel.app/api/jokes?borderAnimation=gradient&reduceMotion=true) |
| `neon` | Neon glow via filter | ![neon](https://geekageddon-api.vercel.app/api/jokes?borderAnimation=neon) |
| `gif` | Image mask border (needs `borderImage`) | ![gif](https://geekageddon-api.vercel.app/api/jokes?borderAnimation=gif&borderImage=https://example.com/overlay.gif) |
| `colorful-dash` | Color-cycling dashed border | ![colorful-dash](https://geekageddon-api.vercel.app/api/jokes?borderAnimation=colorful-dash) |
| `colorful-dots` | Color-cycling dotted border | ![colorful-dots](https://geekageddon-api.vercel.app/api/jokes?borderAnimation=colorful-dots) |
| `rainbow` | Rotating rainbow gradient stroke | ![rainbow](https://geekageddon-api.vercel.app/api/jokes?borderAnimation=rainbow) |
| `rainbow-ants` | Rainbow marching ants | ![rainbow-ants](https://geekageddon-api.vercel.app/api/jokes?borderAnimation=rainbow-ants) |
| `rainbow-dots` | Rainbow marching dots | ![rainbow-dots](https://geekageddon-api.vercel.app/api/jokes?borderAnimation=rainbow-dots) |
| `rainbow-pulse-dots` | Pulsating rainbow dots around border | ![rainbow-pulse-dots](https://geekageddon-api.vercel.app/api/jokes?borderAnimation=rainbow-pulse-dots) |
| `ants` | Marching ants (theme colors) | ![ants](https://geekageddon-api.vercel.app/api/jokes?borderAnimation=ants) |
| `ants-mono` | Marching ants (monochrome) | ![ants-mono](https://geekageddon-api.vercel.app/api/jokes?borderAnimation=ants-mono) |
| `ants-color` | Marching ants (accent mix) | ![ants-color](https://geekageddon-api.vercel.app/api/jokes?borderAnimation=ants-color) |
| `double` | Two dashed borders, counter-moving | ![double](https://geekageddon-api.vercel.app/api/jokes?borderAnimation=double) |
| `scan` | Scanning highlight segment | ![scan](https://geekageddon-api.vercel.app/api/jokes?borderAnimation=scan) |
| `corners` | Pulsing corner dots | ![corners](https://geekageddon-api.vercel.app/api/jokes?borderAnimation=corners) |

Notes:
- `reduceMotion=true` disables animations for accessibility.
- `gif` requires `borderImage` URL (ensure CORS if cross-origin).

### Theme Samples

Some examples of different joke styles with various themes:

#### Random Joke with Dracula Theme and animated border
![QA Dracula](https://geekageddon-api.vercel.app/api/jokes?theme=dracula&category=qna&borderAnimation=colorful-dash)

#### Programming Joke with Tokyo Night Theme
![Programming Tokyo Night](https://geekageddon-api.vercel.app/api/jokes?theme=tokyonight&category=programmer)

#### Custom Styled Joke
![Custom Style](https://geekageddon-api.vercel.app/api/jokes?bgColor=%23073b4c&textColor=%2306d6a0&borderColor=%2306d6a0&width=500&fontSize=16)

#### Light Theme for Documentation
![Stack Overflow Style](https://geekageddon-api.vercel.app/api/jokes?theme=stackoverflow&category=programmer)

### Custom Styling
Customize the card appearance using URL parameters.

#### Colors (use hex values with #)
- `bgColor` - Background color
- `textColor` - Regular text color
- `borderColor` - Border color
- `qColor` - Question color (for Q&A jokes)
- `aColor` - Answer color (for Q&A jokes)
- `codeColor` - Code snippet color

#### Layout
- `fontSize` - Text size (default: 14)
- `width` - Card width (default: 480)
- `padding` - Edge padding (default: 24)
- `lineHeight` - Space between lines (default: 20)

### Sample Endpoints

| Description | Example |
|------------|---------|
| Basic random joke | https://geekageddon-api.vercel.app/api/jokes |
| Filter by category | https://geekageddon-api.vercel.app/api/jokes?category=programmer |
| Multiple categories | https://geekageddon-api.vercel.app/api/jokes?category=qna,javascript |
| With theme | https://geekageddon-api.vercel.app/api/jokes?theme=dracula |
| Custom colors | https://geekageddon-api.vercel.app/api/jokes?bgColor=%23073b4c&textColor=%2306d6a0&borderColor=%2306d6a0 |
| Custom layout | https://geekageddon-api.vercel.app/api/jokes?fontSize=16&width=600 |
| Full customization | https://geekageddon-api.vercel.app/api/jokes?theme=dracula&category=qna&fontSize=18&width=550 |

### Response Format
The API returns an SVG image with the joke text styled according to the theme or custom parameters.

For Q&A format jokes, questions and answers are styled differently using the theme's `qColor` and `aColor` respectively.
