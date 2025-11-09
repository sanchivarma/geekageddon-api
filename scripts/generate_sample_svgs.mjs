import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Import the generator; ensure Node resolves ESM (this file is .mjs)
import { generateJokeSVG } from '../api/jokes/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  const outDir = path.join(__dirname, '..', 'outputs');
  await fs.mkdir(outDir, { recursive: true });

  // Sample joke object
  const sampleQnA = { q: 'Why do programmers prefer dark mode?', a: 'Because light attracts bugs!' };
  const sampleText = { text: "I told my computer I needed a break, and it said 'No problem — I'll go to sleep.'" };

  const themes = [
    { name: 'default', theme: { bgColor: '#0f172a', borderColor: '#22d3ee', textColor: '#e2e8f0', qColor: '#fbbf24', aColor: '#34d399' } },
  ];

  const borderTypes = ['none', 'dash', 'gradient', 'neon'];

  for (const bt of borderTypes) {
    const svg1 = generateJokeSVG(sampleQnA, themes[0].theme, { borderAnimation: bt, reduceMotion: false });
    await fs.writeFile(path.join(outDir, `qna-${bt}.svg`), svg1, 'utf8');

    const svg2 = generateJokeSVG(sampleText, themes[0].theme, { borderAnimation: bt, reduceMotion: false });
    await fs.writeFile(path.join(outDir, `text-${bt}.svg`), svg2, 'utf8');
  }

}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
