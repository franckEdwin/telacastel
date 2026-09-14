/* ============================================================
   Tela Castle — application client
   Mobile : des écrans, jamais de fenêtre surgissante.
   Bureau : menu au centre, panier en colonne permanente.
   ============================================================ */
(function(){
"use strict";
var T = window.TELA, D = T.dates();
var $ = function(s, r){ return (r||document).querySelector(s); };
var el = function(t,c,h){ var e=document.createElement(t); if(c) e.className=c; if(h!=null) e.innerHTML=h; return e; };
var F = T.F;
var ETOILE = '<svg viewBox="0 0 24 24"><path d="m12 3 2.6 5.6 6.1.8-4.5 4.2 1.2 6.1L12 16.8 6.6 19.7l1.2-6.1L3.3 9.4l6.1-.8z"/></svg>';
var FLECHE = '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>';
var mobile = function(){ return window.innerWidth < 1100; };

/* ---------------------------------------------------------- état */
var compte = T.compte();
var S = {
  panier:   T.lire('panier', []),
  zone:     T.lire('zone', 'angre'),
  creneau:  T.lire('creneau', 'c1'),
  paiement: T.lire('paiement', 'especes'),
  nom:      (compte && compte.nom) || 'Aïcha Koné',
  tel:      (compte && compte.tel) || '+225 07 88 12 44 09',
  adresse:  T.lire('adresse', 'Rue L94, portail vert, en face de la pharmacie'),
  position: T.lire('position', null),
  especes:  T.lire('especes', null),
  etape:    'panier',
  ref:      T.lire('refEnCours', null),
  q:        '',
  jour:     (D.jourCle === 'samedi' || D.jourCle === 'dimanche') ? 'lundi' : D.jourCle,
  sectionActive: null,
  ecran:    'accueil'
};

/* ---------------------------------------------------------- thème */
(function theme(){
  var courant = T.theme();
  Array.prototype.forEach.call(document.querySelectorAll('#themes button'), function(b){
    b.setAttribute('aria-pressed', b.dataset.th === courant);
    b.onclick = function(){
      T.theme(b.dataset.th);
      Array.prototype.forEach.call(document.querySelectorAll('#themes button'), function(x){
        x.setAttribute('aria-pressed', x.dataset.th === b.dataset.th);
      });
      avis('Thème ' + b.title.toLowerCase());
    };
  });
})();

/* ---------------------------------------------------------- panier */
function totalArticles(){ return S.panier.reduce(function(a,l){ return a + l.qte; }, 0); }
function sousTotal(){ return S.panier.reduce(function(a,l){ return a + l.prix * l.qte; }, 0); }
function frais(){ var st = sousTotal(); return !st ? 0 : (st >= T.boutique.seuilLivraisonOfferte ? 0 : T.zone(S.zone).frais); }
function total(){ return sousTotal() + frais(); }
function qteProduit(id){ return S.panier.reduce(function(a,l){ return a + (l.id === id ? l.qte : 0); }, 0); }

function ajouter(id, iFmt, qte, sups, note, silencieux){
  var p = T.produits[id];
  sups = sups || [];
  var supTxt = sups.map(function(s){ return s.nom; }).join(', ');
  var prix = p.formats[iFmt][1] + sups.reduce(function(a,s){ return a + s.prix; }, 0);
  var cle = id + '|' + iFmt + '|' + supTxt + '|' + (note || '');
  var l = S.panier.filter(function(x){ return x.cle === cle; })[0];
  if (l) l.qte += qte;
  else S.panier.push({cle:cle, id:id, nom:p.nom, img:p.img, fmt:p.formats[iFmt][0], sup:supTxt, prix:prix, qte:qte, note:note||''});
  if (S.etape === 'confirme'){ S.etape = 'panier'; S.ref = null; T.ecrire('refEnCours', null); }
  sauver();
  if (!silencieux){
    avis(qte + ' × ' + p.nom + ' ajouté');
    var b = $('#btnPanier'); b.classList.remove('saute'); void b.offsetWidth; b.classList.add('saute');
  }
}
function retirer(id){
  for (var i = S.panier.length - 1; i >= 0; i--){
    if (S.panier[i].id === id){ S.panier[i].qte--; if (S.panier[i].qte <= 0) S.panier.splice(i,1); break; }
  }
  sauver();
}
function sauver(){
  T.ecrire('panier', S.panier);
  T.ecrire('zone', S.zone); T.ecrire('creneau', S.creneau);
  T.ecrire('paiement', S.paiement); T.ecrire('adresse', S.adresse);
  rendreTout();
}

/* ---------------------------------------------------------- rail + sommaire */
function rendreRail(){
  var r = $('#rail'); r.innerHTML = '';
  categoriesActives().forEach(function(c){
    var b = el('button');
    var rond = el('span','rond');
    var i = el('img'); i.src = T.img(c.vignette); i.alt = '';
    rond.appendChild(i); b.appendChild(rond);
    b.appendChild(el('span', null, c.nom));
    b.dataset.cible = 'sec-' + c.id;
    b.setAttribute('aria-pressed', S.sectionActive === 'sec-' + c.id);
    b.onclick = function(){ allerSection('sec-' + c.id); };
    r.appendChild(b);
  });
  var s = $('#sommaire'); s.innerHTML = '';
  categoriesActives().forEach(function(c){
    var a = el('a', null, c.nom + '<span>' + produitsDe(c).length + '</span>');
    a.href = '#sec-' + c.id; a.dataset.cible = 'sec-' + c.id;
    a.onclick = function(e){ e.preventDefault(); allerSection('sec-' + c.id); };
    s.appendChild(a);
  });
  marquerActif();
}
function categoriesActives(){ return T.categories.filter(function(c){ return c.actif !== false; }); }
function produitsDe(c){ return T.produitsDe(c, S.jour); }
function allerSection(id){
  if (mobile()) ecran('accueil');
  var e = document.getElementById(id);
  if (e) e.scrollIntoView({behavior:'smooth', block:'start'});
}

/* ---------------------------------------------------------- menu */
function ligneProduit(id){
  var p = T.produits[id];
  if (!p) return el('div');
  var dispo = T.dispo(id);
  var b = el('button','plat' + (dispo ? '' : ' epuise'));
  var tx = el('div','tx');
  if (!dispo) tx.appendChild(el('span','etq rouge','Épuisé'));
  else if (p.tag) tx.appendChild(el('span','etq ' + (p.neuf ? 'vert' : 'or'), p.tag));
  tx.appendChild(el('h3', null, p.nom));
  tx.appendChild(el('p','d', p.desc));
  var meta = el('div','meta');
  meta.appendChild(el('span','prix', T.prixTxt(p)));
  meta.appendChild(el('span','etoile', ETOILE + p.note.toFixed(1).replace('.',',') + ' <span style="color:var(--doux)">(' + p.avis + ')</span>'));
  if (dispo && p.stock != null && p.stock <= 5) meta.appendChild(el('span','restant','plus que ' + p.stock));
  tx.appendChild(meta);

  var vis = el('div','vis');
  var im = el('img'); im.src = T.img(p.img); im.alt = ''; im.loading = 'lazy';
  vis.appendChild(im);
  b.appendChild(vis);
  b.appendChild(tx);

  if (dispo){
    var q = qteProduit(id);
    if (q > 0){
      var c = el('div','compteur cpt');
      var m = el('button', null, '−'); m.setAttribute('aria-label','Retirer un ' + p.nom);
      var n = el('b', null, String(q));
      var pl = el('button', null, '+'); pl.setAttribute('aria-label','Ajouter un ' + p.nom);
      m.onclick = function(e){ e.stopPropagation(); retirer(id); };
      pl.onclick = function(e){ e.stopPropagation(); ajouter(id, 0, 1, [], '', true); };
      c.appendChild(m); c.appendChild(n); c.appendChild(pl);
      b.appendChild(c);
    } else b.appendChild(el('span','plus','+'));
  }
  b.onclick = function(){ if (dispo) ouvrirFiche(id); };
  return b;
}

function rendreMenu(){
  var m = $('#menu'); m.innerHTML = '';

  if (S.q){
    var q = S.q.toLowerCase();
    var ids = Object.keys(T.produits).filter(function(id){
      var p = T.produits[id];
      return (p.nom + ' ' + p.desc).toLowerCase().indexOf(q) > -1;
    });
    var sec = el('section','sec');
    var t = el('div','sec-titre');
    var h = el('div','t-haut');
    h.appendChild(el('h2', null, 'Résultats'));
    h.appendChild(el('span', null, ids.length + ' article' + (ids.length > 1 ? 's' : '')));
    t.appendChild(h); sec.appendChild(t);
    if (!ids.length) sec.appendChild(el('p','vide','Rien pour « ' + S.q +' ». Essayez « dêguê », « jus » ou « poisson ».'));
    var g = el('div','plats');
    ids.forEach(function(id){ g.appendChild(ligneProduit(id)); });
    sec.appendChild(g); m.appendChild(sec);
    return;
  }

  categoriesActives().forEach(function(c){
    var sec = el('section','sec'); sec.id = 'sec-' + c.id;
    var t = el('div','sec-titre');
    var h = el('div','t-haut');
    h.appendChild(el('h2', null, c.nom));
    h.appendChild(el('span', null, c.parJour ? 'Livraison ' + D.long : produitsDe(c).length + ' articles'));
    t.appendChild(h);
    if (c.parJour){
      var j = el('div','jours');
      ['lundi','mardi','mercredi','jeudi','vendredi'].forEach(function(x){
        var b = el('button', null, x.charAt(0).toUpperCase() + x.slice(1) + (x === D.jourCle ? ' · demain' : ''));
        b.setAttribute('aria-pressed', S.jour === x);
        b.onclick = function(){
          var y = window.scrollY; S.jour = x; rendreMenu(); rendreRail(); window.scrollTo({top:y});
        };
        j.appendChild(b);
      });
      t.appendChild(j);
    }
    sec.appendChild(t);

    if (c.parJour){
      var groupes = (c.jours || {})[S.jour] || [];
      if (!groupes.length) sec.appendChild(el('p','vide','Pas de service déjeuner ce jour-là. Le p’tit déj et le goûter restent disponibles.'));
      groupes.forEach(function(gr){
        sec.appendChild(el('div','sous-sec', gr.groupe));
        var g = el('div','plats');
        gr.produits.filter(function(id){ return !!T.produits[id]; }).forEach(function(id){ g.appendChild(ligneProduit(id)); });
        sec.appendChild(g);
      });
    } else {
      var g2 = el('div','plats');
      produitsDe(c).forEach(function(id){ g2.appendChild(ligneProduit(id)); });
      sec.appendChild(g2);
    }
    m.appendChild(sec);
  });
  spy();
}

/* ---------------------------------------------------------- fiche produit */
function ouvrirFiche(id){
  var p = T.produits[id];
  var etat = {f:0, qte:1, sups:[]};
  var pan = $('#panneau-fiche');
  pan.innerHTML = '';

  var tete = el('div','tete');
  var ret = el('button','retour', FLECHE); ret.setAttribute('aria-label','Retour'); ret.onclick = fermer;
  tete.appendChild(ret);
  tete.appendChild(el('div', null, '<h3>' + p.nom + '</h3>'));
  pan.appendChild(tete);

  var dd = el('div','dedans');
  var im = el('img','fiche-ph'); im.src = T.img(p.img); im.alt = '';
  dd.appendChild(im);

  var ft = el('div','fiche-tete');
  ft.appendChild(el('h2', null, p.nom));
  ft.appendChild(el('p','d', p.desc));
  var meta = el('div','meta');
  meta.innerHTML = '<span style="display:inline-flex;align-items:center;gap:5px;color:var(--encre);font-weight:500">'
    + ETOILE + p.note.toFixed(1).replace('.',',') + '</span><span>' + p.avis + ' avis</span>'
    + (p.stock != null ? '<span>· ' + p.stock + ' portions préparées</span>' : '');
  ft.appendChild(meta);
  dd.appendChild(ft);

  var bf = el('div','champ');
  bf.appendChild(el('span','lab','Format'));
  var ch = el('div','choix');
  p.formats.forEach(function(f, i){
    var b = el('button', null, f[0] + '<span class="px">' + F(f[1]) + '</span>');
    b.setAttribute('aria-pressed', i === 0);
    b.onclick = function(){
      etat.f = i;
      Array.prototype.forEach.call(ch.children, function(x,j){ x.setAttribute('aria-pressed', j === i); });
      maj();
    };
    ch.appendChild(b);
  });
  bf.appendChild(ch); dd.appendChild(bf);

  if (p.sup && p.sup.length){
    var bs = el('div','champ');
    bs.appendChild(el('span','lab','Suppléments'));
    var box = el('div','sups');
    p.sup.forEach(function(s){
      var lab = el('label');
      var cb = el('input'); cb.type = 'checkbox';
      cb.onchange = function(){
        if (cb.checked) etat.sups.push(s);
        else etat.sups = etat.sups.filter(function(x){ return x !== s; });
        maj();
      };
      lab.appendChild(cb);
      lab.appendChild(el('span', null, s.nom));
      lab.appendChild(el('span','px', s.prix ? '+ ' + F(s.prix) : 'offert'));
      box.appendChild(lab);
    });
    bs.appendChild(box); dd.appendChild(bs);
  }

  var bn = el('div','champ');
  bn.appendChild(el('label','lab','Un mot pour la cuisine'));
  var note = el('input'); note.type = 'text'; note.placeholder = 'Sans piment, bien sucré…';
  bn.appendChild(note); dd.appendChild(bn);
  pan.appendChild(dd);

  var pied = el('div','pied');
  var rang = el('div'); rang.style.cssText = 'display:flex;gap:12px;align-items:center';
  var cpt = el('div','compteur');
  var moins = el('button', null, '−'); moins.setAttribute('aria-label','Retirer un');
  var nb = el('b', null, '1');
  var plus = el('button', null, '+'); plus.setAttribute('aria-label','Ajouter un');
  moins.onclick = function(){ if (etat.qte > 1){ etat.qte--; nb.textContent = etat.qte; maj(); } };
  plus.onclick = function(){ etat.qte++; nb.textContent = etat.qte; maj(); };
  cpt.appendChild(moins); cpt.appendChild(nb); cpt.appendChild(plus);
  rang.appendChild(cpt);
  var cta = el('button','btn plein');
  cta.onclick = function(){ ajouter(id, etat.f, etat.qte, etat.sups, note.value); fermer(); };
  rang.appendChild(cta);
  pied.appendChild(rang);
  pan.appendChild(pied);

  function prixUnite(){ return p.formats[etat.f][1] + etat.sups.reduce(function(a,s){ return a + s.prix; }, 0); }
  function maj(){ cta.textContent = 'Ajouter · ' + F(prixUnite() * etat.qte); }
  maj();
  ouvrir('#panneau-fiche');
}

/* ---------------------------------------------------------- feuille basse
   Les sous-choix passent par une feuille qui monte du bas, jamais par une
   fenêtre surgissante : c'est le geste attendu sur téléphone. */
function feuille(construire){
  var f = $('#feuille');
  f.innerHTML = '';
  f.appendChild(el('div','poignee'));
  construire(f);
  $('#voileF').classList.add('on');
  requestAnimationFrame(function(){ f.classList.add('on'); });
}
function fermerFeuille(){
  $('#feuille').classList.remove('on');
  $('#voileF').classList.remove('on');
}
$('#voileF').onclick = fermerFeuille;

/* ---------------------------------------------------------- panier / commande */
function rendrePanier(){
  var pan = $('#panneau-panier');
  pan.innerHTML = '';

  var tete = el('div','tete');
  if (mobile()){
    var ret = el('button','retour', FLECHE); ret.setAttribute('aria-label','Retour');
    ret.onclick = function(){
      if (S.etape === 'caisse'){ S.etape = 'panier'; rendrePanier(); return; }
      ecran('accueil');
    };
    tete.appendChild(ret);
  }
  var titres = {panier:'Votre panier', caisse:'Passage en caisse', confirme:'Commande envoyée'};
  var bloc = el('div');
  bloc.appendChild(el('h3', null, titres[S.etape]));
  if (S.etape === 'panier' && totalArticles()) bloc.appendChild(el('div','sous', totalArticles() + ' article' + (totalArticles()>1?'s':'')));
  if (S.etape === 'confirme' && S.ref) bloc.appendChild(el('div','sous', S.ref));
  tete.appendChild(bloc);
  pan.appendChild(tete);

  var dd = el('div','dedans');
  var pied = el('div','pied');

  if (S.etape === 'confirme'){ vueConfirme(dd, pied); }
  else if (!S.panier.length){ vueVide(dd, pied); }
  else if (S.etape === 'panier'){ vuePanier(dd, pied); }
  else { vueCaisse(dd, pied); }

  pan.appendChild(dd); pan.appendChild(pied);
}

function filEtapes(actif){
  var f = el('div','fil');
  [['panier','1','Panier'],['livraison','2','Livraison'],['paiement','3','Paiement']].forEach(function(e,i){
    var ordre = ['panier','livraison','paiement'];
    var etat = ordre.indexOf(e[0]) < ordre.indexOf(actif) ? 'ok' : (e[0] === actif ? 'on' : '');
    var b = el('span','e ' + etat, '<span class="p">' + (etat === 'ok' ? '✓' : e[1]) + '</span>' + e[2]);
    f.appendChild(b);
    if (i < 2) f.appendChild(el('span','tr'));
  });
  return f;
}

function vueVide(dd, pied){
  dd.appendChild(el('div','vide',
    '<span class="ic"><svg viewBox="0 0 24 24"><path d="M6 8h12l-1 12H7zM9 8V6a3 3 0 0 1 6 0v2"/></svg></span>' +
    'Votre panier est vide.<br>La commande de demain se prépare ce soir.'));
  var b = el('button','btn creux plein'); b.textContent = 'Parcourir la carte';
  b.onclick = function(){ ecran('accueil'); var c = categoriesActives()[0]; if (c) allerSection('sec-' + c.id); };
  pied.appendChild(b);
}

function vuePanier(dd, pied){
  var reste = T.boutique.seuilLivraisonOfferte - sousTotal();
  var j = el('div');
  j.appendChild(el('div','jauge-tx', reste > 0
    ? 'Plus que <b>' + F(reste) + '</b> pour la livraison offerte'
    : '<b>Livraison offerte</b> — seuil atteint'));
  j.appendChild(el('div','jauge','<i style="width:' + Math.min(100, Math.round(sousTotal()/T.boutique.seuilLivraisonOfferte*100)) + '%"></i>'));
  dd.appendChild(j);

  var liste = el('div');
  S.panier.forEach(function(l){
    var a = el('div','art');
    var im = el('img','v'); im.src = T.img(l.img); im.alt = ''; a.appendChild(im);
    var t = el('div');
    t.appendChild(el('div','n', l.nom));
    t.appendChild(el('div','o', [l.fmt, l.sup, l.note].filter(Boolean).join(' · ')));
    var cpt = el('div','compteur'); cpt.style.marginTop = '7px';
    var m = el('button', null, '−'); var n = el('b', null, String(l.qte)); var p2 = el('button', null, '+');
    m.setAttribute('aria-label','Retirer un ' + l.nom); p2.setAttribute('aria-label','Ajouter un ' + l.nom);
    m.onclick = function(){ l.qte--; if (l.qte <= 0) S.panier = S.panier.filter(function(x){ return x !== l; }); sauver(); };
    p2.onclick = function(){ l.qte++; sauver(); };
    cpt.appendChild(m); cpt.appendChild(n); cpt.appendChild(p2);
    t.appendChild(cpt);
    a.appendChild(t);
    a.appendChild(el('div','p','<div class="px">' + F(l.prix * l.qte) + '</div>'));
    liste.appendChild(a);
  });
  dd.appendChild(liste);

  var ajout = el('button','btn creux petit');
  ajout.style.justifySelf = 'start';
  ajout.textContent = 'Ajouter des articles';
  ajout.onclick = function(){ ecran('accueil'); };
  dd.appendChild(ajout);

  /* suggestions : ce qui va bien avec le panier */
  var dedans = {};
  S.panier.forEach(function(l){ dedans[l.id] = 1; });
  var idees = ['bissap','degue','cafe-milo','pastels','fruits','gingembre','yaourt','the-lait']
    .filter(function(id){ return T.produits[id] && !dedans[id] && T.dispo(id); }).slice(0,6);
  if (idees.length){
    dd.appendChild(el('div','lab','Vous aimerez peut-être aussi'));
    var rail = el('div','suggest');
    idees.forEach(function(id){
      var p3 = T.produits[id];
      var b = el('button','s');
      var im2 = el('img','im'); im2.src = T.img(p3.img); im2.alt = ''; im2.loading = 'lazy';
      b.appendChild(im2);
      b.appendChild(el('span','a','+'));
      b.appendChild(el('div','c','<div class="n">' + p3.nom + '</div><div class="p">' + T.prixTxt(p3) + '</div>'));
      b.onclick = function(){ ajouter(id, 0, 1, [], ''); };
      rail.appendChild(b);
    });
    dd.appendChild(rail);
  }

  var add = el('div','addition');
  add.appendChild(el('div', null, '<span>Sous-total</span><span>' + F(sousTotal()) + '</span>'));
  add.appendChild(el('div', null, '<span>Livraison · ' + T.zone(S.zone).nom + '</span><span>' + (frais() ? F(frais()) : 'Offerte') + '</span>'));
  add.appendChild(el('div','tot','<span>Total</span><span>' + F(total()) + '</span>'));
  pied.appendChild(add);
  var b2 = el('button','btn plein grand');
  b2.textContent = 'Passer à la caisse · ' + F(total());
  b2.onclick = function(){ S.etape = 'caisse'; rendrePanier(); };
  pied.appendChild(b2);
}

/* carte de localisation, posée à l'ouverture de la section adresse */
var carteL = null, marqueur = null;
function monterCarte(){
  var noeud = document.getElementById('carte-map');
  if (!noeud) return;
  if (!window.L){ noeud.innerHTML = '<div class="vide" style="padding:24px">Carte indisponible hors connexion.</div>'; return; }
  var pos = S.position || T.zone(S.zone).position;
  if (carteL){ try{ carteL.remove(); }catch(e){} carteL = null; }
  carteL = L.map(noeud, {zoomControl:false, attributionControl:false}).setView(pos, 15);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom:19}).addTo(carteL);
  marqueur = L.marker(pos, {draggable:true}).addTo(carteL);
  marqueur.on('dragend', function(){
    var p = marqueur.getLatLng();
    S.position = [p.lat, p.lng];
    T.ecrire('position', S.position);
    avis('Point de livraison enregistré');
  });
  setTimeout(function(){ carteL.invalidateSize(); }, 140);
}

