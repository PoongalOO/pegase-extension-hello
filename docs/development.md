# Développer Pégase Hello Extension

## Organisation

| Dossier | Contenu |
|---|---|
| `extension/pegase-extension.json` | Manifeste (schéma officiel : `@pegase/extension-sdk/schemas/pegase-extension.schema.json`) |
| `src/pages/*.ts` | Une page par fichier : `accueil`, `cartes` (mes cartes), `edition`, `statistiques` |
| `src/commun.ts` | SDK de la page, construction des éléments (textContent seulement), messages d'erreur, journal des événements |
| `src/modele.ts` | Modèle des cartes, sans navigateur (testé par `tests/modele.test.mjs`) |
| `pages/` | Pages HTML et feuille de style, copiées telles quelles |
| `scripts/construire.mjs` | Regroupement (esbuild), copie, validation et archive `.pegext` par le SDK |

## Règles imposées par Pégase

- L'interface tourne dans une **iframe isolée** : aucun cookie, aucun stockage du navigateur, aucun accès à la page
  parente, **aucune connexion réseau** (même vers Pégase). Tout passe par le pont du SDK.
- Les scripts et feuilles de style doivent faire partie de l'archive (pas de CDN, pas de police externe) : esbuild
  regroupe le SDK et le code de chaque page dans un seul fichier.
- Toujours `textContent`, jamais `innerHTML` avec des données : les projets et messages sont saisis par des
  utilisateurs.
- Une permission déclarée n'est pas accordée d'office : gérez l'erreur `permission_refusee`, surtout pour une
  permission facultative.
- Une version publiée ne change jamais : toute modification passe par une nouvelle version (manifeste et étiquette).
- Le stockage change de format par des **migrations déclaratives** dans le manifeste (`stockage.migrations`), que
  Pégase applique après une sauvegarde.

## Commandes

```sh
npm install
npm run verifier      # types TypeScript
npm run valider       # build/extension puis validation par le SDK
npm run construire    # dist/poongaloo-hello-<version>.pegext et son empreinte
npm test              # types, construction et tests
```

## Publier une version

1. Mettre à jour `version` dans `extension/pegase-extension.json` (et `package.json`).
2. Commit, puis étiquette `vX.Y.Z` identique à la version du manifeste.
3. Pousser l'étiquette : le workflow **Publication** construit l'archive, vérifie la cohérence et crée la release
   GitHub avec `poongaloo-hello-X.Y.Z.pegext` et son fichier `.sha256`.
