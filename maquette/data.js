/* ============================================================
   Tela Castel — données partagées entre l'app client et le back-office.

   Catalogue  : T.produits   (dictionnaire, modifiable depuis l'admin)
   Catégories : T.categories (liste ordonnée, un produit peut appartenir
                à plusieurs catégories — p'tit déj' ET goûter par exemple)
   Commandes  : T.commandes()

   Tout ce qui est modifiable est enregistré dans localStorage, ce qui fait
   dialoguer index.html et gestion.html (y compris entre deux onglets).
   ============================================================ */
(function(){
"use strict";

var T = window.TELA = {};
var clone = function(o){ return JSON.parse(JSON.stringify(o)); };

/* ---------------------------------------------------------- boutique */
T.boutique = {
  nom: 'Tela Castel',
  slogan: 'Bien manger, un plaisir à partager',
  tel: '+225 05 06 45 70 70',
  telBrut: '2250506457070',
  ville: 'Abidjan, Côte d’Ivoire',
  adresse: 'Angré 8e tranche, Cocody',
  position: [5.3975, -3.9868],
  horaires: ['Lundi – vendredi · 06h – 18h', 'Samedi · 07h – 14h', 'Dimanche · fermé'],
  clotureHeure: 21,
  seuilLivraisonOfferte: 10000
};

/* ---------------------------------------------------------- livraison */
T.zones = [
  { id:'angre',    nom:'Angré 8e',     frais:500,  delai:'15 min', position:[5.4032,-3.9741] },
  { id:'cocody',   nom:'Cocody Angré', frais:500,  delai:'20 min', position:[5.3915,-3.9880] },
  { id:'riviera',  nom:'Riviera 2',    frais:1000, delai:'30 min', position:[5.3600,-3.9490] },
  { id:'marcory',  nom:'Marcory',      frais:1000, delai:'35 min', position:[5.2960,-3.9910] },
  { id:'yopougon', nom:'Yopougon',     frais:1500, delai:'45 min', position:[5.3370,-4.0710] }
];
T.creneaux = [
  { id:'c1', nom:'06h30 – 08h00', type:'matin'  },
  { id:'c2', nom:'08h00 – 09h30', type:'matin'  },
  { id:'c3', nom:'15h30 – 17h00', type:'gouter' }
];
T.paiements = [
  { id:'especes', nom:'Espèces à la livraison', logo:'img/pay/especes.svg',      aide:'Vous payez au livreur' },
  { id:'wave',    nom:'Wave',                   logo:'img/pay/wave.svg',         aide:'Lien de paiement envoyé sur WhatsApp' },
  { id:'om',      nom:'Orange Money',           logo:'img/pay/orange-money.svg', aide:'Code marchand communiqué à la validation' }
];

/* ---------------------------------------------------------- visuels disponibles */
T.visuels = ['jaune-jaune','bouillie','yaourt','yassa','placali','wintchin','crudites','fruits','alloco',
             'arachide','gombo','garba','bissap','gingembre','baobab','pastels','galette','macedoine',
             'salade-pates','salade-pdt','yaourt-boire','attieke'];

/* ---------------------------------------------------------- suppléments */
var SUP_DOUX = [ {nom:'Lait concentré', prix:200}, {nom:'Sucre à part', prix:0}, {nom:'Glaçons', prix:0} ];
var SUP_SALE = [ {nom:'Piment fort', prix:0}, {nom:'Supplément viande', prix:500}, {nom:'Sauce à part', prix:0} ];

/* ---------------------------------------------------------- catalogue par défaut */
T.produitsDefaut = {
  'jj-viande':     {nom:'Jaune Jaune viande hachée', desc:'Galette de mil dorée, vermicelle, sauce tomate maison', img:'jaune-jaune', formats:[['La part',2500]], note:4.9, avis:184, tag:'Le plus commandé', sup:clone(SUP_SALE), stock:24, seuil:5, actif:true},
  'jj-poisson':    {nom:'Jaune Jaune poisson', desc:'Le même, au poisson braisé du matin', img:'jaune-jaune', formats:[['La part',2000]], note:4.8, avis:96, sup:clone(SUP_SALE), stock:18, seuil:5, actif:true},
  'galette':       {nom:'Galette au sucre', desc:'Sortie de la poêle, sucre de canne', img:'galette', formats:[['La part',1500]], note:4.7, avis:52, stock:30, seuil:6, actif:true},
  'pastels':       {nom:'Pastels', desc:'Chaussons frits, farce poisson ou viande', img:'pastels', formats:[['Les 3',1500],['Les 6',2800]], note:4.8, avis:71, sup:clone(SUP_SALE), stock:40, seuil:8, actif:true},
  'crudites':      {nom:'Crudités', desc:'Salade composée, œuf dur, vinaigrette maison', img:'crudites', formats:[['La part',1500]], note:4.6, avis:38, stock:12, seuil:4, actif:true},
  'fruits':        {nom:'Fruits de saison', desc:'Découpés le matin même, en coupe fermée', img:'fruits', formats:[['La coupe',500]], note:4.9, avis:64, stock:22, seuil:5, actif:true},

  'degue':         {nom:'Dêguê traditionnel', desc:'Mil roulé à la main, lait caillé, pointe de muscade', img:'yaourt', formats:[['Petit',1000],['Grand',1500]], note:5.0, avis:129, tag:'Nouveau', neuf:true, sup:clone(SUP_DOUX), stock:16, seuil:4, actif:true},
  'yaourt':        {nom:'Yaourt maison nature', desc:'Fermenté douze heures, sans additif ni poudre', img:'yaourt', formats:[['Petit',500],['Grand',1000]], note:4.9, avis:158, tag:'Le plus commandé', sup:clone(SUP_DOUX), stock:28, seuil:6, actif:true},
  'bouillie-mil':  {nom:'Bouillie de mil', desc:'Servie chaude, lait concentré à part', img:'bouillie', formats:[['Petit',500],['Grand',1000]], note:4.8, avis:87, sup:clone(SUP_DOUX), stock:20, seuil:5, actif:true},
  'bouillie-mais': {nom:'Bouillie de maïs', desc:'Douce, parfumée à la vanille', img:'bouillie', formats:[['Petit',500],['Grand',1000]], note:4.7, avis:45, sup:clone(SUP_DOUX), stock:20, seuil:5, actif:true},

  'macedoine':     {nom:'Macédoine', desc:'Légumes taillés fin, mayonnaise maison', img:'macedoine', formats:[['La part',1500]], note:4.5, avis:24, stock:10, seuil:3, actif:true},
  'salade-pates':  {nom:'Salade de pâtes', desc:'Pâtes fraîches, thon, crudités', img:'salade-pates', formats:[['La part',1500]], note:4.6, avis:19, stock:10, seuil:3, actif:true},
  'salade-pdt':    {nom:'Salade de pomme de terre', desc:'Pomme de terre, œuf dur, persil', img:'salade-pdt', formats:[['La part',1500]], note:4.5, avis:16, stock:10, seuil:3, actif:true},

  'attieke':       {nom:'Attiéké poisson grillé', desc:'Attiéké frais, poisson entier, tomate oignon', img:'attieke', formats:[['Le plat',1500]], note:4.8, avis:92, sup:clone(SUP_SALE), stock:15, seuil:4, actif:true},
  'wintchin':      {nom:'Wintchin', desc:'Riz au gras, œuf dur, sauce piment', img:'wintchin', formats:[['Le plat',1500]], note:4.6, avis:41, sup:clone(SUP_SALE), stock:15, seuil:4, actif:true},
  'tomate':        {nom:'Sauce tomate et riz', desc:'Mijotée le matin, au choix poisson ou viande', img:'arachide', formats:[['Poisson',1500],['Viande',1500]], note:4.7, avis:63, sup:clone(SUP_SALE), stock:15, seuil:4, actif:true},
  'alloco':        {nom:'Alloco poulet ou poisson', desc:'Banane plantain frite, oignons marinés', img:'alloco', formats:[['Poisson',1500],['Poulet',2000]], note:4.9, avis:141, tag:'Le plus commandé', sup:clone(SUP_SALE), stock:18, seuil:5, actif:true},
  'arachide':      {nom:'Sauce arachide et riz', desc:'Mijotée lentement, poisson ou viande', img:'arachide', formats:[['Poisson',1500],['Viande',1500]], note:4.8, avis:77, sup:clone(SUP_SALE), stock:15, seuil:4, actif:true},
  'frites':        {nom:'Frites poulet', desc:'Poulet braisé, frites maison', img:'alloco', formats:[['Le plat',2000]], note:4.7, avis:58, sup:clone(SUP_SALE), stock:12, seuil:3, actif:true},
  'placali':       {nom:'Placali sauce gombo', desc:'Gombo frais, poisson fumé', img:'placali', formats:[['Simple',1500],['Garni',2000]], note:4.9, avis:103, tag:'Le plus commandé', sup:clone(SUP_SALE), stock:16, seuil:4, actif:true},
  'igname':        {nom:'Igname bouillie poisson grillé', desc:'Igname tendre, sauce tomate à l’huile rouge', img:'gombo', formats:[['Le plat',1500]], note:4.6, avis:34, sup:clone(SUP_SALE), stock:12, seuil:3, actif:true},
  'garba':         {nom:'Garba', desc:'Attiéké, thon frit, piment, oignon', img:'garba', formats:[['Le plat',1500]], note:4.9, avis:212, tag:'Le plus commandé', sup:clone(SUP_SALE), stock:25, seuil:6, actif:true},
  'yassa':         {nom:'Yassa poulet riz', desc:'Poulet mariné citron, oignons confits', img:'yassa', formats:[['Le plat',1500]], note:4.8, avis:88, sup:clone(SUP_SALE), stock:18, seuil:5, actif:true},

  'bissap':        {nom:'Jus de bissap', desc:'Hibiscus infusé, menthe fraîche', img:'bissap', formats:[['Petit',500],['Grand',1000]], note:4.9, avis:112, stock:40, seuil:8, actif:true},
  'gingembre':     {nom:'Jus de gingembre', desc:'Pressé du jour, bien relevé', img:'gingembre', formats:[['Petit',500],['Grand',1000]], note:4.8, avis:95, stock:35, seuil:8, actif:true},
  'baobab':        {nom:'Jus de baobab', desc:'Pain de singe, lait, vanille', img:'baobab', formats:[['Le litre',1000]], note:4.7, avis:46, stock:14, seuil:4, actif:true},
  'yaourt-b':      {nom:'Yaourt à boire', desc:'Nature ou vanille', img:'yaourt-boire', formats:[['La bouteille',1000]], note:4.6, avis:29, stock:0, seuil:4, actif:true}
};

/* ---------------------------------------------------------- catégories par défaut
   Un même produit peut figurer dans plusieurs catégories : la galette et les
   pastels sont au p'tit déj' ET au goûter, le dêguê est en goûter et en rayon
   maison. Chaque catégorie garde son propre ordre d'affichage.              */
T.categoriesDefaut = [
  { id:'petitdej', nom:"P'tit déj'", vignette:'jaune-jaune', actif:true,
    produits:['jj-viande','jj-poisson','galette','pastels','bouillie-mil','bouillie-mais'] },

  { id:'gouter', nom:'Goûter', vignette:'galette', actif:true,
    produits:['galette','pastels','degue','yaourt','fruits','yaourt-b'] },

  { id:'maison', nom:'Dêguê et yaourt maison', vignette:'yaourt', actif:true,
    produits:['degue','yaourt','bouillie-mil','bouillie-mais','yaourt-b'] },

  { id:'dejeuner', nom:'Menu du jour', vignette:'garba', actif:true, parJour:true, produits:[], jours:{
      lundi:[
        {groupe:'Entrée', produits:['crudites','macedoine']},
        {groupe:'Plat de résistance', produits:['attieke','wintchin']},
        {groupe:'Dessert', produits:['fruits','yaourt']},
        {groupe:'Boisson', produits:['bissap','gingembre']}
      ],
      mardi:[
        {groupe:'Entrée', produits:['crudites','salade-pates']},
        {groupe:'Plat de résistance', produits:['tomate','alloco']},
        {groupe:'Dessert', produits:['fruits','yaourt']},
        {groupe:'Boisson', produits:['bissap','gingembre']}
      ],
      mercredi:[
        {groupe:'Entrée', produits:['crudites','macedoine']},
        {groupe:'Plat de résistance', produits:['arachide','frites']},
        {groupe:'Dessert', produits:['fruits','yaourt']},
        {groupe:'Boisson', produits:['bissap','gingembre']}
      ],
      jeudi:[
        {groupe:'Entrée', produits:['crudites','macedoine']},
        {groupe:'Plat de résistance', produits:['placali','igname']},
        {groupe:'Dessert', produits:['fruits','yaourt']},
        {groupe:'Boisson', produits:['bissap','gingembre']}
      ],
      vendredi:[
        {groupe:'Entrée', produits:['crudites','salade-pdt']},
        {groupe:'Plat de résistance', produits:['garba','yassa']},
        {groupe:'Dessert', produits:['fruits','yaourt']},
        {groupe:'Boisson', produits:['bissap','gingembre']}
      ],
      samedi:[], dimanche:[]
  }},

  { id:'boissons', nom:'Boissons', vignette:'bissap', actif:true,
    produits:['bissap','gingembre','baobab','yaourt-b'] }
];

/* ---------------------------------------------------------- stockage */
var PREFIXE = 'tela.';
T.lire = function(cle, defaut){
  try{ var v = localStorage.getItem(PREFIXE + cle); return v == null ? defaut : JSON.parse(v); }
  catch(e){ return defaut; }
};
T.ecrire = function(cle, valeur){
  try{ localStorage.setItem(PREFIXE + cle, JSON.stringify(valeur)); }catch(e){}
  try{ window.dispatchEvent(new CustomEvent('tela:maj', {detail:{cle:cle}})); }catch(e){}
};

/* catalogue vivant */
T.produits   = T.lire('produits',   null) || clone(T.produitsDefaut);
T.categories = T.lire('categories', null) || clone(T.categoriesDefaut);

T.sauverProduits   = function(){ T.ecrire('produits', T.produits); };
T.sauverCategories = function(){ T.ecrire('categories', T.categories); };
T.recharger = function(){
  T.produits   = T.lire('produits',   null) || clone(T.produitsDefaut);
  T.categories = T.lire('categories', null) || clone(T.categoriesDefaut);
  T.medias     = T.lire('medias', {});
};
T.reinitialiserCatalogue = function(){
  T.produits = clone(T.produitsDefaut);
  T.categories = clone(T.categoriesDefaut);
  T.sauverProduits(); T.sauverCategories();
};

/* ---------------------------------------------------------- médias
   Une image ajoutée depuis l'admin est redimensionnée puis rangée ici.
   T.img() sait résoudre aussi bien un visuel livré qu'un média téléversé. */
T.medias = T.lire('medias', {});
T.img = function(ref){
  if (!ref) return 'img/jaune-jaune.jpg';
  if (ref.indexOf('data:') === 0) return ref;
  if (T.medias[ref]) return T.medias[ref].data;
  return 'img/' + ref + '.jpg';
};
T.nomMedia = function(ref){
  if (T.medias[ref]) return T.medias[ref].nom;
  return ref;
};
T.ajouterMedia = function(nom, dataUrl){
  var id = 'media-' + Date.now().toString(36) + '-' + Math.floor(Math.random()*999);
  T.medias[id] = {nom:nom, data:dataUrl, quand:new Date().toISOString()};
  T.ecrire('medias', T.medias);
  return id;
};
T.supprimerMedia = function(id){
  delete T.medias[id];
  T.ecrire('medias', T.medias);
};
T.tousVisuels = function(){
  return Object.keys(T.medias).concat(T.visuels);
};
T.poidsMedias = function(){
  var o = 0;
  Object.keys(T.medias).forEach(function(k){ o += (T.medias[k].data || '').length; });
  return o;
};

/* ---------------------------------------------------------- produits */
T.majProduit = function(id, champs){
  if (!T.produits[id]) return;
  Object.keys(champs).forEach(function(k){ T.produits[id][k] = champs[k]; });
  T.sauverProduits();
};
T.creerProduit = function(champs){
  var base = (champs.nom || 'produit').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g,'')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,28) || 'produit';
  var id = base, i = 2;
  while (T.produits[id]){ id = base + '-' + (i++); }
  T.produits[id] = Object.assign({
    nom:'Nouveau produit', desc:'', img:'jaune-jaune', formats:[['La part',1000]],
    note:5.0, avis:0, stock:10, seuil:3, actif:true, sup:[]
  }, champs);
  T.sauverProduits();
  return id;
};
T.supprimerProduit = function(id){
  delete T.produits[id];
  T.categories.forEach(function(c){
    if (c.produits) c.produits = c.produits.filter(function(x){ return x !== id; });
    if (c.jours) Object.keys(c.jours).forEach(function(j){
      (c.jours[j] || []).forEach(function(g){ g.produits = g.produits.filter(function(x){ return x !== id; }); });
    });
  });
  T.sauverProduits(); T.sauverCategories();
};
T.dupliquerProduit = function(id){
  var p = clone(T.produits[id]);
  p.nom = p.nom + ' (copie)';
  var nouveau = T.creerProduit(p);
  T.categoriesDuProduit(id).forEach(function(cid){ T.basculerCategorie(cid, nouveau, true); });
  return nouveau;
};

