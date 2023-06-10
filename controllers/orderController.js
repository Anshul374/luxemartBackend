const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const ErrorHandler = require("../utils/errorHandler");

//create a new order

const newOrder = async (req, res, next) => {
  const {
    shippingInfo,
    orderItems,
    paymentInfo,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
  } = req.body;

  let order = new Order({
    shippingInfo,
    orderItems,
    paymentInfo,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    paidAt: Date.now(),
    user: req.user.id,
  });

  order = await order.save();
  if (order) {
    res.status(201).send({
      success: true,
      order,
    });
  } else {
    res.status(400).send({
      success: false,
      message: "There is something wrong in creating new error",
    });
  }
};

//get single order
const getSingleOrder = async (req, res, next) => {
  const order = await Order.findById(req.params.id).populate(
    "user",
    "name email"
  );

  if (!order) {
    return next(new ErrorHandler(`Order not found with this Id:`, 404));
  }

  res.status(200).send({
    success: true,
    order,
  });
};

//get logged in user order

const myOrders = async (req, res, next) => {
  const orders = await Order.find({ user: req.user.id });

  if (!orders) {
    return next(new ErrorHandler(`Order not found with this Id:`, 404));
  }

  res.status(200).send({
    success: true,
    orders,
  });
};

//get all orders --Admin
const getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.find();
    let totalAmount = 0;

    orders.forEach((order) => {
      totalAmount += order.totalPrice;
    });
    res.status(200).send({
      success: true,
      totalAmount,
      orders,
    });
  } catch (err) {
    return next(new ErrorHandler(err.message, 400));
  }
};

//Update order --Admin
const updateOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return next(new ErrorHandler("Order not found with this id", 404));
    }

    if (order.orderStatus === "Delivered") {
      return next(
        new ErrorHandler("You have already delivered this order", 400)
      );
    }

    if (req.body.status === "Shipped") {
      order.orderItems.forEach(async (order) => {
        await updateStock(order.product_id, order.quantity);
      });
    }

    order.orderStatus = req.body.status;
    if (req.body.status === "Delivered") {
      order.deliveredAt = Date.now();
    }

    await order.save();

    res.status(200).send({
      success: true,
    });
  } catch (err) {
    return next(new ErrorHandler(err.message, 400));
  }
};

async function updateStock(id, qty) {
  const product = await Product.findById(id);
  product.stock -= qty;
  await product.save();
}

//delete order

const deleteOrder = async (req, res, next) => {
  const order = await Order.findByIdAndDelete(req.params.id);
  if (!order) {
    return next(new ErrorHandler("Order not found with this id", 404));
  } else {
    res.status(200).send({
      success: true,
      message: "order successfully deleted",
    });
  }
};

module.exports = {
  newOrder,
  getSingleOrder,
  myOrders,
  getAllOrders,
  updateOrder,
  deleteOrder,
};
