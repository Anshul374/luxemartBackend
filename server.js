const express = require("express");
const app = express();
const errorMiddleware = require("./middleware/error");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const bodyParser = require("body-parser");
const fileupload = require("express-fileupload");
const path = require("path");

//Handling Uncaught Exception
process.on("uncaughtException", (err) => {
  console.log(`Error:${err.message}`);
  console.log(`Shutting down the server due to uncaught exception`);
  process.exit(1);
});

app.use(
  cors({
    origin: "http://localhost:3000",
  })
);

//config
if (process.env.NODE_ENV !== "PRODUCTION") {
  dotenv.config({ path: "./config/config.env" });
}
require("./config/database.js");

app.use(
  express.json({
    limit: "50mb",
  })
);
app.use(cookieParser());

//to upload images
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(fileupload());

//port from env file
const PORT = process.env.PORT || 5000;

//Route imports
const product = require("./routes/productRoute");
const user = require("./routes/userRoutes");
const order = require("./routes/orderRoute");
const cart = require("./routes/cartRoute");
const payment = require("./routes/paymentRoute");

app.use("/api/v1", product);
app.use("/api/v1", user);
app.use("/api/v1", order);
app.use("/api/v1", cart);
app.use("/api/v1", payment);

//production build
// app.use(express.static(path.join(__dirname, "../frontend/build")));
// app.get("*", (req, res) => {
//   req.send(path.resolve(__dirname, "../frontend/build"));
// });

//middleware for errors
app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
