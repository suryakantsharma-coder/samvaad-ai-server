const User = require("../models/User");
const mongoose = require("mongoose");
const { getHospitalFilter, getLinkedHospitalForResponse } = require("../utils/hospitalScope");
const { ROLES } = require("../constants/roles");

/**
 * @route GET /api/admin/users
 * Query: hospitalId (optional) - filter users by hospital. Admin can pass any hospitalId; hospital_admin only sees their linked hospital.
 */
const getUsers = async (req, res, next) => {
  try {
    const filter = {};
    const scope = getHospitalFilter(req);

    if (scope.hospital) {
      filter.hospital = scope.hospital;
    }
    if (req.query.hospitalId && mongoose.isValidObjectId(req.query.hospitalId)) {
      const requestedId = String(req.query.hospitalId);
      if (!scope.hospital || String(scope.hospital) === requestedId) {
        filter.hospital = req.query.hospitalId;
      }
    }

    const users = await User.find(filter).select("-password").sort({ createdAt: -1 }).lean();
    res.json({
      success: true,
      ...getLinkedHospitalForResponse(req),
      data: { users },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route PATCH /api/admin/users/:id
 * Body: { role, hospitalId? }. Assign role to user. For doctor/hospital_admin, hospitalId required (or existing). Admin can set any; hospital_admin only their hospital.
 */
const assignRole = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const { role, hospitalId } = req.body;
    const scope = getHospitalFilter(req);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.role === ROLES.ADMIN && req.user.role !== ROLES.ADMIN) {
      return res.status(403).json({ success: false, message: "Cannot modify an admin user" });
    }

    // hospital_admin cannot assign admin or moderator roles
    if (scope.hospital && [ROLES.ADMIN, ROLES.MODERATOR].includes(role)) {
      return res.status(403).json({
        success: false,
        message: "Hospital admin cannot assign admin or moderator roles",
      });
    }

    if (scope.hospital && user.hospital && !user.hospital.equals(scope.hospital)) {
      return res.status(403).json({
        success: false,
        message: "You can only assign role to users in your linked hospital",
      });
    }

    if ([ROLES.DOCTOR, ROLES.HOSPITAL_ADMIN].includes(role)) {
      const newHospitalId = hospitalId ? new mongoose.Types.ObjectId(hospitalId) : user.hospital;
      if (!newHospitalId) {
        return res.status(400).json({
          success: false,
          message: "hospitalId is required when assigning doctor or hospital_admin role",
        });
      }
      if (scope.hospital && !scope.hospital.equals(newHospitalId)) {
        return res.status(403).json({
          success: false,
          message: "You can only assign users to your linked hospital",
        });
      }
      user.role = role;
      user.hospital = newHospitalId;
    } else {
      user.role = role;
      if ([ROLES.ADMIN, ROLES.MODERATOR].includes(role)) {
        user.hospital = undefined;
      }
    }

    await user.save({ validateBeforeSave: true });
    const updated = await User.findById(user._id).select("-password").lean();
    res.json({
      success: true,
      ...getLinkedHospitalForResponse(req),
      data: { user: updated },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getUsers,
  assignRole,
};
