import { ErreurPegase, pegase, type Contexte } from '@pegase/extension-sdk';

/** Instance du SDK de la page (iframe de l'extension) */
export const p = pegase();

/**
 * Élément HTML construit sans innerHTML : les textes passent toujours par textContent (aucune injection possible, même
 * avec des données saisies par d'autres utilisateurs)
 */
export function el<K extends keyof HTMLElementTagNameMap>(
  balise: K,
  attributs: Record<string, string | boolean | undefined> = {},
  ...enfants: Array<Node | string | null | undefined>
): HTMLElementTagNameMap[K] {
  const element = document.createElement(balise);
  for (const [nom, valeur] of Object.entries(attributs)) {
    if (valeur === undefined || valeur === false) continue;
    if (nom === 'texte') {
      element.textContent = String(valeur);
    } else {
      element.setAttribute(nom, valeur === true ? '' : valeur);
    }
  }
  for (const enfant of enfants) {
    if (enfant !== null && enfant !== undefined) {
      element.append(enfant);
    }
  }

  return element;
}

export function principal(): HTMLElement {
  return document.querySelector('main') ?? document.body;
}

/** Message d'erreur lisible, selon le code rendu par le Core */
export function expliquer(erreur: unknown): string {
  if (!(erreur instanceof ErreurPegase)) {
    return 'Une erreur est survenue.';
  }
  switch (erreur.code) {
    case 'non_connecte': return 'Connectez-vous pour continuer.';
    case 'permission_refusee': return 'Cette fonction n\'est pas autorisée par l\'administrateur de Pégase.';
    case 'extension_inactive': return 'L\'extension a été désactivée.';
    case 'conflit': return 'Le contenu a été modifié ailleurs : rechargez la page.';
    case 'quota_depasse': return 'L\'espace de stockage de l\'extension est plein.';
    case 'annule_par_utilisateur': return 'Action annulée.';
    case 'introuvable': return 'Introuvable.';
    default: return erreur.message;
  }
}

/**
 * Démarrage commun des pages : contexte, hauteur suivie, message si l'extension est désactivée pendant l'usage
 */
export async function demarrer(): Promise<Contexte> {
  const contexte = await p.demarrer();
  p.ajusterHauteur();
  p.surDesactivation(() => {
    principal().replaceChildren(el('p', { class: 'alerte', texte: 'Cette extension vient d\'être désactivée.' }));
  });

  return contexte;
}

/**
 * Fonctionnalité 4 (réception d'un événement) : événements utilisateur.cree reçus par la boîte de l'extension,
 * enregistrés dans la collection partagée « journal » (clé : identifiant de l'événement, donc sans doublon) puis
 * acquittés. Rien n'est demandé au Core si la permission n'est pas accordée.
 *
 * @return nombre d'événements enregistrés
 */
export async function enregistrerEvenements(contexte: Contexte): Promise<number> {
  if (!contexte.utilisateur.connecte || !contexte.permissions.includes('evenements:utilisateur.cree')) {
    return 0;
  }
  const journal = p.stockage.collection<{ type: string; date: string; recu: string }>('journal');
  let total = 0;
  for (let lot = 0; lot < 5; lot++) {
    const evenements = await p.evenements.lister(50);
    if (evenements.length === 0) break;
    for (const evenement of evenements) {
      await journal.ecrire(evenement.id, { type: evenement.type, date: evenement.date, recu: new Date().toISOString() });
    }
    await p.evenements.acquitter(evenements.map((e) => e.id));
    total += evenements.length;
  }

  return total;
}
