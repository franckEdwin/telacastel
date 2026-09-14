/* ============================================================
   Synchronisation avec l'état partagé
   Sans elle, tout vit dans le navigateur : une commande passée sur un
   téléphone n'arrive jamais dans l'espace de gestion ouvert ailleurs.
   Ici on pousse ce qu'on modifie, on tire régulièrement le reste, et on
   prévient la page quand quelque chose a changé au loin.
   ============================================================ */
(function(){
  var T = window.TELA;
  if (!T) return;

  var POINT = '/api/donnees';
  var CADENCE = 5000;          // on interroge le serveur toutes les 5 s
  var enCoursApplication = false;
  var minuteur = null;
  var dernierEnvoi = 0;

  T.sync = { actif: false, derniere: null, erreur: null };

  function quand(c){
    var j = c && c.journal && c.journal.length ? c.journal[c.journal.length - 1].quand : null;
    return Date.parse(c && c.majLe) || Date.parse(j) || Date.parse(c && c.creele) || 0;
  }

  /* Fusion locale, même règle que côté serveur : par référence, la
     version touchée le plus récemment l'emporte. */
  function fusionner(locales, distantes){
    var par = {}, ordre = [];
    function poser(c){
      if (!c || !c.ref) return;
      if (!par[c.ref]) ordre.push(c.ref);
      if (!par[c.ref] || quand(c) >= quand(par[c.ref])) par[c.ref] = c;
    }
    (locales || []).forEach(poser);
    (distantes || []).forEach(poser);
    return ordre.map(function(r){ return par[r]; })
                .sort(function(a, b){ return quand(b) - quand(a); });
  }

  function appliquer(etat){
    if (!etat) return false;
    var change = false;

    var avant = JSON.stringify(T.commandes());
    var fusion = fusionner(T.commandes(), etat.commandes);
    if (JSON.stringify(fusion) !== avant){ T.ecrire('commandes', fusion); change = true; }

    if (etat.produits && JSON.stringify(etat.produits) !== JSON.stringify(T.produits)){
      T.ecrire('produits', etat.produits); change = true;
    }
    if (etat.categories && JSON.stringify(etat.categories) !== JSON.stringify(T.categories)){
      T.ecrire('categories', etat.categories); change = true;
    }
    if (etat.devis && JSON.stringify(etat.devis) !== JSON.stringify(T.devis())){
      T.ecrire('devis', etat.devis); change = true;
    }
    if (etat.equipe && JSON.stringify(etat.equipe) !== JSON.stringify(T.equipe())){
      T.ecrire('equipe', etat.equipe); change = true;
    }
    if (change && T.recharger) T.recharger();
    return change;
  }

  function tirer(){
    return fetch(POINT, {cache:'no-store'})
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(etat){
        T.sync.actif = true; T.sync.erreur = null; T.sync.derniere = new Date();
        enCoursApplication = true;
        var change = appliquer(etat);
        enCoursApplication = false;
        if (change) window.dispatchEvent(new CustomEvent('tela:distant'));
        return change;
      })
      .catch(function(e){ T.sync.actif = false; T.sync.erreur = String(e && e.message || e); });
  }

  function pousser(){
    dernierEnvoi = Date.now();
    return fetch(POINT, {
      method: 'PUT',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({
        commandes: T.commandes(),
        produits: T.produits,
        categories: T.categories,
        devis: T.devis(),
        equipe: T.equipe()
      })
    }).then(function(r){ return r.ok ? r.json() : null; })
      .then(function(etat){
        if (!etat) return;
        enCoursApplication = true;
        var change = appliquer(etat);
        enCoursApplication = false;
        if (change) window.dispatchEvent(new CustomEvent('tela:distant'));
      })
      .catch(function(){});
  }
  T.pousser = pousser;

  /* Toute écriture locale sur les données partagées part au serveur,
     groupée : on attend une seconde que les modifications se tassent. */
  window.addEventListener('tela:maj', function(e){
    if (enCoursApplication) return;
    var cle = e && e.detail && e.detail.cle;
    if (['commandes', 'produits', 'categories', 'devis', 'equipe'].indexOf(cle) < 0) return;
    clearTimeout(minuteur);
    minuteur = setTimeout(pousser, 900);
  });

  /* Premier échange au chargement, puis à intervalle régulier. On se tait
     quand l'onglet est en arrière-plan, et on rattrape au retour. */
  tirer().then(function(){ return pousser(); });
  setInterval(function(){ if (!document.hidden) tirer(); }, CADENCE);
  document.addEventListener('visibilitychange', function(){ if (!document.hidden) tirer(); });
  window.addEventListener('online', tirer);
})();
