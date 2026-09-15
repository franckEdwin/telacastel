/* ============================================================
   Tela Castle — reçu de commande en image
   WhatsApp n'affiche que du texte brut : on fabrique donc une image
   du reçu, que l'on partage (partage natif sur mobile) ou télécharge.
   Aucune dépendance : tout est dessiné au canvas.
   ============================================================ */
(function(){
"use strict";
var T = window.TELA;
if (!T) return;

var L = 1000;                 /* largeur du reçu en pixels */
var M = 64;                   /* marge intérieure */
var C = {
  fond:   '#FFFDF8',
  papier: '#FFFFFF',
  encre:  '#241A12',
  doux:   '#7B6E64',
  or:     '#F5B21F',
  orPale: '#FDF3DC',
  vert:   '#17A15E',
  trait:  '#E7E2DA'
};
var POLICE_T = '"Baloo 2","Trebuchet MS",sans-serif';
var POLICE_X = 'Lexend,system-ui,sans-serif';

/* ---------------------------------------------------------- petits outils */
function rond(ctx, x, y, l, h, r){
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + l, y, x + l, y + h, r);
  ctx.arcTo(x + l, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + l, y, r);
  ctx.closePath();
}
function pointilles(ctx, y, x1, x2){
  ctx.save();
  ctx.strokeStyle = C.trait;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 8]);
  ctx.beginPath();
  ctx.moveTo(x1, y); ctx.lineTo(x2, y);
  ctx.stroke();
  ctx.restore();
}
function coupe(ctx, texte, largeur){
  var mots = String(texte).split(' '), out = [], ligne = '';
  for (var i = 0; i < mots.length; i++){
    var essai = ligne ? ligne + ' ' + mots[i] : mots[i];
    if (ctx.measureText(essai).width > largeur && ligne){ out.push(ligne); ligne = mots[i]; }
    else ligne = essai;
  }
  if (ligne) out.push(ligne);
  return out;
}
/* Le logo est intégré au script : une image chargée depuis le disque
   « tache » le canvas et empêche l'export en PNG. */
var LOGO = 'data:image/png;base64,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';

function chargerImage(src){
  return new Promise(function(res){
    var i = new Image();
    i.onload = function(){ res(i); };
    i.onerror = function(){ res(null); };
    i.src = src;
  });
}
function polices(){
  if (!document.fonts || !document.fonts.load) return Promise.resolve();
  var attente = Promise.all([
    document.fonts.load('700 46px "Baloo 2"'),
    document.fonts.load('700 30px "Baloo 2"'),
    document.fonts.load('400 24px Lexend'),
    document.fonts.load('500 24px Lexend')
  ]).catch(function(){});
  var secours = new Promise(function(res){ setTimeout(res, 1500); });
  return Promise.race([attente, secours]);
}

