const User = require("../models/userModels.js");
const Product = require("../models/productModel.js");
const ErrorHandler = require("../utils/errorHandler.js");
const sendToken = require("../utils/jwToken.js");
const cloudinary = require("../utils/cloudinary.js");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");

//Register a user
const registerUser = async (req, res) => {
  try {
    const myCloud = await cloudinary.uploader.upload(req.body.avatar, {
      folder: "avatars",
      width: 300,
      crop: "scale",
    });
    const { name, email, password } = req.body;
    let user = new User({
      name,
      email,
      password,
      avatar: {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      },
    });
    // console.log(user);
    user = await user.save();
    if (user) {
      res.status(201).send({
        success: true,
        message: "Registered successfully",
      });
    }
    // sendToken(user, 201, res);
  } catch (err) {
    res.status(400).send({ success: false, message: err.message });
  }
};

//Login user
const loginUser = async (req, res, next) => {
  const { loginEmail, loginPassword } = req.body;
  const email = loginEmail;
  const password = loginPassword;
  console.log(email, password);

  if (!email || !password) {
    return next(new ErrorHandler("Please Enter Email and Password", 400));
  }

  try {
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return next(new ErrorHandler("Invalid email or password", 401));
    }
    const isPasswordMatched = await user.comparePassword(password);

    if (!isPasswordMatched) {
      return next(new ErrorHandler("Invalid email or password", 401));
    }

    sendToken(user, 200, res);
  } catch (err) {
    res.status(400).send({ success: false, message: err.message });
  }
};

//Logout User
const logoutUser = async (req, res) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).send({
    success: true,
    message: "Logged Out Successfully",
  });
};

//Get User Details

const getUserDetails = async (req, res) => {
  const user = await User.findById(req.user.id);
  res.status(200).send({
    success: true,
    user,
  });
};

//update user password

const updateUserPassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("+password");

    const isPasswordMatched = await user.comparePassword(req.body.oldPassword);

    if (!isPasswordMatched) {
      return next(new ErrorHandler("Old password is incorrect", 400));
    }

    if (req.body.newPassword !== req.body.confirmPassword) {
      return next(new ErrorHandler("Password doesn't match", 400));
    }

    user.password = req.body.newPassword;
    const result = await user.save();
    sendToken(user, 200, res);
  } catch (err) {
    res.status(400).send({ success: false, message: err.message });
  }
};

//forgot password
const forgotPassword = async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  //get resetPasswordToken
  const resetToken = await user.getResetPasswordToken();

  await user.save();

  //link
  const resetPasswordUrl = `${req.protocol}://${req.get(
    "host"
  )}/password/reset/${resetToken}`;

  //message
  const message = `Your password reset token is :- \n\n ${resetPasswordUrl} \n\nIf you have not requested this email then please ignore it`;

  try {
    await sendEmail({
      email: user.email,
      subject: `Ecommerce Password Recovery`,
      message,
    });
    res.status(200).send({
      success: true,
      message: `Email send to ${user.email} successfully`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    return next(new ErrorHandler(error.message, 500));
  }
};

//Reset Password
const resetPassword = async (req, res, next) => {
  //creating token hash
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(
      new ErrorHandler(
        "Reset Password Token is invalid or has been expired",
        400
      )
    );
  }

  if (req.body.password !== req.body.confirmPassword) {
    return next(new ErrorHandler("Password doesn't match", 400));
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();
  sendToken(user, 200, res);
};

//update user profile
const updateProfile = async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
  };

  //cloudinary
  try {
    if (req.body.avatar !== "") {
      // console.log(req.body.avatar);
      const user = await User.findById(req.user.id);
      const imageId = user.avatar.public_id;
      await cloudinary.uploader.destroy(imageId);
      // console.log(req.body.avatar);
      const myCloud = await cloudinary.uploader.upload(req.body.avatar, {
        folder: "avatars",
      });
      newUserData.avatar = {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      };
    }

    const user = await User.findByIdAndUpdate(req.user.id, newUserData);
    if (user) {
      res.status(200).send({
        success: true,
        message: "Successfully Updated",
      });
    } else {
      res.status(400).send({
        success: false,
        message: "There is an error in updation",
      });
    }
  } catch (err) {
    return next(new ErrorHandler(err.message, 400));
  }
};

//Get all users (admin)

const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find();

    res.status(200).send({
      success: true,
      users,
    });
  } catch (err) {
    res.status(400).send({ success: false, message: err.message });
  }
};

//get single user
const getSingleUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(
        new ErrorHandler(`User does not exist with id : ${req.params.id}`, 404)
      );
    }
    res.status(200).send({
      success: true,
      user,
    });
  } catch (err) {
    res.status(400).send({ success: false, message: err.message });
  }
};

//update user role --admin
const updateUserRole = async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
  };
  try {
    const user = await User.findByIdAndUpdate(req.params.id, newUserData);
    res.status(200).send({
      success: true,
    });
  } catch (err) {
    return next(new ErrorHandler(err.message, 400));
  }
};

//delete user --admin
const deleteUser = async (req, res, next) => {
  //we will remove cloudinary later
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(
        new ErrorHandler(`User does not exist with Id: ${req.params.id}`)
      );
    }

    const imageId = user.avatar.public_id;
    await cloudinary.uploader.destroy(imageId);

    await user.deleteOne();

    res.status(200).send({
      success: true,
      message: "User deleted successfully",
    });
  } catch (err) {
    return next(new ErrorHandler(err.message, 400));
  }
};

//update user

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getUserDetails,
  updateUserPassword,
  updateProfile,
  getAllUsers,
  getSingleUser,
  updateUserRole,
  deleteUser,
  forgotPassword,
  resetPassword,
};
