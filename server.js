var express = require('express');
var bodyParser = require('body-parser')
var cors = require('cors')
var app = express()
app.use(bodyParser.urlencoded({ extended: true }));
const bcrypt = require('bcrypt');
var ObjectId = require('mongodb').ObjectId;
const port = process.env.PORT || 9001;
app.use(cors())
var MongoClient = require('mongodb').MongoClient;
var moment = require('moment');
const { response } = require('express');

let hashIt = async(password)=>{
    const salt = await bcrypt. genSalt(6);
    const hashed = await bcrypt. hash(password, salt);
    return hashed
}

MongoClient.connect('mongodb://app_back_db:27017/', function(err, client) {
  if (err) {
    throw err;
  }
  db = client.db("stock");
});
app.listen(port, () => {
    console.log('Server app listening on port ' + port);
    });
app.post('/signup', async function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    let hassPassword = await hashIt(req.body.password);
    db.collection('users').findOne(
        {
        'username':req.body.username 
        },
        (err, result)=> {
        if (err) {
            throw err;
        } 
        
        if(result===null){
            db.collection('users').insertOne( {
                "username":req.body.username,
                "email" : req.body.email ,
                "role":req.body.role ,
                "password" : hassPassword ,
                "state":0,
                "last_connexion":"",
                "date_modification":""
                },(err, user) => {
                if (err) {
                    return console.log('Unable to fetch')
                }
                let responsedb = {}
                responsedb.status="201"
                responsedb.message = "compte crée , veuillez contactez un administrateur afin de l'activer"
                return res.json(responsedb)
                // res.json({"insertedId" : user.insertedId,
                // "status": "done"});
            } );
        }else{
            let responsedb = {}
                responsedb.status="204"
                responsedb.message = "le nom d'utilisateur existe déjà"
                return res.json(responsedb)
        }
    });
    
});

app.post('/signin', async function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    
    let responsedb = { }
    db.collection('users').findOne(
        {
        'username':req.body.username 
        },
        (err, result)=> {
        if (err) {
            throw err;
        }
        
        if(result===null){ 
            console.log('not found')
            responsedb.status="404"
            responsedb.message = 'identifiant ou mot de passe érroné'
            return res.json(responsedb)
        }else{
            if(result.state!==1){
                responsedb.status="404"
                responsedb.message = 'compte désactivez , veuillez contactez un administrateur'
                return res.json(responsedb)
            }
            console.log('found')
            const verified = bcrypt.compareSync(req.body.password , result.password);
            if(verified){
                moment.locale('fr')
                var currentDate = moment().format("DD-MM-YYYY");
                let data = {[`${"last_connexion"}`] : currentDate }
                db.collection('users').updateOne({
                    "_id": ObjectId(result._id) ,
                },{$set:data}, (err, users) =>{
                });
                responsedb.status="200"
                responsedb.message = 'connecté'
                responsedb.username = result.username
                responsedb.role = result.role
                return res.json(responsedb)
            }
            if(!verified){
                responsedb.status="301"
                responsedb.message = 'identifiant ou mot de passe érroné'
                return res.json(responsedb)
            }
            
        }
    });
    
});

