const express = require("express");
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");
const router = express.Router();

router.post("/signup", authController.signUp);
router.post("/login", authController.login);

router.get("/me", authController.protect, userController.getMe);
router.get("/getAllUsers", userController.getAllUsers);
router.get("/:id", authController.protect, userController.getUser);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password/:token", authController.resetPassword);
router.patch(
  "/updateMyPassword",
  authController.protect,
  authController.updatePassword
);
router.patch("/updateMe", authController.protect, userController.updateMe);
router.delete("/deleteMe", authController.protect, userController.deleteMe);

router.route("/").get(userController.getAllUsers);
// router.route('/:id').get(userController.getUser);
module.exports = router;
