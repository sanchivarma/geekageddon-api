# 🤖 Geekageddon API  
🌍 https://geekageddon-api.vercel.app

*Your open portal to latest geeky content and more.*

---

## 🧩 Overview
The **Geekageddon API** is a collection of lighthearted, useful, and nerdy endpoints — built to spark curiosity, humor, and creativity.  

Available endpoints are modular, so you can fetch what you need: jokes, quotes, facts, or anything else we add next.

## 🧩 1. Geek-Jokes API
> The first live module of Geekageddon — random humor for developers, office survivors, and caffeine addicts ☕.

### 🧠 Endpoint : /api/jokes
### 🔹 Sample Endpoints

| Description | Example |
|--------------|----------|
| Get a random joke (any category) | [🔗 /api/jokes](https://geekageddon-api.vercel.app/api/jokes) |
| Filter by one category | [🔗 /api/jokes?category=programmer](https://geekageddon-api.vercel.app/api/jokes?category=programmer) |
| Multiple categories | [🔗 /api/jokes?category=programmer,hr](https://geekageddon-api.vercel.app/api/jokes?category=programmer,hr) |


For Example:

`GET /api/jokes?category=programmer,office`

**Response:**
```json
{
  "text": "Our team runs like a well-oiled machine — mostly leaking and full of noise.",
  "categories": ["office", "team"]
}
```

## 🔮 2. Upcoming APIs
API	Endpoint	Description
💬 Geek-Quotes	/api/quotes	Motivational or witty quotes for geeks.
🧪 Geek-Facts	/api/facts	Random tech/science facts.
📰 Tech-News	/api/news	Latest headlines from the world of technology.
🚀 Startup-News	/api/startup	Curated news about tech startups and founders.

>🚧 These endpoints are in development and will roll out in phases.


### App health check endpoints
| Endpoint          | Description                                                    | Example                                                                                                          |
| ----------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **`/api/health`** | Health check for uptime and monitoring.                        | [🔗 health](https://geekageddon-api.vercel.app/api/health)                                                       |
| **`/api/echo`**   | Echoes back your JSON payload — useful for testing POST calls. | `curl -X POST -H "Content-Type: application/json" -d '{"msg":"Hi"}' https://geekageddon-api.vercel.app/api/echo` |
