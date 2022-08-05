const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
// '/orders'
function list(req, res) {
  res.json( {data: orders} );
}

function bodyContains(field) {
    return function (req, res, next) {
      const { data = {} } = req.body;
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

function dishPropertyValid(req, res, next) { //fire after bodyContains
  const { data: {dishes} } = req.body;
  if (dishes.length < 1) {
    return next({
      status: 400,
      message: 'Order must include at least one dish'
    })
  }
  
  for (let i = 0; i < dishes.length; i++) {
    if (!dishes[i].quantity || !Number.isInteger(dishes[i].quantity) || !dishes[i].quantity > 0) {
      return next({
      status: 400,
      message: `dish ${i} must have a quantity that is an integer greater than 0`
    })
    }
  }
  next()
}



function create(req, res) {
  const { data: {deliverTo, mobileNumber, dishes, status} } = req.body;
  const order = {
    deliverTo,
    mobileNumber,
    dishes,
    status,
    id: nextId()
  }
  orders.push(order);
  res.status(201).json( {data: order} );
}
//

// '/orders/:orderId'
function orderExists(req, res, next) {
  const orderId = req.params.orderId; //id displayed as alphanumeric
  res.locals.orderId = orderId;
  const foundOrder = orders.find(order => order.id === orderId);
  res.locals.foundOrder = foundOrder;
  if (foundOrder) {
    return next();
  } else {
    return next({
      status: 404,
      message: `Id not found for order: ${orderId}`
    })
  }
}

function read(req, res) {
  const foundOrder = res.locals.foundOrder
  res.json( {data: foundOrder} )
}

function orderMatchesId(req, res, next) {
  const { data: {id} } = req.body;
  const idParams = res.locals.orderId //id displayed as alphanumeric
  if (id) {
    if (id !== idParams) {
      next({
        status: 400,
        message: `The paths id and request body's id do not match: ${idParams}, ${id}`
      });
    }
  }
  next();
}

function statusPropertyValid(req, res, next) {
  const { data: {status} } = req.body;
  if (status !== 'pending' && status !== 'preparing' && status !== 'out-for-delivery' && status !== 'delivered') {
    next({
      status: 400,
      message: 'Order must have a status of pending, preparing, out-for-delivery, delivered'
    });
  } else if (status === 'delivered') {
    next({
      status: 400,
      message: 'A delivered order cannot be changed'
    });
  } else {
    next();
  }
}
    
function update(req, res) {
  const { data: {deliverTo, mobileNumber, dishes, status} } = req.body;
  const foundOrder = res.locals.foundOrder;
  foundOrder.deliverTo = deliverTo;
  foundOrder.mobileNumber = mobileNumber;
  foundOrder.dishes = dishes;
  foundOrder.status = status;
  res.json( {data: foundOrder} )
}

function orderPending(req, res, next) {
  const foundOrder = res.locals.foundOrder;
  if (foundOrder.status !== 'pending') {
    next({
      status: 400,
      message: 'An order cannot be deleted unless it is pending'
    })
  }
  next();
}

function destroy(req, res) {
  const orderId = res.locals.orderId; //id displayed as alphanumeric
  const index = orders.findIndex(order => order.id === orderId);
  orders.splice(index, 1);
  res.sendStatus(204)
}

module.exports = {
  list,
  create: [
    bodyContains('deliverTo'),
    bodyContains('mobileNumber'),
    bodyContains('dishes'),
    dishPropertyValid,
    create
  ],
  read: [orderExists, read],
  update: [
    orderExists,
    bodyContains('deliverTo'),
    bodyContains('mobileNumber'),
    bodyContains('dishes'),
    dishPropertyValid,
    orderMatchesId,
    statusPropertyValid,
    update
  ],
  destroy: [orderExists, orderPending, destroy]
}