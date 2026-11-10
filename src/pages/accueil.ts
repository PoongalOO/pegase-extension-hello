import { demarrer, el, enregistrerEvenements, expliquer, p, principal } from '../commun.js';

/**
 * Page « Hello Pégase » (publique) : fonctionnalités 1 (page), 2 (utilisateur courant par l'API), 3 (message
 * enregistré dans le stockage de l'extension) et 5 (paramètre réglé par l'administrateur)
 */
const contexte = await demarrer();
const zone = principal();
const { salutation } = await p.parametres.lire<{ salutation: string }>();

if (!contexte.utilisateur.connecte) {
  const bouton = el('button', { type: 'button', class: 'principal', texte: 'Se connecter' });
  bouton.addEventListener('click', () => p.connexion());
  zone.replaceChildren(
    el('h1', { texte: 'Hello Pégase' }),
    el('p', { texte: 'Cette page est affichée par une extension de démonstration, isolée du reste du portail.' }),
    el('p', { texte: 'Connectez-vous pour enregistrer votre message et créer des cartes.' }),
    bouton,
  );
} else {
  const titre = el('h1', { texte: `${salutation || 'Bonjour'} !` });
  zone.replaceChildren(titre);
  try {
    const profil = await p.utilisateur.profil();
    titre.textContent = `${salutation || 'Bonjour'} ${profil.prenom} ${profil.nom}`;
  } catch (erreur) {
    zone.append(el('p', { class: 'discret', texte: expliquer(erreur) }));
  }

  // message personnel, retrouvé à chaque visite (stockage de l'extension, collection propre à chaque personne)
  const messages = p.stockage.collection<{ texte: string; modifie: string }>('messages');
  const actuel = await messages.lireOuNull('message').catch(() => null);
  let version = actuel?.version ?? 0;
  const champ = el('textarea', { id: 'message', rows: '3', maxlength: '500' });
  champ.value = actuel?.valeur.texte ?? '';
  const etat = el('p', { class: 'discret', role: 'status', texte: actuel ? `Enregistré le ${new Date(actuel.valeur.modifie).toLocaleString('fr-FR')}.` : 'Aucun message enregistré.' });
  const formulaire = el('form', { class: 'carte-bloc' },
    el('label', { for: 'message', texte: 'Votre message' }),
    champ,
    el('button', { type: 'submit', class: 'principal', texte: 'Enregistrer le message' }),
    etat,
  );
  formulaire.addEventListener('submit', async (evenement) => {
    evenement.preventDefault();
    try {
      const document = await messages.ecrire('message', { texte: champ.value.trim(), modifie: new Date().toISOString() }, { version });
      version = document.version;
      etat.textContent = 'Message enregistré.';
      p.message('succes', 'Message enregistré.');
    } catch (erreur) {
      etat.textContent = expliquer(erreur);
    }
  });
  zone.append(formulaire);

  if (contexte.utilisateur.niveau === 'valide' || contexte.utilisateur.niveau === 'administration') {
    const lien = el('button', { type: 'button', class: 'secondaire', texte: 'Mes cartes' });
    lien.addEventListener('click', () => p.naviguer('mes-cartes'));
    zone.append(el('p', {}, lien));
  }

  await enregistrerEvenements(contexte).catch(() => 0);
}
