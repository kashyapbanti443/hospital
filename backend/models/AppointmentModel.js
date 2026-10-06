const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    appointmentDate: {
      type: Date,
      required: true,
    },
    appointmentDay: {
      type: String,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    slotStartTime: {
      type: String,
      match: /^([01]\d|2[0-3]):00$/,
    },
    slotEndTime: {
      type: String,
      match: /^([01]\d|2[0-3]):00$/,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Cancelled", "Completed"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

appointmentSchema.index(
  { doctorId: 1, appointmentDay: 1, slotStartTime: 1 },
  { unique: true, partialFilterExpression: { isActive: true } }
);

module.exports = mongoose.model("Appointment", appointmentSchema);
