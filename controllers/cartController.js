const ErrorHandler = require("../utils/errorHandler");
const Cart = require("../models/cartModel");

//addToCart
const addToCart = async (req, res, next) => {
  req.body.loginUser = req.user._id;
  try {
    // console.log(req.body.product_id, req.body.loginUser);
    const cItem = await Cart.findOne({
      product_id: req.body.product_id,
      loginUser: req.user._id,
    });
    // console.log(cItem);
    if (cItem) {
      if (cItem.stock < req.body.quantity + cItem.quantity) {
        cItem.quantity = cItem.stock;
      } else {
        cItem.quantity = cItem.quantity + req.body.quantity;
      }
      const item = await cItem.save();
      // console.log(item);
      if (item) {
        res.status(200).send({
          success: true,
          message: "Added to Cart",
        });
      }
    } else {
      const cart = new Cart(req.body);
      const cartItem = await cart.save();
      if (cartItem) {
        res.status(200).send({
          success: true,
          message: "Added to Cart",
        });
      }
    }
  } catch (err) {
    return next(new ErrorHandler(err.message, 400));
  }
};

//get Cart items
const cart = async (req, res, next) => {
  // console.log(req.user._id);
  const cartItems = await Cart.find({ loginUser: req.user._id });
  // console.log(cartItems);
  if (cartItems) {
    res.status(200).send({
      success: true,
      cartItems,
    });
  } else {
    res.status(404).send({
      success: false,
      message: "empty",
    });
  }
};

//deleteItemFrom Cart

const deleteItem = async (req, res, next) => {
  // console.log(req.params);
  try {
    const product = await Cart.deleteOne({
      loginUser: req.user._id,
      product_id: req.params.product_id,
    });
    if (product.acknowledged) {
      res.status(200).send({
        success: true,
      });
    } else {
      res.status(400).send({
        success: false,
      });
    }
  } catch (err) {
    return next(new ErrorHandler(err.message, 400));
  }
};

//quantity increase and decrease of items in cart

const incDecItem = async (req, res, next) => {
  try {
    const citem = await Cart.findOne({
      loginUser: req.user._id,
      product_id: req.body.product_id,
    });
    if (citem.quantity < req.body.quantity) {
      const diff = req.body.quantity - citem.quantity;
      citem.quantity = diff + req.body.quantity;
    }
    if (citem.quantity > req.body.quantity) {
      const diff = citem.quantity - req.body.quantity;
      citem.quantity = citem.quantity - diff;
    }
    const item = await citem.save();
    // console.log(item);
    if (item) {
      res.status(200).send({
        success: true,
        item,
      });
    } else {
      res.status(400).send({
        success: false,
      });
    }
  } catch (err) {
    return next(new ErrorHandler(err.message, 400));
  }
};

//getTotalAmount in cart

const getTotalAmount = async (req, res, next) => {
  // console.log(req.user._id);
  const cartItems = await Cart.find({ loginUser: req.user._id });
  // console.log(cartItems);
  let totalAmount = 0;
  cartItems.forEach(
    (item) => (totalAmount = totalAmount + item.price * item.quantity)
  );
  // console.log(totalAmount);
  res.status(200).send({
    success: true,
    totalAmount,
  });
};

module.exports = { addToCart, cart, deleteItem, incDecItem, getTotalAmount };