/* ---------------------------------------------------------- catégories */
T.categorie = function(id){ return T.categories.filter(function(c){ return c.id === id; })[0]; };
T.categoriesDuProduit = function(pid){
  return T.categories.filter(function(c){
    if (c.parJour) return (Object.keys(c.jours || {}).some(function(j){
      return (c.jours[j] || []).some(function(g){ return g.produits.indexOf(pid) > -1; });
    }));
    return (c.produits || []).indexOf(pid) > -1;
  }).map(function(c){ return c.id; });
};
T.basculerCategorie = function(cid, pid, forcer){
  var c = T.categorie(cid);
  if (!c || c.parJour) return;
  c.produits = c.produits || [];
  var i = c.produits.indexOf(pid);
  if (i > -1 && !forcer) c.produits.splice(i,1);
  else if (i === -1) c.produits.push(pid);
  T.sauverCategories();
};
T.creerCategorie = function(nom){
  var base = (nom || 'categorie').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,24) || 'categorie';
  var id = base, i = 2;
  while (T.categorie(id)){ id = base + '-' + (i++); }
  T.categories.push({id:id, nom:nom || 'Nouvelle catégorie', vignette:'jaune-jaune', actif:true, produits:[]});
  T.sauverCategories();
  return id;
};
T.supprimerCategorie = function(id){
  T.categories = T.categories.filter(function(c){ return c.id !== id; });
  T.sauverCategories();
};
T.deplacerCategorie = function(id, sens){
  var i = T.categories.findIndex(function(c){ return c.id === id; });
  var j = i + sens;
  if (i < 0 || j < 0 || j >= T.categories.length) return;
  var tmp = T.categories[i]; T.categories[i] = T.categories[j]; T.categories[j] = tmp;
  T.sauverCategories();
};
T.produitsDe = function(c, jour){
  if (!c.parJour) return (c.produits || []).filter(function(id){ return !!T.produits[id]; });
  return ((c.jours || {})[jour] || []).reduce(function(a,g){
    return a.concat(g.produits.filter(function(id){ return !!T.produits[id]; }));
  }, []);
};