app.get('/products', async function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    
    try {
        db.collection('products').find().toArray(function (err, products) {
          if (err) {
            return console.log('Unable to fetch')
        }
        res.json(products);
        });
     } catch (e) {
      res.json(e);
     };
    
});
app.post('/products/add', async function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
   
    db.collection('products').find({
        "designation":req.body.designation
    }).toArray(function (err, products) {
        if (err) {
            return console.log('Unable to fetch')
        }
    if(products.length===0){
        console.log("create")
        db.collection('products').insertOne( {
            "designation":req.body.designation,
            "prix_achat" : req.body.prix_achat ,
            "prix_vente":req.body.prix_vente ,
            "quantite_en_stock" : req.body.quantite_en_stock ,
            "date_modification" : req.body.date_modification ,
            },(err, products) => {
            if (err) {
                return console.log('Unable to fetch')
            }
            let responsedb = {}
            responsedb.status="201" 
            responsedb.message = 'produits crée'
            return res.json(responsedb)
            
        } );
    }else{
        let responsedb = {}
        responsedb.status="204" 
        responsedb.message = 'produits non crée'
        return res.json(responsedb);
    }
    
    });
     
    
});
app.post('/products/delete', async function (req, res) {
res.header("Access-Control-Allow-Origin", "*");
    // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    
    try {
        
        db.collection('products').deleteOne( {
            "_id": ObjectId(req.body.id) ,
        }, (err, products) =>{
            
            if(err) {
                let responsedb ={}
                responsedb.status=400
                responsedb.message="produit non supprimé"
                return res.json(responsedb)
            }
            let responsedb ={}
            responsedb.status=200
            responsedb.message="produit supprimé"
            return res.json(responsedb)      
        });

    } catch (e) {
        console.log(e)
    res.json(e);
    };
    
});
app.post('/products/edit', async function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    
    try {
        // { $set: { [`${columnName}`] : req.body.newData } };
        moment.locale('fr')
        var currentDate = moment().format("DD-MM-YYYY");
        db.collection('products').findOne(
            {
                "_id": ObjectId(req.body.product._id)
            },
            (err, productItem)=> {
                if (err) {
                    throw err;
                }
                let newStock = parseInt(req.body.product.quantite_en_stock)
                let oldStock = parseInt(productItem.quantite_en_stock)
                if(newStock!==oldStock){
                    let actionType = (newStock-oldStock)>=0?"+":"";
                    let calculActionQte = newStock-oldStock
                    db.collection('history_stock').insertOne( {
                        "command_ref":"",
                        "article":productItem.designation,
                        "username":req.body.userInfo.username,
                        "role":req.body.userInfo.role ,
                        "action" : `action via la section admin produit` ,
                        "action_qte" : `${actionType}${calculActionQte}` ,
                        "previous_state":`${oldStock}`,
                        "next_state":`${newStock}`,
                        "date_modification":currentDate
                        },(err, user) => {
                        
                    } );
                }
               
        })
        Object.keys(req.body.product).map((columnName,index)=>{
            let data = {[`${columnName}`] : req.body.product[columnName]}
            
            db.collection('products').updateOne({
                "_id": ObjectId(req.body.product._id) ,
            },{$set:data}, (err, products) =>{
            });
           
        })
        db.collection('products').updateOne({
            "_id": ObjectId(req.body.product._id) ,
        },{$set:{['date_modification']:currentDate}}, (err, clients) =>{});
        let responsedb ={}
        responsedb.status=200
        responsedb.message="produit modifié"
        return res.json(responsedb)   
    } catch (e) {
        console.log(e)
    res.json(e);
    };
    
});

app.get('/users/list', async function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    
    try {
        // { $set: { [`${columnName}`] : req.body.newData } };
        db.collection('users').find({}).toArray(function (err, users) {
            if (err) {
                return console.log('Unable to fetch')
            }
            res.json(users) 
        })
    } catch (e) {
        console.log(e)
    res.json(e);
    };
    
});
app.post('/users/edit', async function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    
    try {
        // { $set: { [`${columnName}`] : req.body.newData } };
        Object.keys(req.body).map((columnName,index)=>{
            let data = {[`${columnName}`] : req.body[columnName]}
            console.log(columnName)
            db.collection('users').updateOne({
                "_id": ObjectId(req.body._id) ,
            },{$set:data}, (err, user) =>{
            });
           
        })
        let responsedb ={}
        responsedb.status=200
        responsedb.message="utilisateur modifié"
        return res.json(responsedb)
    } catch (e) {
        console.log(e)
    res.json(e);
    };
    
});

app.post('/users/add', async function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    let hassPassword = await hashIt(req.body.password);
    db.collection('users').findOne(
        {
        'username':req.body.username 
        },
        (err, result)=> {
        if (err) {
            throw err;
        } 
        
        if(result===null){
            db.collection('users').insertOne( {
                "username":req.body.username,
                "email" : req.body.email ,
                "role":req.body.role ,
                "password" : hassPassword ,
                "last_connexion":"",
                "date_modification":""
                },(err, user) => {
                if (err) {
                    return console.log('Unable to fetch')
                }
                let responsedb = {}
                responsedb.status="201"
                responsedb.message = 'compte crée vous pouvez vous connecté'
                return res.json(responsedb)
                // res.json({"insertedId" : user.insertedId,
                // "status": "done"});
            } );
        }else{
            let responsedb = {}
                responsedb.status="204"
                responsedb.message = "le nom d'utilisateur existe déjà"
                return res.json(responsedb)
        }
    });
    
});

