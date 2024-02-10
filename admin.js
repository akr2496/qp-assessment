const express = require('express');
const database = require('./database')

const admin = express();


// admin.use('/', (req, res, next) => {
//     //authentication process
//     next();
// })


admin.use('/', async(req, res, next) => {
    // console.log(req.headers);
    let adminData;
    try {
        adminData = await database.getAdmin()
        adminData = adminData[0]
    } catch(error){
        console.log(error)
    }
    // simple authentication for admin
    const authheader = req.headers.authorization;
    if(authheader === undefined) res.send(`log in with admin credentials`)
    const auth = new Buffer.from(authheader.split(' ')[1],
        'base64').toString().split(':');
    const user = auth[0];
    const pass = auth[1];
    if(adminData.role === 'admin' && user === adminData.username && pass === adminData.password){
        next();
    }else {
        // console.log("log in with admin credentials")
        res.send(`log in with admin credentials`)
    }
});


admin.get('/', (req, res) => {
    console.log("in admin api")
    res.send(`Inside ADMIN page`)
    // database.pool.end();
});

// Admin Responsibilities:
//    - Add new grocery items to the system

/*
grocery item from user --> {
    id : int,
    name: str,
    price: number,
    inventory_level : int
}
itemTobeAdded= [grocery_items]
*/
admin.post('/addItem', (req, res)=> {
    console.log("in add api")
    // console.log(req.body)
    if(req.body.length > 0){
        let itemTobeAdded = [];
        req.body.forEach((item) => {
            itemTobeAdded.push(Object.values(item))
        })
        database.addItemToDatabase(itemTobeAdded)
        .then((response)=> {
            if(response) res.send("Items are added to database");
        }).catch((error) => {
            res.send(`error has occured : ${error.message}`)
        })
    }else{
        res.send(`no item given to add`)
    }
});

//    - View existing grocery items
admin.get('/getItems', (req, res) => {
    console.log("in get api")

    database.retriveGroceryList()
    .then((groceryItems) => {
        res.json(groceryItems)
    }).catch(error => {
        console.error(`error has occured ${error.message}`);
        res.send(`error has occured ${error.message}`)
    })
});

//    - Remove grocery items from the system
admin.delete('/deleteItem', (req, res) => {
    console.log("in delete api")
    //items = ['Apple', 'Banana']
    const items = req.body;
    database.deleteGroceryItemFromDatabase(items)
    .then((deleteResponse) => res.json(deleteResponse))
    .catch(error => {
        console.error(`error has occured ${error.message}`);
        res.send(`error has occured ${error.message}`)
    })
});

//    - Update details (e.g., name, price) of existing grocery items
admin.put('/updateItem', (req, res) => {
    console.log("in update api")
    console.log(req.body)
    /*
        itemsToUpdate = [
        {"id": 4,"price": 3.23, "inventory_level": 392}
        ]
     */
    const itemsToUpdate = req.body;
    database.updateGroceryItemInDatabase(itemsToUpdate)
    .then((updateResponse) => res.json(updateResponse))
    .catch(error => {
        console.error(`error has occured ${error.message}`);
        res.send(`error has occured ${error.message}`)
    });
    // res.end()
});

//    - Manage inventory levels of grocery items
admin.get('/inventory', (req, res) => {
    console.log("in inventory api")
    //limits = [100, 30]
    const limits = req.body;
    database.getInventoryLevel(limits[0], limits[1])
    .then((inventoryResponse) =>  res.json(inventoryResponse))
    .catch(error => {
        console.error(`error has occured ${error.message}`);
        res.send(`error has occured ${error.message}`)
    });
    /*
    after retriving items whose limits has been breached, update those item using updateItem api
     */
})

module.exports = {
    admin
}