/* ---------------------------------------------------------- stock */
T.dispo = function(id){
  var p = T.produits[id];
  return !!p && p.actif !== false && (p.stock == null || p.stock > 0);
};
T.etatStock = function(id){
  var p = T.produits[id];
  if (!p) return 'inconnu';
  if (p.actif === false) return 'retire';
  if (!p.stock) return 'epuise';
  if (p.stock <= (p.seuil || 5)) return 'bas';
  return 'ok';
};
T.majStock = function(id, valeur){
  if (!T.produits[id]) return;
  T.produits[id].stock = Math.max(0, valeur);
  T.sauverProduits();
};
T.marquerEpuise = function(id){ T.majStock(id, 0); };
T.reapprovisionner = function(id, n){ T.majStock(id, (T.produits[id].stock || 0) + n); };

/* ---------------------------------------------------------- statuts */
T.statuts = {
  recue:       {nom:'Reçue',          couleur:'bleu',  etape:0, client:'Commande reçue par la boutique'},
  validee:     {nom:'Validée',        couleur:'vert',  etape:1, client:'Validée par Tela Castel'},
  preparation: {nom:'En préparation', couleur:'or',    etape:2, client:'En préparation'},
  route:       {nom:'En route',       couleur:'or',    etape:3, client:'Le livreur est en route'},
  livree:      {nom:'Livrée',         couleur:'vert',  etape:4, client:'Livrée'},
  refusee:     {nom:'Refusée',        couleur:'rouge', etape:-1, client:'Commande annulée'}
};
T.ordreStatuts = ['recue','validee','preparation','route','livree'];

