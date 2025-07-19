const express = require("express");
const adminController = require("../controllers/adminController");
const userController = require("../controllers/userController");
const {
  protect,
  signUp,
  updatePassword,
} = require("../controllers/authController");
const { adminOnly } = require("../middleware/adminMiddleware");

const router = express.Router();

router.get("/stats", protect, adminOnly, adminController.getAdminStats);

// Routes
router.get("/admins", protect, adminOnly, userController.getAllUsers);
router.post("/admins", protect, adminOnly, signUp); // Admins can create new admins);
router.patch("/admins/:id", protect, adminOnly, updatePassword); // Admins can update their own password
router.delete("/admins/:id", protect, adminOnly, adminController.deleteAdmin);
router.patch("/user/:id", protect, adminOnly, adminController.updateUser);
// PATCH /api/users/:id/status
router.patch(
  "/admins/:id/status",
  protect,
  adminOnly,
  adminController.updateUserStatus
);

router.patch(
  "/user/:id/role",
  protect,
  adminOnly,
  adminController.changeUserRole
);
module.exports = router;
