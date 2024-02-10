// index.js
const express = require('express');
const {admin} = require('./admin');
const database = require('./database')

const app = express();
const PORT = process.env.PORT || 4000;
var bodyParser = require('body-parser');


app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
// in latest body-parser use like below.
app.use(bodyParser.urlencoded({ extended: true }));


const getAvailableItem = async(req, res, next) => {
    console.log("in cb fn")
    try{
        const grocery = await database.getAvailableItemFromDatabase();
        // res.json(grocery)
        req.grocery = grocery;
        next();
    }catch (error){
        console.log(`err has occured: ${error.message}`)
    }
}

app.use('/admin', admin);
// console.log(admin)

// 2. User Responsibilities:
//    - View the list of available grocery items
app.get('/', (req, res) => {
    res.send('Hello world');
  });

app.get('/getGroceryList', getAvailableItem, (req, res) => {
    res.send(req.grocery);
  });

//    - Ability to book multiple grocery items in a single order
// sending items in cart for particuler user
app.post('/selectItem', (req, res) => {
    console.log('USER : In orderItem Api')
    // [["user_id": INT, "item_id" : INT, "quantity": INT ]]
    const items = req.body;
    database.selectItem(items)
    .then((selectResponse) => {
        console.log(selectResponse)
        res.end()
    }).catch((error) => {
        res.send(`error has occured : ${error.message}`)
    });
});

app.post('/book', async(req,res) => {
    
    //check if orderItem exists for user
    const order = req.body;
    const id = order.id;
    const user = order.user_id;
    try {
        const orderItem = await database.checkOrderItemForUser(user);
        if(orderItem === undefined) res.send(`Explore item in shopping window`)
        //{"id": INT, "user_id": INT,  "total_price": INT, "date": datetimestamp}
        else {
            const booking = await database.bookItem(order);
            if(booking === undefined) res.send(` booking failed`)
            else {
                await database.updateInventoryAfterTransaction(orderItem)
            }
        }
        res.json(`booking is confirmed with :${id}`)
    } catch (error){
        res.send(`error has occured : ${error.message}`)
    }
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