/* ---------------------------------------------------------- clients de démo */
T.clientsDemo = [
  {id:'c1', nom:'Aïcha Koné',    tel:'+225 07 88 12 44 09', zone:'angre',    adresse:'Rue L94, portail vert, en face de la pharmacie', commandes:14, depense:68500, depuis:'2025-03-11', fidelite:6},
  {id:'c2', nom:'Serge Kouadio', tel:'+225 05 44 90 31 20', zone:'riviera',  adresse:'Riviera 2, résidence Les Palmiers, appt 4B',      commandes:9,  depense:41000, depuis:'2025-05-02', fidelite:4},
  {id:'c3', nom:'Fatou Diabaté', tel:'+225 01 22 76 55 18', zone:'cocody',   adresse:'Angré château, rue des Jardins',                  commandes:22, depense:96500, depuis:'2024-11-20', fidelite:2},
  {id:'c4', nom:'Marc Assamoi',  tel:'+225 07 10 65 88 42', zone:'marcory',  adresse:'Marcory Zone 4, rue du Canal',                    commandes:3,  depense:12500, depuis:'2025-08-19', fidelite:3},
  {id:'c5', nom:'Awa Traoré',    tel:'+225 05 67 23 09 77', zone:'yopougon', adresse:'Yopougon Niangon, carrefour Ananeraie',           commandes:6,  depense:27000, depuis:'2025-06-30', fidelite:1}
];

