const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    specialization: {
      type: String,
      required: true,
    },

    qualification: {
      type: String,
      required: true,
    },

    experience: {
      type: Number,
      required: true,
    },

    consultationFee: {
      type: Number,
      required: true,
    },

    availableDays: {
      type: [String],
      required: true,
    },
    weeklySchedule: [
      {
        dayOfWeek: {
          type: String,
          enum: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
          required: true,
        },
        startTime: {
          type: String,
          match: /^([01]\d|2[0-3]):00$/,
          required: true,
        },
        endTime: {
          type: String,
          match: /^([01]\d|2[0-3]):00$/,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Doctor = mongoose.model("Doctor", doctorSchema);

module.exports = Doctor;
