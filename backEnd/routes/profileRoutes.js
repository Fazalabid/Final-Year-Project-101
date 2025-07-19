const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { protect } = require("../middleware/authMiddleware");
const User = require("../models/userModel");
const { validate } = require("../models/bookingModel");

// Multer config
const uploadDir = path.join(__dirname, "../../uploads/profiles");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `user-${req.user._id}${ext}`);
  },
});

const upload = multer({ storage });

// Route: POST /api/profile/upload
router.post(
  "/upload",
  protect,
  upload.single("profilePic"),
  async (req, res) => {
    try {
      const user = await User.findById(req.user._id);
      user.profilePic = `/uploads/profiles/${req.file.filename}`;
      await user.save({ validateBeforeSave: false });
      res.json({
        message: "Profile picture updated",
        profilePic: user.profilePic,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Upload failed" });
    }
  }
);
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "name email profilePic"
    );
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});

module.exports = router;
