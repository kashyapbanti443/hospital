const AppointmentService = require("../services/AppointmentService");

const handleError = (res, error) => {
  const statusCode = error.statusCode || (error.code === 11000 ? 409 : error.message.includes("not found") ? 404 : 400);
  return res.status(statusCode).json({ success: false, message: error.message });
};

const getAppointmentAvailability = async (req, res) => {
  try {
    const availability = await AppointmentService.getAppointmentAvailabilityForRole(
      req.params.doctorId,
      req.query.date,
      req.user
    );
    return res.status(200).json({ success: true, ...availability });
  } catch (error) {
    return handleError(res, error);
  }
};

const createAppointment = async (req, res) => {
  try {
    const appointment = await AppointmentService.createAppointment(req.user.id, req.body);
    return res.status(201).json({ success: true, message: "Appointment booked", appointment });
  } catch (error) {
    return handleError(res, error);
  }
};

const getAppointments = async (req, res) => {
  try {
    const appointments = await AppointmentService.getAppointments(req.user);
    return res.status(200).json({ success: true, count: appointments.length, appointments });
  } catch (error) {
    return handleError(res, error);
  }
};

const getAppointmentById = async (req, res) => {
  try {
    const appointment = await AppointmentService.getAppointmentById(req.params.id, req.user);
    return res.status(200).json({ success: true, appointment });
  } catch (error) {
    return handleError(res, error);
  }
};

const updateAppointmentStatus = async (req, res) => {
  try {
    const appointment = await AppointmentService.updateAppointmentStatus(
      req.params.id,
      req.body.status,
      req.user
    );
    return res.status(200).json({ success: true, message: "Appointment status updated", appointment });
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports = {
  createAppointment,
  getAppointmentAvailability,
  getAppointments,
  getAppointmentById,
  updateAppointmentStatus,
};
