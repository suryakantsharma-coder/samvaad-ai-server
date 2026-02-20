const Prescription = require("../models/prescription.model");
const Appointment = require("../models/appointment.model");
const Patient = require("../models/patient.model");
const mongoose = require("mongoose");
const { mergeHospitalFilter, getLinkedHospitalForResponse, getHospitalFilter } = require("../utils/hospitalScope");

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * @route GET /api/prescriptions
 * Query: patientId, appointmentId, status, page, limit.
 */
const getAll = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || DEFAULT_PAGE);
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(req.query.limit, 10) || DEFAULT_LIMIT));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.patientId && mongoose.isValidObjectId(req.query.patientId)) {
      filter.patient = req.query.patientId;
    }
    if (req.query.appointmentId && mongoose.isValidObjectId(req.query.appointmentId)) {
      filter.appointment = req.query.appointmentId;
    }
    if (req.query.status) {
      filter.status = req.query.status;
    }
    mergeHospitalFilter(req, filter);

    const [prescriptions, total] = await Promise.all([
      Prescription.find(filter)
        .populate("patient", "fullName patientId phoneNumber")
        .populate("appointment", "appointmentId appointmentDateTime reason status")
        .populate("createdBy", "name email")
        .sort({ appointmentDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Prescription.countDocuments(filter),
    ]);

    res.json({
      success: true,
      ...getLinkedHospitalForResponse(req),
      data: {
        prescriptions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route GET /api/prescriptions/search?q=...
 * Search by patient name, patientId, appointmentId, status, or medicine name.
 */
const search = async (req, res, next) => {
  try {
    const q = (req.query.q || "").trim();
    const page = Math.max(1, parseInt(req.query.page, 10) || DEFAULT_PAGE);
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(req.query.limit, 10) || DEFAULT_LIMIT));
    const skip = (page - 1) * limit;

    const filter = {};
    mergeHospitalFilter(req, filter);

    if (q) {
      const regex = { $regex: q, $options: "i" };
      const orClause = [
        { patientName: regex },
        { status: regex },
        { "medicines.name": regex },
      ];
      const [patientIds, appointments] = await Promise.all([
        Patient.find({ ...getHospitalFilter(req), $or: [{ fullName: regex }, { patientId: regex }] }).distinct("_id"),
        Appointment.find({ ...getHospitalFilter(req), appointmentId: regex }).distinct("_id"),
      ]);
      if (patientIds.length) orClause.push({ patient: { $in: patientIds } });
      if (appointments.length) orClause.push({ appointment: { $in: appointments } });
      filter.$or = orClause;
    }

    const [prescriptions, total] = await Promise.all([
      Prescription.find(filter)
        .populate("patient", "fullName patientId phoneNumber")
        .populate("appointment", "appointmentId appointmentDateTime reason status")
        .populate("createdBy", "name email")
        .sort({ appointmentDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Prescription.countDocuments(filter),
    ]);

    res.json({
      success: true,
      ...getLinkedHospitalForResponse(req),
      data: {
        prescriptions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route GET /api/prescriptions/:id
 */
const getById = async (req, res, next) => {
  try {
    const query = { _id: req.params.id };
    mergeHospitalFilter(req, query);

    const prescription = await Prescription.findOne(query)
      .populate("patient", "fullName patientId phoneNumber age gender")
      .populate("appointment", "appointmentId appointmentDateTime reason status doctor")
      .populate("createdBy", "name email")
      .lean();

    if (!prescription) {
      return res.status(404).json({ success: false, message: "Prescription not found" });
    }

    res.json({ success: true, ...getLinkedHospitalForResponse(req), data: { prescription } });
  } catch (err) {
    next(err);
  }
};

/**
 * @route POST /api/prescriptions
 */
const create = async (req, res, next) => {
  try {
    const [patientExists, appointmentExists] = await Promise.all([
      Patient.findById(req.body.patient).lean(),
      Appointment.findById(req.body.appointment)
        .populate("patient", "_id")
        .populate("doctor", "_id")
        .lean(),
    ]);

    if (!patientExists) {
      return res.status(404).json({ success: false, message: "Patient not found" });
    }
    if (!appointmentExists) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }
    if (String(appointmentExists.patient._id) !== String(req.body.patient)) {
      return res.status(400).json({
        success: false,
        message: "Appointment does not belong to the given patient",
      });
    }

    const scope = getHospitalFilter(req);
    const linkedHospitalId = scope.hospital || appointmentExists.hospital || patientExists.hospital;

    if (linkedHospitalId) {
      const patHospital = patientExists.hospital ? String(patientExists.hospital) : null;
      const appHospital = appointmentExists.hospital ? String(appointmentExists.hospital) : null;
      const linked = String(linkedHospitalId);
      if ((patHospital && patHospital !== linked) || (appHospital && appHospital !== linked)) {
        return res.status(403).json({
          success: false,
          message: "You can only create prescriptions for patients and appointments in your linked hospital",
        });
      }
    }

    const hospitalId =
      (appointmentExists && appointmentExists.hospital) ||
      (patientExists && patientExists.hospital) ||
      (req.user && req.user.hospital);

    const body = { ...req.body };
    delete body.hospital;
    const createdBy = req.user ? req.user._id : undefined;
    const prescription = await Prescription.create({
      ...body,
      hospital: hospitalId,
      createdBy,
    });
    const populated = await Prescription.findById(prescription._id)
      .populate("patient", "fullName patientId phoneNumber")
      .populate("appointment", "appointmentId appointmentDateTime reason status")
      .populate("createdBy", "name email")
      .lean();

    res.status(201).json({ success: true, data: { prescription: populated } });
  } catch (err) {
    next(err);
  }
};

/**
 * @route PATCH /api/prescriptions/:id
 */
const update = async (req, res, next) => {
  try {
    const updateData = { ...req.body };
    delete updateData.hospital;
    delete updateData.patient;
    delete updateData.appointment;
    delete updateData.createdBy;

    const filter = { _id: req.params.id };
    mergeHospitalFilter(req, filter);

    const prescription = await Prescription.findOneAndUpdate(
      filter,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate("patient", "fullName patientId phoneNumber")
      .populate("appointment", "appointmentId appointmentDateTime reason status")
      .populate("createdBy", "name email")
      .lean();

    if (!prescription) {
      return res.status(404).json({ success: false, message: "Prescription not found" });
    }

    res.json({ success: true, data: { prescription } });
  } catch (err) {
    next(err);
  }
};

/**
 * @route DELETE /api/prescriptions/:id
 */
const remove = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };
    mergeHospitalFilter(req, filter);
    const prescription = await Prescription.findOneAndDelete(filter);
    if (!prescription) {
      return res.status(404).json({ success: false, message: "Prescription not found" });
    }
    res.json({ success: true, message: "Prescription deleted successfully" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAll,
  getById,
  search,
  create,
  update,
  remove,
};
