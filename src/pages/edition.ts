import type { Projet } from '@pegase/extension-sdk';
import { demarrer, el, expliquer, p, principal } from '../commun.js';
import { carteVide, entier, LIMITES, normaliser, reponseJuste, verifier, type Carte, type ContenuProjet } from '../modele.js';

/** Édition d'un projet de cartes (paramètre d'adresse : identifiant du projet) */
const contexte = await demarrer();
const zone = principal();
const parametres = await p.parametres.lire();
const cartesMax = entier(parametres['cartes-max'], 20, 1, 100);

let projet: Projet<ContenuProjet>;
try {
  projet = await p.projets.lire<ContenuProjet>(String(contexte.parametre ?? ''));
} catch (erreur) {
  const retour = el('button', { type: 'button', class: 'secondaire', texte: 'Retour à mes cartes' });
  retour.addEventListener('click', () => p.naviguer('mes-cartes'));
  zone.replaceChildren(el('h1', { texte: 'Édition des cartes' }), el('p', { class: 'alerte', texte: expliquer(erreur) }), retour);
  throw erreur;
}
let contenu = normaliser(projet.contenu);
p.titre(projet.titre);

function champ(etiquette: string, valeur: string, longueur: number, long = false, changer: (v: string) => void): HTMLElement {
  const id = 'c' + Math.random().toString(36).slice(2, 9);
  const saisie = long ? el('textarea', { id, rows: '3', maxlength: String(longueur) }) : el('input', { id, type: 'text', maxlength: String(longueur) });
  saisie.value = valeur;
  saisie.addEventListener('input', () => changer(saisie.value));

  return el('div', { class: 'champ' }, el('label', { for: id, texte: etiquette }), saisie);
}

const imagesPermises = contexte.permissions.includes('fichiers:deposer');
const apercus = new Map<string, string>();

/**
 * Image de la carte (version 1.1.0, permission facultative fichiers:deposer) : dépôt dans Pégase, qui la contrôle et
 * la réencode, puis aperçu par une adresse data: (fichiers.adresse du SDK)
 */
function imageCarte(carte: Carte): HTMLElement | null {
  if (!imagesPermises && !carte.image) {
    return null;
  }
  const bloc = el('div', { class: 'champ' });
  const apercu = el('img', { class: 'carte-image', alt: carte.titre ? `Image de la carte ${carte.titre}` : 'Image de la carte', hidden: !carte.image });
  if (carte.image) {
    const url = apercus.get(carte.image);
    if (url) {
      apercu.src = url;
    } else {
      p.fichiers.adresse(carte.image).then((adresse) => {
        apercus.set(carte.image as string, adresse);
        apercu.src = adresse;
      }).catch(() => { apercu.hidden = true; });
    }
  }
  bloc.append(apercu);
  if (imagesPermises) {
    const id = 'i' + Math.random().toString(36).slice(2, 9);
    const choix = el('input', { id, type: 'file', accept: 'image/png,image/jpeg,image/webp,image/gif' });
    const etat = el('span', { class: 'discret', role: 'status' });
    choix.addEventListener('change', async () => {
      const fichier = choix.files?.[0];
      if (!fichier) return;
      etat.textContent = 'Envoi…';
      try {
        const depose = await p.fichiers.deposer(fichier);
        carte.image = depose.id;
        afficher();
      } catch (erreur) {
        etat.textContent = expliquer(erreur);
      }
    });
    bloc.prepend(el('label', { for: id, texte: carte.image ? 'Remplacer l\'image' : 'Image (facultative)' }));
    bloc.append(choix, etat);
    if (carte.image) {
      const retirer = el('button', { type: 'button', class: 'lien', texte: 'Retirer l\'image' });
      retirer.addEventListener('click', () => { carte.image = null; afficher(); });
      bloc.append(retirer);
    }
  }

  return bloc;
}