/* ---------------------------------------------------------- passage en caisse
   Une seule page, des sections repliables et un bouton qui ne bouge pas :
   moins d'étapes, moins d'abandon.                                         */
function section(icone, titre, valeur, construire, ouverteParDefaut){
  var s2 = el('div','sect');
  var t = el('button','t');
  t.innerHTML = '<span class="ic">' + icone + '</span>' +
    '<span class="tx"><b>' + titre + '</b><span>' + valeur + '</span></span>' +
    '<span class="fl">' + (ouverteParDefaut ? '⌃' : '⌄') + '</span>';
  s2.appendChild(t);
  var corps = el('div','corps' + (ouverteParDefaut ? '' : ' ferme'));
  construire(corps);
  s2.appendChild(corps);
  t.onclick = function(){
    var ferme = corps.classList.toggle('ferme');
    t.querySelector('.fl').textContent = ferme ? '⌄' : '⌃';
    if (!ferme && titre.indexOf('Adresse') > -1) setTimeout(monterCarte, 220);
  };
  return s2;
}

function vueCaisse(dd, pied){
  var IC = {
    sac:'<svg viewBox="0 0 24 24"><path d="M6 8h12l-1 12H7zM9 8V6a3 3 0 0 1 6 0v2"/></svg>',
    horloge:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
    lieu:'<svg viewBox="0 0 24 24"><path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/></svg>',
    carte:'<svg viewBox="0 0 24 24"><rect x="2.5" y="5.5" width="19" height="13" rx="3"/><path d="M2.5 10h19"/></svg>'
  };

  /* 1. le contenu du panier, replié par défaut */
  dd.appendChild(section(IC.sac, 'Votre commande',
    totalArticles() + ' article' + (totalArticles() > 1 ? 's' : '') + ' · ' + F(sousTotal()),
    function(c){
      S.panier.forEach(function(l){
        var r = el('div');
        r.style.cssText = 'display:flex;gap:10px;font-size:13px;align-items:baseline';
        r.innerHTML = '<span style="color:var(--doux)">' + l.qte + ' ×</span><span style="flex:1">' + l.nom +
          '<span style="display:block;font-size:11.5px;color:var(--doux)">' +
          [l.fmt, l.sup, l.note].filter(Boolean).join(' · ') + '</span></span>' +
          '<span style="font-family:var(--titre);font-weight:700">' + F(l.prix * l.qte) + '</span>';
        c.appendChild(r);
      });
      var mod = el('button','btn creux petit');
      mod.style.justifySelf = 'start';
      mod.textContent = 'Modifier le panier';
      mod.onclick = function(){ S.etape = 'panier'; rendrePanier(); };
      c.appendChild(mod);
    }));

  /* 2. le créneau */
  dd.appendChild(section(IC.horloge, 'Livraison',
    D.court + ' · ' + T.creneau(S.creneau).nom,
    function(c){
      c.appendChild(el('p','aide','Commande préparée le matin même, livrée ' + D.long + '.'));
      var ch = el('div','choix');
      T.creneaux.forEach(function(x){
        var b = el('button', null, x.nom + (x.type === 'gouter' ? ' <span class="px">goûter</span>' : ''));
        b.setAttribute('aria-pressed', S.creneau === x.id);
        b.onclick = function(){ S.creneau = x.id; sauver(); rendrePanier(); };
        ch.appendChild(b);
      });
      c.appendChild(ch);
    }, true));

  /* 3. l'adresse */
  dd.appendChild(section(IC.lieu, 'Adresse de livraison',
    T.zone(S.zone).nom + ' — ' + S.adresse.slice(0, 28) + (S.adresse.length > 28 ? '…' : ''),
    function(c){
      var carte = el('div'); carte.id = 'carte-map';
      c.appendChild(carte);
      var cz = el('div','choix');
      T.zones.forEach(function(x){
        var b = el('button', null, x.nom + '<span class="px">' + F(x.frais) + '</span>');
        b.setAttribute('aria-pressed', S.zone === x.id);
        b.onclick = function(){ S.zone = x.id; S.position = null; sauver(); rendrePanier(); };
        cz.appendChild(b);
      });
      c.appendChild(cz);
      var a = el('div','champ');
      a.appendChild(el('label','lab','Rue, portail, point de repère'));
      var ia = el('input'); ia.type = 'text'; ia.value = S.adresse;
      ia.oninput = function(){ S.adresse = ia.value; };
      a.appendChild(ia); c.appendChild(a);
      var n = el('div','champ');
      n.appendChild(el('label','lab','Nom'));
      var inom = el('input'); inom.type = 'text'; inom.value = S.nom;
      inom.oninput = function(){ S.nom = inom.value; };
      n.appendChild(inom); c.appendChild(n);
      var tl = el('div','champ');
      tl.appendChild(el('label','lab','Téléphone'));
      var it = el('input'); it.type = 'tel'; it.value = S.tel;
      it.oninput = function(){ S.tel = it.value; };
      tl.appendChild(it); c.appendChild(tl);
      setTimeout(monterCarte, 120);
    }, true));

  /* 4. le paiement */
  var pa = T.paiement(S.paiement);
  var detailPaiement = pa.nom;
  if (S.paiement === 'especes' && S.especes && S.especes.montant)
    detailPaiement += ' · ' + (S.especes.appoint ? 'appoint exact' : 'paie avec ' + F(S.especes.montant));
  dd.appendChild(section(IC.carte, 'Moyen de paiement', detailPaiement, function(c){
    var m = el('div','moyens');
    T.paiements.forEach(function(p3){
      var lab = el('label', S.paiement === p3.id ? 'choisi' : '');
      var r = el('input'); r.type = 'radio'; r.name = 'paiement'; r.checked = S.paiement === p3.id;
      r.onchange = function(){
        S.paiement = p3.id; sauver();
        if (p3.id === 'especes') feuilleEspeces();
        else rendrePanier();
      };
      var img = el('img'); img.src = p3.logo; img.alt = '';
      lab.appendChild(r); lab.appendChild(img);
      lab.appendChild(el('span','tx','<b>' + p3.nom + '</b><span>' + p3.aide + '</span>'));
      m.appendChild(lab);
    });
    c.appendChild(m);
    if (S.paiement === 'especes'){
      var b = el('button','btn creux petit');
      b.style.justifySelf = 'start';
      b.textContent = S.especes && S.especes.montant ? 'Modifier le montant' : 'Vous payez avec combien ?';
      b.onclick = feuilleEspeces;
      c.appendChild(b);
    }
  }, true));

  /* 5. le récapitulatif */
  var rec = el('div','addition');
  rec.appendChild(el('div', null, '<span>Produits</span><span>' + F(sousTotal()) + '</span>'));
  rec.appendChild(el('div', null, '<span>Livraison</span><span>' + (frais() ? F(frais()) : 'Offerte') + '</span>'));
  rec.appendChild(el('div','tot','<span>Total à payer</span><span>' + F(total()) + '</span>'));
  dd.appendChild(rec);
  dd.appendChild(el('p','aide','Rien n\u2019est débité maintenant. Tela Castle confirme la commande, puis vous payez ' +
    'au livreur ou par ' + pa.nom.toLowerCase() + '.'));

  var b3 = el('button','btn plein grand');
  b3.textContent = 'Envoyer ma commande · ' + F(total());
  b3.onclick = envoyer;
  pied.appendChild(b3);
}

