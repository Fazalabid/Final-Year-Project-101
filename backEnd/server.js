const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const cors = require("cors");

const connectDB = require("./config/db");
const authRoutes = require("./routes/userRoutes");
const menuRoutes = require("./routes/menuRoutes");
const orderRoutes = require("./routes/orderRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const adminRoutes = require("./routes/adminRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const serviceRequestRoutes = require("./routes/serviceRequestRoutes");
const globalErrorHandler = require("./controllers/errorController");
const AppError = require("./utils/appError");
const statsRoutes = require("./routes/stats");
const reservationRoutes = require("./routes/reservationRoutes");
const tableRoutes = require("./routes/tableRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const app = express();
app.use(cors());

//for handling uncoughtException errors
process.on("uncaughtException", (err) => {
  console.log("Unhandled Rejection!  Shutting down...");
  console.log(err.name, err.message);
  process.exit(1);
});

app.use(express.json({ limit: "5mb" }));
//helmet middleware for setting security http headers(basically for security)
app.use(helmet());

//middleware to limit the req from a single ip(stopping denail of sercie and bruteForce attacks)
const limiter = rateLimit({
  //100 req in one hour only
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many request from this IP, please try again in an hour",
});
// app.use("/api", limiter);

dotenv.config();
connectDB();

app.use(express.json());

//--------Routes--------
//Router Mounting
app.use("/api/auth", authRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/requests", serviceRequestRoutes);
app.use("/api", statsRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/ratings", require("./routes/ratingRoutes"));
app.use("/api/tables", tableRoutes);
app.use("/api/profile", require("./routes/profileRoutes"));
app.use("/uploads", express.static("uploads")); // to serve static files
app.use("/api/payment", paymentRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

//for handling errors that occurs outside of express like DB connection
process.on("unhandledRejection", (err) => {
  console.log(err.name, err.message);
  console.log("Unhandled Rejection!  Shutting down...");
  server.close(() => {
    process.exit(1);
  });
});

//handling all the others request that are not recognized
//the /api is not correct actuall i need to change it to * for all requests but for some reson it doesnot work
app.all(/.*/, (req, res, next) => {
  //simple way of handling it------
  //   res.status(404).json({
  //     status: 'fail',
  //     message: `colud not find ${req.originalUrl} on this server!`,
  //   });

  //Another Way of handling it-----
  // const err = new Error(`colud not find ${req.originalUrl} on this server!`);
  // err.status = 'fail';
  // err.statusCode = 404;
  next(new AppError(`colud not find ${req.originalUrl} on this server!`, 404));
});
app.use(globalErrorHandler);

// Schedule daily cleanup of completed service requests older than 7 days
require("./utils/requestCleanUp");
