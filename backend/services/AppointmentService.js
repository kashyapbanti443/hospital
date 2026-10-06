const mongoose = require("mongoose");
const Appointment = require("../models/AppointmentModel");
const Doctor = require("../models/DoctorModel");

const appointmentStatuses = ["Pending", "Confirmed", "Cancelled", "Completed"];
const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const getDayDate = (day) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day || "")) {
    throw new Error("date must use YYYY-MM-DD format");
  }
  const parsed = new Date(`${day}T12:00:00`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== day) {
    throw new Error("Invalid appointment date");
  }
  return parsed;
};

const slotsForSchedule = (schedule) => {
  const slots = [];
  const startHour = Number(schedule.startTime.slice(0, 2));
  const endHour = Number(schedule.endTime.slice(0, 2));
  for (let hour = startHour; hour < endHour; hour += 1) {
    slots.push({
      startTime: `${String(hour).padStart(2, "0")}:00`,
      endTime: `${String(hour + 1).padStart(2, "0")}:00`,
    });
  }
  return slots;
};

const getAppointmentAvailability = async (doctorId, day) => {
  if (!mongoose.isValidObjectId(doctorId)) {
    throw new Error("Invalid doctorId");
  }
  const date = getDayDate(day);
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    throw new Error("Doctor not found");
  }

  const weekday = weekdays[date.getDay()];
  const schedule = (doctor.weeklySchedule || []).find((entry) => entry.dayOfWeek === weekday);
  if (!schedule) {
    return { doctorId, date: day, slots: [] };
  }

  const slots = slotsForSchedule(schedule);
  const activeAppointments = await Appointment.find({
    doctorId,
    status: { $in: ["Pending", "Confirmed", "Completed"] },
    $or: [
      { appointmentDay: day, isActive: { $ne: false } },
      { appointmentDay: { $exists: false } },
    ],
  }).select("appointmentDay appointmentDate slotStartTime status isActive");

  const bookedTimes = new Set();
  for (const appointment of activeAppointments) {
    if (appointment.appointmentDay === day && appointment.slotStartTime) {
      bookedTimes.add(appointment.slotStartTime);
      continue;
    }
    // Treat legacy appointments without slot fields as occupying their start hour.
    if (!appointment.appointmentDay && appointment.appointmentDate) {
      const legacyDate = appointment.appointmentDate;
      const sameLocalDay = legacyDate.getFullYear() === date.getFullYear()
        && legacyDate.getMonth() === date.getMonth()
        && legacyDate.getDate() === date.getDate();
      if (sameLocalDay) {
        bookedTimes.add(`${String(legacyDate.getHours()).padStart(2, "0")}:00`);
      }
    }
  }

  return {
    doctorId,
    date: day,
    slots: slots.map((slot) => ({
      ...slot,
      status: bookedTimes.has(slot.startTime) ? "Booked" : "Available",
    })),
  };
};

const createAppointment = async (patientId, appointmentData) => {
  const { doctorId, appointmentDay, slotStartTime, appointmentDate, reason } = appointmentData;

  if (!mongoose.isValidObjectId(doctorId)) {
    throw new Error("Invalid doctorId");
  }

  const dayDate = getDayDate(appointmentDay);
  const date = new Date(appointmentDate);
  if (!appointmentDate || Number.isNaN(date.getTime()) || date <= new Date()) {
    throw new Error("appointmentDate must be a valid future date");
  }

  if (typeof reason !== "string" || !reason.trim()) {
    throw new Error("reason is required");
  }

  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    throw new Error("Doctor not found");
  }

  const weekday = weekdays[dayDate.getDay()];
  const schedule = (doctor.weeklySchedule || []).find((entry) => entry.dayOfWeek === weekday);
  if (!schedule) {
    throw new Error("This doctor is not available on the selected day");
  }
  const availableSlots = slotsForSchedule(schedule);
  const selectedSlot = availableSlots.find((slot) => slot.startTime === slotStartTime);
  if (!selectedSlot) {
    throw new Error("Selected time is not in this doctor's schedule");
  }
  const expectedDate = new Date(`${appointmentDay}T${selectedSlot.startTime}:00`);
  if (date.getTime() !== expectedDate.getTime()) {
    throw new Error("appointmentDate does not match the selected day and time slot");
  }

  const existingAppointment = await Appointment.findOne({
    doctorId,
    appointmentDay,
    slotStartTime,
    isActive: { $ne: false },
    status: { $in: ["Pending", "Confirmed", "Completed"] },
  });
  if (existingAppointment) {
    const error = new Error("This time slot has just been booked. Please select another time");
    error.statusCode = 409;
    throw error;
  }

  return Appointment.create({
    patientId,
    doctorId,
    appointmentDate: date,
    appointmentDay,
    slotStartTime: selectedSlot.startTime,
    slotEndTime: selectedSlot.endTime,
    reason: reason.trim(),
  });
};

