/* ============================================================
   Filtre d'accès à l'espace de gestion.
   Tourne sur le réseau de Vercel, avant que la page ne soit servie :
   sans identifiants valides, le fichier n'est jamais envoyé au
   navigateur. Les identifiants vivent dans les variables
   d'environnement du projet, jamais dans le dépôt.
   ============================================================ */
export const config = {
  matcher: ['/gestion', '/gestion.html']
};

export default function middleware(request) {
  const attendus = {
    utilisateur: process.env.GESTION_USER,
    motDePasse: process.env.GESTION_PASS
  };

  /* pas d'identifiants configurés : on refuse plutôt que d'ouvrir */
  if (!attendus.utilisateur || !attendus.motDePasse) {
    return new Response('Espace de gestion non configuré.', {
      status: 503,
      headers: { 'content-type': 'text/plain; charset=utf-8' }
    });
  }

  const entete = request.headers.get('authorization') || '';
  if (entete.startsWith('Basic ')) {
    let decode = '';
    try { decode = atob(entete.slice(6)); } catch (e) { decode = ''; }
    const separateur = decode.indexOf(':');
    const utilisateur = decode.slice(0, separateur);
    const motDePasse = decode.slice(separateur + 1);
    if (utilisateur === attendus.utilisateur && motDePasse === attendus.motDePasse) {
      return undefined; /* accès accordé, la page est servie */
    }
  }

  return new Response('Accès réservé.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Tela Castle — gestion", charset="UTF-8"',
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
}