app.post('/users/delete', async function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
        // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        
        try {
            
            db.collection('users').deleteOne( {
                "_id": ObjectId(req.body.id) ,
            }, (err, users) =>{
                
                if(err) {
                    let responsedb ={}
                    responsedb.status=400
                    responsedb.message="utilisateur non supprimé"
                    return res.json(responsedb)
                }
                let responsedb ={}
                responsedb.status=200
                responsedb.message="utilisateur supprimé"
                return res.json(responsedb)      
            });
    
        } catch (e) {
            console.log(e)
        res.json(e);
        };
        
});
app.get('/clients/list', async function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    
    try {
        // { $set: { [`${columnName}`] : req.body.newData } };
        db.collection('clients').find({}).toArray(function (err, clients) {
            if (err) {
                return console.log('Unable to fetch')
            }
            res.json(clients) 
        })
    } catch (e) {
        console.log(e)
    res.json(e);
    };
    
});

app.post('/clients/add', async function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    moment.locale('fr')
    var currentDate = moment().format("DD-MM-YYYY");
    db.collection('clients').insertOne({
        "firstname":req.body.firstname,
        "lastname" : req.body.lastname ,
        "adress":req.body.adress ,
        "ice":req.body.ice ,
        "company" : req.body.company  ,
        "date_modification": ""
        },(err, user) => {
        if (err) {
            let responsedb = {}
            responsedb.status="204"
            responsedb.message = "le client n'a pas été crée"
            return res.json(responsedb)
        }
        let responsedb = {}
        responsedb.status="201"
        responsedb.message = 'le client à bien été crée'
        return res.json(responsedb)
        // res.json({"insertedId" : user.insertedId,
        // "status": "done"});
    });
});

