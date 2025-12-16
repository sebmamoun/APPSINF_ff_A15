# MyProt - PF10
Site web pour suivre ses calories et macronutriments de manière quotidienne.
##Membres
* Sebti Mamoun
* Fortuna Dos Santos Lucas
* Von Lettow-Vorbeck Paul
##Architecture
###Dossier racine
*index.js : contient l'ensemble des routes GET, POST ainsi que les middlewares utilisés dans ce projet.
*index-test.js : contient des tests basiques permettant de vérifier l'accès aux différentes pages.
###Dossier views/
*profile.ejs : page sur laquelle on peut suivre ses calories et macronutriments.
*game.ejs : page sur laquelle on peut jouer à un mini jeu.
*home.ejs : page principale du site.
*connexion.ejs : page sur laquelle on peut se connecter ou créer un compte. il suffit d'utiliser le bouton du bas pour passer d'une option à l'autre.
*ajout.ejs : page sur laquelle on ajoute un nouvel aliment à la base de donnée.
###Dossier public/css/
Contient l'ensemble du style css utilisé dans ce projet.
###Dossier public/scripts/
Contient tous les scripts utilisés pour les différentes fonctionnalités du site.
##Instructions
1. Télécharger l'archive ZIP et l'extraire
2. Ouvrir le dossier nommé 'import'.
3. Ouvrir un terminal à l'intérieur de ce dossier et écrire : 
mongoimport --db a15 --collection foods --file a15.foods.json --jsonArray
mongoimport --db a15 --collection macros --file a15.macros.json --jsonArray
mongoimport --db a15 --collection trackings --file a15.trackings.json --jsonArray
mongoimport --db a15 --collection users --file a15.users.json --jsonArray
4. Fermer le terminal et retourner à la racine du projet.
5. Ouvrir un terminal à la racine du projet et faire npm install pour installer les packages nécessaires.
6. Dans ce même terminal, faire node index.js pour lancer le site.
Deux comptes ont été importé, l'un user et l'autre admin, voici les accès:
*user : username : user mot de passe : 123
*admin : username : admin mot de passe : 123
7. Pour accéder au site, se diriger vers http://localhost:8080 sur votre navigateur.
##Fonctionnalités
*Gestion de comptes
Connexion avec identitiant et mot de passe
Déconnexion
*Tracking
Ajout et retrait d'aliments à un suivi personnalisé
Visibilité sur ses objectifs
*Tri
Tri sur les différents éléments du tableau principal

##Base de données

User Schema

{
username: {type: String, required: true, minlength: 3, unique: true},
email: {type: String, required: true, unique: true}, 
hash: {type: String, required: true},
rank: {type: String, enum: ['user', 'admin'], default: 'user'},
},
{
timestamps: true
}

Food Schema

{
    name: {type: String, required: true},
    user: { type: String, required: true},
    price:{type: Number, required: true},
    prot:{type: Number, required: true},
    glucides:{type: Number, required: true},
    lipides:{type: Number, required: true},
    calories:{type: Number, required: true},    
},
{
    timestamps: true
}