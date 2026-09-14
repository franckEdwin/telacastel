/* ============================================================
   État partagé de la boutique
   La maquette gardait tout dans le navigateur : une commande passée sur
   un téléphone n'atteignait jamais l'espace de gestion ouvert sur un
   ordinateur. Ce point d'entrée sert d'unique source commune.

   GET  → l'état courant
   PUT  → fusionne l'état envoyé avec celui déjà stocké
   ============================================================ */
import { put, get } from '@vercel/blob';

const CHEMIN = 'tela/etat.json';
const VIDE = { commandes: [], produits: null, categories: null, maj: 0 };

async function lire(){
  try {
    const r = await get(CHEMIN, { abortSignal: AbortSignal.timeout(7000) });
    if (!r) return { ...VIDE };
    const texte = await new Response(r.stream ?? r.blob).text();
    return { ...VIDE, ...JSON.parse(texte) };
  } catch (e) {
    if (e && /not.?found/i.test(e.name + e.message)) return { ...VIDE };
    throw e;
  }
}

async function ecrire(etat){
  await put(CHEMIN, JSON.stringify(etat), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 0
  });
}

/* Quand deux appareils écrivent, on ne veut pas que le dernier efface le
   travail de l'autre : les commandes sont fusionnées par référence, et
   c'est la version la plus récemment touchée qui gagne. */
function quand(c){
  const j = c && c.journal && c.journal.length ? c.journal[c.journal.length - 1].quand : null;
  return Date.parse(c && c.majLe) || Date.parse(j) || Date.parse(c && c.creele) || 0;
}
function fusionner(ancien, nouveau){
  const par = new Map();
  for (const c of ancien.commandes || []) if (c && c.ref) par.set(c.ref, c);
  for (const c of nouveau.commandes || []){
    if (!c || !c.ref) continue;
    const dejaLa = par.get(c.ref);
    if (!dejaLa || quand(c) >= quand(dejaLa)) par.set(c.ref, c);
  }
  const commandes = [...par.values()].sort((a, b) => quand(b) - quand(a));
  return {
    commandes,
    produits:   nouveau.produits   ?? ancien.produits,
    categories: nouveau.categories ?? ancien.categories,
    maj: Date.now()
  };
}

export default async function handler(req, res){
  res.setHeader('cache-control', 'no-store, max-age=0');
  try {
    if (req.method === 'GET'){
      return res.status(200).json(await lire());
    }
    if (req.method === 'PUT' || req.method === 'POST'){
      const recu = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const etat = fusionner(await lire(), recu);
      await ecrire(etat);
      return res.status(200).json(etat);
    }
    res.setHeader('allow', 'GET, PUT');
    return res.status(405).json({ erreur: 'méthode non permise' });
  } catch (e) {
    return res.status(500).json({ erreur: String((e && e.message) || e) });
  }
}
