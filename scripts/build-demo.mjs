/**
 * Build web de demonstração para o portfólio: app sem backend, com os dados anonimizados de
 * src/demo/fixtures.json (gerados por scripts/capture-demo-fixtures.mjs).
 *
 *   npm run build:demo   →  ../../portfolio/public/demos/vanbora
 *
 * Mais leve para a web: a fonte de ícones (Ionicons, ~1.350 ícones) é reduzida aos ícones que o
 * app realmente usa — todo nome de ícone que aparece no código ou nos dados da demo.
 */
import { execSync } from 'node:child_process';
import { cpSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import subsetFont from 'subset-font';

const out = '../../portfolio/public/demos/vanbora';
execSync('npx expo export --platform web --output-dir dist-demo --clear', {
  stdio: 'inherit',
  env: { ...process.env, EXPO_PUBLIC_DEMO: '1' },
});

// ---------- Fonte de ícones só com os ícones usados ----------
const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
const glyphs = JSON.parse(
  readFileSync('node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json', 'utf8'),
);
const fontes = [...walk('app'), ...walk('src')].filter((f) => /\.(tsx?|jsx?|json)$/.test(f));
const usados = new Set();
for (const f of fontes) {
  for (const m of readFileSync(f, 'utf8').matchAll(/['"`]([a-z0-9-]+)['"`]/g)) if (glyphs[m[1]] !== undefined) usados.add(m[1]);
}
const texto = [...usados].map((n) => String.fromCodePoint(glyphs[n])).join('');
for (const ttf of walk('dist-demo').filter((f) => /Ionicons\.[0-9a-f]+\.ttf$/.test(f))) {
  const antes = statSync(ttf).size;
  writeFileSync(ttf, await subsetFont(readFileSync(ttf), texto, { targetFormat: 'truetype' }));
  console.log(`Ionicons: ${usados.size} ícones usados · ${Math.round(antes / 1024)} KB → ${Math.round(statSync(ttf).size / 1024)} KB`);
}

rmSync(out, { recursive: true, force: true });
cpSync('dist-demo', out, { recursive: true });
cpSync('src/demo/fixtures.json', `${out}/demo-fixtures.json`);
rmSync('dist-demo', { recursive: true, force: true });
console.log(`Demonstração gerada em ${out}`);
