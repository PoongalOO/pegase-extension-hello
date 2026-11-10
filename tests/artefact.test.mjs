import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';

const manifeste = JSON.parse(readFileSync('extension/pegase-extension.json', 'utf8'));
const nom = `poongaloo-hello-${manifeste.version}.pegext`;
const empreinte = () => createHash('sha256').update(readFileSync(`dist/${nom}`)).digest('hex');

test('artefact construit, empreinte publiée avec lui', () => {
  assert.ok(readdirSync('dist').includes(nom));
  assert.equal(readFileSync(`dist/${nom}.sha256`, 'utf8'), `${empreinte()}  ${nom}\n`);
});

test('construction reproductible : mêmes sources, même empreinte', () => {
  const avant = empreinte();
  execFileSync(process.execPath, ['scripts/construire.mjs'], { stdio: 'ignore' });
  assert.equal(empreinte(), avant);
});

test('contenu : manifeste, licence, pages et scripts regroupés, rien d\'autre', () => {
  const tar = gunzipSync(readFileSync(`dist/${nom}`));
  const chemins = [];
  for (let position = 0; position + 512 <= tar.length; ) {
    const entete = tar.subarray(position, position + 512);
    if (entete.every((o) => o === 0)) break;
    const taille = parseInt(entete.subarray(124, 136).toString().replace(/\0.*$/s, ''), 8);
    chemins.push(entete.subarray(0, 100).toString().replace(/\0.*$/s, ''));
    position += 512 + Math.ceil(taille / 512) * 512;
  }
  for (const page of manifeste.points_entree.pages) {
    assert.ok(chemins.includes(page.fichier), page.fichier);
  }
  assert.ok(chemins.every((c) => /^(pegase-extension\.json|LICENSE|README\.md|interface\/[a-z-]+\.(html|js|css))$/.test(c)), chemins.join(', '));
  // aucun module externe : les scripts regroupés n'importent rien
  for (const script of chemins.filter((c) => c.endsWith('.js'))) {
    assert.doesNotMatch(readFileSync(`build/extension/${script}`, 'utf8'), /^\s*import\s.+from\s/m, script);
  }
});
