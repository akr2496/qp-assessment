const {Client, Pool} = require('pg');
const dotenv = require('dotenv').config();


const {HOST, USERNAME, PASSWORD, DATABASE, DB_PORT} = dotenv.parsed;
const pool = new Pool({
    user: USERNAME,
    host: HOST,
    database: DATABASE,
    password: PASSWORD,
    port: DB_PORT, // PostgreSQL default port
});

// connecting to DB
const connectToDatabase = async(client) =>{
    try{
        await pool.connect();
    } catch (error) {
        console.log(`error occured while connecting to DB : ${error.message}`)
    }
}

const getAdmin = async() => {
    const query =`
        SELECT * FROM "UserDetail"
        WHERE role = 'admin'
    `;
    let result;
    try {
        const res = await pool.query(query);
        result = res.rows;
    } catch(error) {
        console.log(`error has occured : ${error.message}`)
    }
    return result;
}

//add item to table [groceryitem]
const addItemToDatabase = async(itemTobeAdded) => {
    // itemTobeAdded = list of list
    const query = `
        INSERT INTO "GroceryItem" (id, name, price, inventory_level)
        VALUES 
            ${itemTobeAdded.map((_, index) => `($${index * 4 + 1}, $${index * 4 + 2}, $${index * 4 + 3}, $${index * 4 + 4})`).join(',')}
        ON CONFLICT (id) DO NOTHING;
    `;
    pool.query(query, itemTobeAdded.flat())
    .then(res => console.log(res.rowCount))
    .catch(error => console.log(`error in inserting items : ${error.message}`));

    return "Item(s) are added to database";
}

//get grocery items 
const retriveGroceryList = async() => {
    const query = `
        SELECT * FROM "GroceryItem"
    `;
    let result;
    try {
        const res = await pool.query(query);
        result = res.rows;
    } catch(error) {
        console.log(`error has occured : ${error.message}`)
    }
    return result;
}

//get available grocery items
const getAvailableItemFromDatabase = async() => {
    const query = `
        SELECT id, name, price FROM "GroceryItem"
        WHERE inventory_level > 0
    `;
    let result;
    try {
        const res = await pool.query(query);
        result = res.rows;
    } catch(error) {
        console.log(`error has occured : ${error.message}`)
    }
    return result;
}

//delete items from grocery list
const deleteGroceryItemFromDatabase = async(item_name) => {
    const query = `
        DELETE FROM "GroceryItem"
        WHERE name IN (${item_name.map((_, index) => `$${index + 1}`).join(', ')})
    `;
    let result;
    try {
        const res = await pool.query(query);
        result = res.rows;
    } catch(error) {
        console.log(`error has occured : ${error.message}`)
    }
    // return result;
    // console.log(userData)
    return `Deleted item(s) :${item_name} -- ${result}`;
}

//update grocery item detail
const updateGroceryItemInDatabase = async(itemsToUpdate) => {
    // itemsToUpdate = [{"id": 4,"price": 1.23, "inventory_level": 392}];

    itemsToUpdate.forEach(async(item) => {
        const id = item.id,
              name = item.name,
              price = item.price,
              inventory_level = item.inventory_level;

        let queryParams = [];
        let query = `UPDATE "GroceryItem" SET `;
        if (name !== undefined) {
            query += `name = $${queryParams.push(name)}, `;
        }
        if (price !== undefined) {
            query += `price = $${queryParams.push(price)}, `;
        }
        if (inventory_level !== undefined) {
            query += `inventory_level = $${queryParams.push(inventory_level)}, `;
        }

        query = query.slice(0, -2);
        query += ` WHERE id = $${queryParams.push(id)}`;
        console.log(query)
        pool.query(query, queryParams).then((res) => console.log(res))
                        .catch((error) => console.log(`error in update query : ${error.message}`))
    })
    // console.log(userData)
    // pool.end();
    return "Items have been updated"
}

const getInventoryLevel = async(lowerLimit, upperLimit) => {
    const query1 = `
        SELECT id, inventory_level FROM "GroceryItem"
        WHERE inventory_level > ${upperLimit}
    `;
    const query2 = `
        SELECT id, inventory_level FROM "GroceryItem"
        WHERE inventory_level < ${lowerLimit}
    `;

    const res1 = await pool.query(query1);
    let upperIds = res1.rows;
    // console.log(upperIds)
    const res2 = await pool.query(query2);
    let lowerIds = res2.rows;
    // console.log(lowerIds)
    const output = {
        "ids with inventory_levels above upperLimit" : upperIds, 
        "ids with inventory_levels below lowerLimit" : lowerIds
    };

    return output;
}

const selectItem = async(orderItem) => {

    const query = `
        INSERT INTO "OrderItem" (user_id, item_id, quantity)
        VALUES 
            ${orderItem.map((_, index) => `($${index * 3 + 1}, $${index * 3 + 2}, $${index * 3 + 3})`).join(',')}
    `;

    pool.query(query, orderItem.flat())
    .then(res => console.log(res.rowCount))
    .catch(error => console.log(`error in selecting items : ${error.message}`));

    return "Item(s) are added to database";
}

const checkOrderItemForUser = async(user_id) => {
    const query =`
        SELECT item_id, quantity FROM "OrderItem" 
        WHERE user_id = ${user_id}
    `;
    let result;
    try {
        const res = await pool.query(query);
        result = res.rows;
    } catch(error) {
        console.log(`error has occured : ${error.message}`)
    }
    return result;
}
const bookItem = async(order) =>{
    const query = `
        INSERT INTO "Order" (id, user_id, 'order_date', total_price')
        VALUES 
            ($1, $2, $3, $4)
    `;
    const auxQuery = `
        SELECT item_id, quantity FROM OrderItem
    `;
    let result;
    try {
        const res = await pool.query(query, Object.values(order));
        result = res;
    } catch(error) {
        console.log(`error has occured : ${error.message}`)
    }
    return result;
}

const updateInventoryAfterTransaction = async(orderItem) => {
    orderItem.forEach(async(item) => {
        const id = item.id,
              inventory_level = item.quantity;

        let queryParams = [];
        let query = `UPDATE "GroceryItem" SET `;
      
        if (inventory_level !== undefined) {
            //assuming inventory_level always > quantity purchased
            query += `inventory_level = inventory_level - $${queryParams.push(inventory_level)}, `;
        }

        query = query.slice(0, -2);
        query += ` WHERE id = $${queryParams.push(id)}`;
        console.log(query)
        pool.query(query, queryParams).then((res) => console.log(res))
                        .catch((error) => console.log(`error in update query : ${error.message}`))
    })
    // console.log(userData)
    // pool.end();
    return "Items have been updated after transaction"
}

module.exports = {
    pool,
    getAdmin,
    connectToDatabase,
    addItemToDatabase,
    retriveGroceryList,
    getAvailableItemFromDatabase,
    deleteGroceryItemFromDatabase,
    updateGroceryItemInDatabase,
    getInventoryLevel,
    checkOrderItemForUser,
    selectItem,
    bookItem,
    updateInventoryAfterTransaction
}