const getAppointments = async (user) => {
  if (user.role === "Admin") {
    return Appointment.find()
      .populate("patientId", "name email phone")
      .populate({ path: "doctorId", populate: { path: "userId", select: "name email phone" } })
      .sort({ appointmentDate: 1 });
  }

  if (user.role === "Patient") {
    return Appointment.find({ patientId: user.id })
      .populate("patientId", "name email phone")
      .populate({ path: "doctorId", populate: { path: "userId", select: "name email phone" } })
      .sort({ appointmentDate: 1 });
  }

  if (user.role === "Doctor") {
    const doctor = await Doctor.findOne({ userId: user.id });
    if (!doctor) {
      throw new Error("Doctor profile not found");
    }
    return Appointment.find({ doctorId: doctor._id })
      .populate("patientId", "name email phone")
      .populate({ path: "doctorId", populate: { path: "userId", select: "name email phone" } })
      .sort({ appointmentDate: 1 });
  }

  throw new Error("Unsupported user role");
};

const getAppointmentById = async (id, user) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new Error("Invalid appointment ID");
  }

  const appointment = await Appointment.findById(id)
    .populate("patientId", "name email phone")
    .populate({ path: "doctorId", populate: { path: "userId", select: "name email phone" } });

  if (!appointment) {
    throw new Error("Appointment not found");
  }

  if (user.role === "Admin") {
    return appointment;
  }

  if (user.role === "Patient" && appointment.patientId._id.toString() === user.id) {
    return appointment;
  }

  if (user.role === "Doctor" && appointment.doctorId.userId._id.toString() === user.id) {
    return appointment;
  }

  const error = new Error("Access denied");
  error.statusCode = 403;
  throw error;
};

const getAppointmentAvailabilityForRole = async (doctorId, day, user) => {
  if (!["Patient", "Doctor", "Admin"].includes(user.role)) {
    const error = new Error("Access denied");
    error.statusCode = 403;
    throw error;
  }
  const availability = await getAppointmentAvailability(doctorId, day);

  if (user.role === "Doctor") {
    const doctor = await Doctor.findOne({ userId: user.id });
    if (!doctor || doctor._id.toString() !== availability.doctorId.toString()) {
      const error = new Error("Access denied");
      error.statusCode = 403;
      throw error;
    }
  }
  return availability;
};

const updateAppointmentStatus = async (id, status, user) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new Error("Invalid appointment ID");
  }
  if (!appointmentStatuses.includes(status)) {
    throw new Error(`status must be one of: ${appointmentStatuses.join(", ")}`);
  }

  const appointment = await Appointment.findById(id);
  if (!appointment) {
    throw new Error("Appointment not found");
  }

  if (user.role === "Doctor") {
    const doctor = await Doctor.findOne({ userId: user.id });
    if (!doctor || appointment.doctorId.toString() !== doctor._id.toString()) {
      const error = new Error("Access denied");
      error.statusCode = 403;
      throw error;
    }
  }

  appointment.status = status;
  if (status === "Cancelled") appointment.isActive = false;
  if ((status === "Pending" || status === "Confirmed") && appointment.appointmentDay && appointment.slotStartTime) {
    appointment.isActive = true;
  }
  await appointment.save();
  return appointment;
};

module.exports = {
  createAppointment,
  getAppointmentAvailabilityForRole,
  getAppointments,
  getAppointmentById,
  updateAppointmentStatus,
};