app.post('/clients/edit', async function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    moment.locale('fr')
    var currentDate = moment().format("DD-MM-YYYY");
    Object.keys(req.body).map((columnName,index)=>{
        let data = {[`${columnName}`] : req.body[columnName]}
        console.log(columnName)
        db.collection('clients').updateOne({
            "_id": ObjectId(req.body._id) ,
        },{$set:data}, (err, user) =>{
        });
       
    })
    db.collection('clients').updateOne({
        "_id": ObjectId(req.body._id) ,
    },{$set:{['date_modification']:currentDate}}, (err, clients) =>{});
    let responsedb = {}
    responsedb.status="200"
    responsedb.message = 'Modification enregistré'
    return res.json(responsedb)
});
app.post('/clients/delete', async function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    db.collection('clients').deleteOne( {
        "_id": ObjectId(req.body.id) ,
    }, (err, users) =>{
        
        if(err) {
            let responsedb ={}
            responsedb.status=400
            responsedb.message="utilisateur non supprimé"
            return res.json(responsedb)
        }
        let responsedb ={}
        responsedb.status=200
        responsedb.message="utilisateur supprimé"
        return res.json(responsedb)      
    });

});
app.post('/operations/list', async function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    console.log(req.body)
    // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    if(req.body.userInfo.role==="admin"||req.body.userInfo.role==="comptable"){
        db.collection('operation_achat').find({}).toArray(function (err, achats) {
            if (err) {
                return console.log('Unable to fetch')
            }
            res.json(achats) 
        })
    }else{
        db.collection('operation_achat').find({"owner":req.body.userInfo.username}).toArray(function (err, achats) {
            if (err) {
                return console.log('Unable to fetch')
            }
            res.json(achats) 
        })
    }
    
    
});
app.post('/operations/add', async function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    moment.locale('fr')
    var currentDate = moment().format("DD-MM-YYYY");
    await db.collection('operation_achat_id').insertOne({new_entry:0},(err,entrys)=>{

    })
    db.collection('operation_achat').insertOne({
        "id_show": await db.collection('operation_achat_id').find().count(),
        "owner":req.body.userInfo.username,
        "role":req.body.userInfo.role,
        "client":req.body.client,
        "produit" : [] ,
        "quantite":0,
        "prix_ttc":0,
        "payer_espece":req.body.payer_espece ,
        "payer_cheque":req.body.payer_cheque ,
        "payer_credit":req.body.payer_credit ,
        "date_operation" : currentDate  ,
        "date_modification": ""
        },async (err, operation) => {
        if (err) {
            let responsedb = {}
            responsedb.status="204"
            responsedb.message = "la commande n'a pas été crée"
            return res.json(responsedb)
        }
        let newOperation = await db.collection('operation_achat').find({"_id":ObjectId(operation.insertedId)}).toArray()
        let responsedb = {}
        responsedb.status="201"
        responsedb.message = 'la commande a bien été crée'
        responsedb.operation_id=operation.insertedId
        responsedb.operation_id_show=newOperation[0].id_show
        return res.json(responsedb)
        // res.json({"insertedId" : user.insertedId,
        // "status": "done"});
    });
});
app.post('/operations/delete', async function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    moment.locale('fr')
    var currentDate = moment().format("DD-MM-YYYY");
    db.collection('operation_achat').find({"_id":ObjectId(req.body.id)}).toArray(function (err, operation) {
        if (err) {
            return console.log('Unable to fetch')
        }
       
        operation[0].produit.map((productOperation)=>{
        
            db.collection('products').find({"_id":ObjectId(productOperation._id)}).toArray(function (err, productItem) {
                if (err) {
                    return console.log('Unable to fetch')
                }
                let data = {[`quantite_en_stock`] : parseInt(productItem[0].quantite_en_stock)+parseInt(productOperation.quantite)}
                console.log(data)
                db.collection('products').updateOne({
                    "_id": ObjectId(productOperation._id) ,
                },{$set:data}, (err, products) =>{
                }); 
                db.collection('history_stock').insertOne( {
                    "command_ref":operation.id_show,
                    "article":productItem[0].designation,
                    "username":req.body.userInfo.username,
                    "role":req.body.userInfo.role ,
                    "action" : `suppréssion opération` ,
                    "action_qte" : `+${parseInt(productOperation.quantite)}` ,
                    "previous_state":`${parseInt(productItem[0].quantite_en_stock)}`,
                    "next_state":`${data.quantite_en_stock}`,
                    "date_modification":currentDate
                    },(err, user) => {
                    
                } );
            })
            
        })
    })
    db.collection('operation_achat').deleteOne( {
        "_id": ObjectId(req.body.id) ,
    }, (err, users) =>{
        
        if(err) {
            let responsedb ={}
            responsedb.status=400
            responsedb.message="opération non supprimé"
            return res.json(responsedb)
        }
        let responsedb ={}
        responsedb.status=200
        responsedb.message="opération supprimé"
        return res.json(responsedb)      
    });

});
app.get('/command/:id', async function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    db.collection('operation_achat').find({"_id":ObjectId(req.params.id)}).toArray(function (err, operation) {
        if (err) {
            return console.log('Unable to fetch')
        }
        res.json(operation) 
    })

});

app.post('/article/checkstock', (req,res)=>{
    res.header("Access-Control-Allow-Origin", "*");
    db.collection('products').find({"_id":ObjectId(req.body._id)}).toArray(function (err, product) {
        if (err) {
            return console.log('Unable to fetch')
        }
        
        if(parseInt(product[0].quantite_en_stock)>0){
         return   res.json({status:200})
        }   
        return res.json({status:403}) 
    })
})

