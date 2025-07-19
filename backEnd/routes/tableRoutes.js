const express = require("express");
const router = express.Router();
const tableController = require("../controllers/tableController");
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");

router.get("/available", tableController.getAvailableTables);
// Create a table
router.post("/", protect, adminOnly, tableController.createTable);

// // Get all tables
router.get("/", protect, adminOnly, tableController.getAllTables);

// // Update a table
router.patch("/:id", protect, adminOnly, tableController.updateTable);

// // Delete a table
router.delete("/:id", protect, adminOnly, tableController.deleteTable);
module.exports = router;