/* feuille « vous payez avec combien ? », comme chez les livreurs d'ici */
function feuilleEspeces(){
  var brouillon = {montant: (S.especes && S.especes.montant) || total(), appoint: !!(S.especes && S.especes.appoint)};
  feuille(function(f){
    f.appendChild(el('span','ic-rond','<svg viewBox="0 0 24 24"><rect x="2.5" y="6" width="19" height="12" rx="2.5"/>' +
      '<circle cx="12" cy="12" r="2.8"/><path d="M6 9.5v5M18 9.5v5"/></svg>'));
    f.appendChild(el('h3', null, 'Vous payez avec combien ?'));
    f.appendChild(el('p','sous','Le livreur prépare la monnaie. Total à payer : <b style="color:var(--encre)">' + F(total()) + '</b>'));

    var ch = el('div','champ');
    ch.style.marginTop = '18px';
    ch.appendChild(el('label','lab','Montant remis'));
    var ligne = el('div');
    ligne.style.cssText = 'display:flex;gap:8px;align-items:center';
    var inp = el('input');
    inp.type = 'number'; inp.inputMode = 'numeric'; inp.min = total(); inp.step = 500;
    inp.value = brouillon.montant;
    inp.style.cssText = 'flex:1;text-align:right;font-family:var(--titre);font-weight:700;font-size:17px';
    var u = el('span'); u.textContent = 'F'; u.style.cssText = 'color:var(--doux);font-size:14px';
    inp.oninput = function(){
      brouillon.montant = Number(inp.value) || 0;
      brouillon.appoint = brouillon.montant === total();
      caseAppoint.setAttribute('aria-pressed', brouillon.appoint);
      majRendu();
    };
    ligne.appendChild(inp); ligne.appendChild(u);
    ch.appendChild(ligne);
    f.appendChild(ch);

    var billets = el('div','choix');
    billets.style.marginTop = '10px';
    var propositions = [total(), 1000, 2000, 5000, 10000]
      .filter(function(v, i, a){ return v >= total() && a.indexOf(v) === i; })
      .sort(function(a, b){ return a - b; })
      .slice(0, 4);
    propositions.forEach(function(v){
      var b = el('button', null, F(v));
      b.onclick = function(){
        brouillon.montant = v; inp.value = v;
        brouillon.appoint = v === total();
        caseAppoint.setAttribute('aria-pressed', brouillon.appoint);
        majRendu();
      };
      billets.appendChild(b);
    });
    f.appendChild(billets);

    var caseAppoint = el('button','choix');
    caseAppoint = el('button');
    caseAppoint.style.cssText = 'display:flex;align-items:center;gap:11px;padding:12px 13px;border:var(--ep-bord) solid var(--bord);' +
      'border-radius:12px;font-size:13px;width:100%;margin-top:12px;text-align:left';
    caseAppoint.innerHTML = '<span class="c" style="width:20px;height:20px;border-radius:6px;border:var(--ep-bord) solid var(--bord-fort);' +
      'display:grid;place-items:center;font-size:12px;flex:none"></span><span>J\u2019ai l\u2019appoint exact</span>';
    function majCase(){
      var on = brouillon.appoint;
      caseAppoint.querySelector('.c').textContent = on ? '✓' : '';
      caseAppoint.querySelector('.c').style.background = on ? 'var(--or)' : 'transparent';
      caseAppoint.querySelector('.c').style.borderColor = on ? 'var(--or)' : 'var(--bord-fort)';
    }
    caseAppoint.onclick = function(){
      brouillon.appoint = !brouillon.appoint;
      if (brouillon.appoint){ brouillon.montant = total(); inp.value = total(); }
      majCase(); majRendu();
    };
    f.appendChild(caseAppoint);

    var rendu = el('p','sous');
    rendu.style.marginTop = '12px';
    f.appendChild(rendu);
    function majRendu(){
      majCase();
      var d2 = brouillon.montant - total();
      rendu.innerHTML = d2 > 0
        ? 'Le livreur rendra <b style="color:var(--encre)">' + F(d2) + '</b>'
        : (d2 === 0 ? 'Aucune monnaie à rendre.' : '<span style="color:var(--rouge)">Montant inférieur au total.</span>');
    }
    majRendu();

    var act = el('div','actions');
    var ok = el('button','btn plein');
    ok.textContent = 'Confirmer';
    ok.onclick = function(){
      S.especes = {montant:brouillon.montant, appoint:brouillon.appoint};
      T.ecrire('especes', S.especes);
      fermerFeuille(); rendrePanier();
      avis(brouillon.appoint ? 'Appoint exact noté' : 'Monnaie à préparer : ' + F(brouillon.montant - total()));
    };
    var non = el('button','btn creux');
    non.textContent = 'Annuler';
    non.onclick = fermerFeuille;
    act.appendChild(ok); act.appendChild(non);
    f.appendChild(act);
  });
}

