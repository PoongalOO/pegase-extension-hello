import type { Projet } from '@pegase/extension-sdk';
import { demarrer, el, expliquer, p, principal } from '../commun.js';
import { normaliser, type ContenuProjet } from '../modele.js';

/** Mini-espace de création : projets de cartes de la personne connectée */
await demarrer();
const zone = principal();

async function afficher(): Promise<void> {
  let projets: Projet<ContenuProjet>[];
  try {
    projets = await p.projets.lister<ContenuProjet>();
  } catch (erreur) {
    zone.replaceChildren(el('h1', { texte: 'Mes cartes' }), el('p', { class: 'alerte', texte: expliquer(erreur) }));
    return;
  }
  const titre = el('input', { id: 'titre', type: 'text', maxlength: '120', required: true, placeholder: 'Les volcans' });
  const creation = el('form', { class: 'carte-bloc ligne' },
    el('label', { for: 'titre', texte: 'Nouveau projet' }), titre,
    el('button', { type: 'submit', class: 'principal', texte: 'Créer' }));
  creation.addEventListener('submit', async (evenement) => {
    evenement.preventDefault();
    try {
      const projet = await p.projets.creer<ContenuProjet>({ titre: titre.value.trim(), contenu: { cartes: [] } });
      p.naviguer('edition', projet.id);
    } catch (erreur) {
      p.message('alerte', expliquer(erreur));
    }
  });

  const liste = el('ul', { class: 'projets' });
  for (const projet of projets) {
    const ouvrir = el('button', { type: 'button', class: 'lien', texte: projet.titre });
    ouvrir.addEventListener('click', () => p.naviguer('edition', projet.id));
    const supprimer = el('button', { type: 'button', class: 'danger', texte: 'Supprimer' });
    supprimer.addEventListener('click', async () => {
      try {
        await p.projets.supprimer(projet.id); // confirmation demandée par Pégase, hors de l'extension
        await afficher();
      } catch (erreur) {
        p.message('alerte', expliquer(erreur));
      }
    });
    const cartes = normaliser(projet.contenu).cartes.length;
    const publie = projet.publication ? `, publié (code ${projet.publication.code})` : '';
    liste.append(el('li', {}, ouvrir, el('span', { class: 'discret', texte: ` ${cartes} carte${cartes > 1 ? 's' : ''}, modifié le ${new Date(projet.modifie).toLocaleDateString('fr-FR')}${publie}` }), supprimer));
  }
  zone.replaceChildren(
    el('h1', { texte: 'Mes cartes' }),
    el('p', { texte: 'Chaque projet est une suite de cartes à question. Vos projets ne sont visibles que de vous.' }),
    creation,
    projets.length === 0 ? el('p', { class: 'discret', texte: 'Aucun projet pour l\'instant.' }) : liste,
  );
}

await afficher();
