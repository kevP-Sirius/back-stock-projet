#application de gestion de stock

3 profile avec 3 role
admin : 
- peut tout faire
comptable : 
- comptable peut consulter les opérations
livreur : 
- crée les opérations/la modifier/pas la supprimer /
- il peut également faire des actiosn sur le client  : crée /modifier mais ne peut pas supprimer .

# client :
nom 
prenom
adresse
nom de l'entreprise
ICE 
date_modification
# produit:
designation
prix_achat
prix_vente
quantite_en_stock
date_modification

# operation_achat :
produit
client
quantite
prix_ttc
date_operation
payer_espece
payer_cheque
payer_credit
date_modification

# utilisateur

login
password
role
dernière_connexion
date_modification



# correction à apporter

- validateur sur les suppréssions avec confirmation bootbox dialog . => fait
- module client : mettre le champs nom prénom uniquement en obligatoire et le reste optionnel .=> fait
- date de modification sur le module produit qui ne fonctionne pas . => fait
- module operation inversion colonne espèce et chèque au niveau de la boucle . => fait
- comptable bug : il ne voit que les commandes qu'il a crée => fait
- créer un module de recherche qui vas permettre d'effectuer une recherche dans le tableau . => fait
- filtrage sur les données par defaut pour operation par ordre croissant de montant à régler=> fait
- rendre les compte désactiver lors de la création => fait
- filtrage sur les données par defaut pour produit sur les quantités en stock par ordre décroissant autorisé le stock négatif lors de l'ajout=>fait
- historique stock rajouter dans action effectué le client concerné => fait
- rajouter le logo du client dans la page d'accueil et dans le favicon => fait
- rajouter une table id pour l'affichage de l'id dans la reférence commande  =>fait

- l'id à corriger la il est encore sous object id =>fait
- l'affichage du client est ko dans la page opération=>fait
- rajouter la possibilité d'avoir un prix différents de l'original=>fait
- rajouter l'export en pdf de bon de commande associé au commande=> fait
- 