/* ---------------------------------------------------------- dessin */
T.dessinerRecu = function(cmd){
  return Promise.all([polices(), chargerImage(LOGO)]).then(function(res){
    var logo = res[1];
    var z = T.zone(cmd.zone), cr = T.creneau(cmd.creneau), pa = T.paiement(cmd.paiement);
    var st = T.statuts[cmd.statut] || T.statuts.recue;

    /* --- première passe : mesurer la hauteur nécessaire --- */
    var mesure = document.createElement('canvas').getContext('2d');
    var hLignes = 0;
    mesure.font = '500 26px ' + POLICE_X;
    cmd.lignes.forEach(function(l){
      var n = coupe(mesure, l.qte + ' × ' + l.nom, L - 2*M - 200).length;
      var options = [l.fmt, l.sup, l.note].filter(Boolean).join(' · ');
      hLignes += n * 36 + (options ? 30 : 0) + 22;
    });
    /* l'adresse est mesurée avec la police et la largeur réelles du dessin */
    mesure.font = '400 24px ' + POLICE_X;
    var adresse = coupe(mesure, z.nom + ' — ' + cmd.adresse, L - 2*M - 64);
    var hBloc = 166 + adresse.length * 32;

    var H = 210                      /* bandeau */
          + 118                      /* référence + statut */
          + hBloc + 54               /* bloc livraison */
          + 66 + hLignes             /* articles */
          + 176 + (cmd.especes && cmd.especes.montant ? 44 : 0)   /* totaux */
          + 152                      /* total en valeur */
          + 150;                     /* pied */

    var cv = document.createElement('canvas');
    cv.width = L; cv.height = Math.round(H);
    var ctx = cv.getContext('2d');
    ctx.textBaseline = 'alphabetic';

    /* fond */
    ctx.fillStyle = C.fond;
    ctx.fillRect(0, 0, L, H);

    /* --- bandeau doré --- */
    ctx.fillStyle = C.or;
    ctx.fillRect(0, 0, L, 210);
    if (logo){
      var lw = 210, lh = logo.height * lw / logo.width;
      ctx.drawImage(logo, M, (210 - lh) / 2, lw, lh);
    } else {
      ctx.fillStyle = C.encre;
      ctx.font = '700 44px ' + POLICE_T;
      ctx.fillText('TELA CASTLE', M, 120);
    }
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(36,26,18,.72)';
    ctx.font = '500 24px ' + POLICE_X;
    ctx.fillText('REÇU DE COMMANDE', L - M, 92);
    ctx.fillStyle = C.encre;
    ctx.font = '700 40px ' + POLICE_T;
    ctx.fillText(cmd.ref, L - M, 140);
    ctx.textAlign = 'left';

    var y = 210 + 62;

    /* --- statut + date --- */
    ctx.font = '500 24px ' + POLICE_X;
    var texteSt = st.nom;
    var lst = ctx.measureText(texteSt).width + 56;
    ctx.fillStyle = cmd.statut === 'refusee' ? '#FBEBE5' : C.orPale;
    rond(ctx, M, y - 34, lst, 48, 24); ctx.fill();
    ctx.fillStyle = cmd.statut === 'refusee' ? '#D14A2A' : '#A9760A';
    ctx.beginPath(); ctx.arc(M + 24, y - 10, 7, 0, 6.3); ctx.fill();
    ctx.fillText(texteSt, M + 40, y - 1);

    ctx.textAlign = 'right';
    ctx.fillStyle = C.doux;
    ctx.font = '400 24px ' + POLICE_X;
    ctx.fillText('Passée le ' + T.dateCourte(cmd.creele) + ' à ' + T.heure(cmd.creele), L - M, y - 1);
    ctx.textAlign = 'left';
    y += 56;

    /* --- livraison --- */
    ctx.fillStyle = C.papier;
    rond(ctx, M, y, L - 2*M, hBloc, 22); ctx.fill();
    ctx.strokeStyle = C.trait; ctx.lineWidth = 2;
    rond(ctx, M, y, L - 2*M, hBloc, 22); ctx.stroke();

    var yy = y + 46;
    ctx.fillStyle = C.doux; ctx.font = '400 22px ' + POLICE_X;
    ctx.fillText('LIVRAISON', M + 32, yy);
    ctx.fillStyle = C.encre; ctx.font = '700 30px ' + POLICE_T;
    var jour = new Date(cmd.jourLivraison).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'});
    ctx.fillText(jour.charAt(0).toUpperCase() + jour.slice(1) + ' · ' + cr.nom, M + 32, yy + 38);
    yy += 78;
    ctx.fillStyle = C.encre; ctx.font = '500 25px ' + POLICE_X;
    ctx.fillText(cmd.client.nom + '  ·  ' + cmd.client.tel, M + 32, yy);
    yy += 34;
    ctx.fillStyle = C.doux; ctx.font = '400 24px ' + POLICE_X;
    adresse.forEach(function(t){ ctx.fillText(t, M + 32, yy); yy += 32; });
    y += hBloc + 54;

    /* --- articles --- */
    ctx.fillStyle = C.doux; ctx.font = '400 22px ' + POLICE_X;
    ctx.fillText('VOTRE COMMANDE', M, y);
    y += 26;
    pointilles(ctx, y, M, L - M);
    y += 40;

    cmd.lignes.forEach(function(l){
      ctx.fillStyle = C.encre;
      ctx.font = '500 26px ' + POLICE_X;
      var titres = coupe(ctx, l.qte + ' × ' + l.nom, L - 2*M - 200);
      titres.forEach(function(t, i){
        ctx.fillText(t, M, y + i * 36);
      });
      ctx.textAlign = 'right';
      ctx.font = '700 28px ' + POLICE_T;
      ctx.fillText(T.F(l.prix * l.qte), L - M, y);
      ctx.textAlign = 'left';
      y += titres.length * 36;
      var options = [l.fmt, l.sup, l.note].filter(Boolean).join('  ·  ');
      if (options){
        ctx.fillStyle = C.doux; ctx.font = '400 22px ' + POLICE_X;
        ctx.fillText(options, M, y + 4);
        y += 30;
      }
      y += 22;
    });

    pointilles(ctx, y - 6, M, L - M);
    y += 44;

    /* --- totaux --- */
    function rang(lib, val, gras){
      ctx.fillStyle = gras ? C.encre : C.doux;
      ctx.font = (gras ? '500 26px ' : '400 25px ') + POLICE_X;
      ctx.fillText(lib, M, y);
      ctx.textAlign = 'right';
      ctx.fillStyle = C.encre;
      ctx.font = (gras ? '700 28px ' + POLICE_T : '400 25px ' + POLICE_X);
      ctx.fillText(val, L - M, y);
      ctx.textAlign = 'left';
      y += 44;
    }
    rang('Sous-total', T.F(cmd.sousTotal));
    rang('Livraison ' + z.nom, cmd.frais ? T.F(cmd.frais) : 'offerte');
    rang('Paiement', pa.nom);
    if (cmd.especes && cmd.especes.montant){
      rang('Espèces', cmd.especes.appoint ? 'appoint exact'
        : F(cmd.especes.montant) + ' — rendre ' + F(cmd.especes.montant - cmd.total));
    }
    y += 14;

    /* --- total --- */
    ctx.fillStyle = C.orPale;
    rond(ctx, M, y, L - 2*M, 96, 22); ctx.fill();
    ctx.fillStyle = C.encre;
    ctx.font = '700 34px ' + POLICE_T;
    ctx.fillText('TOTAL', M + 32, y + 60);
    ctx.textAlign = 'right';
    ctx.font = '700 46px ' + POLICE_T;
    ctx.fillText(T.F(cmd.total), L - M - 32, y + 62);
    ctx.textAlign = 'left';
    y += 96 + 56;

    /* --- pied --- */
    ctx.fillStyle = C.encre;
    ctx.fillRect(0, H - 150, L, 150);
    ctx.textAlign = 'center';
    ctx.fillStyle = C.or;
    ctx.font = '700 32px ' + POLICE_T;
    ctx.fillText('Merci, et à demain matin.', L / 2, H - 92);
    ctx.fillStyle = 'rgba(255,253,248,.72)';
    ctx.font = '400 23px ' + POLICE_X;
    ctx.fillText(T.boutique.slogan + '  ·  ' + T.boutique.tel, L / 2, H - 50);
    ctx.textAlign = 'left';

    return cv;
  });
};

