/**
 * Modèle du mini-espace de création : un projet est une suite de cartes à question. Fonctions pures, testées sans
 * navigateur (tests/modele.test.mjs).
 */

export interface Carte {
  titre: string;
  texte: string;
  question: string;
  reponse: string;
  /** image déposée dans Pégase (identifiant de fichier, version 1.1.0) */
  image?: string | null;
}

export interface ContenuProjet {
  cartes: Carte[];
}

export const LIMITES = { titre: 80, texte: 1000, question: 200, reponse: 80, titreProjet: 120 };

export function carteVide(): Carte {
  return { titre: '', texte: '', question: '', reponse: '', image: null };
}

/** Contenu lu dans le stockage, remis en forme (champs manquants, types, longueurs) */
export function normaliser(contenu: unknown): ContenuProjet {
  const cartes = Array.isArray((contenu as ContenuProjet | null)?.cartes) ? (contenu as ContenuProjet).cartes : [];

  return {
    cartes: cartes.map((carte) => ({
      titre: texte((carte as Partial<Carte>)?.titre, LIMITES.titre),
      texte: texte((carte as Partial<Carte>)?.texte, LIMITES.texte),
      question: texte((carte as Partial<Carte>)?.question, LIMITES.question),
      reponse: texte((carte as Partial<Carte>)?.reponse, LIMITES.reponse),
      image: identifiantFichier((carte as Partial<Carte>)?.image),
    })),
  };
}

/** Problèmes empêchant d'enregistrer (vide : contenu valide) */
export function verifier(titreProjet: string, contenu: ContenuProjet, cartesMax: number): string[] {
  const problemes: string[] = [];
  if (titreProjet.trim() === '') {
    problemes.push('Donnez un titre au projet.');
  }
  if (titreProjet.length > LIMITES.titreProjet) {
    problemes.push(`Le titre du projet dépasse ${LIMITES.titreProjet} caractères.`);
  }
  if (contenu.cartes.length > cartesMax) {
    problemes.push(`Un projet compte au plus ${cartesMax} cartes.`);
  }
  contenu.cartes.forEach((carte, i) => {
    if (carte.titre.trim() === '') {
      problemes.push(`Carte ${i + 1} : titre manquant.`);
    }
    if (carte.question.trim() !== '' && carte.reponse.trim() === '') {
      problemes.push(`Carte ${i + 1} : la question n'a pas de réponse.`);
    }
  });

  return problemes;
}

/** Réponse d'un joueur comparée sans tenir compte de la casse, des accents ni des espaces superflus */
export function reponseJuste(attendue: string, donnee: string): boolean {
  const simplifier = (valeur: string) => valeur.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/\s+/g, ' ').trim();

  return simplifier(attendue) !== '' && simplifier(attendue) === simplifier(donnee);
}

/** Nombre entier du paramètre, borné ; valeur par défaut si le paramètre est absent ou invalide */
export function entier(valeur: unknown, defaut: number, minimum: number, maximum: number): number {
  const nombre = typeof valeur === 'number' ? valeur : Number.parseInt(String(valeur ?? ''), 10);

  return Number.isFinite(nombre) ? Math.min(maximum, Math.max(minimum, Math.trunc(nombre))) : defaut;
}

/** Identifiant de fichier de Pégase (ULID), ou null */
export function identifiantFichier(valeur: unknown): string | null {
  return typeof valeur === 'string' && /^[0-9A-HJKMNP-TV-Z]{26}$/.test(valeur) ? valeur : null;
}

function texte(valeur: unknown, longueur: number): string {
  return typeof valeur === 'string' ? valeur.slice(0, longueur) : '';
}
