const { body, query } = require("express-validator");
const { validObjectId } = require("./common");
const { ROLES } = require("../constants/roles");

const validRoles = Object.values(ROLES);

const assignRole = [
  validObjectId("id"),
  body("role")
    .trim()
    .notEmpty()
    .withMessage("role is required")
    .isIn(validRoles)
    .withMessage(`role must be one of: ${validRoles.join(", ")}`),
  body("hospitalId")
    .optional()
    .trim()
    .isMongoId()
    .withMessage("hospitalId must be a valid MongoDB ObjectId"),
];

/** GET /api/admin/users - optional hospitalId filter */
const usersListQuery = [
  query("hospitalId")
    .optional()
    .trim()
    .isMongoId()
    .withMessage("hospitalId must be a valid MongoDB ObjectId"),
];

module.exports = {
  assignRole,
  usersListQuery,
};
