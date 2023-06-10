const express = require("express");
const router = express.Router();
const { isAuthenticatedUser } = require("../middleware/auth");
const {
  addToCart,
  cart,
  deleteItem,
  incDecItem,
  getTotalAmount,
} = require("../controllers/cartController");

router.post("/product/add/cart", isAuthenticatedUser, addToCart);
router.get("/cart", isAuthenticatedUser, cart);
router.delete("/cart/delete/:product_id", isAuthenticatedUser, deleteItem);
router.post("/cart/qty", isAuthenticatedUser, incDecItem);
router.get("/cart/totalamount", isAuthenticatedUser, getTotalAmount);

module.exports = router;
