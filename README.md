# Pégase Hello Extension

Module de démonstration du système d'extensions de [Pégase](https://github.com/PoongalOO/pegase), dans un dépôt
indépendant. Il ne contient aucun code de Pégase et Pégase ne contient aucun code de ce module : il s'installe depuis
son artefact publié, une archive `.pegext` contrôlée par son empreinte SHA-256.

## Ce que montre le module

| Fonctionnalité | Où | Permissions |
|---|---|---|
| 1. Page « Hello Pégase » dans le portail, avec une entrée de menu | page `accueil` (publique) | — |
| 2. Nom de la personne connectée, obtenu par l'API de Pégase | page `accueil` | `utilisateur:profil` |
| 3. Message enregistré dans le stockage propre au module, retrouvé à chaque visite | page `accueil` | `stockage:prive` |
| 4. Réception de l'événement `utilisateur.cree` (comptes créés, sans donnée personnelle), enregistrée dans un journal | pages `accueil` et `statistiques` | `evenements:utilisateur.cree`, `stockage:partage` |
| 5. Paramètre réglé par l'administrateur : formule de salutation, nombre maximal de cartes | administration de Pégase | — |
| 6. Désactivation : pages, menu, API et événements bloqués, le portail continue | administration de Pégase | — |
| 7. Désinstallation en conservant les données, réinstallation et données retrouvées | administration de Pégase | — |
| 8. Mise à jour : versions 1.0.0 puis 1.1.0 (images sur les cartes, nouvelle permission, migration des données) | releases | `fichiers:deposer` (1.1.0) |
| Mini-espace de création : projets de cartes à question | pages `mes-cartes` et `edition` | `projets:*` |

Le module tourne dans une iframe isolée par le navigateur : il ne voit ni les cookies, ni la session, ni le reste du
portail, et ne peut contacter aucun serveur. Tout passe par le pont de Pégase, qui vérifie chaque appel.

## Documentation

- [Installation dans Pégase](docs/installation.md)
- [Développement](docs/development.md)
- [Tests](docs/testing.md)

## Licence

MIT, voir [LICENSE](LICENSE).
