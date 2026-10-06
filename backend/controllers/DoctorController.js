const DoctorService = require("../services/DoctorService");

// Create Doctor
const createDoctor = async (req, res) => {
  try {
    const doctor = await DoctorService.createDoctor(req.body);

    res.status(201).json({
      success: true,
      message: "Doctor created successfully",
      doctor
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get All Doctors
const getAllDoctors = async (req, res) => {
  try {
    const doctors = await DoctorService.getAllDoctors();

    res.status(200).json({
      success: true,
      count: doctors.length,
      doctors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get Doctor By ID
const getDoctorById = async (req, res) => {
  try {
    const doctor = await DoctorService.getDoctorById(
      req.params.id
    );

    res.status(200).json({
      success: true,
      doctor
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
};

// Update Doctor
const updateDoctor = async (req, res) => {
  try {
    const doctor = await DoctorService.updateDoctor(
      req.params.id,
      req.body
    );

    res.status(200).json({
      success: true,
      message: "Doctor updated successfully",
      doctor
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete Doctor
const deleteDoctor = async (req, res) => {
  try {


    await DoctorService.deleteDoctor(req.params.id);

    res.status(200).json({
      success: true,
      message: "Doctor deleted successfully"
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createDoctor,
  getAllDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor
};