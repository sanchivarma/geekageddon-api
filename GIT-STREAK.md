# GitStreak API

Endpoint: https://geekageddon-api.vercel.app/gitstreak?user=your-github-username

Live GitHub contribution streaks with themed SVG cards, optional graph, and hover tooltips per day.

## How to use 
 https://geekageddon-api.vercel.app/gitstreak?user=yourUserName&theme=themeName

### Required
Use `?user=githubUsername` to fetch stats for a GitHub profile.

### Theme Options
Use `?theme=themeName` to apply a predefined color scheme.

### Graph Option
Use `?showgraph=true/false` to toggle the contribution grid.
 ![Contribution-Graph](https://geekageddon-api.vercel.app/gitstreak?user=octocat&borderAnimation=dots&showgraph=true)

#### All Themes (with preview)
| Theme | Description | Preview |
|-------|-------------|---------|
| `default` | Dark navy with cyan accents | ![default](https://geekageddon-api.vercel.app/gitstreak?theme=default&user=octocat) |
| `terminal` | Terminal style with green accents | ![terminal](https://geekageddon-api.vercel.app/gitstreak?theme=terminal&user=octocat) |
| `dracula` | Classic Dracula palette | ![dracula](https://geekageddon-api.vercel.app/gitstreak?theme=dracula&user=octocat) |
| `tokyonight` | Tokyo Night inspired | ![tokyonight](https://geekageddon-api.vercel.app/gitstreak?theme=tokyonight&user=octocat) |
| `onedark` | One Dark inspired | ![onedark](https://geekageddon-api.vercel.app/gitstreak?theme=onedark&user=octocat) |
| `gotham` | Gotham dark tones | ![gotham](https://geekageddon-api.vercel.app/gitstreak?theme=gotham&user=octocat) |
| `light` | Light with blue accents | ![light](https://geekageddon-api.vercel.app/gitstreak?theme=light&user=octocat) |
| `paper` | Paper-like light theme | ![paper](https://geekageddon-api.vercel.app/gitstreak?theme=paper&user=octocat) |
| `milk` | Soft light look | ![milk](https://geekageddon-api.vercel.app/gitstreak?theme=milk&user=octocat) |
| `sunny` | Warm light palette | ![sunny](https://geekageddon-api.vercel.app/gitstreak?theme=sunny&user=octocat) |
| `matrix` | Green-on-black Matrix | ![matrix](https://geekageddon-api.vercel.app/gitstreak?theme=matrix&user=octocat) |
| `cyberpunk` | Neon cyberpunk vibes | ![cyberpunk](https://geekageddon-api.vercel.app/gitstreak?theme=cyberpunk&user=octocat) |
| `retro` | Retro arcade colors | ![retro](https://geekageddon-api.vercel.app/gitstreak?theme=retro&user=octocat) |
| `hacker` | Hacker terminal green | ![hacker](https://geekageddon-api.vercel.app/gitstreak?theme=hacker&user=octocat) |
| `synthwave` | 80s synthwave vibe | ![synthwave](https://geekageddon-api.vercel.app/gitstreak?theme=synthwave&user=octocat) |
| `github` | GitHub dark | ![github](https://geekageddon-api.vercel.app/gitstreak?theme=github&user=octocat) |
| `vscode` | VS Code dark | ![vscode](https://geekageddon-api.vercel.app/gitstreak?theme=vscode&user=octocat) |
| `gameboy` | Game Boy greens | ![gameboy](https://geekageddon-api.vercel.app/gitstreak?theme=gameboy&user=octocat) |
| `minecraft` | Minecraft greens | ![minecraft](https://geekageddon-api.vercel.app/gitstreak?theme=minecraft&user=octocat) |
| `stackoverflow` | Stack Overflow light | ![stackoverflow](https://geekageddon-api.vercel.app/gitstreak?theme=stackoverflow&user=octocat) |
| `pastel` | Soft pastel colors | ![pastel](https://geekageddon-api.vercel.app/gitstreak?theme=pastel&user=octocat) |
| `aurora` | Northern lights dark | ![aurora](https://geekageddon-api.vercel.app/gitstreak?theme=aurora&user=octocat) |
| `ocean` | Deep ocean blues | ![ocean](https://geekageddon-api.vercel.app/gitstreak?theme=ocean&user=octocat) |
| `forest` | Forest greens | ![forest](https://geekageddon-api.vercel.app/gitstreak?theme=forest&user=octocat) |
| `candy` | Sweet candy tones | ![candy](https://geekageddon-api.vercel.app/gitstreak?theme=candy&user=octocat) |
| `halloween` | Spooky orange/green | ![halloween](https://geekageddon-api.vercel.app/gitstreak?theme=halloween&user=octocat) |
| `christmas` | Festive red/green | ![christmas](https://geekageddon-api.vercel.app/gitstreak?theme=christmas&user=octocat) |
| `vaporwave` | Vaporwave neon | ![vaporwave](https://geekageddon-api.vercel.app/gitstreak?theme=vaporwave&user=octocat) |
| `nord` | Nord cool palette | ![nord](https://geekageddon-api.vercel.app/gitstreak?theme=nord&user=octocat) |
| `gruvbox` | Gruvbox warm dark | ![gruvbox](https://geekageddon-api.vercel.app/gitstreak?theme=gruvbox&user=octocat) |
| `solarized` | Solarized dark | ![solarized](https://geekageddon-api.vercel.app/gitstreak?theme=solarized&user=octocat) |
| `monokai` | Monokai classic | ![monokai](https://geekageddon-api.vercel.app/gitstreak?theme=monokai&user=octocat) |
| `sunset` | Sunset purples/orange | ![sunset](https://geekageddon-api.vercel.app/gitstreak?theme=sunset&user=octocat) |
| `rainbow` | Bold rainbow accents | ![rainbow](https://geekageddon-api.vercel.app/gitstreak?theme=rainbow&user=octocat) |

#### Border options (`?borderAnimation=`)
| Option | Description | Preview |
|-------|-------------|---------|
| `none` | Static outline (default) | ![none](https://geekageddon-api.vercel.app/gitstreak?user=octocat) |
| `dots` | Marching dotted outline | ![dots](https://geekageddon-api.vercel.app/gitstreak?borderAnimation=dots&user=octocat) |
| `rainbow` | Rotating rainbow gradient stroke | ![rainbow](https://geekageddon-api.vercel.app/gitstreak?borderAnimation=rainbow&user=octocat) |
| `rainbow-ants` | Rainbow marching ants | ![rainbow-ants](https://geekageddon-api.vercel.app/gitstreak?borderAnimation=rainbow-ants&user=octocat) |
| `rainbow-dots` | Rainbow marching dots | ![rainbow-dots](https://geekageddon-api.vercel.app/gitstreak?borderAnimation=rainbow-dots&user=octocat) |
| `rainbow-pulse-dots` | Pulsating rainbow dots around border | ![rainbow-pulse-dots](https://geekageddon-api.vercel.app/gitstreak?borderAnimation=rainbow-pulse-dots&user=octocat) |
| `ants` | Marching ants (theme colors) | ![ants](https://geekageddon-api.vercel.app/gitstreak?borderAnimation=ants&user=octocat) |
| `ants-mono` | Marching ants (monochrome) | ![ants-mono](https://geekageddon-api.vercel.app/gitstreak?borderAnimation=ants-mono&user=octocat) |
| `ants-color` | Marching ants (accent mix) | ![ants-color](https://geekageddon-api.vercel.app/gitstreak?borderAnimation=ants-color&user=octocat) |
| `double` | Two dashed borders, counter-moving | ![double](https://geekageddon-api.vercel.app/gitstreak?borderAnimation=double&user=octocat) |
| `scan` | Scanning highlight segment | ![scan](https://geekageddon-api.vercel.app/gitstreak?borderAnimation=scan&user=octocat) |
| `corners` | Pulsing corner dots | ![corners](https://geekageddon-api.vercel.app/gitstreak?borderAnimation=corners&user=octocat) |

Notes:
- `reduceMotion=true` disables animations for accessibility.

### Graph options
- `showgraph=true` to display the 6‑month grid (5 months back + 1 month ahead).
- Hover a cell to see `dd-mm-yy` date and contribution count.

### Custom Styling
Customize the card appearance using URL parameters.

#### Colors (use hex values with #)
- `bgColor` - Background color
- `textColor` - Text color
- `borderColor` - Circle/border color

### Sample Endpoints

| Description | Example |
|------------|---------|
| Basic SVG card | https://geekageddon-api.vercel.app/gitstreak?user=octocat |
| With theme | https://geekageddon-api.vercel.app/gitstreak?theme=dracula&user=octocat |
| With graph | https://geekageddon-api.vercel.app/gitstreak?showgraph=true&user=octocat |
| With border animation | https://geekageddon-api.vercel.app/gitstreak?borderAnimation=rainbow&user=octocat |
| JSON stats + SVG string | https://geekageddon-api.vercel.app/gitstreak?format=json&user=octocat |

### Response Format
If `format=json` is provided, the API returns JSON including stats and an `svg` string.  
Otherwise it returns an SVG image.
