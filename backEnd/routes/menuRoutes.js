const express = require("express");
const {
  getAllMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} = require("../controllers/menuController");
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");

const router = express.Router();

router.get("/", getAllMenuItems);
router.post("/", protect, adminOnly, createMenuItem);
router.patch("/:id", protect, adminOnly, updateMenuItem);
router.delete("/:id", protect, adminOnly, deleteMenuItem);

module.exports = router;
