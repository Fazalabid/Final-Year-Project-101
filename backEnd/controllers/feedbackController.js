const Feedback = require("../models/feedbackModel");

// Submit feedback
exports.submitFeedback = async (req, res) => {
  const { name, email, message, subject } = req.body;

  try {
    const feedback = await Feedback.create({
      name,
      email,
      message,
      subject,
      user: req.user._id,
    });

    res.status(201).json(feedback);
  } catch (err) {
    res.status(400).json({ message: "Feedback submission failed" });
  }
};

// Get all feedbacks (admin)
exports.getAllFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find().populate("user", "name email");
    res.json(feedbacks);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch feedbacks" });
  }
};
exports.deleteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);
    if (!feedback) {
      return res.status(404).json({ error: "Feedback not found" });
    }
    res.status(200).json({ message: "Feedback deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete feedback" });
  }
};