app.post('/panier/update', (req,res)=>{
    res.header("Access-Control-Allow-Origin", "*");
    
    moment.locale('fr')
    var currentDate = moment().format("DD-MM-YYYY");
    let updateDateModification = {[`date_modification`] : currentDate }
    if(req.body.panierToUpdate.produit==undefined){
        req.body.panierToUpdate.produit = []
    }
    Object.keys(req.body.panierToUpdate).map((columnName,index)=>{
        let data = {[`${columnName}`] : req.body.panierToUpdate[columnName]}
        db.collection('operation_achat').updateOne({
            "_id": ObjectId(req.body.panierToUpdate._id) ,
        },{$set:data}, (err, products) =>{
        });
       
    })
    
    
    db.collection('operation_achat').updateOne({
        "_id": ObjectId(req.body.panierToUpdate._id) ,
    },{$set:updateDateModification}, (err, products) =>{
    });
   
    db.collection('products').find({"_id":ObjectId(req.body.productToDownStock._id)}).toArray(function (err, product) {
        if (err) {
            return console.log('Unable to fetch')
        }
        
        if(req.body.productToDownStock.action=="add"){ 
            let stateStockQte = parseInt(product[0].quantite_en_stock);
            let qteToCheck = parseInt(req.body.productToDownStock.quantiteToDown)
            // if(stateStockQte<=0||qteToCheck>stateStockQte){
            //   return  res.json({status:403}) 
            // }
            let updateQuantite = {['quantite_en_stock']:parseInt(product[0].quantite_en_stock)-parseInt(req.body.productToDownStock.quantiteToDown) }
            console.log("add "+parseInt(req.body.productToDownStock.quantiteToDown))
           
            db.collection('products').updateOne({
                "_id": ObjectId(req.body.productToDownStock._id) ,
            },{$set:updateQuantite}, (err, products) =>{
                db.collection('products').updateOne({
                    "_id": ObjectId(req.body.productToDownStock._id) ,
                },{$set:updateDateModification}, (err, products) =>{
                    
                });
                db.collection('history_stock').insertOne( {
                    "command_ref":req.body.panierToUpdate.id_show,
                    "article":product[0].designation,
                    "username":req.body.productToDownStock.userInfo.username,
                    "role":req.body.productToDownStock.userInfo.role ,
                    "action" : `ajout en panier pour le client ${req.body.panierToUpdate.client[0].firstname} ${req.body.panierToUpdate.client[0].lastname}` ,
                    "action_qte" : `-${qteToCheck}` ,
                    "previous_state":`${stateStockQte}`,
                    "next_state":`${updateQuantite.quantite_en_stock}`,
                    "date_modification":currentDate
                    },(err, user) => {
                    
                } );
            });
            
        
        }
        if(req.body.productToDownStock.action=="edit"){
            if(parseInt(req.body.productToDownStock.quantiteToDown)<0){
                let stateStockQte = product[0].quantite_en_stock
                let qteToCheck = parseInt(req.body.productToDownStock.quantiteToDown)
                let updateQuantite = {['quantite_en_stock']:parseInt(product[0].quantite_en_stock)+parseInt(req.body.productToDownStock.quantiteToDown) }
                db.collection('products').updateOne({
                    "_id": ObjectId(req.body.productToDownStock._id) ,
                },{$set:updateQuantite}, (err, products) =>{
                    db.collection('products').updateOne({
                        "_id": ObjectId(req.body.productToDownStock._id) ,
                    },{$set:updateDateModification}, (err, products) =>{
                     
                    });
                });
                db.collection('history_stock').insertOne( {
                    "command_ref":req.body.panierToUpdate.id_show,
                    "article":product[0].designation,
                    "username":req.body.productToDownStock.userInfo.username,
                    "role":req.body.productToDownStock.userInfo.role ,
                    "action" : `modification article en panier pour le client ${req.body.panierToUpdate.client[0].firstname} ${req.body.panierToUpdate.client[0].lastname}` ,
                    "action_qte" : `+${qteToCheck*-1}` ,
                    "previous_state":`${stateStockQte}`,
                    "next_state":`${updateQuantite.quantite_en_stock}`,
                    "date_modification":currentDate
                    },(err, user) => {
                    
                } );
            }else{
                let stateStockQte = product[0].quantite_en_stock
                let qteToCheck = parseInt(req.body.productToDownStock.quantiteToDown)
                let updateQuantite = {['quantite_en_stock']:parseInt(product[0].quantite_en_stock)+parseInt(req.body.productToDownStock.quantiteToDown) }
                // if(stateStockQte<=0||qteToCheck>stateStockQte){
                //     return  res.json({status:403}) 
                // }
                console.log(">0 "+parseInt(req.body.productToDownStock.quantiteToDown))
                db.collection('products').updateOne({
                    "_id": ObjectId(req.body.productToDownStock._id) ,
                },{$set:updateQuantite}, (err, products) =>{
                    db.collection('products').updateOne({
                        "_id": ObjectId(req.body.productToDownStock._id) ,
                    },{$set:updateDateModification}, (err, products) =>{
                     
                    });
                });
                db.collection('history_stock').insertOne( {
                    "command_ref":req.body.panierToUpdate.id_show,
                    "article":product[0].designation,
                    "username":req.body.productToDownStock.userInfo.username,
                    "role":req.body.productToDownStock.userInfo.role ,
                    "action" : `modification article en panier pour le client ${req.body.panierToUpdate.client[0].firstname} ${req.body.panierToUpdate.client[0].lastname}` ,
                    "action_qte" : `-${qteToCheck}` ,
                    "previous_state":`${stateStockQte}`,
                    "next_state":`${updateQuantite.quantite_en_stock}`,
                    "date_modification":currentDate
                    },(err, user) => {
                    
                } );
            }
        }
        if(req.body.productToDownStock.action=="delete"){
            let stateStockQte = product[0].quantite_en_stock
            let qteToCheck = parseInt(req.body.productToDownStock.quantiteToDown)
            let updateQuantite = {['quantite_en_stock']:product[0].quantite_en_stock+parseInt(req.body.productToDownStock.quantiteToDown) }
                db.collection('products').updateOne({
                    "_id": ObjectId(req.body.productToDownStock._id) ,
                },{$set:updateQuantite}, (err, products) =>{
                    db.collection('products').updateOne({
                        "_id": ObjectId(req.body.productToDownStock._id) ,
                    },{$set:updateDateModification}, (err, products) =>{
                     
                    });
                    db.collection('history_stock').insertOne( {
                        "command_ref":req.body.panierToUpdate.id_show,
                        "article":product[0].designation,
                        "username":req.body.productToDownStock.userInfo.username,
                        "role":req.body.productToDownStock.userInfo.role ,
                        "action" : `suppression article en panier pour le client ${req.body.panierToUpdate.client[0].firstname} ${req.body.panierToUpdate.client[0].lastname}` ,
                        "action_qte" : `+${qteToCheck}` ,
                        "previous_state":`${stateStockQte}`,
                        "next_state":`${updateQuantite.quantite_en_stock}`,
                        "date_modification":currentDate
                        },(err, user) => {
                        
                    } );
                });
            
        }
        res.json({status:200}) 
    })
    
})

