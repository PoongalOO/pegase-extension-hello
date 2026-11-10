import { ErreurPegase, pegase } from '@pegase/extension-sdk';
import { normaliser, reponseJuste, type Carte } from '../modele.js';

/**
 * Joueur d'un parcours de cartes publié (version 1.2.0), affiché par le lecteur de Pégase sans connexion : les cartes
 * une à une, la réponse vérifiée, le score envoyé à Pégase (pseudo facultatif) à chaque carte puis à la fin
 */
const p = pegase();
const zone = document.querySelector('main') as HTMLElement;

function el<K extends keyof HTMLElementTagNameMap>(balise: K, texte = '', classe = ''): HTMLElementTagNameMap[K] {
  const element = document.createElement(balise);
  if (texte) element.textContent = texte;
  if (classe) element.className = classe;
  return element;
}

function adresseData(blob: Blob): Promise<string> {
  return new Promise((resoudre, rejeter) => {
    const lecteur = new FileReader();
    lecteur.onload = () => resoudre(String(lecteur.result));
    lecteur.onerror = () => rejeter(lecteur.error);
    lecteur.readAsDataURL(blob);
  });
}

await p.demarrer();
p.ajusterHauteur();
let cartes: Carte[] = [];
try {
  // (le Core renvoie aussi le titre du parcours, absent du type de la version 0.1.0 du SDK)
  const parcours = (await p.parcours.lire()) as { titre?: string; contenu: unknown };
  cartes = normaliser(parcours.contenu).cartes;
  p.titre(parcours.titre ?? 'Parcours de cartes');
} catch (erreur) {
  zone.replaceChildren(el('p', erreur instanceof ErreurPegase ? erreur.message : 'Parcours introuvable.', 'alerte'));
  throw erreur;
}

let pseudo = '';
let bonnes = 0;
const questions = cartes.filter((c) => c.question.trim() !== '').length;

async function envoyer(termine: boolean): Promise<void> {
  try {
    await p.pont.appeler('resultats.enregistrer', { score: bonnes, termine, pseudo, details: { bonnes, questions, cartes: cartes.length } });
  } catch {
    // résultat non enregistré (réseau) : la partie continue
  }
}

function accueil(): void {
  const champ = el('input');
  champ.id = 'pseudo';
  champ.type = 'text';
  champ.maxLength = 40;
  champ.autocomplete = 'off';
  const label = el('label', 'Votre pseudo (facultatif)');
  label.htmlFor = 'pseudo';
  const commencer = el('button', 'Commencer', 'principal');
  commencer.type = 'button';
  commencer.addEventListener('click', () => {
    pseudo = champ.value.trim();
    p.pont.appeler('resultats.enregistrer', { score: 0, termine: false, pseudo }).catch(() => null);
    carte(0);
  });
  zone.replaceChildren(
    el('p', `${cartes.length} carte${cartes.length > 1 ? 's' : ''}${questions ? `, dont ${questions} à question` : ''}.`),
    label, champ, el('p'), commencer,
  );
  if (cartes.length === 0) {
    zone.replaceChildren(el('p', 'Ce parcours ne contient encore aucune carte.'));
  }
}

function carte(i: number): void {
  const c = cartes[i];
  if (!c) {
    fin();
    return;
  }
  const bloc = el('section', '', 'carte-bloc');
  bloc.append(el('p', `Carte ${i + 1} sur ${cartes.length}`, 'discret'), el('h2', c.titre));
  if (c.image) {
    const image = el('img', '', 'carte-image');
    image.alt = `Illustration : ${c.titre}`;
    bloc.append(image);
    p.fichiers.lire(c.image).then(adresseData).then((adresse) => { image.src = adresse; }).catch(() => image.remove());
  }
  if (c.texte) bloc.append(el('p', c.texte));
  const suivant = el('button', i + 1 < cartes.length ? 'Carte suivante' : 'Terminer', 'principal');
  suivant.type = 'button';
  suivant.addEventListener('click', () => carte(i + 1));
  if (c.question.trim() !== '') {
    const formulaire = el('form');
    const id = `reponse-${i}`;
    const label = el('label', c.question);
    label.htmlFor = id;
    const champ = el('input');
    champ.id = id;
    champ.type = 'text';
    champ.autocomplete = 'off';
    const valider = el('button', 'Valider', 'secondaire');
    valider.type = 'submit';
    const verdict = el('p', '', 'discret');
    verdict.setAttribute('role', 'status');
    formulaire.append(label, champ, valider, verdict);
    suivant.hidden = true;
    formulaire.addEventListener('submit', async (evenement) => {
      evenement.preventDefault();
      const juste = reponseJuste(c.reponse, champ.value);
      if (juste) bonnes++;
      verdict.textContent = juste ? 'Bonne réponse !' : `La réponse était : ${c.reponse}`;
      verdict.className = juste ? 'succes' : 'alerte';
      champ.disabled = true;
      valider.hidden = true;
      suivant.hidden = false;
      suivant.focus();
      await envoyer(false);
    });
    bloc.append(formulaire);
  }
  bloc.append(suivant);
  zone.replaceChildren(bloc);
}

function fin(): void {
  envoyer(true);
  const rejouer = el('button', 'Rejouer', 'secondaire');
  rejouer.type = 'button';
  rejouer.addEventListener('click', () => { bonnes = 0; carte(0); });
  zone.replaceChildren(
    el('h2', 'Parcours terminé'),
    el('p', questions ? `${pseudo ? pseudo + ', vous' : 'Vous'} avez trouvé ${bonnes} réponse${bonnes > 1 ? 's' : ''} sur ${questions}.` : 'Merci d\'avoir parcouru ces cartes.'),
    rejouer,
  );
}

accueil();