/* ---------------------------------------------------------- dates du service */
T.dates = function(){
  var now = new Date();
  var cloture = new Date(now.getFullYear(), now.getMonth(), now.getDate(), T.boutique.clotureHeure, 0, 0);
  var decal = 1;
  if (now > cloture){ cloture = new Date(cloture.getTime() + 864e5); decal = 2; }
  var livraison = new Date(now.getFullYear(), now.getMonth(), now.getDate() + decal);
  var JOURS = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
  return {
    maintenant: now, cloture: cloture, livraison: livraison,
    jourCle: JOURS[livraison.getDay()],
    long: livraison.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'}),
    court: livraison.toLocaleDateString('fr-FR',{weekday:'short',day:'numeric',month:'short'}),
    resteMs: function(){ return Math.max(0, cloture - new Date()); }
  };
};

/* ---------------------------------------------------------- outils */
T.F = function(n){ return Number(n||0).toLocaleString('fr-FR').replace(/ | /g,' ') + ' F'; };
T.heure = function(d){ return new Date(d).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}); };
T.dateCourte = function(d){ return new Date(d).toLocaleDateString('fr-FR',{day:'numeric',month:'short'}); };
T.prixMin = function(p){ return Math.min.apply(null, p.formats.map(function(f){ return f[1]; })); };
T.prixTxt = function(p){
  var v = p.formats.map(function(f){ return f[1]; });
  var mn = Math.min.apply(null,v), mx = Math.max.apply(null,v);
  return mn === mx ? T.F(mn) : 'dès ' + T.F(mn);
};
T.zone = function(id){ return T.zones.filter(function(z){ return z.id === id; })[0] || T.zones[0]; };
T.creneau = function(id){ return T.creneaux.filter(function(c){ return c.id === id; })[0] || T.creneaux[0]; };
T.paiement = function(id){ return T.paiements.filter(function(p){ return p.id === id; })[0] || T.paiements[0]; };

