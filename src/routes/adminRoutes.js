const express = require('express');
const { protect } = require('../middleware/auth');
const { requireAdmin, requireHospitalAdminOnly, requireHospitalLink } = require('../middleware/roles');
const { validate } = require('../middleware/validate');
const { assignRole, usersListQuery } = require('../validators/admin.validator');
const adminController = require('../controllers/adminController');

const router = express.Router();

router.use(protect);
router.use(requireAdmin);
router.use(requireHospitalLink); // hospital_admin only sees users from their linked hospital

router.get('/users', usersListQuery, validate, adminController.getUsers);
// Only hospital_admin can change user roles (admin cannot)
router.patch('/users/:id', requireHospitalAdminOnly, requireHospitalLink, assignRole, validate, adminController.assignRole);

module.exports = router;
