const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass
// '/dishes'
function list(req, res) {
  res.json({ data: dishes });
}

function bodyContains(field) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    res.locals.data = data;
    if (data[field]) {
      return next();
    } else {
      return next({
        status: 400,
        message: `Dish must include a ${field}`,
      });
    }
  };
}

function bodyFieldEmpty(field) {
  //fire after bodyContains
  return function (req, res, next) {
    const data = res.locals.data;
    if (data[field] === undefined || data[field].toString() < 1) {
      return next({
        status: 400,
        message: `Dish must include a ${field}`,
      });
    } else {
      return next();
    }
  };
}

function priceValid(req, res, next) {
  //fire after bodyFieldEmpty
  const {
    data: { price },
  } = req.body;
  res.locals.price = price;
  if (Number.isInteger(price) && price > 0) {
    return next();
  } else {
    return next({
      status: 400,
      message: "Dish must have a price that is an integer greater than 0",
    });
  }
}

function create(req, res, next) {
  const {
    data: { id, name, description, price, image_url },
  } = req.body;
  const dish = {
    name,
    description,
    price,
    image_url,
    id: nextId()
  };
  dishes.push(dish);
  res.status(201).json( {data: dish} );
}
//

// '/dishes/:dishId'
function dishExists(req, res, next) {
  const dishId = req.params.dishId; //id displayed as alphanumeric
  res.locals.dishId = dishId;
  const dishFound = dishes.find((dish) => dish.id === dishId);
  res.locals.dishFound = dishFound;
  if (dishFound) {
    return next();
  } else {
    return next({ 
      status: 404,
      message: `Dish not found for id: ${dishId}`,
    })
  }
}

function read(req, res) {
  const dishId = res.locals.dishId; //id displayed as alphanumeric
  const dishFound = res.locals.dishFound;
  res.json({ data: dishFound });
}

function dishMatchesId(req, res, next) {
  const { data: {id} } = req.body;
  const idParams = res.locals.dishId //id displayed as alphanumeric
  if (id) {
    if (id === idParams) {
        return next();
      } else {
        return next({
          status: 400,
          message: `The paths id and request body's id do not match: ${id}, ${idParams}`
        })
    }
  }
  next();
}

function update(req, res) {
  const dishFound = res.locals.dishFound;
  const {
    data: { name, description, price, image_url },
  } = req.body;
  dishFound.name = name;
  dishFound.description = description;
  dishFound.price = price;
  dishFound.image_url = image_url;
  res.json( {data: dishFound} )
}

module.exports = {
  list,
  create: [
    bodyContains("name"),
    bodyContains("price"),
    bodyContains("image_url"),
    bodyContains("description"),
    bodyFieldEmpty('name'),
    bodyFieldEmpty('price'),
    bodyFieldEmpty('image_url'),
    bodyFieldEmpty('description'),
    priceValid,
    create,
  ],
  read: [dishExists, read],
  update: [
    dishExists,
    bodyContains("name"),
    bodyContains("price"),
    bodyContains("description"),
    bodyContains("image_url"),
    bodyFieldEmpty('name'),
    bodyFieldEmpty('price'),
    bodyFieldEmpty('image_url'),
    bodyFieldEmpty('description'),
    priceValid,
    dishMatchesId,
    update
  ],
};