function afficher(): void {
  const titre = el('input', { id: 'titre-projet', type: 'text', maxlength: String(LIMITES.titreProjet) });
  titre.value = projet.titre;
  const cartes = el('ol', { class: 'cartes' });
  contenu.cartes.forEach((carte: Carte, i) => {
    const retirer = el('button', { type: 'button', class: 'danger', texte: 'Retirer la carte' });
    retirer.addEventListener('click', () => { contenu.cartes.splice(i, 1); afficher(); });
    const essai = el('input', { type: 'text', 'aria-label': `Essayer la réponse de la carte ${i + 1}`, placeholder: 'Essayer une réponse' });
    const verdict = el('span', { class: 'discret', role: 'status' });
    essai.addEventListener('input', () => { verdict.textContent = essai.value === '' ? '' : (reponseJuste(carte.reponse, essai.value) ? ' Juste' : ' Pas encore'); });
    cartes.append(el('li', { class: 'carte-bloc' },
      imageCarte(carte),
      champ('Titre', carte.titre, LIMITES.titre, false, (v) => { carte.titre = v; }),
      champ('Texte', carte.texte, LIMITES.texte, true, (v) => { carte.texte = v; }),
      champ('Question', carte.question, LIMITES.question, false, (v) => { carte.question = v; }),
      champ('Réponse attendue', carte.reponse, LIMITES.reponse, false, (v) => { carte.reponse = v; }),
      el('p', {}, essai, verdict),
      retirer,
    ));
  });
  const ajouter = el('button', { type: 'button', class: 'secondaire', texte: 'Ajouter une carte', disabled: contenu.cartes.length >= cartesMax });
  ajouter.addEventListener('click', () => { contenu.cartes.push(carteVide()); afficher(); });
  const problemes = el('ul', { class: 'alerte', role: 'alert' });
  const enregistrer = el('button', { type: 'button', class: 'principal', texte: 'Enregistrer' });
  enregistrer.addEventListener('click', async () => {
    const erreurs = verifier(titre.value, contenu, cartesMax);
    problemes.replaceChildren(...erreurs.map((e) => el('li', { texte: e })));
    if (erreurs.length > 0) return;
    try {
      projet = await p.projets.modifier<ContenuProjet>(projet.id, { titre: titre.value.trim(), contenu, version: projet.version });
      contenu = normaliser(projet.contenu);
      p.message('succes', 'Projet enregistré.');
    } catch (erreur) {
      problemes.replaceChildren(el('li', { texte: expliquer(erreur) }));
    }
  });
  const retour = el('button', { type: 'button', class: 'lien', texte: '← Mes cartes' });
  retour.addEventListener('click', () => p.naviguer('mes-cartes'));
  zone.replaceChildren(...[
    retour,
    el('h1', { texte: 'Édition des cartes' }),
    publication(),
    el('div', { class: 'champ' }, el('label', { for: 'titre-projet', texte: 'Titre du projet' }), titre),
    cartes,
    el('p', { class: 'discret', texte: `${contenu.cartes.length} carte(s) sur ${cartesMax} au plus.` }),
    el('div', { class: 'actions' }, ajouter, enregistrer),
    problemes,
  ].filter((e): e is HTMLElement => e !== null));
}

/**
 * Publication dans le lecteur (version 1.2.0, permission facultative parcours:publier) : code et adresse du parcours,
 * résultats des joueurs (permission facultative resultats:lire)
 */
function publication(): HTMLElement | null {
  const peutPublier = contexte.permissions.includes('parcours:publier');
  if (!peutPublier && !projet.publication) {
    return null;
  }
  const bloc = el('section', { class: 'carte-bloc publication', 'aria-label': 'Publication dans le lecteur' });
  if (projet.publication) {
    bloc.append(
      el('p', {}, 'Publié dans le lecteur de Pégase, code ', el('code', { texte: projet.publication.code })),
      el('p', { class: 'discret', texte: `Adresse : ${projet.publication.adresse ?? ''}` }),
      el('p', { class: 'discret', texte: `Version publiée : ${projet.publication.version} ; enregistrez puis publiez de nouveau pour mettre à jour le parcours.` }),
    );
  } else {
    bloc.append(el('p', { texte: 'Publiez le projet pour qu\'il soit joué dans le lecteur de Pégase avec son code.' }));
  }
  if (peutPublier) {
    const publier = el('button', { type: 'button', class: 'secondaire', texte: projet.publication ? 'Publier de nouveau' : 'Publier dans le lecteur' });
    publier.addEventListener('click', async () => {
      try {
        const publie = await p.projets.publier(projet.id); // confirmation demandée par Pégase
        projet = { ...projet, publication: publie };
        p.message('succes', `Parcours publié : code ${publie.code}`);
        afficher();
      } catch (erreur) {
        p.message('alerte', expliquer(erreur));
      }
    });
    bloc.append(publier);
  }
  if (projet.publication && contexte.permissions.includes('resultats:lire')) {
    const tableau = el('table', { class: 'resultats' });
    bloc.append(el('h2', { texte: 'Résultats des joueurs' }), tableau);
    p.resultats.lister(projet.id).then((resultats) => {
      if (resultats.length === 0) {
        tableau.replaceWith(el('p', { class: 'discret', texte: 'Aucune partie pour l\'instant.' }));
        return;
      }
      tableau.append(el('tr', {}, el('th', { texte: 'Joueur' }), el('th', { texte: 'Bonnes réponses' }), el('th', { texte: 'Terminé' }), el('th', { texte: 'Date' })));
      for (const r of resultats) {
        tableau.append(el('tr', {},
          el('td', { texte: r.pseudo ?? 'anonyme' }),
          el('td', { texte: String(r.score) }),
          el('td', { texte: r.termine ? 'oui' : 'non' }),
          el('td', { texte: new Date(r.date).toLocaleString('fr-FR') })));
      }
    }).catch((erreur) => tableau.replaceWith(el('p', { class: 'discret', texte: expliquer(erreur) })));
  }

  return bloc;
}

afficher();