/* ---------------------------------------------------------- commandes */
T.commandes = function(){
  var liste = T.lire('commandes', null);
  if (liste) return liste;
  liste = T.commandesDemo();
  T.ecrire('commandes', liste);
  return liste;
};
T.enregistrerCommande = function(cmd){
  var liste = T.commandes();
  liste.unshift(cmd);
  T.ecrire('commandes', liste);
  return cmd;
};
T.majCommande = function(ref, champs){
  var liste = T.commandes();
  for (var i = 0; i < liste.length; i++){
    if (liste[i].ref === ref){
      Object.assign(liste[i], champs);
      liste[i].journal = (liste[i].journal || []).concat([{quand:new Date().toISOString(), quoi: champs.statut || 'modifiée'}]);
      break;
    }
  }
  T.ecrire('commandes', liste);
};
T.nouvelleRef = function(){
  var d = T.dates().livraison;
  var n = T.lire('compteur', 140) + 1;
  T.ecrire('compteur', n);
  return 'TC-' + String(d.getDate()).padStart(2,'0') + String(d.getMonth()+1).padStart(2,'0') + '-' + n;
};
T.commandesDemo = function(){
  var d = T.dates();
  function ligne(id, iFmt, qte, sup, note){
    var p = T.produits[id];
    var supl = (sup || []).map(function(s){ return {nom:s[0], prix:s[1]}; });
    var prix = p.formats[iFmt][1] + supl.reduce(function(a,s){ return a + s.prix; }, 0);
    return {id:id, nom:p.nom, img:p.img, fmt:p.formats[iFmt][0],
            sup:supl.map(function(s){ return s.nom; }).join(', '), prix:prix, qte:qte, note:note||''};
  }
  function st(l){ return l.reduce(function(a,x){ return a + x.prix*x.qte; }, 0); }
  function cmd(n, cli, zone, creneau, lignes, statut, paiement, ilya, canal){
    var sous = st(lignes);
    var frais = sous >= T.boutique.seuilLivraisonOfferte ? 0 : T.zone(zone).frais;
    var ref = 'TC-' + String(d.livraison.getDate()).padStart(2,'0') + String(d.livraison.getMonth()+1).padStart(2,'0') + '-' + n;
    return {
      ref:ref, creele:new Date(Date.now() - ilya*6e4).toISOString(),
      client:{nom:cli.nom, tel:cli.tel, id:cli.id},
      zone:zone, adresse:cli.adresse, creneau:creneau,
      jourLivraison:d.livraison.toISOString(),
      lignes:lignes, sousTotal:sous, frais:frais, total:sous+frais,
      paiement:paiement, statut:statut, canal:canal||'app',
      journal:[{quand:new Date(Date.now() - ilya*6e4).toISOString(), quoi:'recue'}]
    };
  }
  var C = T.clientsDemo;
  return [
    cmd(141, C[0], 'angre', 'c1', [ligne('jj-viande',0,2,[['Piment fort',0]]), ligne('degue',1,2,[['Lait concentré',200]]), ligne('bissap',1,2)], 'recue', 'especes', 4),
    cmd(140, C[2], 'cocody', 'c2', [ligne('yaourt',1,4), ligne('pastels',1,1), ligne('fruits',0,3)], 'recue', 'wave', 19),
    cmd(139, C[1], 'riviera', 'c1', [ligne('garba',0,3), ligne('gingembre',1,3)], 'validee', 'om', 52),
    cmd(138, C[3], 'marcory', 'c3', [ligne('bouillie-mil',1,2,[['Lait concentré',200]]), ligne('galette',0,4)], 'preparation', 'especes', 96),
    cmd(137, C[4], 'yopougon', 'c2', [ligne('alloco',1,2), ligne('crudites',0,2), ligne('baobab',0,1)], 'livree', 'wave', 320, 'whatsapp'),
    cmd(136, C[0], 'angre', 'c3', [ligne('degue',0,6)], 'livree', 'especes', 400)
  ];
};

