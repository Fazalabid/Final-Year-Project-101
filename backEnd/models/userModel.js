// const userSchema = new mongoose.Schema(
//   {
//     name: { type: String, required: true },
//     email: { type: String, required: true, unique: true },
//     password: { type: String, required: true },
//     role: { type: String, enum: ["admin", "customer"], default: "customer" },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("User", userSchema);

//My good Schema for User Model
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const validator = require("validator");

const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "User must have a name."],
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valid email"],
  },
  role: {
    type: String,
    enum: ["admin", "customer"],
    default: "customer",
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    minLength: [8, "A password must at least have 8 characters"],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm your password"],
    validate: {
      // Only works on CREATE and SAVE!
      validator: function (el) {
        return el === this.password;
      },
      message: "Passwords do not match!",
    },
  },
  profilePic: {
    type: String,
    default: "", // or you can provide a default avatar image path
  },

  // passwordChangedAt: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,

  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});
//Password Encryption before it is saved/persisted to database
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  // Bcrypt encryption for password
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

//function/middleware for updating the ChangedPasswordAt property for user
userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();

  //subtracting 1 sec cause sometimes there is a delay when password is reset(like slow network or DB) and the user will not be logged
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

//function to only show those documents whose active = !false.(this pre middleware will run before everytime we run a query that starts with find like find(),findById(),findByIdUpdate()etc)
//--/^find/-- is a regular expression and it will look for queries starting with find only
userSchema.pre(/^find/, function (next) {
  //--this-- points to the current query
  this.find({ active: { $ne: false } });
  next();
});

//instant method to check if password is correct by matching the user's password with password stored in DB
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

//function to only give authentic users access
//checking if the user has changed his password after the token was issued
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    console.log(passwordChangedAt, JWTTimestamp);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

//Instance method fot creating reset password token
userSchema.methods.createPasswordResetToken = function () {
  //using builtin crypto to create a random token and convert it to string(hexadecimal)
  const resetToken = crypto.randomBytes(32).toString("hex");
  //encrypt the token using crypto
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  //set the experation time of token(10 mints in milliSenonds)
  this.PasswordResetExpires = Date.now() + 10 * 60 * 1000;
  //return the unencryted token to be send to user's email from authController
  return resetToken;
};
const User = new mongoose.model("User", userSchema);

module.exports = User;
