const Doctor = require("../models/DoctorModel");
const User = require("../models/UserModel");

const validateWeeklySchedule = (weeklySchedule) => {
  const validDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  if (!Array.isArray(weeklySchedule) || weeklySchedule.length === 0) {
    throw new Error("Add at least one working day and time range");
  }

  const scheduledDays = new Set();
  for (const schedule of weeklySchedule) {
    const { dayOfWeek, startTime, endTime } = schedule;
    if (!validDays.includes(dayOfWeek) || scheduledDays.has(dayOfWeek)) {
      throw new Error("Each working day must be valid and listed only once");
    }
    if (!/^([01]\d|2[0-3]):00$/.test(startTime) || !/^([01]\d|2[0-3]):00$/.test(endTime)) {
      throw new Error("Working hours must use whole-hour times, such as 09:00");
    }
    if (Number(endTime.slice(0, 2)) <= Number(startTime.slice(0, 2))) {
      throw new Error("End time must be later than start time");
    }
    scheduledDays.add(dayOfWeek);
  }

  return weeklySchedule;
};

const createDoctor = async (doctorData) => {
  const {
    userId,
    specialization,
    qualification,
    experience,
    consultationFee,
    availableDays
  } = doctorData;
  const requestedSchedule = doctorData.weeklySchedule || (availableDays || []).map((dayOfWeek) => ({
    dayOfWeek,
    startTime: "09:00",
    endTime: "17:00",
  }));
  const weeklySchedule = validateWeeklySchedule(requestedSchedule);

  // Check user exists
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  // Check user is Doctor
  if (user.role !== "Doctor") {
    throw new Error("User role must be Doctor");
  }

  // Check doctor profile already exists
  const existingDoctor = await Doctor.findOne({ userId });

  if (existingDoctor) {
    throw new Error("Doctor profile already exists");
  }

  const doctor = await Doctor.create({
    userId,
    specialization,
    qualification,
    experience,
    consultationFee,
    availableDays: weeklySchedule.map(({ dayOfWeek }) => dayOfWeek),
    weeklySchedule,
  });

  return doctor;
};

const getAllDoctors = async () => {
  return await Doctor.find().populate(
    "userId",
    "name email phone role"
  );
};

const getDoctorById = async (id) => {
  const doctor = await Doctor.findById(id).populate(
    "userId",
    "name email phone role"
  );

  if (!doctor) {
    throw new Error("Doctor not found");
  }

  return doctor;
};

const updateDoctor = async (id, doctorData) => {
  const updateData = { ...doctorData };
  if (updateData.weeklySchedule) {
    updateData.weeklySchedule = validateWeeklySchedule(updateData.weeklySchedule);
    updateData.availableDays = updateData.weeklySchedule.map(({ dayOfWeek }) => dayOfWeek);
  }
  const doctor = await Doctor.findByIdAndUpdate(
    id,
    updateData,
    {
      new: true,
      runValidators: true
    }
  ).populate(
    "userId",
    "name email phone role"
  );

  if (!doctor) {
    throw new Error("Doctor not found");
  }

  return doctor;
};

const deleteDoctor = async (id) => {
  const doctor = await Doctor.findByIdAndDelete(id);

  if (!doctor) {
    throw new Error("Doctor not found");
  }

  return doctor;
};

module.exports = {
  createDoctor,
  getAllDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor
};

