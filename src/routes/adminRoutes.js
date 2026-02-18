const express = require('express');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { requireAdmin, requireHospitalLink } = require('../middleware/roles');
const { getHospitalFilter, getLinkedHospitalForResponse } = require('../utils/hospitalScope');

const router = express.Router();

router.use(protect);
router.use(requireAdmin);
router.use(requireHospitalLink); // hospital_admin only sees users from their linked hospital

router.get('/users', async (req, res, next) => {
  try {
    const filter = {};
    const scope = getHospitalFilter(req);
    if (scope.hospital) {
      filter.hospital = scope.hospital;
    }
    const users = await User.find(filter).select('-password').lean();
    res.json({ success: true, ...getLinkedHospitalForResponse(req), data: { users } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
