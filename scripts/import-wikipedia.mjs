#!/usr/bin/env node
/**
 * Copie de secours des résultats Wikipédia dans src/resultats.json (lancé avant dev et build).
 * L'application se met ensuite à jour toute seule depuis Wikipédia (src/wikipedia.mjs).
 *
 *   npm run import:wiki
 *
 * Si Wikipédia ne répond pas, le fichier actuel est conservé tel quel.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { buildResultats, sameResults } from '../src/wikipedia.mjs';

const OUT = fileURLToPath(new URL('../src/resultats.json', import.meta.url));
const UA = 'PodiumDakarImport/1.0 (https://github.com/MalickDevWeb/resultat-joj)';

let prev = null;
try {
  prev = JSON.parse(await readFile(OUT, 'utf8'));
} catch {}

try {
  const out = await buildResultats({ prev, headers: { 'User-Agent': UA }, log: console.log });
  if (sameResults(prev, out)) {
    console.log(`\nAucun changement (${out.events.length} podiums, ${out.pending.length} à venir).`);
  } else {
    await writeFile(OUT, JSON.stringify(out, null, 1) + '\n');
    console.log(`\n${out.events.length} podiums, ${out.pending.length} épreuves à venir -> ${OUT}`);
  }
} catch (e) {
  console.error(`\n${e.message} : les résultats actuels sont conservés.`);
  process.exit(prev ? 0 : 1);
}