app.post('/panier/update/reduce', (req,res)=>{
    res.header("Access-Control-Allow-Origin", "*");
    
    moment.locale('fr')
    var currentDate = moment().format("DD-MM-YYYY");
    let updateDateModification = {[`date_modification`] : currentDate }
    Object.keys(req.body.panierToUpdate).map((columnName,index)=>{
        let data = {[`${columnName}`] : req.body.panierToUpdate[columnName]}
        db.collection('operation_achat').updateOne({
            "_id": ObjectId(req.body.panierToUpdate._id) ,
        },{$set:data}, (err, products) =>{
        });
       console.log(data)
    })
    if(req.body.panierToUpdate.produit===undefined){
        let data = {[`produit`] : [] }
        db.collection('operation_achat').updateOne({
            "_id": ObjectId(req.body.panierToUpdate._id) ,
        },{$set:data}, (err, products) =>{
        });
    }
    console.log()
    db.collection('operation_achat').updateOne({
        "_id": ObjectId(req.body.panierToUpdate._id) ,
    },{$set:updateDateModification}, (err, products) =>{
    });
//    return res.json(req.body)
    db.collection('products').find({"_id":ObjectId(req.body.productToUpStock._id)}).toArray(function (err, product) {
        if (err) {
            return console.log('Unable to fetch')
        }
        
        
           let updateQuantite = {['quantite_en_stock']:product[0].quantite_en_stock+1}
            db.collection('products').updateOne({
                "_id": ObjectId(req.body.productToUpStock._id) ,
            },{$set:updateQuantite}, (err, products) =>{
                db.collection('products').updateOne({
                    "_id": ObjectId(req.body.productToUpStock._id) ,
                },{$set:updateDateModification}, (err, products) =>{
                 
                });
            });
            
        
          
        res.json({status:200}) 
    })
    
})


