const { body, query } = require("express-validator");
const { validObjectIdBody, paginationQuery } = require("./common");

const medicineValidator = [
  body("name").trim().notEmpty().withMessage("Medicine name is required").isLength({ max: 200 }).escape(),
  body("dosage.value").isNumeric().withMessage("Dosage value is required"),
  body("dosage.unit")
    .trim()
    .notEmpty()
    .withMessage("Dosage unit is required")
    .isIn(["mg", "ml", "g", "tablet", "capsule"])
    .escape(),
  body("duration.value").isNumeric().withMessage("Duration value is required"),
  body("duration.unit")
    .optional()
    .trim()
    .isIn(["Days", "Weeks", "Months"])
    .escape(),
  body("intake")
    .trim()
    .notEmpty()
    .withMessage("Intake is required")
    .isIn(["Before", "After"])
    .escape(),
  body("time.breakfast").optional().isBoolean().toBoolean(),
  body("time.lunch").optional().isBoolean().toBoolean(),
  body("time.dinner").optional().isBoolean().toBoolean(),
  body("notes").optional().trim().isLength({ max: 500 }).escape(),
];

const createPrescription = [
  validObjectIdBody("patient"),
  validObjectIdBody("appointment"),
  body("patientName")
    .trim()
    .notEmpty()
    .withMessage("patientName is required")
    .isLength({ max: 200 })
    .escape(),
  body("appointmentDate")
    .notEmpty()
    .withMessage("appointmentDate is required")
    .isISO8601()
    .withMessage("appointmentDate must be a valid ISO 8601 date"),
  body("followUp.value").isNumeric().withMessage("followUp value is required"),
  body("followUp.unit")
    .optional()
    .trim()
    .isIn(["Days"])
    .escape(),
  body("medicines")
    .isArray({ min: 1 })
    .withMessage("At least one medicine is required"),
  body("medicines.*.name").trim().notEmpty().withMessage("Medicine name is required").escape(),
  body("medicines.*.dosage.value").isNumeric().withMessage("Dosage value is required"),
  body("medicines.*.dosage.unit")
    .trim()
    .notEmpty()
    .isIn(["mg", "ml", "g", "tablet", "capsule"])
    .escape(),
  body("medicines.*.duration.value").isNumeric().withMessage("Duration value is required"),
  body("medicines.*.duration.unit")
    .optional()
    .trim()
    .isIn(["Days", "Weeks", "Months"])
    .escape(),
  body("medicines.*.intake")
    .trim()
    .notEmpty()
    .isIn(["Before", "After"])
    .escape(),
  body("medicines.*.time").optional().isObject(),
  body("medicines.*.time.breakfast").optional().isBoolean(),
  body("medicines.*.time.lunch").optional().isBoolean(),
  body("medicines.*.time.dinner").optional().isBoolean(),
  body("medicines.*.notes").optional().trim().isLength({ max: 500 }).escape(),
  body("status")
    .optional()
    .trim()
    .isIn(["Draft", "Sent", "Completed"])
    .escape(),
];

const updatePrescription = [
  body("patient").optional().isMongoId().withMessage("Invalid patient id"),
  body("appointment").optional().isMongoId().withMessage("Invalid appointment id"),
  body("patientName")
    .optional()
    .trim()
    .notEmpty()
    .isLength({ max: 200 })
    .escape(),
  body("appointmentDate").optional().isISO8601().withMessage("appointmentDate must be a valid ISO 8601 date"),
  body("followUp.value").optional().isNumeric(),
  body("followUp.unit").optional().trim().isIn(["Days"]).escape(),
  body("medicines").optional().isArray(),
  body("medicines.*.name").optional().trim().notEmpty().escape(),
  body("medicines.*.dosage.value").optional().isNumeric(),
  body("medicines.*.dosage.unit").optional().trim().isIn(["mg", "ml", "g", "tablet", "capsule"]).escape(),
  body("medicines.*.duration.value").optional().isNumeric(),
  body("medicines.*.duration.unit").optional().trim().isIn(["Days", "Weeks", "Months"]).escape(),
  body("medicines.*.intake").optional().trim().isIn(["Before", "After"]).escape(),
  body("medicines.*.time").optional().isObject(),
  body("medicines.*.notes").optional().trim().isLength({ max: 500 }).escape(),
  body("status")
    .optional()
    .trim()
    .isIn(["Draft", "Sent", "Completed"])
    .escape(),
];

const prescriptionListQuery = [
  ...paginationQuery,
  query("patientId").optional().trim().isMongoId().withMessage("Invalid patientId"),
  query("appointmentId").optional().trim().isMongoId().withMessage("Invalid appointmentId"),
  query("status")
    .optional()
    .trim()
    .isIn(["Draft", "Sent", "Completed"])
    .escape(),
];

module.exports = {
  medicineValidator,
  createPrescription,
  updatePrescription,
  prescriptionListQuery,
};
