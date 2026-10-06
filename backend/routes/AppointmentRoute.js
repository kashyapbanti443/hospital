const express = require("express");
const authMiddleware = require("../middleware/AuthMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const {
  createAppointment,
  getAppointmentAvailability,
  getAppointments,
  getAppointmentById,
  updateAppointmentStatus,
} = require("../controllers/AppointmentController");

const router = express.Router();

router.post("/", authMiddleware, roleMiddleware("Patient"), createAppointment);
router.get("/availability/:doctorId", authMiddleware, roleMiddleware("Patient", "Doctor", "Admin"), getAppointmentAvailability);
router.get("/", authMiddleware, roleMiddleware("Patient", "Doctor", "Admin"), getAppointments);
router.get("/:id", authMiddleware, roleMiddleware("Patient", "Doctor", "Admin"), getAppointmentById);
router.patch("/:id/status", authMiddleware, roleMiddleware("Doctor", "Admin"), updateAppointmentStatus);

module.exports = router;
