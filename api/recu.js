/* ============================================================
   Reçus en image
   WhatsApp ne sait pas recevoir de pièce jointe par un simple lien : son
   API de conversation ne transporte que du texte. On dépose donc l'image
   du reçu ici, et le message ne porte plus qu'un lien court vers elle.
   Le restaurant l'ouvre d'un doigt et voit le reçu tel qu'il est dessiné.

   POST → dépose le reçu, renvoie son adresse
   GET  → sert l'image (le jeton évite qu'on devine celle du voisin)
   ============================================================ */
import { put, get } from '@vercel/blob';

const DOSSIER = 'recus/';

function chemin(ref, jeton){
  const propre = String(ref).replace(/[^A-Za-z0-9_-]/g, '');
  const t = String(jeton).replace(/[^a-z0-9]/g, '');
  return `${DOSSIER}${propre}-${t}.png`;
}

export const config = { api: { bodyParser: { sizeLimit: '6mb' } } };

export default async function handler(req, res){
  try {
    if (req.method === 'POST'){
      const corps = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const { ref, image } = corps;
      if (!ref || !image) return res.status(400).json({ erreur: 'ref et image sont requis' });

      const brut = String(image).replace(/^data:image\/png;base64,/, '');
      const octets = Buffer.from(brut, 'base64');
      if (octets.length > 5_000_000) return res.status(413).json({ erreur: 'image trop lourde' });

      const jeton = Math.random().toString(36).slice(2, 12);
      await put(chemin(ref, jeton), octets, {
        access: 'private',
        contentType: 'image/png',
        addRandomSuffix: false,
        allowOverwrite: true
      });
      const base = `https://${req.headers.host}`;
      return res.status(200).json({ ok: true, url: `${base}/api/recu?r=${encodeURIComponent(ref)}&t=${jeton}` });
    }

    if (req.method === 'GET'){
      const { r, t } = req.query || {};
      if (!r || !t) return res.status(400).send('Reçu introuvable.');
      const blob = await get(chemin(r, t), { access: 'private', useCache: true });
      if (!blob) return res.status(404).send('Reçu introuvable.');
      const buf = Buffer.from(await new Response(blob.stream ?? blob.blob ?? blob.body).arrayBuffer());
      res.setHeader('content-type', 'image/png');
      res.setHeader('cache-control', 'public, max-age=31536000, immutable');
      return res.status(200).send(buf);
    }

    res.setHeader('allow', 'GET, POST');
    return res.status(405).json({ erreur: 'méthode non permise' });
  } catch (e) {
    if (/not.?found/i.test(String(e && e.message))) return res.status(404).send('Reçu introuvable.');
    return res.status(500).json({ erreur: String((e && e.message) || e) });
  }
}
