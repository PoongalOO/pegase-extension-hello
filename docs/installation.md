# Installer Pégase Hello Extension dans Pégase

Il faut un compte **super administrateur** de Pégase (version 1.8.0 ou plus) et l'interface des extensions ouverte sur
le portail (`EXTENSIONS_INTERFACE=active`). Rien n'est copié dans le code de Pégase : seule l'archive publiée est
installée, après contrôle de son empreinte.

## Depuis la release GitHub (recommandé)

1. Dans Pégase : **Administration › Technique › Extensions › Extensions disponibles**. Le dépôt
   `PoongalOO/pegaselab-extension-hello` doit être autorisé (`EXTENSIONS_SOURCES`, autorisé par défaut).
2. Choisissez la version et vérifiez l'**empreinte SHA-256** : elle doit être identique à celle du fichier
   `poongaloo-hello-X.Y.Z.pegext.sha256` publié avec la release. C'est l'empreinte qui fait foi, pas l'étiquette.
3. **Installer…** : l'archive est téléchargée et contrôlée ; la version est mise **en attente de votre accord**.
4. Sur la fiche de l'extension, lisez les permissions demandées et leur justification, cochez celles que vous
   accordez (toutes les obligatoires), puis **Accorder et installer**.
5. **Activer** : la page « Hello Pégase » apparaît dans le menu, la carte « Hello : cartes » sur l'accueil des comptes.

En ligne de commande, sur le serveur :

```sh
bin/console extensions installer github:PoongalOO/pegaselab-extension-hello --numero=1.0.0 --empreinte=<sha256>
bin/console extensions accorder poongaloo/hello
bin/console extensions activer poongaloo/hello
```

## Depuis l'archive

**Installer une extension › Depuis une archive** : déposez `poongaloo-hello-X.Y.Z.pegext` en indiquant son empreinte.

## Réglages

**Paramètres** sur la fiche : formule de salutation, nombre maximal de cartes par projet, quota de stockage (20 Mo au
plus), conservation des données après désinstallation.

## Mettre à jour vers 1.1.0

Déposez ou téléchargez la 1.1.0 : elle reste en attente, la 1.0.0 continue de fonctionner. La fiche signale la
**nouvelle permission** `fichiers:deposer` (images sur les cartes, facultative). Après l'accord, Pégase sauvegarde les
données puis applique la migration du stockage (version 2). Un retour à la 1.0.0 reste possible depuis la fiche.

## Version 1.2.0 : parcours joués dans le lecteur

Deux nouvelles permissions facultatives : `parcours:publier` (bouton « Publier dans le lecteur » de l'édition : le
parcours reçoit un code `ext-xxxxxxxx`, à saisir dans le lecteur de Pégase ou à ouvrir par
`/extensions/joueur/<code>`) et `resultats:lire` (résultats des joueurs affichés à l'auteur). Sans elles, le module
fonctionne comme la 1.1.0.

## Désactiver, désinstaller, réinstaller, purger

- **Désactiver** : pages, menu, carte, API et événements du module bloqués immédiatement ; le portail continue.
- **Désinstaller** : le module disparaît, ses données sont **conservées** (sauvegarde prise).
- **Réinstaller** la même version ou une plus récente : messages, projets et journal sont retrouvés.
- **Purger les données** (après désinstallation, saisie de l'identifiant `poongaloo/hello`) : suppression définitive.
