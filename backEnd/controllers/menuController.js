const MenuItem = require("../models/menuModel");

// Get all menu items
exports.getAllMenuItems = async (req, res) => {
  try {
    const items = await MenuItem.find();
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};

// Create a new menu item
exports.createMenuItem = async (req, res) => {
  const { title, description, price, category, stock, image } = req.body;

  try {
    const newItem = await MenuItem.create({
      title,
      description,
      price,
      category,
      stock,
      image,
    });
    res.status(201).json(newItem);
  } catch (err) {
    res.status(400).json({ message: "Invalid data" });
  }
};

// Update menu item
exports.updateMenuItem = async (req, res) => {
  const { id } = req.params;
  try {
    const updatedItem = await MenuItem.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    if (!updatedItem)
      return res.status(404).json({ message: "Item not found" });
    res.status(200).json(updatedItem);
  } catch (err) {
    res.status(400).json({ message: "Update failed" });
  }
};

// Delete menu item
exports.deleteMenuItem = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await MenuItem.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Item not found" });
    res.json({ message: "Item deleted" });
  } catch (err) {
    res.status(400).json({ message: "Delete failed" });
  }
};
