// Construction de l'extension : pages TypeScript regroupées avec le SDK (esbuild, aucun module externe : l'iframe ne
// charge que ses propres fichiers), fichiers statiques, manifeste, licence ; puis validation et archive .pegext
// reproductible par le SDK (dist/, avec son empreinte SHA-256).
//
//   node scripts/construire.mjs              build/extension puis dist/poongaloo-hello-<version>.pegext
//   node scripts/construire.mjs --valider    build/extension et validation seulement
import { build } from 'esbuild';
import { cpSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const racine = join(dirname(fileURLToPath(import.meta.url)), '..');
const sortie = join(racine, 'build', 'extension');
rmSync(join(racine, 'build'), { recursive: true, force: true });
mkdirSync(join(sortie, 'interface'), { recursive: true });

await build({
  entryPoints: readdirSync(join(racine, 'src', 'pages')).filter((f) => f.endsWith('.ts')).map((f) => join(racine, 'src', 'pages', f)),
  outdir: join(sortie, 'interface'),
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
  charset: 'utf8',
  legalComments: 'none',
  logLevel: 'warning',
});
for (const fichier of readdirSync(join(racine, 'pages'))) {
  cpSync(join(racine, 'pages', fichier), join(sortie, 'interface', fichier));
}
cpSync(join(racine, 'extension', 'pegase-extension.json'), join(sortie, 'pegase-extension.json'));
cpSync(join(racine, 'LICENSE'), join(sortie, 'LICENSE'));
cpSync(join(racine, 'README.md'), join(sortie, 'README.md'));

const cli = createRequire(import.meta.url).resolve('@pegase/extension-sdk').replace(/index\.js$/, 'cli/cli.js');
const arguments_ = process.argv.includes('--valider')
  ? ['valider', sortie]
  : ['construire', sortie, `--sortie=${join(racine, 'dist')}`];
execFileSync(process.execPath, [cli, ...arguments_], { stdio: 'inherit' });
