const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    dosage: {
      value: {
        type: Number,
        required: true,
      },
      unit: {
        type: String,
        enum: ["mg", "ml", "g", "tablet", "capsule"],
        required: true,
      },
    },
    duration: {
      value: {
        type: Number,
        required: true,
      },
      unit: {
        type: String,
        enum: ["Days", "Weeks", "Months"],
        default: "Days",
      },
    },
    intake: {
      type: String,
      enum: ["Before", "After"],
      required: true,
    },
    time: {
      breakfast: { type: Boolean, default: false },
      lunch: { type: Boolean, default: false },
      dinner: { type: Boolean, default: false },
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { _id: true }
);

const prescriptionSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
      index: true,
    },
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: false,
      index: true,
    },
    patientName: {
      type: String,
      required: true,
      trim: true,
    },
    appointmentDate: {
      type: Date,
      required: true,
    },
    followUp: {
      value: {
        type: Number,
        required: true,
      },
      unit: {
        type: String,
        enum: ["Days"],
        default: "Days",
      },
    },
    medicines: [medicineSchema],
    status: {
      type: String,
      enum: ["Draft", "Sent", "Completed"],
      default: "Draft",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Prescription", prescriptionSchema);