function envoyer(){
  if (!S.panier.length) return;
  var cmd = {
    ref: T.nouvelleRef(),
    creele: new Date().toISOString(),
    client: {nom:S.nom, tel:S.tel, id:(compte && compte.id) || 'invite'},
    zone: S.zone, adresse: S.adresse, position: S.position,
    creneau: S.creneau, jourLivraison: D.livraison.toISOString(),
    lignes: S.panier.map(function(l){ return {id:l.id, nom:l.nom, img:l.img, fmt:l.fmt, sup:l.sup, prix:l.prix, qte:l.qte, note:l.note}; }),
    sousTotal: sousTotal(), frais: frais(), total: total(),
    paiement: S.paiement,
    especes: S.paiement === 'especes' ? S.especes : null,
    statut: 'recue', canal: 'app',
    journal: [{quand:new Date().toISOString(), quoi:'recue'}]
  };
  T.enregistrerCommande(cmd);
  /* le stock diminue comme dans la vraie vie */
  S.panier.forEach(function(l){
    var p = T.produits[l.id];
    if (p && p.stock != null) T.majStock(l.id, p.stock - l.qte);
  });
  if (compte){ T.gagnerFidelite(compte.tel); compte = T.compte(); }
  S.ref = cmd.ref; T.ecrire('refEnCours', cmd.ref);
  S.etape = 'confirme';
  S.panier = [];
  sauver();
  avis('Commande envoyée à Tela Castle');
}

function commandeCourante(){
  if (!S.ref) return null;
  return T.commandes().filter(function(c){ return c.ref === S.ref; })[0] || null;
}

function vueConfirme(dd, pied){
  var cmd = commandeCourante();
  if (!cmd){ S.etape = 'panier'; rendrePanier(); return; }
  var st = T.statuts[cmd.statut] || T.statuts.recue;

  dd.appendChild(el('div','bloc','<div style="padding:14px 16px">' +
    '<div style="display:flex;align-items:center;gap:9px"><span class="etq ' + st.couleur + '"><span class="pt"></span>' + st.nom + '</span>' +
    '<span style="margin-left:auto;font-size:12px;color:var(--doux)">' + T.heure(cmd.creele) + '</span></div>' +
    '<div style="margin-top:10px;font-size:13.5px">' + st.client + '</div>' +
    '<div style="font-size:12px;color:var(--doux);margin-top:3px">Livraison ' + D.long + ' · ' + T.creneau(cmd.creneau).nom + '</div></div>'));

  var suivi = el('div');
  T.ordreStatuts.forEach(function(cle, i){
    var e = T.statuts[cle];
    var etat = (cmd.statut === 'refusee') ? '' : (e.etape < st.etape ? 'ok' : (e.etape === st.etape ? 'now' : ''));
    var w = el('div','pas ' + etat);
    var rep = el('div','rep'); rep.appendChild(el('div','pt'));
    if (i < T.ordreStatuts.length - 1) rep.appendChild(el('div','fil2'));
    w.appendChild(rep);
    w.appendChild(el('div','t','<b>' + e.nom + '</b><p>' + (etat ? e.client : '—') + '</p>'));
    suivi.appendChild(w);
  });
  dd.appendChild(suivi);

  /* qui reçoit quoi : la question mérite une réponse à l'écran */
  var suite = el('div','bloc');
  suite.style.padding = '15px 16px';
  suite.innerHTML =
    '<b style="font-family:var(--titre);font-size:15px">Et maintenant ?</b>' +
    '<div style="font-size:12.8px;color:var(--doux);line-height:1.6;margin-top:8px">' +
    '<b style="color:var(--encre);font-weight:500">1.</b> Votre commande est arrivée chez Tela Castle, ' +
    'qui la voit dans son espace de gestion et vous confirme sous 15 minutes.<br>' +
    '<b style="color:var(--encre);font-weight:500">2.</b> Vous pouvez aussi la lui envoyer sur WhatsApp au ' +
    '<b style="color:var(--encre);font-weight:500">' + T.boutique.tel + '</b>, pour préciser un détail.<br>' +
    '<b style="color:var(--encre);font-weight:500">3.</b> Le reçu ci-dessous est <b style="color:var(--encre);' +
    'font-weight:500">pour vous</b> : gardez-le, ou envoyez-le à la personne qui paie.</div>';
  dd.appendChild(suite);

  dd.appendChild(el('div','lab','Votre reçu'));
  var boite = el('div');
  dd.appendChild(boite);
  if (T.apercuRecu) T.apercuRecu(cmd, boite);
  else dd.appendChild(ticket(cmd));

  var enr = el('button');
  enr.style.cssText = 'font-size:12.5px;color:var(--doux);text-decoration:underline;margin:0 auto';
  enr.textContent = 'Enregistrer l\u2019image du reçu';
  enr.onclick = function(){ T.telechargerRecu(cmd, function(){ avis('Reçu enregistré'); }); };
  dd.appendChild(enr);

  /* proposition de compte, seulement si le client n'en a pas */
  if (!compte){
    var prop = el('div','bloc');
    prop.style.cssText = 'padding:14px 16px;display:flex;align-items:center;gap:12px';
    prop.innerHTML = '<span style="flex:1;min-width:0;font-size:12.5px;line-height:1.45">' +
      '<b style="font-weight:500">Commande passée sans compte.</b><br>Créez-en un avec ' +
      T.telJoli(cmd.client.tel) + ' pour retrouver vos commandes.</span>';
    var bc2 = el('button','btn creux petit');
    bc2.textContent = 'Créer';
    bc2.onclick = function(){ ecran('compte'); };
    prop.appendChild(bc2);
    dd.appendChild(prop);
  }

  var wa = el('a','btn vert plein');
  wa.href = T.lienWhatsApp(cmd); wa.target = '_blank'; wa.rel = 'noopener';
  wa.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2zm5.6 14.1c-.2.6-1.2 1.2-1.7 1.2-.5.1-1 .1-1.7-.1-.4-.1-.9-.3-1.6-.6-2.8-1.2-4.6-4-4.7-4.2-.1-.2-1.1-1.4-1.1-2.7s.7-1.9 1-2.2c.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5s.8 1.9.8 2 .1.3 0 .5c-.1.2-.2.3-.3.5l-.4.5c-.2.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1s.7-.8.9-1.1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.3z"/></svg> Prévenir la boutique sur WhatsApp';
  pied.appendChild(wa);

  var capacite = T.capaciteRecu ? T.capaciteRecu() : 'telecharge';
  var libelles = {partage:'Partager le reçu', copie:'Copier le reçu', telecharge:'Enregistrer le reçu'};
  var partage = el('button','btn creux plein');
  partage.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4M8 8l4-4 4 4"/><path d="M4 14v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/></svg> ' + libelles[capacite];
  partage.onclick = function(){
    partage.disabled = true;
    T.partagerRecu(cmd, function(etat){
      partage.disabled = false;
      if (etat === 'copie') avis('Reçu copié — ouvrez WhatsApp et collez avec Ctrl+V');
      else if (etat === 'telecharge') avis('Reçu enregistré — joignez-le à votre message');
      else if (etat === 'partage') avis('Reçu partagé');
      else if (etat === 'erreur') avis('Le reçu n\u2019a pas pu être créé');
    });
  };
  pied.appendChild(partage);
  if (capacite !== 'partage'){
    pied.appendChild(el('span','aide', capacite === 'copie'
      ? 'Ce navigateur ne sait pas envoyer une image directement. Le reçu est copié, il ne reste qu\u2019à le coller dans la conversation.'
      : 'Ce navigateur ne sait pas envoyer une image directement. Le reçu est enregistré dans vos téléchargements.'));
  }

  var nb = el('button','btn creux plein'); nb.textContent = 'Nouvelle commande';
  nb.onclick = function(){ S.ref = null; T.ecrire('refEnCours', null); S.etape = 'panier'; rendrePanier(); ecran('accueil'); };
  pied.appendChild(nb);
}

function ticket(cmd){
  var z = T.zone(cmd.zone), c = T.creneau(cmd.creneau), p = T.paiement(cmd.paiement);
  var t = el('div','ticket'); t.style.maxWidth = 'none';
  var tete = el('div','tete');
  tete.innerHTML = '<img src="img/logo.png" alt=""><b>TELA CASTLE</b><span>' + T.boutique.adresse + '</span><span>' + T.boutique.tel + '</span>';
  t.appendChild(tete);
  t.appendChild(el('div','traits'));
  t.appendChild(el('div','l','<span>Commande</span><span>' + cmd.ref + '</span>'));
  t.appendChild(el('div','l','<span>Passée le</span><span>' + T.dateCourte(cmd.creele) + ' ' + T.heure(cmd.creele) + '</span>'));
  t.appendChild(el('div','l','<span>Livraison</span><span>' + T.dateCourte(cmd.jourLivraison) + ' · ' + c.nom + '</span>'));
  t.appendChild(el('div','l','<span>Client</span><span>' + cmd.client.nom + '</span>'));
  t.appendChild(el('div','traits'));
  cmd.lignes.forEach(function(l){
    t.appendChild(el('div','l','<span>' + l.qte + ' × ' + l.nom +
      '<em>' + [l.fmt, l.sup, l.note].filter(Boolean).join(' · ') + '</em></span><span>' + F(l.prix * l.qte) + '</span>'));
  });
  t.appendChild(el('div','traits'));
  t.appendChild(el('div','l','<span>Sous-total</span><span>' + F(cmd.sousTotal) + '</span>'));
  t.appendChild(el('div','l','<span>Livraison ' + z.nom + '</span><span>' + (cmd.frais ? F(cmd.frais) : 'offerte') + '</span>'));
  t.appendChild(el('div','l tot','<span>TOTAL</span><span>' + F(cmd.total) + '</span>'));
  t.appendChild(el('div','l','<span>Paiement</span><span>' + p.nom + '</span>'));
  t.appendChild(el('div','pied','Merci et à demain matin.<br>Bien manger, un plaisir à partager.'));
  return t;
}

/* ---------------------------------------------------------- compte
   Parcours en trois temps, comme les applications de commande d'ici :
   numéro → code reçu par message → profil si le numéro est inconnu.      */
var CPT = {etape:'tel', tel:'', attendu:'', restant:0, minuteur:null};

function rendreCompte(){
  var pan = $('#panneau-compte');
  pan.innerHTML = '';

  var tete = el('div','tete');
  var ret = el('button','retour', FLECHE);
  ret.setAttribute('aria-label','Retour');
  ret.onclick = function(){
    if (!compte && CPT.etape === 'code'){ CPT.etape = 'tel'; rendreCompte(); return; }
    if (!compte && CPT.etape === 'profil'){ CPT.etape = 'code'; rendreCompte(); return; }
    fermer();
  };
  tete.appendChild(ret);
  var titres = {tel:'Connexion', code:'Code de confirmation', profil:'Votre profil'};
  tete.appendChild(el('div', null, '<h3>' + (compte ? 'Mon compte' : titres[CPT.etape]) + '</h3>'));
  pan.appendChild(tete);

  var dd = el('div','dedans');
  var pied = el('div','pied');
  pan.appendChild(dd); pan.appendChild(pied);

  if (compte) vueCompte(dd, pied);
  else if (CPT.etape === 'tel') vueTelephone(dd, pied);
  else if (CPT.etape === 'code') vueCode(dd, pied);
  else vueProfil(dd, pied);
}

