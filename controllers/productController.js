const Product = require("../models/productModel");
const ErrorHandler = require("../utils/errorHandler");
const ApiFeatures = require("../utils/apiFeatures");
const cloudinary = require("../utils/cloudinary");

//create product --admin
const createProduct = async (req, res, next) => {
  try {
    let images = [];

    if (typeof req.body.images === "string") {
      images.push(re.body.images);
    } else {
      images = req.body.images;
    }

    const imagesLink = [];

    for (i = 0; i < images.length; i++) {
      const result = await cloudinary.uploader.upload(images[i], {
        folder: "products",
      });
      imagesLink.push({
        public_id: result.public_id,
        url: result.secure_url,
      });
    }

    req.body.images = imagesLink;
    req.body.user = req.user.id;
    const product = new Product(req.body);

    const prod = await product.save();

    if (prod) {
      res.status(201).send({
        success: true,
        prod,
      });
    }
  } catch (err) {
    return next(new ErrorHandler(err.message, 400));
  }
};

//get all products
const getAllProducts = async (req, res, next) => {
  // return next(new ErrorHandler("This is my temp error", 500));
  // console.log("hi");
  const resultPerPage = 8;
  const productCount = await Product.countDocuments();
  // console.log(req.query);
  const apiFeatured = new ApiFeatures(Product.find(), req.query)
    .search()
    .filter();
  let products = await apiFeatured.query;
  let filteredProductCount = products.length;
  apiFeatured.pagination(resultPerPage);
  products = await apiFeatured.query.clone();
  // console.log(products);

  if (products) {
    res.status(200).send({
      success: true,
      products,
      productCount,
      resultPerPage,
      filteredProductCount,
    });
  } else {
    res.status(404).send({ success: false, message: "product not found" });
  }
};

//update product --admin
const updateProduct = async (req, res) => {
  let product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(500).send({
      success: false,
      message: "Product not found",
    });
  }

  //images start here
  let images = [];

  if (typeof req.body.images === "string") {
    images.push(re.body.images);
  } else {
    images = req.body.images;
  }
  if (images !== undefined) {
    for (let i = 0; i < product.images.length; i++) {
      await cloudinary.uploader.destroy(product.images[i].public_id);
    }
  }

  const imagesLink = [];

  for (i = 0; i < images.length; i++) {
    const result = await cloudinary.uploader.upload(images[i], {
      folder: "products",
    });
    imagesLink.push({
      public_id: result.public_id,
      url: result.secure_url,
    });
  }

  req.body.images = imagesLink;

  product = await Product.findByIdAndUpdate(req.params.id, req.body);
  res.status(200).send({
    success: true,
    product,
  });
};

//delete product --admin
const deleteProduct = async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);

  //deleting images from cloudinary
  for (let i = 0; i < product.images.length; i++) {
    await cloudinary.uploader.destroy(product.images[i].public_id);
  }
  if (!product) {
    return res.status(500).send({
      success: false,
      message: "Product not find",
    });
  } else {
    return res.status(200).send({
      success: true,
      message: "Product deleted successfully",
    });
  }
};

//get product details
const getProductDetails = async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
    // res.status(400).send({
    //   success: false,
    //   message: "Product not found",
    // });
  } else {
    return res.status(200).send({
      success: true,
      product,
    });
  }
};

//Create New Review or Update the review
const createProductReview = async (req, res, next) => {
  const { rating, comment, productId } = req.body;
  // console.log(rating, comment, productId, req.user.id);
  const review = {
    user: req.user.id,
    name: req.user.name,
    rating: Number(rating),
    comment,
  };
  try {
    const product = await Product.findById(productId);
    // console.log(product);

    const isReviewed = product.reviews.find(
      (rev) => rev.user.toString() === req.user.id.toString()
    );
    if (isReviewed) {
      product.reviews.forEach((rev) => {
        if (rev.user.toString() === req.user.id.toString()) {
          rev.rating = rating;
          rev.comment = comment;
        }
      });
    } else {
      // console.log(review);
      product.reviews.push(review);
      product.numOfReviews = product.reviews.length;
    }
    let avg = 0;
    product.reviews.forEach((rev) => {
      avg += rev.rating;
    });
    product.ratings = (avg / product.reviews.length).toFixed(1);
    let a = await product.save({ validateBeforeSave: false });
    // console.log(a);
    res.status(200).send({
      success: true,
    });
  } catch (err) {
    // res.send(err);
    return next(new ErrorHandler(err.message, 400));
  }
};

//get all reviews of a product

const getProductReviews = async (req, res, next) => {
  const product = await Product.findById(req.query.productId);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }
  res.status(200).send({
    success: true,
    reviews: product.reviews,
  });
};

//Delete review

const deleteReview = async (req, res, next) => {
  try {
    // console.log(req.query.productId, req.query.id);
    const product = await Product.findById(req.query.productId);

    if (!product) {
      return next(new ErrorHandler("Product not found", 404));
    }
    const reviews = product.reviews.filter(
      (rev) => rev._id.toString() !== req.query.id.toString()
    );
    let avg = 0;
    reviews.forEach((rev) => {
      avg += rev.rating;
    });

    let ratings = 0;

    if (reviews.length === 0) {
      ratings = 0;
    } else {
      ratings = avg / reviews.length;
    }
    // console.log(ratings);

    const numOfReviews = reviews.length;

    await Product.findByIdAndUpdate(req.query.productId, {
      reviews,
      ratings,
      numOfReviews,
    });

    res.status(200).send({
      success: true,
      message: "review deleted successfully",
    });
  } catch (err) {
    res.status(400).send({
      success: false,
      message: err.message,
    });
  }
};

//get all products --admin
const getAdminProducts = async (req, res, next) => {
  try {
    const products = await Product.find();
    res.status(200).send({
      success: true,
      products,
    });
  } catch (err) {
    return next(new ErrorHandler(err.message, 400));
  }
};

module.exports = {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductDetails,
  createProductReview,
  getProductReviews,
  deleteReview,
  getAdminProducts,
};
