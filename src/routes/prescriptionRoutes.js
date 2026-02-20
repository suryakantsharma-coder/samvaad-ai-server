const express = require("express");
const { protect } = require("../middleware/auth");
const { requireAdmin, requireStaff, requireHospitalLink } = require("../middleware/roles");
const { validate } = require("../middleware/validate");
const { validObjectId } = require("../validators/common");
const {
  createPrescription,
  updatePrescription,
  prescriptionListQuery,
} = require("../validators/prescription.validator");
const { searchQueryParam } = require("../validators/common");
const prescriptionController = require("../controllers/prescriptionController");

const router = express.Router();

router.use(protect);
router.use(requireHospitalLink);

// Doctor, hospital_admin, admin: list (filter by patientId, appointmentId, status), search, get by id, create, update
router.get("/", requireStaff, prescriptionListQuery, validate, prescriptionController.getAll);
router.get("/search", requireStaff, searchQueryParam, validate, prescriptionController.search);
router.get("/:id", requireStaff, validObjectId("id"), validate, prescriptionController.getById);
router.post("/", requireStaff, createPrescription, validate, prescriptionController.create);
router.patch("/:id", requireStaff, validObjectId("id"), updatePrescription, validate, prescriptionController.update);

// hospital_admin, admin only: delete
router.delete("/:id", requireAdmin, validObjectId("id"), validate, prescriptionController.remove);

module.exports = router;