function illustration(ic, titre, sous){
  var b = el('div');
  b.style.cssText = 'text-align:center;padding:6px 0 4px';
  b.innerHTML = '<span style="width:62px;height:62px;border-radius:50%;background:var(--or-doux);display:grid;' +
    'place-items:center;margin:0 auto 14px">' + ic + '</span>' +
    '<h2 style="font-size:21px">' + titre + '</h2>' +
    '<p style="font-size:13.5px;color:var(--doux);margin-top:6px;line-height:1.5">' + sous + '</p>';
  return b;
}

/* --- 1. le numéro --- */
function vueTelephone(dd, pied){
  dd.appendChild(illustration(
    '<svg viewBox="0 0 24 24" style="width:26px;height:26px;stroke:var(--or-fonce);fill:none;stroke-width:1.8;stroke-linecap:round"><rect x="6" y="2.5" width="12" height="19" rx="3"/><path d="M11 18.5h2"/></svg>',
    'Votre numéro',
    'Nous vous envoyons un code à quatre chiffres<br>par message pour retrouver vos commandes.'));

  var ch = el('div','champ');
  ch.appendChild(el('label','lab','Numéro de téléphone'));
  var ligne = el('div');
  ligne.style.cssText = 'display:flex;gap:8px;align-items:center';
  var ind = el('span');
  ind.style.cssText = 'flex:none;padding:11px 13px;border:var(--ep-bord) solid var(--bord);border-radius:var(--r-s);' +
    'font-size:13.5px;background:var(--surface-2)';
  ind.textContent = '🇨🇮 +225';
  var inp = el('input');
  inp.type = 'tel'; inp.inputMode = 'numeric'; inp.placeholder = '07 00 00 00 00';
  inp.value = CPT.tel ? T.telCle(CPT.tel).replace(/(\d{2})(?=\d)/g,'$1 ').trim() : '';
  inp.style.flex = '1';
  inp.oninput = function(){
    var n = inp.value.replace(/[^0-9]/g,'').slice(0,10);
    inp.value = n.replace(/(\d{2})(?=\d)/g,'$1 ').trim();
    CPT.tel = n;
    cta.disabled = n.length < 8;
  };
  ligne.appendChild(ind); ligne.appendChild(inp);
  ch.appendChild(ligne);
  ch.appendChild(el('span','aide','Le même numéro que sur WhatsApp, pour recevoir le suivi de vos commandes.'));
  dd.appendChild(ch);

  var cta = el('button','btn plein grand');
  cta.textContent = 'Recevoir le code';
  cta.disabled = T.telCle(CPT.tel).length < 8;
  cta.onclick = function(){
    CPT.attendu = String(Math.floor(1000 + Math.random() * 9000));
    CPT.etape = 'code';
    lancerCompteARebours();
    rendreCompte();
    avis('Code envoyé au ' + T.telJoli(CPT.tel));
  };
  pied.appendChild(cta);
  var sans = el('button','btn creux plein');
  sans.textContent = 'Continuer sans compte';
  sans.onclick = function(){ fermer(); };
  pied.appendChild(sans);
  setTimeout(function(){ inp.focus(); }, 120);
}

/* --- 2. le code --- */
function lancerCompteARebours(){
  CPT.restant = 30;
  clearInterval(CPT.minuteur);
  CPT.minuteur = setInterval(function(){
    CPT.restant--;
    var e = $('#renvoi');
    if (!e){ clearInterval(CPT.minuteur); return; }
    if (CPT.restant <= 0){
      clearInterval(CPT.minuteur);
      e.textContent = 'Renvoyer le code';
      e.disabled = false;
    } else e.textContent = 'Renvoyer le code dans ' + CPT.restant + ' s';
  }, 1000);
}
function vueCode(dd, pied){
  dd.appendChild(illustration(
    '<svg viewBox="0 0 24 24" style="width:26px;height:26px;stroke:var(--or-fonce);fill:none;stroke-width:1.8;stroke-linecap:round"><path d="M3 8.5 12 14l9-5.5"/><rect x="3" y="5" width="18" height="14" rx="3"/></svg>',
    'Entrez le code',
    'Envoyé au <b style="color:var(--encre)">' + T.telJoli(CPT.tel) + '</b>'));

  var cases = el('div');
  cases.style.cssText = 'display:flex;gap:10px;justify-content:center;margin:4px 0 2px';
  var champs = [];
  for (var i = 0; i < 4; i++){
    (function(n){
      var c = el('input');
      c.type = 'text'; c.inputMode = 'numeric'; c.maxLength = 1;
      c.style.cssText = 'width:58px;height:66px;text-align:center;font-family:var(--titre);font-weight:700;' +
        'font-size:26px;border:var(--ep-bord) solid var(--bord);border-radius:var(--r);background:var(--surface)';
      c.oninput = function(){
        c.value = c.value.replace(/[^0-9]/g,'');
        if (c.value && n < 3) champs[n+1].focus();
        verifier();
      };
      c.onkeydown = function(e){
        if (e.key === 'Backspace' && !c.value && n > 0) champs[n-1].focus();
      };
      c.onpaste = function(e){
        var t = (e.clipboardData.getData('text') || '').replace(/[^0-9]/g,'').slice(0,4);
        if (!t) return;
        e.preventDefault();
        t.split('').forEach(function(ch, j){ if (champs[j]) champs[j].value = ch; });
        champs[Math.min(t.length,3)].focus();
        verifier();
      };
      c.onfocus = function(){ c.style.borderColor = 'var(--or)'; };
      c.onblur = function(){ c.style.borderColor = 'var(--bord)'; };
      champs.push(c); cases.appendChild(c);
    })(i);
  }
  dd.appendChild(cases);

  var indice = el('div');
  indice.style.cssText = 'border:1.5px dashed var(--bord-fort);border-radius:var(--r);padding:12px 14px;' +
    'font-size:12.5px;color:var(--doux);text-align:center';
  indice.innerHTML = 'Maquette — aucun SMS n\u2019est envoyé.<br>Votre code est <b style="color:var(--encre);' +
    'font-family:var(--titre);font-size:15px;letter-spacing:.08em">' + CPT.attendu + '</b>';
  dd.appendChild(indice);

  var renvoi = el('button');
  renvoi.id = 'renvoi';
  renvoi.style.cssText = 'font-size:13px;color:var(--doux);text-decoration:underline;margin:0 auto';
  renvoi.textContent = 'Renvoyer le code dans ' + CPT.restant + ' s';
  renvoi.disabled = CPT.restant > 0;
  renvoi.onclick = function(){
    if (CPT.restant > 0) return;
    CPT.attendu = String(Math.floor(1000 + Math.random() * 9000));
    lancerCompteARebours();
    rendreCompte();
    avis('Nouveau code envoyé');
  };
  dd.appendChild(renvoi);

  var cta = el('button','btn plein grand');
  cta.textContent = 'Confirmer';
  cta.disabled = true;
  cta.onclick = valider;
  pied.appendChild(cta);
  var chg = el('button','btn creux plein');
  chg.textContent = 'Modifier le numéro';
  chg.onclick = function(){ CPT.etape = 'tel'; clearInterval(CPT.minuteur); rendreCompte(); };
  pied.appendChild(chg);

  function saisi(){ return champs.map(function(c){ return c.value; }).join(''); }
  function verifier(){
    var v = saisi();
    cta.disabled = v.length < 4;
    if (v.length === 4) valider();
  }
  function valider(){
    var v = saisi();
    if (v.length < 4) return;
    if (v !== CPT.attendu){
      champs.forEach(function(c){ c.value = ''; c.style.borderColor = 'var(--rouge)'; });
      champs[0].focus();
      avis('Code incorrect, réessayez');
      return;
    }
    clearInterval(CPT.minuteur);
    var connu = T.compteParTel(CPT.tel);
    if (connu){
      compte = connu;
      T.connexion(connu);
      S.nom = connu.nom; S.tel = connu.tel;
      if (connu.zone) S.zone = connu.zone;
      if (connu.adresse) S.adresse = connu.adresse;
      sauver();
      avis('Bon retour, ' + connu.nom.split(' ')[0]);
      rendreCompte();
    } else {
      CPT.etape = 'profil';
      rendreCompte();
    }
  }
  setTimeout(function(){ champs[0].focus(); }, 140);
}

/* --- 3. le profil, uniquement pour un numéro inconnu --- */
function vueProfil(dd, pied){
  dd.appendChild(illustration(
    '<svg viewBox="0 0 24 24" style="width:26px;height:26px;stroke:var(--or-fonce);fill:none;stroke-width:1.8;stroke-linecap:round"><circle cx="12" cy="8.5" r="3.6"/><path d="M4.8 20a7.5 7.5 0 0 1 14.4 0"/></svg>',
    'Bienvenue chez Tela Castle',
    'Encore deux informations et votre compte est prêt.'));

  var brouillon = {nom:'', zone:S.zone, adresse:''};

  var c1 = el('div','champ');
  c1.appendChild(el('label','lab','Votre nom'));
  var i1 = el('input'); i1.type = 'text'; i1.placeholder = 'Prénom et nom';
  i1.oninput = function(){ brouillon.nom = i1.value; cta.disabled = brouillon.nom.trim().length < 2; };
  c1.appendChild(i1); dd.appendChild(c1);

  var c2 = el('div','champ');
  c2.appendChild(el('span','lab','Votre quartier'));
  var ch = el('div','choix');
  T.zones.forEach(function(z){
    var b = el('button', null, z.nom);
    b.setAttribute('aria-pressed', brouillon.zone === z.id);
    b.onclick = function(){
      brouillon.zone = z.id;
      Array.prototype.forEach.call(ch.children, function(x,i){ x.setAttribute('aria-pressed', T.zones[i].id === z.id); });
    };
    ch.appendChild(b);
  });
  c2.appendChild(ch); dd.appendChild(c2);

  var c3 = el('div','champ');
  c3.appendChild(el('label','lab','Adresse et repères'));
  var i3 = el('input'); i3.type = 'text'; i3.placeholder = 'Rue, portail, point de repère…';
  i3.oninput = function(){ brouillon.adresse = i3.value; };
  c3.appendChild(i3); dd.appendChild(c3);

  var cta = el('button','btn plein grand');
  cta.textContent = 'Créer mon compte';
  cta.disabled = true;
  cta.onclick = function(){
    compte = T.enregistrerCompte({
      tel: T.telJoli(CPT.tel), nom: brouillon.nom.trim(), zone: brouillon.zone,
      adresse: brouillon.adresse || S.adresse, fidelite: 0, depuis: new Date().toISOString()
    });
    S.nom = compte.nom; S.tel = compte.tel; S.zone = compte.zone;
    if (compte.adresse) S.adresse = compte.adresse;
    sauver();
    avis('Compte créé — bienvenue ' + compte.nom.split(' ')[0]);
    rendreCompte();
  };
  pied.appendChild(cta);
  setTimeout(function(){ i1.focus(); }, 140);
}