/* ---------------------------------------------------------- thème & compte */
T.theme = function(nom){
  if (nom){ T.ecrire('theme', nom); document.documentElement.setAttribute('data-theme', nom); return nom; }
  var t = T.lire('theme', 'clair');
  document.documentElement.setAttribute('data-theme', t);
  return t;
};
T.compte = function(){ return T.lire('compte', null); };
T.connexion = function(p){ T.ecrire('compte', p); };
T.deconnexion = function(){ T.ecrire('compte', null); };

/* ---------------------------------------------------------- message WhatsApp */
T.messageWhatsApp = function(cmd){
  var z = T.zone(cmd.zone), c = T.creneau(cmd.creneau), p = T.paiement(cmd.paiement);
  var l = [];
  l.push('*TELA CASTEL — COMMANDE ' + cmd.ref + '*');
  l.push('Livraison ' + new Date(cmd.jourLivraison).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'}) + ' · ' + c.nom);
  l.push('Client : ' + cmd.client.nom + ' · ' + cmd.client.tel);
  l.push('Adresse : ' + z.nom + ' — ' + cmd.adresse);
  l.push('--------------------------------');
  cmd.lignes.forEach(function(x){
    l.push(x.qte + ' x ' + x.nom + ' (' + x.fmt + ')  ' + T.F(x.prix * x.qte));
    if (x.sup)  l.push('    + ' + x.sup);
    if (x.note) l.push('    note : ' + x.note);
  });
  l.push('--------------------------------');
  l.push('Sous-total  ' + T.F(cmd.sousTotal));
  l.push('Livraison ' + z.nom + '  ' + (cmd.frais ? T.F(cmd.frais) : 'offerte'));
  l.push('*TOTAL  ' + T.F(cmd.total) + '*');
  l.push('Paiement : ' + p.nom);
  return l.join('\n');
};
T.lienWhatsApp = function(cmd){
  return 'https://wa.me/' + T.boutique.telBrut + '?text=' + encodeURIComponent(T.messageWhatsApp(cmd));
};
})();
