import fs from "fs";
import path from "path";

export default function handler(req, res) {
  const filePath = path.join(process.cwd(), "data", "jokes.json");
  const jokes = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const { category } = req.query;

  let filtered = jokes;
  if (category) {
    const categories = category.split(",").map((c) => c.trim().toLowerCase());
    filtered = jokes.filter((j) =>
      j.categories.some((c) => categories.includes(c.toLowerCase()))
    );
  }

  if (!filtered.length) {
    res.status(404);
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.send("No jokes found for given category.");
  }

  const joke = filtered[Math.floor(Math.random() * filtered.length)];

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.status(200).send(joke.text);
}
