/* ============================================================
   Tela Castle — service worker

   Règle du jeu, corrigée :
   le code (page, scripts, styles) part TOUJOURS chercher le réseau
   d'abord, sinon une nouvelle mise en ligne reste invisible tant que
   le cache n'expire pas. Seules les images et les polices sont servies
   depuis le cache en priorité, puisqu'elles ne changent pas.
   ============================================================ */
var VERSION = 'tela-v5';
var COQUILLE = [
  '/', '/index.html', '/app.js', '/data.js', '/recu.js', '/tela.css',
  '/manifest.webmanifest',
  '/img/logo.png', '/img/logo-encre.png',
  '/img/icones/icone-192.png', '/img/icones/icone-512.png'
];
var CODE = /\.(?:html|js|css|webmanifest)(?:\?.*)?$/i;

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(VERSION)
      .then(function(c){ return c.addAll(COQUILLE); })
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(cles){
      return Promise.all(cles.filter(function(k){ return k !== VERSION; })
                            .map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

function reseauDAbord(req){
  return fetch(req).then(function(rep){
    if (rep && rep.status === 200){
      var copie = rep.clone();
      caches.open(VERSION).then(function(c){ c.put(req, copie); });
    }
    return rep;
  }).catch(function(){
    return caches.match(req).then(function(r){
      return r || (req.mode === 'navigate' ? caches.match('/index.html') : Response.error());
    });
  });
}

self.addEventListener('fetch', function(e){
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  var memeOrigine = url.origin === location.origin;

  /* navigation et code : le réseau fait foi */
  if (req.mode === 'navigate' || (memeOrigine && CODE.test(url.pathname))){
    e.respondWith(reseauDAbord(req));
    return;
  }

  /* images, polices, tuiles : le cache d'abord, rafraîchi en arrière-plan */
  e.respondWith(
    caches.match(req).then(function(cache){
      var reseau = fetch(req).then(function(rep){
        if (rep && rep.status === 200 && (rep.type === 'basic' || rep.type === 'cors')){
          var copie = rep.clone();
          caches.open(VERSION).then(function(c){ c.put(req, copie); });
        }
        return rep;
      }).catch(function(){ return cache; });
      return cache || reseau;
    })
  );
});
