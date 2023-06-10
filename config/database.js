const mongoose = require("mongoose");

mongoose
  .connect(process.env.DATABASE)
  .then((data) => {
    console.log(`Mongodb connected with server:${data.connection.host}`);
  })
  .catch((error) => {
    console.log(error);
  });