/* --- le compte --- */
function vueCompte(dd, pied){
  dd.appendChild(el('div','bloc','<div style="padding:16px;display:flex;align-items:center;gap:13px">' +
    '<span style="width:48px;height:48px;border-radius:50%;background:var(--or-doux);display:grid;place-items:center;' +
    'font-family:var(--titre);font-weight:700;font-size:19px;color:var(--or-fonce)">' + compte.nom.charAt(0) + '</span>' +
    '<div><b style="font-family:var(--titre);font-size:16px">' + compte.nom + '</b>' +
    '<div style="font-size:12.5px;color:var(--doux)">' + T.telJoli(compte.tel) + '</div></div></div>'));

  var fid = compte.fidelite || 0;
  dd.appendChild(el('div','bloc','<div style="padding:14px 16px">' +
    '<div style="font-size:12px;color:var(--doux)">Carte de fidélité</div>' +
    '<div style="display:flex;gap:6px;margin-top:9px;flex-wrap:wrap">' +
    [0,1,2,3,4,5,6,7].map(function(i){
      return '<span style="width:24px;height:24px;border-radius:50%;display:grid;place-items:center;font-size:11px;' +
        'background:' + (i < fid ? 'var(--or)' : 'var(--surface-3)') + ';color:' + (i < fid ? '#241A12' : 'var(--doux)') + '">' +
        (i < fid ? '✓' : (i+1)) + '</span>';
    }).join('') + '</div>' +
    '<div style="font-size:12px;color:var(--doux);margin-top:9px">Huit commandes, un dêguê offert. Encore ' +
    Math.max(0, 8 - fid) + '.</div></div>'));

  var miennes = mesCommandes();
  dd.appendChild(el('div','lab','Mes commandes'));
  if (!miennes.length) dd.appendChild(el('p','vide','Aucune commande pour l\u2019instant.'));
  miennes.slice(0,3).forEach(function(c){
    var st = T.statuts[c.statut] || T.statuts.recue;
    var b = el('button','bloc');
    b.style.cssText = 'padding:13px 15px;text-align:left;display:block;width:100%';
    b.innerHTML = '<div style="display:flex;align-items:center;gap:10px"><b style="font-family:var(--titre);font-size:14px">' +
      c.ref + '</b><span class="etq ' + st.couleur + '">' + st.nom + '</span>' +
      '<span style="margin-left:auto;font-family:var(--titre);font-weight:700">' + F(c.total) + '</span></div>' +
      '<div style="font-size:12px;color:var(--doux);margin-top:4px">' + T.dateCourte(c.creele) + ' · ' +
      c.lignes.length + ' article' + (c.lignes.length > 1 ? 's' : '') + ' · ' + T.zone(c.zone).nom + '</div>';
    b.onclick = function(){
      S.ref = c.ref; T.ecrire('refEnCours', c.ref);
      S.etape = 'confirme'; rendrePanier(); ecran('panier');
    };
    dd.appendChild(b);
  });

  if (miennes.length){
    var tout = el('button','btn creux plein');
    tout.textContent = miennes.length > 3 ? 'Voir mes ' + miennes.length + ' commandes' : 'Historique et recommander';
    tout.onclick = function(){ ecran('histo'); };
    dd.appendChild(tout);
  }

  dd.appendChild(el('div','lab','Adresse de livraison'));
  var adr = el('div','bloc');
  adr.style.padding = '14px 16px';
  adr.innerHTML = '<div style="font-size:13px">' + T.zone(compte.zone || S.zone).nom + '</div>' +
    '<div style="color:var(--doux);font-size:12px;margin-top:3px">' + (compte.adresse || S.adresse) + '</div>';
  dd.appendChild(adr);
  var modif = el('button','btn creux plein');
  modif.textContent = 'Modifier mon adresse';
  modif.onclick = function(){ S.etape = 'livraison'; ecran('panier'); };
  dd.appendChild(modif);

  dd.appendChild(el('div','lab','Apparence'));
  var th = el('div','choix');
  [['clair','Clair'],['sombre','Sombre'],['cacao','Cacao']].forEach(function(o){
    var b = el('button', null, o[1]);
    b.setAttribute('aria-pressed', T.lire('theme','clair') === o[0]);
    b.onclick = function(){
      T.theme(o[0]);
      Array.prototype.forEach.call(th.children, function(x,i){
        x.setAttribute('aria-pressed', ['clair','sombre','cacao'][i] === o[0]);
      });
      Array.prototype.forEach.call(document.querySelectorAll('#themes button'), function(x){
        x.setAttribute('aria-pressed', x.dataset.th === o[0]);
      });
    };
    th.appendChild(b);
  });
  dd.appendChild(th);

  var d = el('button','btn creux plein');
  d.textContent = 'Se déconnecter';
  d.onclick = function(){
    T.deconnexion(); compte = null;
    CPT = {etape:'tel', tel:'', attendu:'', restant:0, minuteur:null};
    avis('Déconnecté');
    rendreCompte();
  };
  pied.appendChild(d);
}

/* ---------------------------------------------------------- boutique */
function rendreInfos(){
  var pan = $('#panneau-infos');
  pan.innerHTML = '';
  var tete = el('div','tete');
  var ret = el('button','retour', FLECHE); ret.setAttribute('aria-label','Retour'); ret.onclick = fermer;
  tete.appendChild(ret);
  tete.appendChild(el('div', null, '<h3>La boutique</h3>'));
  pan.appendChild(tete);
  var dd = el('div','dedans');

  dd.appendChild(el('div','bloc','<div style="padding:16px">' +
    '<b style="font-family:var(--titre);font-size:17px">Tela Castle</b>' +
    '<div style="font-size:13px;color:var(--doux);margin-top:4px">' + T.boutique.slogan + '</div>' +
    '<div style="font-size:13px;margin-top:12px">' + T.boutique.adresse + '<br>' + T.boutique.ville + '</div>' +
    '<a class="btn creux plein" style="margin-top:12px" href="tel:' + T.boutique.tel.replace(/ /g,'') + '">Appeler ' + T.boutique.tel + '</a>' +
    '</div>'));

  dd.appendChild(el('div','lab','Horaires'));
  dd.appendChild(el('div','bloc','<div style="padding:6px 0">' + T.boutique.horaires.map(function(h){
    return '<div style="padding:9px 16px;font-size:13px;border-bottom:var(--ep-bord) solid var(--bord)">' + h + '</div>';
  }).join('') + '<div style="padding:9px 16px;font-size:13px;color:var(--doux)">Commandes jusqu’à 21h pour le lendemain</div></div>'));

  dd.appendChild(el('div','lab','Zones et frais de livraison'));
  var z = el('div','bloc'); z.style.overflow = 'hidden';
  var tb = el('table','tabl');
  tb.innerHTML = '<thead><tr><th>Quartier</th><th>Frais</th><th>Délai</th></tr></thead><tbody>' +
    T.zones.map(function(x){ return '<tr><td>' + x.nom + '</td><td>' + F(x.frais) + '</td><td style="color:var(--doux)">' + x.delai + '</td></tr>'; }).join('') +
    '</tbody>';
  z.appendChild(tb); dd.appendChild(z);
  dd.appendChild(el('p','aide','Livraison offerte dès ' + F(T.boutique.seuilLivraisonOfferte) + ' de commande.'));

  dd.appendChild(el('div','lab','Moyens de paiement'));
  var m = el('div','moyens');
  T.paiements.forEach(function(p){
    m.appendChild(el('div','bloc','<div style="padding:11px 13px;display:flex;align-items:center;gap:12px">' +
      '<img src="' + p.logo + '" alt="" style="height:26px"><div><b style="font-size:13.5px;font-weight:500">' + p.nom + '</b>' +
      '<div style="font-size:11.5px;color:var(--doux)">' + p.aide + '</div></div></div>'));
  });
  dd.appendChild(m);

  dd.appendChild(el('div','lab','Recevoir un groupe'));
  var pl = el('button','bloc');
  pl.style.cssText = 'padding:14px 16px;text-align:left;display:flex;align-items:center;gap:13px;width:100%';
  pl.innerHTML = '<span style="width:40px;height:40px;border-radius:12px;background:var(--or-doux);display:grid;' +
    'place-items:center;flex:none"><svg viewBox="0 0 24 24" style="width:20px;height:20px;stroke:var(--or-fonce);' +
    'fill:none;stroke-width:1.8;stroke-linecap:round"><path d="M4 14h16M6 14a6 6 0 0 1 12 0"/><path d="M3 18h18"/>' +
    '<path d="M12 5v3"/></svg></span>' +
    '<span style="flex:1"><b style="font-family:var(--titre);font-size:14.5px">Plateaux &amp; événements</b>' +
    '<span style="display:block;font-size:12px;color:var(--doux);margin-top:2px">' +
    'Bureaux, baptêmes, réunions. Devis dès 8 personnes.</span></span>' +
    '<span style="color:var(--doux);font-size:18px">›</span>';
  pl.onclick = function(){ ecran('plateaux'); };
  dd.appendChild(pl);

  dd.appendChild(el('div','lab','Apparence'));
  var th = el('div','choix');
  [['clair','Clair'],['sombre','Sombre'],['cacao','Cacao']].forEach(function(o){
    var b = el('button', null, o[1]);
    b.setAttribute('aria-pressed', T.lire('theme','clair') === o[0]);
    b.onclick = function(){
      T.theme(o[0]);
      Array.prototype.forEach.call(th.children, function(x,i){ x.setAttribute('aria-pressed', ['clair','sombre','cacao'][i] === o[0]); });
      Array.prototype.forEach.call(document.querySelectorAll('#themes button'), function(x){ x.setAttribute('aria-pressed', x.dataset.th === o[0]); });
    };
    th.appendChild(b);
  });
  dd.appendChild(th);

  dd.appendChild(el('div','lab','Dessin de la carte'));
  var ds = el('div','choix');
  [['epure','Épuré'],['boites','Boîtes']].forEach(function(o){
    var b = el('button', null, o[1]);
    b.setAttribute('aria-pressed', T.lire('dessin','epure') === o[0]);
    b.onclick = function(){
      T.dessin(o[0]);
      Array.prototype.forEach.call(ds.children, function(x,i){ x.setAttribute('aria-pressed', ['epure','boites'][i] === o[0]); });
      avis(o[0] === 'epure' ? 'Dessin épuré' : 'Ancien dessin, pour comparer');
    };
    ds.appendChild(b);
  });
  dd.appendChild(ds);
  dd.appendChild(el('span','aide','« Épuré » est la nouvelle proposition. « Boîtes » remet l\u2019ancien rendu pour comparer.'));

  dd.appendChild(el('div','lab','Application'));
  var inst = el('button','btn creux plein');
  inst.id = 'btnInstaller';
  inst.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M8 11l4 4 4-4"/><path d="M5 19h14"/></svg> Installer sur l\u2019écran d\u2019accueil';
  inst.onclick = installer;
  dd.appendChild(inst);
  dd.appendChild(el('span','aide','La carte reste consultable même sans connexion.'));

  dd.appendChild(el('p','aide','Version en ligne : <b>' + T.version + '</b>'));
  pan.appendChild(dd);
}

/* ---------------------------------------------------------- panneaux & écrans */
/* ---------------------------------------------------------- mes commandes
   L'historique mérite son écran : on y revient pour recommander, pas pour
   relire un reçu. D'où le bouton « Recommander » en premier.               */
