const express = require("express");
const cors = require("cors");

const UserRoutes = require("./routes/UserRoutes");
const DoctorRoutes = require("./routes/DoctorRoute");
const AppointmentRoutes = require("./routes/AppointmentRoute");
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// User Routes
app.use("/Users", UserRoutes);
app.use("/doctors", DoctorRoutes);
app.use("/appointments", AppointmentRoutes);
// Test route
app.get("/", (req, res) => {
  res.json({
    message: "Hospital Management API is running",
  });
});

module.exports = app;

