import { demarrer, el, enregistrerEvenements, expliquer, p, principal } from '../commun.js';

/**
 * Statistiques (administrateurs) : fonctionnalité 4, réception de l'événement utilisateur.cree. Les événements reçus
 * sont enregistrés dans le journal de l'extension, sans aucune donnée personnelle, puis comptés.
 */
const contexte = await demarrer();
const zone = principal();
zone.replaceChildren(el('h1', { texte: 'Statistiques Hello' }));

try {
  const nouveaux = await enregistrerEvenements(contexte);
  const journal = p.stockage.collection<{ type: string; date: string; recu: string }>('journal');
  const recus: { type: string; date: string; recu: string }[] = [];
  let apres: string | undefined;
  do {
    const page = await journal.lister({ apres, limite: 100 });
    recus.push(...page.documents.map((d) => d.valeur));
    apres = page.suivant ?? undefined;
  } while (apres !== undefined && recus.length < 1000);
  const comptes = recus.filter((e) => e.type === 'utilisateur.cree');
  zone.append(
    el('p', { texte: `Comptes créés depuis l'installation : ${comptes.length}${recus.length >= 1000 ? ' ou plus' : ''}.` }),
    el('p', { class: 'discret', texte: `${nouveaux} événement(s) reçu(s) à l'ouverture de cette page. Les événements sont livrés par Pégase environ une minute après la création du compte.` }),
  );
  const liste = el('ul', {});
  for (const evenement of comptes.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10)) {
    liste.append(el('li', { texte: `Compte créé le ${new Date(evenement.date).toLocaleString('fr-FR')}` }));
  }
  zone.append(liste);
} catch (erreur) {
  zone.append(el('p', { class: 'alerte', texte: expliquer(erreur) }));
}