function mesCommandes(){
  if (!compte) return [];
  return T.commandes().filter(function(c){ return T.telCle(c.client.tel) === T.telCle(compte.tel); });
}
function recommander(cmd){
  S.panier = [];
  var perdus = 0;
  cmd.lignes.forEach(function(l){
    var p = T.produits[l.id];
    if (!p || p.epuise){ perdus++; return; }
    var i = 0;
    p.formats.forEach(function(f, j){ if (f[0] === l.fmt) i = j; });
    var sups = l.sup ? l.sup.split(', ').map(function(n){ return {nom:n, prix:0}; }) : [];
    ajouter(l.id, i, l.qte, sups, l.note, true);
  });
  S.zone = cmd.zone; S.adresse = cmd.adresse; S.creneau = cmd.creneau;
  S.etape = 'panier'; S.ref = null; T.ecrire('refEnCours', null);
  sauver();
  avis(perdus ? 'Panier rempli, ' + perdus + ' produit(s) indisponible(s)' : 'Panier rempli, il n\u2019y a plus qu\u2019à valider');
  ecran('panier');
}
function rendreHisto(){
  var pan = $('#panneau-histo');
  pan.innerHTML = '';
  var tete = el('div','tete');
  var ret = el('button','retour', FLECHE); ret.setAttribute('aria-label','Retour');
  ret.onclick = function(){ fermer(); };
  tete.appendChild(ret);
  tete.appendChild(el('div', null, '<h3>Mes commandes</h3>'));
  pan.appendChild(tete);
  var dd = el('div','dedans'); pan.appendChild(dd);

  var toutes = mesCommandes();
  if (!compte){
    dd.appendChild(illustration(
      '<svg viewBox="0 0 24 24" style="width:26px;height:26px;stroke:var(--or-fonce);fill:none;stroke-width:1.8;stroke-linecap:round"><path d="M6 8h12l-1 12H7z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
      'Vos commandes vous attendent',
      'Entrez votre numéro une fois, et vous retrouverez ici tout ce que vous avez commandé, prêt à être recommandé.'));
    var cn = el('button','btn plein'); cn.textContent = 'Entrer mon numéro';
    cn.onclick = function(){ ecran('compte'); };
    dd.appendChild(cn);
    return;
  }

  var f = el('div','filtres');
  [['tout','Toutes'],['cours','En cours'],['livree','Livrées']].forEach(function(o){
    var b = el('button', null, o[1]);
    b.setAttribute('aria-pressed', (S.filtreHisto || 'tout') === o[0]);
    b.onclick = function(){ S.filtreHisto = o[0]; rendreHisto(); };
    f.appendChild(b);
  });
  dd.appendChild(f);

  var vues = toutes.filter(function(c){
    var fl = S.filtreHisto || 'tout';
    if (fl === 'livree') return c.statut === 'livree';
    if (fl === 'cours') return ['recue','validee','preparation','route'].indexOf(c.statut) > -1;
    return true;
  });
  if (!vues.length){ dd.appendChild(el('p','vide','Rien dans cette liste pour l\u2019instant.')); return; }

  var depense = toutes.filter(function(c){ return c.statut === 'livree'; })
                      .reduce(function(a,c){ return a + c.total; }, 0);
  dd.appendChild(el('div','bloc','<div style="padding:13px 16px;display:flex;gap:18px">' +
    '<div><div style="font-size:11.5px;color:var(--doux)">Commandes</div>' +
    '<b style="font-family:var(--titre);font-size:19px">' + toutes.length + '</b></div>' +
    '<div><div style="font-size:11.5px;color:var(--doux)">Total dépensé</div>' +
    '<b style="font-family:var(--titre);font-size:19px">' + F(depense) + '</b></div></div>'));

  vues.forEach(function(c){
    var st = T.statuts[c.statut] || T.statuts.recue;
    var w = el('div','hcmd');
    var art = c.lignes.reduce(function(a,l){ return a + l.qte; }, 0);
    w.innerHTML = '<div class="h"><b>' + c.ref + '</b><span class="etq ' + st.couleur + '">' + st.nom + '</span>' +
      '<span class="t">' + F(c.total) + '</span></div>' +
      '<div class="d">' + T.dateCourte(c.creele) + ' · ' + T.zone(c.zone).nom + ' · ' +
      T.paiement(c.paiement).nom.replace(' à la livraison','') + '</div>' +
      '<div class="v">' + c.lignes.slice(0,4).map(function(l){
        return '<img src="' + T.img(l.img) + '" alt="">';
      }).join('') + '<span>' + art + ' article' + (art > 1 ? 's' : '') + '</span></div>';
    var a = el('div','a');
    var det = el('button', null, 'Voir le détail');
    det.onclick = function(){
      S.ref = c.ref; T.ecrire('refEnCours', c.ref);
      S.etape = 'confirme'; rendrePanier(); ecran('panier');
    };
    var re = el('button','plein', 'Recommander');
    re.onclick = function(){ recommander(c); };
    a.appendChild(det); a.appendChild(re);
    w.appendChild(a);
    dd.appendChild(w);
  });
}

/* ---------------------------------------------------------- plateaux
   Un bureau qui commande vingt petits déjeuners n'a pas le même besoin
   qu'un client seul : il veut un devis avant de s'engager.                */
var PL = {personnes:10, formule:'f-decouverte', boissons:true, jour:'', quand:'', mot:''};
var FORMULES_PL = [
  {id:'f-decouverte', nom:'Plateau découverte',  par:2500, det:'Bouillie, pastels, un fruit de saison'},
  {id:'f-complet',    nom:'Plateau complet',     par:3500, det:'Jaune-jaune ou garba, dêguê, boisson chaude'},
  {id:'f-gourmand',   nom:'Plateau gourmand',    par:4500, det:'Assortiment salé-sucré, yaourt maison, jus pressé'}
];
function rendrePlateaux(){
  var pan = $('#panneau-plateaux');
  pan.innerHTML = '';
  var tete = el('div','tete');
  var ret = el('button','retour', FLECHE); ret.setAttribute('aria-label','Retour');
  ret.onclick = function(){ fermer(); };
  tete.appendChild(ret);
  tete.appendChild(el('div', null, '<h3>Plateaux &amp; événements</h3><div class="sous">Bureaux, baptêmes, réunions</div>'));
  pan.appendChild(tete);
  var dd = el('div','dedans'); var pied = el('div','pied');
  pan.appendChild(dd); pan.appendChild(pied);

  dd.appendChild(el('p', null, '<span style="font-size:13px;color:var(--doux);line-height:1.55">' +
    'À partir de 8 personnes, Tela Castle prépare des plateaux à partager. ' +
    'Composez votre demande ici : vous recevez un devis, rien n\u2019est débité.</span>'));

  dd.appendChild(el('div','lab','Combien de personnes ?'));
  var cp = el('div','compteur');
  var moins = el('button', null, '−');
  var plus  = el('button', null, '+');
  var n = el('div','n', PL.personnes);
  moins.onclick = function(){ PL.personnes = Math.max(8, PL.personnes - 1); rendrePlateaux(); };
  plus.onclick  = function(){ PL.personnes = Math.min(200, PL.personnes + 1); rendrePlateaux(); };
  cp.appendChild(moins); cp.appendChild(n); cp.appendChild(plus);
  dd.appendChild(cp);

  dd.appendChild(el('div','lab','Quel plateau ?'));
  var fp = el('div','form-pl');
  FORMULES_PL.forEach(function(o){
    var l = el('label');
    l.innerHTML = '<input type="radio" name="fpl"' + (PL.formule === o.id ? ' checked' : '') + '>' +
      '<span class="tx"><b>' + o.nom + '</b><span>' + o.det + '</span></span>' +
      '<span class="pr">' + F(o.par) + '<br><span style="font-family:var(--texte);font-weight:400;font-size:11px;color:var(--doux)">par personne</span></span>';
    l.onclick = function(){ PL.formule = o.id; rendrePlateaux(); };
    fp.appendChild(l);
  });
  dd.appendChild(fp);

  var bo = el('label','form-pl');
  bo.style.cssText = 'display:flex;gap:12px;align-items:flex-start;background:var(--surface);' +
    'border:var(--ep-bord) solid var(--bord);border-radius:var(--r-m);padding:13px 15px;cursor:pointer';
  bo.innerHTML = '<input type="checkbox"' + (PL.boissons ? ' checked' : '') + ' style="margin-top:3px;accent-color:var(--or-fonce)">' +
    '<span style="flex:1"><b style="font-size:13.8px;display:block">Boissons à volonté</b>' +
    '<span style="font-size:12px;color:var(--doux)">Bissap, gingembre et jus de baobab en bonbonnes</span></span>' +
    '<span style="font-family:var(--titre);font-weight:700;font-size:13.5px">+ 800 F</span>';
  bo.onclick = function(e){ if (e.target.tagName !== 'INPUT') e.preventDefault(); PL.boissons = !PL.boissons; rendrePlateaux(); };
  dd.appendChild(bo);

  dd.appendChild(el('div','lab','Quand ?'));
  var gr = el('div'); gr.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:9px';
  var dj = el('input','champ'); dj.type = 'date'; dj.value = PL.jour;
  dj.min = new Date(Date.now() + 2*864e5).toISOString().slice(0,10);
  dj.onchange = function(){ PL.jour = dj.value; majDevis(); };
  var dh = el('input','champ'); dh.type = 'time'; dh.value = PL.quand || '07:30';
  dh.onchange = function(){ PL.quand = dh.value; };
  gr.appendChild(dj); gr.appendChild(dh);
  dd.appendChild(gr);

  var mot = el('textarea','champ');
  mot.rows = 3; mot.placeholder = 'Adresse précise, allergies, nombre de couverts…';
  mot.value = PL.mot;
  mot.oninput = function(){ PL.mot = mot.value; };
  dd.appendChild(mot);

  dd.appendChild(el('div','lab','Votre devis'));
  var dv = el('div','devis'); dv.id = 'devisPl';
  dd.appendChild(dv);
  majDevis();

  var env = el('button','btn plein');
  env.textContent = 'Demander le devis sur WhatsApp';
  env.onclick = function(){
    if (!PL.jour){ avis('Choisissez d\u2019abord une date'); dj.focus(); return; }
    var c = calculPlateaux();
    var f = FORMULES_PL.filter(function(x){ return x.id === PL.formule; })[0];
    var txt = 'Bonjour Tela Castle, je souhaite un devis pour un plateau.%0A%0A' +
      '*' + f.nom + '*%0A' + PL.personnes + ' personnes%0A' +
      (PL.boissons ? 'Avec boissons à volonté%0A' : '') +
      'Date : ' + new Date(PL.jour).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'}) +
      ' à ' + (PL.quand || '07:30') + '%0A' +
      'Estimation : ' + F(c.total) + '%0A' +
      (PL.mot ? '%0APrécisions : ' + encodeURIComponent(PL.mot) : '');
    window.open('https://wa.me/' + T.boutique.telBrut + '?text=' + txt, '_blank');
    avis('Demande envoyée, réponse sous 24 h');
  };
  pied.appendChild(env);
}
function calculPlateaux(){
  var f = FORMULES_PL.filter(function(x){ return x.id === PL.formule; })[0];
  var base = f.par * PL.personnes;
  var bois = PL.boissons ? 800 * PL.personnes : 0;
  var remise = PL.personnes >= 30 ? Math.round((base + bois) * 0.1) : 0;
  return {f:f, base:base, bois:bois, remise:remise, total:base + bois - remise};
}
function majDevis(){
  var dv = $('#devisPl'); if (!dv) return;
  var c = calculPlateaux();
  dv.innerHTML =
    '<div class="l"><span>' + c.f.nom + ' × ' + PL.personnes + '</span><span>' + F(c.base) + '</span></div>' +
    (c.bois ? '<div class="l"><span>Boissons × ' + PL.personnes + '</span><span>' + F(c.bois) + '</span></div>' : '') +
    (c.remise ? '<div class="l"><span>Remise groupe (10 %)</span><span>− ' + F(c.remise) + '</span></div>' : '') +
    '<div class="l"><span>Livraison et installation</span><span>Offerte</span></div>' +
    '<div class="l gros"><span>Estimation</span><span>' + F(c.total) + '</span></div>' +
    '<div style="font-size:11.5px;color:var(--or-fonce);margin-top:9px;line-height:1.5">' +
    'Montant indicatif. Tela Castle confirme le devis définitif sur WhatsApp' +
    (PL.personnes < 30 ? ', et à partir de 30 personnes la remise groupe s\u2019applique.' : '.') + '</div>';
}