/* ---------------------------------------------------------- partage */
T.recuFichier = function(cmd){
  return T.dessinerRecu(cmd).then(function(cv){
    return new Promise(function(res){
      cv.toBlob(function(b){
        res(new File([b], 'recu-' + cmd.ref + '.png', {type:'image/png'}));
      }, 'image/png', 0.95);
    });
  });
};

/* Trois chemins, du meilleur au plus simple :
   1. téléphone  : partage natif, WhatsApp apparaît dans la liste ;
   2. ordinateur : copie de l'image dans le presse-papier, à coller (Ctrl+V)
                   directement dans la conversation WhatsApp Web ;
   3. secours    : téléchargement du PNG. */
function telecharger(fichier){
  var url = URL.createObjectURL(fichier);
  var a = document.createElement('a');
  a.href = url; a.download = fichier.name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function(){ URL.revokeObjectURL(url); }, 4000);
}
/* Ce que l'appareil sait vraiment faire du reçu. Le bouton doit le dire
   avant le clic : promettre « partager » puis copier dans le presse-papier
   sans prévenir, c'est ce qui donne l'impression que rien ne marche. */
T.capaciteRecu = function(){
  var sonde = new File([new Blob([''],{type:'image/png'})], 'x.png', {type:'image/png'});
  try { if (navigator.canShare && navigator.canShare({files:[sonde]})) return 'partage'; } catch(e){}
  if (navigator.clipboard && window.ClipboardItem && window.isSecureContext) return 'copie';
  return 'telecharge';
};
T.partagerRecu = function(cmd, retour){
  retour = retour || function(){};
  T.recuFichier(cmd).then(function(fichier){
    var texte = 'Reçu de la commande ' + cmd.ref + ' — ' + T.F(cmd.total);

    if (navigator.canShare && navigator.canShare({files:[fichier]})){
      navigator.share({files:[fichier], title:'Reçu ' + cmd.ref, text:texte})
        .then(function(){ retour('partage'); })
        .catch(function(){ retour('annule'); });
      return;
    }
    if (navigator.clipboard && window.ClipboardItem && window.isSecureContext){
      var item = {}; item['image/png'] = fichier;
      navigator.clipboard.write([new ClipboardItem(item)])
        .then(function(){ retour('copie'); })
        .catch(function(){ telecharger(fichier); retour('telecharge'); });
      return;
    }
    telecharger(fichier);
    retour('telecharge');
  }).catch(function(){ retour('erreur'); });
};
T.telechargerRecu = function(cmd, retour){
  retour = retour || function(){};
  T.recuFichier(cmd).then(function(f){ telecharger(f); retour('telecharge'); })
                    .catch(function(){ retour('erreur'); });
};

/* Dépose le reçu sur le serveur et renvoie son adresse publique.
   WhatsApp ne transporte pas de pièce jointe par lien : c'est cette
   adresse qui voyage dans le message, et l'image s'ouvre au clic. */
T.publierRecu = function(cmd){
  return T.dessinerRecu(cmd).then(function(cv){
    return fetch('/api/recu', {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({ref: cmd.ref, image: cv.toDataURL('image/png')})
    });
  }).then(function(r){ return r.ok ? r.json() : null; })
    .then(function(j){ return j && j.url ? j.url : null; })
    .catch(function(){ return null; });
};

/* Aperçu du reçu dans un panneau, avec les actions */
T.apercuRecu = function(cmd, conteneur, toast){
  conteneur.innerHTML = '';
  var enveloppe = document.createElement('div');
  enveloppe.style.cssText = 'border:var(--ep-bord) solid var(--bord);border-radius:var(--r);overflow:hidden;background:var(--surface-2)';
  var img = document.createElement('img');
  img.alt = 'Reçu ' + cmd.ref;
  img.style.cssText = 'width:100%;display:block';
  enveloppe.appendChild(img);
  conteneur.appendChild(enveloppe);
  T.dessinerRecu(cmd).then(function(cv){ img.src = cv.toDataURL('image/png'); });
  return img;
};
})();
