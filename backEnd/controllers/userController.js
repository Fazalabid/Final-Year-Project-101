const fs = require("fs");
const User = require("./../models/userModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

// const users = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/users.json`),
// );

//function to filter through the req.body and allow only email and name to be updated
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};

  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

//function to update the other fields except for passwrod
exports.updateMe = catchAsync(async (req, res, next) => {
  // 1)create error if the user POSTs password data(if user tries to update his password)
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        "This route is not for password updates. please use /updateMyPassword",
        400
      )
    );
  }
  // 2)Filtered out fields that are allowed to be updated
  //we need to filter the body and update only name and email(user can update his role and become admin if he wants and we dont want that)
  const filteredBody = filterObj(req.body, "name", "email");

  // 3)update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

//function to delete user accounts(behind the scene we will only deactivate it not delete the actual document of user)
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: "success",
    data: null,
  });
});

//get All users function
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();
  res.status(200).json({
    status: "success",
    length: users.length,
    data: {
      users,
    },
  });
});

exports.getUser = catchAsync(async (req, res, next) => {
  const users = await User.findById(req.params.id);
  res.status(200).json({
    status: "success",
    requestedAt: req.requestTime,
    length: users.length,
    data: {
      users,
    },
  });
});

exports.getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new AppError("No user found with that ID", 404));
  }
  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
});
//Get User by id or just one tour function
// exports.getUser = (req, res) => {
//   const id = req.params.id * 1;
//   const user = User.find((el) => el.id === id);
//   if (!user) {
//     return res.status(404).json({
//       status: "fail",
//       message: "Invalid ID",
//     });
//   }
//   res.status(200).json({
//     status: "success",
//     data: {
//       user,
//     },
//   });
// };

// //Create New User function
// exports.createUser = (req, res) => {
//   // console.log(req.body);
//   const newId = users[users.length - 1].id + 1;
//   const newUser = Object.assign({ id: newId }, req.body);
//   users.push(newUser);
//   fs.writeFile(
//     `${__dirname}/dev-data/data/users.json`,
//     JSON.stringify(users),
//     (err) => {
//       res.status(201).json({
//         status: 'success',
//         data: {
//           user: newUser,
//         },
//       });
//     },
//   );
// };

// //Update User function
// exports.updateUser = (req, res) => {
//   if (req.params.id * 1 > user.length) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'Invalid ID',
//     });
//   }

//   res.status(200).json({
//     status: 'success',
//     data: {
//       user: 'Updated tour goes here...',
//     },
//   });
// };

// //Delete tour function
// exports.deleteUser = (req, res) => {
//   if (req.params.id * 1 > users.length) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'Invalid ID',
//     });
//   }

//   res.status(204).json({
//     status: 'success',
//     data: null,
//   });
// };
