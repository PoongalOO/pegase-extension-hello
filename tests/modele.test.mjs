import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// modèle compilé à la volée (TypeScript pur, sans navigateur)
const sortie = join(mkdtempSync(join(tmpdir(), 'hello-')), 'modele.mjs');
await build({ entryPoints: ['src/modele.ts'], outfile: sortie, format: 'esm', platform: 'node', logLevel: 'error' });
const { normaliser, verifier, reponseJuste, entier, carteVide, identifiantFichier } = await import(sortie);

test('contenu normalisé : champs manquants, types, longueurs', () => {
  assert.deepEqual(normaliser(null), { cartes: [] });
  assert.deepEqual(normaliser({ cartes: [{ titre: 'A', texte: 5 }] }), { cartes: [{ titre: 'A', texte: '', question: '', reponse: '', image: null }] });
  assert.equal(normaliser({ cartes: [{ titre: 'x'.repeat(500) }] }).cartes[0].titre.length, 80);
});

test('vérification avant enregistrement', () => {
  assert.deepEqual(verifier('Volcans', { cartes: [{ ...carteVide(), titre: 'Vésuve', question: 'Pays ?', reponse: 'Italie' }] }, 20), []);
  assert.match(verifier(' ', { cartes: [] }, 20)[0], /titre au projet/);
  assert.match(verifier('V', { cartes: [carteVide()] }, 20)[0], /titre manquant/);
  assert.match(verifier('V', { cartes: [{ ...carteVide(), titre: 'T', question: 'Q ?' }] }, 20)[0], /pas de réponse/);
  assert.match(verifier('V', { cartes: [carteVide(), carteVide()].map((c) => ({ ...c, titre: 't' })) }, 1)[0], /au plus 1 cartes/);
});

test('réponse comparée sans casse, accents ni espaces superflus', () => {
  assert.equal(reponseJuste('Pompéi', ' pompei '), true);
  assert.equal(reponseJuste('Italie', 'France'), false);
  assert.equal(reponseJuste('', ''), false);
});

test('paramètre numérique borné', () => {
  assert.equal(entier(50, 20, 1, 100), 50);
  assert.equal(entier('7', 20, 1, 100), 7);
  assert.equal(entier(500, 20, 1, 100), 100);
  assert.equal(entier(null, 20, 1, 100), 20);
});

test('image de carte (1.1.0) : identifiant de fichier de Pégase seulement', () => {
  assert.equal(identifiantFichier('01JC6X0R8Z7B4QW2M5N3P9T1VH'), '01JC6X0R8Z7B4QW2M5N3P9T1VH');
  assert.equal(identifiantFichier('https://exemple.test/image.png'), null);
  assert.equal(normaliser({ cartes: [{ titre: 'A', image: 'javascript:alert(1)' }] }).cartes[0].image, null);
});