app.post('/operation/update', (req,res)=>{
    res.header("Access-Control-Allow-Origin", "*");
    
    moment.locale('fr')
    var currentDate = moment().format("DD-MM-YYYY");
    let updateDateModification = {[`date_modification`] : currentDate }
    if(req.body.panierToUpdate.produit==undefined){
        req.body.panierToUpdate.produit = []
    }
    db.collection('operation_achat').findOne({"_id":ObjectId(req.body.panierToUpdate._id)},(err,operation)=>{
        let current_payer_espece = parseInt(operation.payer_espece)
        let current_payer_cheque = parseInt(operation.payer_cheque)
        let current_credit = parseInt(operation.payer_credit)
        let new_current_payer_espece = parseInt(req.body.panierToUpdate.payer_espece)
        let new_current_payer_cheque = parseInt(req.body.panierToUpdate.payer_cheque)
        let new_current_credit = parseInt(req.body.panierToUpdate.payer_credit)

        if(current_payer_espece!==new_current_payer_espece){
            let actionType = (new_current_payer_espece-current_payer_espece)>=0?"+":""
            calculActionQte= (new_current_payer_espece-current_payer_espece)
            db.collection('history_financial').insertOne( {
                "command_ref":req.body.panierToUpdate.id_show,
                "client":operation.client,
                "username":req.body.userInfo.username,
                "role":req.body.userInfo.role ,
                "action" : `Modification paiement espèce` ,
                "action_qte" : `${actionType}${calculActionQte}` ,
                "previous_state":`${current_payer_espece}`,
                "next_state":`${new_current_payer_espece}`,
                "date_modification":currentDate
                },(err, user) => {
                
            } );
        }
        if(current_payer_cheque!==new_current_payer_cheque){
            let actionType = (new_current_payer_cheque-current_payer_cheque)>=0?"+":""
            calculActionQte = (new_current_payer_cheque-current_payer_cheque)
            db.collection('history_financial').insertOne( {
                "command_ref":req.body.panierToUpdate.id_show,
                "client":operation.client,
                "username":req.body.userInfo.username,
                "role":req.body.userInfo.role ,
                "action" : `Modification paiement cheque` ,
                "action_qte" : `${actionType}${calculActionQte}` ,
                "previous_state":`${current_payer_cheque}`,
                "next_state":`${new_current_payer_cheque}`,
                "date_modification":currentDate
                },(err, user) => {
                
            } );
        }
        if(current_credit!==new_current_credit){
            let actionType = (new_current_credit-current_credit)>=0?"+":""
            calculActionQte = (new_current_credit-current_credit)
            db.collection('history_financial').insertOne( {
                "command_ref":req.body.panierToUpdate.id_show,
                "client":operation.client,
                "username":req.body.userInfo.username,
                "role":req.body.userInfo.role ,
                "action" : `Modification montant restant à payer` ,
                "action_qte" : `${actionType}${calculActionQte}` ,
                "previous_state":`${current_credit}`,
                "next_state":`${new_current_credit}`,
                "date_modification":currentDate
                },(err, user) => {
                
            } );
        }
    })
    Object.keys(req.body.panierToUpdate).map((columnName,index)=>{
        let data = {[`${columnName}`] : req.body.panierToUpdate[columnName]}
        db.collection('operation_achat').updateOne({
            "_id": ObjectId(req.body.panierToUpdate._id) ,
        },{$set:data}, (err, products) =>{
        });
       
    })
    
    
    db.collection('operation_achat').updateOne({
        "_id": ObjectId(req.body.panierToUpdate._id) ,
    },{$set:updateDateModification}, (err, products) =>{
    });
    res.json({status:200,message:'modification enregistré'}) 
})


