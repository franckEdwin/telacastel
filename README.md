# Tela Castle

Maquette d'application de commande pour **Tela Castle**, boutique de petits déjeuners
africains, dêguê et yaourt maison à Abidjan.

> *Bien manger, un plaisir à partager.*

## Le principe

On commande la veille avant 21h, on est livré le lendemain matin au créneau choisi.
La boutique reçoit la commande, la valide, et le suivi du client avance en direct.

## Contenu

| Fichier | Rôle |
|---|---|
| `maquette/index.html` + `app.js` | Application client : carte, panier, livraison, paiement, suivi, compte |
| `maquette/gestion.html` | Espace gestion : commandes, produits, stock, catégories, menu de la semaine, clients, réglages |
| `maquette/tela.css` | Système de design commun — thèmes clair, sombre et cacao |
| `maquette/data.js` | Source de vérité : produits, catégories, zones, commandes |
| `maquette/img/` | Visuels (flyer + Wikimedia Commons, crédits dans `img/CREDITS.md`) |

Les deux pages communiquent par le stockage local du navigateur : une commande
passée côté client apparaît immédiatement côté gestion, et inversement pour le stock.

## Polices

Titres en **Baloo 2**, textes en **Lexend**.
La police des flyers est **Gliker** (police Canva payante) : déposer
`Gliker-Bold.woff2` et `Gliker-Regular.woff2` dans `maquette/fonts/` et elle
remplace automatiquement Baloo 2.

## Développement

Aucune dépendance, aucun build : ouvrir `maquette/index.html` dans un navigateur.
