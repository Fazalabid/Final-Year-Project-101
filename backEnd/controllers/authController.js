//My Code
const nodemailer = require("nodemailer");
const AppError = require("../utils/appError");
const sendEmail = require("../config/email");

const crypto = require("crypto");
const catchAsync = require("../utils/catchAsync");
const User = require("./../models/userModel");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const { token } = require("morgan");
// const { param } = require('../routes/tourRoutes');

const signToken = (id) => {
  //needs id(payload),secret,experationTime == payload,header and secret are used together create a jwt.
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const id = user._id;
  const token = signToken(id);

  //code for sending cookie
  //we are converting expiration date from 90days to milliseconds
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    // secure:true
  };
  //secure only works on https and currently we in development so we will change that later on(used to send cookies only on encryted connection)
  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;
  res.cookie("jwt", token, cookieOptions);

  //remove password form output
  user.password = undefined;
  res.status(statusCode).json({
    status: "success",
    token: token,
    data: {
      user,
    },
  });
};
//Signup Function
exports.signUp = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role || "customer", //default role is customer
  });

  createSendToken(newUser, 201, res);
  // const token = signToken(newUser._id);
  // res.status(201).json({
  //   status: 'success',
  //   token,
  //   user: newUser,
  // });
});

//Login function
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //1) check if email and password exists
  if (!email || !password) {
    return next(new AppError("please provide email and password!", 400));
  }

  //2) check if the user exists and password is correct
  const user = await User.findOne({ email: email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }

  //3) if everything is ok then send token to the client
  createSendToken(user, 200, res);

  // const token = signToken(user._id);
  // res.status(200).json({
  //   status: 'success',
  //   token,
  // });
});

//function to only give authentic users access
exports.protect = catchAsync(async (req, res, next) => {
  //1)getting the token and checking if it is there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    //token has a block scope that is why we declaired it outside if-statement
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) {
    return next(
      new AppError("You are not logged in! please log in to get access", 401)
    );
  }

  //2)verifying the token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //3)check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return new AppError(
      "The user belonging to this token no longer exist",
      401
    );
  }

  //4)check if user has changed password after token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        "User has recently changed his password! please login again",
        401
      )
    );
  }

  //grant access to protected routes
  req.user = currentUser;
  next();
});

//function to ristrict access based on roles
exports.ristrictTo = (...roles) => {
  return (req, res, next) => {
    //if the roles array(because there can be multiple users who has access to something) does not have a particular role(say admin) then ristrict user and throw new error(403 = forbidden)
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("you do not have permission to perform this action", 403)
      );
    }
    //otherwise call the next middleware and grant access to user(say to delete tours route handler)
    next();
  };
};

exports.forgotPassword = async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) return res.status(404).json({ msg: "User not found" });

  const resetToken = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(resetToken).digest("hex");
  const expireTime = Date.now() + 15 * 60 * 1000; // 15 minutes in milliseconds
  user.resetPasswordToken = hash;
  user.resetPasswordExpires = expireTime;
  await user.save({ validateBeforeSave: false });

  // console.log("Raw token:", resetToken);
  // console.log("Hashed token:", hash);
  const resetURL = `http://127.0.0.1:5500/login/reset-password.html?token=${resetToken}`;

  const html = `
    <p>You requested a password reset for BooknBite.</p>
    <p><a href="${resetURL}">Click here to reset your password</a></p>
    <p>This link will expire in 15 minutes.</p>
  `;

  try {
    await sendEmail(user.email, "BooknBite Password Reset", html);
    res.json({ msg: "Reset link sent to email" });
  } catch (err) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save({ validateBeforeSave: false });
    res
      .status(500)
      .json({ msg: "Failed to send email", error: err.message, err });
  }
};

//2)
// POST /api/auth/reset-password
// In authController.js
exports.resetPassword = async (req, res) => {
  try {
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ msg: "Token is invalid or expired" });
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res
      .status(200)
      .json({ msg: "Password reset successful, You can login now" });
  } catch (err) {
    console.error("Error resetting password:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};
//function to update the current user password(no forget password hastle)(for logged in users)
exports.updatePassword = catchAsync(async (req, res, next) => {
  const { passwordCurrent, password, passwordConfirm } = req.body;

  if (!passwordCurrent || !password || !passwordConfirm) {
    return next(new AppError("Please provide all required fields.", 400));
  }
  // 1)Get user from the collection
  const user = await User.findById(req.user.id).select("+password");
  // 2)check if the POSTed password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError("Your current password is wrong ", 401));
  }

  // 3)if so, then update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // 4)log user in , send jwt
  createSendToken(user, 200, res);
  // const token = signToken(user._id);
  // res.status(200).json({
  //   status: 'success',
  //   token,
  // });
});
