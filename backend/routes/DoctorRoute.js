const express = require("express");

const {
  createDoctor,
  getAllDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor
} = require("../controllers/DoctorController");

const authMiddleware = require("../middleware/AuthMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

// Create Doctor
router.post(
  "/",
  authMiddleware,
  roleMiddleware("Admin"),
  createDoctor
);

// Get All Doctors
router.get("/", getAllDoctors);

// Get Doctor By ID
router.get("/:id", getDoctorById);

// Update Doctor
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("Admin"),
  updateDoctor
);

// Delete Doctor
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("Admin"),
  deleteDoctor
);

module.exports = router;