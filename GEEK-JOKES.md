# 🤖 Geek-Jokes 
🌍 https://geekageddon-api.vercel.app/api/jokes

> Random humor for developers, office survivors, and caffeine addicts ☕. The jokes can be categorized along with display customizations

### 🎯 Available Categories
Use `?category=categoryName` to display random jokes related to a specific category


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

### 🎨 Theme Options
Use `?theme=themeName` to apply a predefined color scheme:

#### 🌓 Classic Themes
| Theme | Description |
|-------|-------------|
| `default` | Dark navy with cyan accents |
| `terminal` | Dark terminal style with green accents |
| `dracula` | Classic Dracula theme colors |
| `tokyonight` | Tokyo Night theme inspired |
| `onedark` | Atom One Dark inspired theme |
| `gotham` | Dark Gotham colors |
| `light` | Light theme with blue accents |
| `paper` | Light paper-like theme |
| `milk` | Soft light theme |
| `sunny` | Warm light theme |

#### 🎮 Geeky Themes
| Theme | Description | Preview |
|-------|-------------|---------|
| `matrix` | The Matrix inspired green-on-black | ![Matrix Theme](https://geekageddon-api.vercel.app/api/jokes?theme=matrix&category=programmer) |
| `cyberpunk` | Neon-bright cyberpunk aesthetic | ![Cyberpunk Theme](https://geekageddon-api.vercel.app/api/jokes?theme=cyberpunk&category=programmer) |
| `synthwave` | 80s synthwave style | ![Synthwave Theme](https://geekageddon-api.vercel.app/api/jokes?theme=synthwave) |
| `github` | GitHub dark theme | ![GitHub Theme](https://geekageddon-api.vercel.app/api/jokes?theme=github&category=programmer) |
| `hacker` | Classic hacker terminal look | ![Hacker Theme](https://geekageddon-api.vercel.app/api/jokes?theme=hacker&category=programmer) |

#### 🎮 Border options (?borderAnimation=<>)
| Theme | Description | Preview |
|-------|-------------|---------|
| `dash` | Animated dash | ![Animated_dash](https://geekageddon-api.vercel.app/api/jokes?borderAnimation=dash) |
| `neon` | Neon look | ![Neon](https://geekageddon-api.vercel.app/api/jokes?borderAnimation=neon) |
| `gradient` | gradient | ![Gradient](https://geekageddon-api.vercel.app/api/jokes?borderAnimation=gradient&reduceMotion=true) |
| `colorful-dash` | Animated blinking dash | ![Animated_dash](https://geekageddon-api.vercel.app/api/jokes?borderAnimation=colorful-dash) |
| `colorful-dots` | Animated blinking dots | ![Animated_dash](https://geekageddon-api.vercel.app/api/jokes?borderAnimation=colorful-dots) |


### Theme Samples

Here are some examples of different joke styles with various themes:

#### Random Joke with Dracula Theme and animated border
![QA Dracula](https://geekageddon-api.vercel.app/api/jokes?theme=dracula?category=qna&borderAnimation=colorful-dash)

#### Programming Joke with Tokyo Night Theme
![Programming Tokyo Night](https://geekageddon-api.vercel.app/api/jokes?theme=tokyonight&category=programmer)

#### Custom Styled Joke
![Custom Style](https://geekageddon-api.vercel.app/api/jokes?bgColor=%23073b4c&textColor=%2306d6a0&borderColor=%2306d6a0&width=500&fontSize=16)

#### Light Theme for Documentation
![Stack Overflow Style](https://geekageddon-api.vercel.app/api/jokes?theme=stackoverflow&category=programmer)

### 🎪 Custom Styling
Customize the card appearance using URL parameters:

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

### 🔹 Sample Endpoints

| Description | Example |
|------------|----------|
| Basic random joke | [🔗 /api/jokes](https://geekageddon-api.vercel.app/api/jokes) |
| Filter by category | [🔗 /api/jokes?category=programmer](https://geekageddon-api.vercel.app/api/jokes?category=programmer) |
| Multiple categories | [🔗 /api/jokes?category=qna,javascript](https://geekageddon-api.vercel.app/api/jokes?category=qna,javascript) |
| With theme | [🔗 /api/jokes?theme=dracula](https://geekageddon-api.vercel.app/api/jokes?theme=dracula) |
| Custom colors | [🔗 /api/jokes?bgColor=#073b4c&textColor=#06d6a0&borderColor=#06d6a0](https://geekageddon-api.vercel.app/api/jokes?bgColor=#073b4c&textColor=#06d6a0&borderColor=#06d6a0) |
| Custom layout | [🔗 /api/jokes?fontSize=16&width=600](https://geekageddon-api.vercel.app/api/jokes?fontSize=16&width=600) |
| Full customization | [🔗 /api/jokes?theme=dark&category=qna&fontSize=18&width=550](https://geekageddon-api.vercel.app/api/jokes?theme=dark&category=qna&fontSize=18&width=550) |

### 📤 Response Format
The API returns an SVG image with the joke text styled according to the theme or custom parameters.

For Q&A format jokes, questions and answers are styled differently using the theme's qColor and aColor respectively.
