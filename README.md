# 🤖 Geekageddon API  
🌍 https://geekageddon-api.vercel.app

### https://geekageddon.com

*Your open portal to latest geeky content and more.*

---

## 🧩 Overview
The **Geekageddon API** is a collection of lighthearted, useful, and nerdy endpoints — built to spark curiosity, humor, and creativity.  

Available endpoints are modular, so you can fetch what you need: jokes, quotes, facts, or anything else we add next.

## 🧩 1. Geek-Jokes API
=> Paste the below link in your github profile, and enjoy a randomly-selected hearty geeky-joke on your profile (changes on each profile visit)
🌍 https://geekageddon-api.vercel.app/api/jokes

> Random humor for developers, office survivors, and caffeine addicts ☕. The jokes can be categorized along with display customizations

![Animated_dash](https://geekageddon-api.vercel.app/api/jokes?borderAnimation=colorful-dash)

For more UI-Style customizations, checkout : [GEEK-JOKES.md](./GEEK-JOKES.md)


## 🧩 2. Geek-Quotes API
=> Paste the below link in your github profile, and enjoy a randomly-selected famous quote on your profile (changes on each profile visit)
🌍 https://geekageddon-api.vercel.app/api/quotes

> Motivational quotes for makers, devs, and teams. Filter by category and style the SVG with themes and parameters.

![Animated_dash](https://geekageddon-api.vercel.app/api/quotes?theme=aurora&borderAnimation=colorful-dash)

For more UI-Style customizations, checkout : [GEEK-QUOTES.md](./GEEK-QUOTES.md)



## 🔮 Upcoming APIs
API	Endpoint	Description

🧪 Geek-Facts	/api/facts	Random tech/science facts.
📰 Tech-News	/api/news	Latest headlines from the world of technology.
🚀 Startup-News	/api/startup	Curated news about tech startups and founders.

>🚧 These endpoints are in development and will roll out in phases.


### App health check endpoints
| Endpoint          | Description                                                    | Example                                                                                                          |
| ----------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **`/api/health`** | Health check for uptime and monitoring.                        | [🔗 health](https://geekageddon-api.vercel.app/api/health)                                                       |
| **`/api/echo`**   | Echoes back your JSON payload — useful for testing POST calls. | `curl -X POST -H "Content-Type: application/json" -d '{"msg":"Hi"}' https://geekageddon-api.vercel.app/api/echo` |


👩‍💻 Author
Created by Sanchi Varma
Part of the Geekageddon project suite.

💬 Contributions and ideas are welcome — especially if you’ve got a joke, quote, or news source to add!

⚖️ License
All rights reserved.
You may freely use the public APIs, but cannot copy or redistribute the source code without permission.

✨ Stay Tuned
More APIs are coming soon —follow Geekageddon.com for updates and release notes.
