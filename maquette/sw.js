/* ============================================================
   Tela Castle — service worker
   La carte reste consultable hors connexion : la coquille de
   l'application est mise en cache à l'installation, les images et
   polices sont gardées au fil de la navigation.
   ============================================================ */
var VERSION = 'tela-v1';
var COQUILLE = [
  '/', '/index.html', '/app.js', '/data.js', '/recu.js', '/tela.css',
  '/manifest.webmanifest',
  '/img/logo.png', '/img/logo-encre.png',
  '/img/icones/icone-192.png', '/img/icones/icone-512.png'
];

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

self.addEventListener('fetch', function(e){
  var req = e.request;
  if (req.method !== 'GET') return;

  /* navigation : le réseau d'abord, le cache si la connexion manque */
  if (req.mode === 'navigate'){
    e.respondWith(
      fetch(req).then(function(rep){
        var copie = rep.clone();
        caches.open(VERSION).then(function(c){ c.put(req, copie); });
        return rep;
      }).catch(function(){
        return caches.match(req).then(function(r){ return r || caches.match('/index.html'); });
      })
    );
    return;
  }

  /* le reste : le cache d'abord, rafraîchi en arrière-plan */
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