function ouvrir(sel){
  fermer(true);
  var p = $(sel);
  p.classList.add('on');
  if (!mobile()) $('#voile').classList.add('on');
  document.body.style.overflow = mobile() ? 'hidden' : '';
}
function fermer(silencieux){
  ['#panneau-fiche','#panneau-compte','#panneau-infos','#panneau-histo','#panneau-plateaux']
    .forEach(function(s){ $(s).classList.remove('on'); });
  if (mobile()) $('#panneau-panier').classList.remove('on');
  $('#voile').classList.remove('on');
  document.body.style.overflow = '';
  if (!silencieux){ S.ecran = 'accueil'; majNav(); }
}
function ecran(nom){
  S.ecran = nom;
  if (nom === 'accueil'){ fermer(true); }
  else if (nom === 'panier'){ rendrePanier(); if (mobile()) ouvrir('#panneau-panier'); else $('#panneau-panier').scrollIntoView({behavior:'smooth',block:'nearest'}); }
  else if (nom === 'compte'){ rendreCompte(); ouvrir('#panneau-compte'); }
  else if (nom === 'infos'){ rendreInfos(); ouvrir('#panneau-infos'); }
  else if (nom === 'histo'){ rendreHisto(); ouvrir('#panneau-histo'); }
  else if (nom === 'plateaux'){ rendrePlateaux(); ouvrir('#panneau-plateaux'); }
  majNav();
}
function majNav(){
  majBarreTotal();
  majBandeau();
  Array.prototype.forEach.call(document.querySelectorAll('.nav-flot button'), function(b){
    b.classList.toggle('on', b.dataset.ecran === S.ecran);
  });
}
function reculerEtape(){ S.etape = 'panier'; rendrePanier(); }

/* ---------------------------------------------------------- section courante */
function hautBarre(){ var b = $('.bar'); return b ? b.offsetHeight : 66; }
function marquerActif(){
  Array.prototype.forEach.call(document.querySelectorAll('.col-nav a'), function(a){
    a.classList.toggle('actif', a.dataset.cible === S.sectionActive);
  });
  Array.prototype.forEach.call(document.querySelectorAll('.rail button'), function(b){
    b.setAttribute('aria-pressed', b.dataset.cible === S.sectionActive);
  });
}
function spy(){
  var secs = document.querySelectorAll('.sec');
  if (!secs.length) return;
  var limite = hautBarre() + (mobile() ? 74 : 24);
  var courant = secs[0].id;
  for (var i = 0; i < secs.length; i++){
    if (secs[i].id && secs[i].getBoundingClientRect().top <= limite) courant = secs[i].id;
  }
  if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 40) courant = secs[secs.length-1].id || courant;
  if (courant !== S.sectionActive){ S.sectionActive = courant; marquerActif(); }
}

/* ---------------------------------------------------------- divers */
var minuteurAvis;
function avis(txt){
  var a = $('#avis'); a.textContent = txt; a.classList.add('on');
  clearTimeout(minuteurAvis);
  minuteurAvis = setTimeout(function(){ a.classList.remove('on'); }, 2300);
}
function chrono(){
  var ms = D.resteMs();
  var h = Math.floor(ms/36e5), m = Math.floor(ms%36e5/6e4), s = Math.floor(ms%6e4/1000);
  $('#chrono').textContent = h > 0 ? h + 'h' + String(m).padStart(2,'0') : m + 'min ' + String(s).padStart(2,'0');
}
/* le bandeau suit la dernière commande active, quel que soit l'écran */
function commandeActive(){
  var actives = ['recue','validee','preparation','route'];
  var liste = compte ? mesCommandes() : (S.ref ? T.commandes().filter(function(c){ return c.ref === S.ref; }) : []);
  return liste.filter(function(c){ return actives.indexOf(c.statut) > -1; })[0] || null;
}
function majBandeau(){
  var b = $('#bandeauSuivi'); if (!b) return;
  var c = commandeActive();
  /* le bandeau ramène vers la commande depuis la carte ; ailleurs il gêne */
  var panneauOuvert = !!document.querySelector('.panneau.on:not(#panneau-panier)') ||
                      (mobile() && S.ecran !== 'accueil');
  var visible = !!c && S.etape !== 'confirme' && !panneauOuvert;
  b.hidden = !visible;
  document.body.classList.toggle('a-suivi', visible);
  if (!visible) return;
  var st = T.statuts[c.statut] || T.statuts.recue;
  b.innerHTML = '<span class="pulse"></span><span class="tx"><b>' + st.nom + ' · ' + c.ref + '</b>' +
    '<span>' + st.client + '</span></span><span class="fl">›</span>';
  b.onclick = function(){
    S.ref = c.ref; T.ecrire('refEnCours', c.ref);
    S.etape = 'confirme'; rendrePanier(); ecran('panier');
  };
}

function majBarreTotal(){
  var n = totalArticles();
  var b = $('#barreTotal');
  var visible = n > 0 && S.ecran === 'accueil' && mobile();
  b.classList.toggle('on', visible);
  document.body.classList.toggle('a-total', visible);
  $('#btQte').textContent = n;
  b.querySelector('.q').innerHTML = '<b id="btQte">' + n + '</b> article' + (n > 1 ? 's' : '');
  $('#btTotal').textContent = F(total());
}
function rendreTout(){
  var n = totalArticles();
  var bn = $('#btnPanierN');
  bn.hidden = !n; bn.textContent = n;
  $('#btnPanier').title = n ? n + ' article' + (n > 1 ? 's' : '') + ' · ' + F(total()) : 'Panier vide';
  var nn = $('#navN'); nn.hidden = !n; nn.textContent = n;
  $('#zoneNom').textContent = T.zone(S.zone).nom;
  rendreMenu(); rendrePanier(); majBarreTotal(); majBandeau();
}

/* ---------------------------------------------------------- animations */
function animations(){
  var reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduit){
    Array.prototype.forEach.call(document.querySelectorAll('.rv'), function(e){ e.classList.add('vu'); });
    return;
  }
  /* défilement adouci — la sensation « lourde » demandée, bureau seulement */
  if (window.Lenis && !mobile()){
    var lenis = new window.Lenis({duration:1.25, easing:function(t){ return Math.min(1, 1.001 - Math.pow(2, -10*t)); },
      smoothWheel:true, syncTouch:false});
    function boucle(t){ lenis.raf(t); requestAnimationFrame(boucle); }
    requestAnimationFrame(boucle);
    lenis.on('scroll', function(){ spy(); if (window.ScrollTrigger) window.ScrollTrigger.update(); });
  }
  if (window.gsap && window.ScrollTrigger){
    gsap.registerPlugin(ScrollTrigger);
    /* la parallaxe sur la bannière a été retirée avec la photo */
    ScrollTrigger.batch('.sec', {
      start:'top 88%',
      onEnter:function(lot){ gsap.fromTo(lot, {opacity:0, y:18}, {opacity:1, y:0, duration:.6, stagger:.08, ease:'power2.out', overwrite:true}); }
    });
  }
}

/* ---------------------------------------------------------- branchements */
$('#btnPanier').onclick = function(){ ecran('panier'); };
$('#barreTotal').onclick = function(){ ecran('panier'); };
$('#btnCompte').onclick = function(){ ecran('compte'); };
Array.prototype.forEach.call(document.querySelectorAll('#acces button'), function(b){
  b.onclick = function(){ ecran(b.dataset.va); };
});
/* Sur grand écran les accès directs appartiennent à la colonne de gauche ;
   sur mobile, où cette colonne n'existe pas, ils restent dans le flux. */
function placerAcces(){
  var a = $('#acces'); if (!a) return;
  var colonne = $('.col-nav .in'), flux = $('#accueil'), rail = $('#rail');
  if (!mobile()){ if (a.parentNode !== colonne) colonne.appendChild(a); }
  else if (a.parentNode !== flux) flux.insertBefore(a, rail);
}
placerAcces();
window.addEventListener('resize', placerAcces);
$('#btnAdresse').onclick = function(){ S.etape = 'livraison'; ecran('panier'); };
$('#voile').onclick = function(){ fermer(); };
$('#q').oninput = function(){ S.q = this.value.trim(); rendreMenu(); };
document.addEventListener('keydown', function(e){ if (e.key === 'Escape') fermer(); });
Array.prototype.forEach.call(document.querySelectorAll('.nav-flot button'), function(b){
  b.onclick = function(){ ecran(b.dataset.ecran); };
});

/* la barre flottante s'efface quand on descend, revient quand on remonte */
var dernierY = 0;
window.addEventListener('scroll', function(){
  var y = window.scrollY;
  var nav = $('#navFlot');
  if (mobile() && S.ecran === 'accueil'){
    var descend = y > dernierY + 6 && y > 200;
    nav.classList.toggle('cache', descend);
    $('#barreTotal').style.transform = descend ? 'translateY(140%)' : '';
  } else { nav.classList.remove('cache'); $('#barreTotal').style.transform = ''; }
  dernierY = y;
  spy();
}, {passive:true});

window.addEventListener('resize', function(){ rendrePanier(); });

/* le back-office change un statut ou le stock : l'app se met à jour, même dans un autre onglet */
window.addEventListener('storage', function(e){
  if (!e.key || e.key.indexOf('tela.') !== 0) return;
  T.recharger();
  if (e.key === 'tela.commandes'){
    majBandeau();
    if (S.etape === 'confirme') rendrePanier();
    if (!$('#panneau-histo').hidden && $('#panneau-histo').classList.contains('on')) rendreHisto();
  }
  if (e.key === 'tela.produits' || e.key === 'tela.categories'){ rendreRail(); rendreMenu(); }
});
window.addEventListener('tela:maj', function(){ /* même onglet : déjà géré par sauver() */ });

/* ---------------------------------------------------------- installation */
var invitationInstall = null;
if ('serviceWorker' in navigator && location.protocol !== 'file:'){
  window.addEventListener('load', function(){
    navigator.serviceWorker.register('sw.js').then(function(reg){
      reg.update();
      /* une version plus récente vient de prendre la main : on recharge une fois */
      var dejaRecharge = false;
      navigator.serviceWorker.addEventListener('controllerchange', function(){
        if (dejaRecharge) return;
        dejaRecharge = true;
        location.reload();
      });
    }).catch(function(){});
  });
}
window.addEventListener('beforeinstallprompt', function(e){
  e.preventDefault();
  invitationInstall = e;
  var b = $('#btnInstaller');
  if (b) b.hidden = false;
});
window.addEventListener('appinstalled', function(){
  invitationInstall = null;
  avis('Application installée');
});
function installer(){
  if (!invitationInstall){
    avis('Menu du navigateur → « Installer l\u2019application »');
    return;
  }
  invitationInstall.prompt();
  invitationInstall.userChoice.then(function(){ invitationInstall = null; });
}

/* ---------------------------------------------------------- démarrage */
T.dessin();
$('#infoJour').textContent = D.court;
$('#rappelLong').textContent = 'Commandez aujourd’hui avant 21h, vous êtes livré ' + D.long + ' au créneau de votre choix.';
$('#rappelCourt').textContent = 'Livraison ' + D.long;
$('#piedTel').textContent = T.boutique.tel;
$('#piedVille').textContent = T.boutique.ville;
$('#piedHoraires').innerHTML = T.boutique.horaires.map(function(h){ return '<li>' + h + '</li>'; }).join('');
if (S.ref && commandeCourante()) S.etape = 'confirme';

rendreRail(); rendreTout(); chrono(); spy(); majNav();
setInterval(chrono, 1000);
window.addEventListener('load', animations);
})();
