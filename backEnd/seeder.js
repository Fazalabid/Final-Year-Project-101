const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Table = require("./models/tableModel");

dotenv.config();

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connected");
    seedTables();
  })
  .catch((err) => console.log(err));

const tables = [
  { tableNumber: 1, capacity: 2 },
  { tableNumber: 2, capacity: 4 },
  { tableNumber: 3, capacity: 4 },
  { tableNumber: 4, capacity: 6 },
  { tableNumber: 5, capacity: 6 },
  { tableNumber: 6, capacity: 8 },
  { tableNumber: 7, capacity: 8 },
  { tableNumber: 8, capacity: 6 },
  { tableNumber: 9, capacity: 4 },
  { tableNumber: 10, capacity: 6 },
  { tableNumber: 11, capacity: 2 },
  { tableNumber: 12, capacity: 8 },
  { tableNumber: 13, capacity: 4 },
  { tableNumber: 14, capacity: 2 },
];

async function seedTables() {
  try {
    await Table.deleteMany();
    await Table.insertMany(tables);
    console.log("✅ Tables seeded successfully!");
    mongoose.disconnect();
  } catch (err) {
    console.error(err);
    mongoose.disconnect();
  }
}