app.get('/historique/list', async function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    
    try {
        db.collection('history_stock').find().toArray(function (err, historys) {
          if (err) {
            return console.log('Unable to fetch')
        }
        res.json(historys);
        });
     } catch (e) {
      res.json(e);
     };
    
});
app.get('/historiquefinancier/list', async function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    
    try {
        db.collection('history_financial').find().toArray(function (err, historys) {
          if (err) {
            return console.log('Unable to fetch')
        }
        res.json(historys);
        });
     } catch (e) {
      res.json(e);
     };
    
});
app.post('/historique/search', async function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    
    try {
        db.collection('history_financial').find().toArray(function (err, historys) {
          if (err) {
            return console.log('Unable to fetch')
        }
        let search = historys.filter(element=>{
          return  element.client[0]._id==req.body.search 
        });
        res.json(search);
        });
     } catch (e) {
      res.json(e);
     };
    
});

app.post('/products/search', async function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
   
    db.collection('products').find({
        "designation":req.body.designation
    }).toArray(function (err, products) {
        if (err) {
            return console.log('Unable to fetch')
        }
        return res.json(products)
    })
     
    
});
app.post('/clients/search', async function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
   
    db.collection('clients').find({
        "firstname":req.body.firstname
    }).toArray(function (err, clients) {
        if (err) {
            return console.log('Unable to fetch')
        }
        return res.json(clients)
    })
     
    
});
app.post('/users/search', async function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    
    db.collection('users').find({
        "username":req.body.username
    }).toArray(function (err, users) {
        if (err) {
            return console.log('Unable to fetch')
        }
        return res.json(users)
    })
     
    
});
app.post('/historiquestock/search', async function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    
    db.collection('history_stock').find({
        "article":req.body.article
    }).toArray(function (err, history) {
        if (err) {
            return console.log('Unable to fetch')
        }
        return res.json(history)
    })
     
    
});

app.post('/user/active', async function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
   
    let data = {[`${"state"}`] : 1 }
        db.collection('users').updateOne({
            "_id": ObjectId(req.body.id) ,
        },{$set:data}, (err, users) =>{
            
        });
    moment.locale('fr')
    var currentDate = moment().format("DD-MM-YYYY");
    let data2 = {[`${"date_modification"}`] : currentDate }
    db.collection('users').updateOne({
        "_id": ObjectId(req.body.id) ,
    },{$set:data2}, (err, users) =>{
        return res.json("done")
    });
     
    
});
app.post('/user/desactive', async function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    let data = {[`${"state"}`] : 0 }
    db.collection('users').updateOne({
        "_id": ObjectId(req.body.id) ,
    },{$set:data}, (err, users) =>{
        
    });
    moment.locale('fr')
    var currentDate = moment().format("DD-MM-YYYY");
    let data2 = {[`${"date_modification"}`] : currentDate }
    db.collection('users').updateOne({
    "_id": ObjectId(req.body.id) ,
    },{$set:data2}, (err, users) =>{
        return res.json("done")
    }); 
});
app.get('/user/rescue/admin', async function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    let hassPassword = await hashIt('admin');
    db.collection('users').findOne(
        {
        'username':'admin'
        },
        (err, result)=> {
        if (err) {
            throw err;
        } 
        
        if(result===null){
            db.collection('users').insertOne( {
                "username":'admin',
                "email" : 'admin@admin.com' ,
                "role":'admin' ,
                "password" : hassPassword ,
                "state":1,
                "last_connexion":"",
                "date_modification":""
                },(err, user) => {
                if (err) {
                    return console.log('Unable to fetch')
                }
                let responsedb = {}
                responsedb.status="201"
                responsedb.message = 'compte crée vous pouvez vous connecté'
                return res.json(responsedb)
                // res.json({"insertedId" : user.insertedId,
                // "status": "done"});
            } );
        }else{
            db.collection('users').updateOne({
            "username": 'admin' ,
            },{$set:{'password':hassPassword}}, (err, users) =>{
                return res.json("done")
            }); 
        }
    });
});
app.post('/historiquestock/delete/all', async function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    if(req.body.userInfo.role=='admin'){
        db.collection('history_stock').drop()
        return res.json("done")
    }
});
app.post('/historiquefinancial/delete/all', async function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    if(req.body.userInfo.role=='admin'){
        db.collection('history_financial').drop()
        return res.json("done")
    }
});