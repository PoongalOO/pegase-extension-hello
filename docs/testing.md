# Tests de Pégase Hello Extension

## Dans ce dépôt

```sh
npm test
```

- **Types** : `tsc` sur `src/`.
- **Construction et validation** : le manifeste est validé contre le schéma officiel et les fichiers contrôlés comme
  Pégase le fera avant installation (`pegase-extension valider`).
- **Modèle** (`tests/modele.test.mjs`) : normalisation des contenus, vérification avant enregistrement, comparaison
  des réponses, bornes des paramètres.
- **Artefact** (`tests/artefact.test.mjs`) : archive et empreinte publiées ensemble, construction reproductible (deux
  constructions, même empreinte), contenu limité aux fichiers attendus, aucun module externe importé.

La CI (`.github/workflows/ci.yml`) lance ces tests à chaque modification.

## Dans Pégase

Le dépôt de Pégase contient un essai dans Chromium qui installe une archive publiée et parcourt le module comme un
utilisateur :

```sh
HELLO_ARCHIVE=/chemin/poongaloo-hello-1.0.0.pegext tests/navigateur/essai.sh hello
```

Il vérifie la page publique sans compte, la connexion depuis le module et le retour à sa page, la salutation avec le
nom de la personne (API), le message enregistré puis retrouvé après rechargement, la création et l'édition d'un projet
de cartes, et la réception de l'événement `utilisateur.cree` dans les statistiques. Les tests automatisés de Pégase
(`tests/Fonctionnel/Extensions/`) couvrent l'installation, les permissions refusées et révoquées, la désactivation, la
mise à jour, la désinstallation avec conservation, la réinstallation, la purge et l'isolation entre extensions.
