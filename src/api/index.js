const express = require('express');
const raExpressMongooseModule = require('express-mongoose-ra-json-server');
const raExpressMongoose = raExpressMongooseModule.default || raExpressMongooseModule;

// Import models
const Company = require('../models/Company');
const User = require('../models/User');
const Employee = require('../models/Employee');

// Import controllers
const userController = require('../controllers/userController');

const router = express.Router();

// Company endpoints
router.use('/company', raExpressMongoose(Company, {
  q: ['name', 'email', 'industry'],
  allowedRegexFields: ['name', 'industry'],
  useLean: false
}));

// User endpoints (belongs to Company)
// Custom POST endpoint to send set password email
router.post('/user', userController.createUser);

// Other user CRUD operations handled by ra-express-mongoose
router.use('/user', raExpressMongoose(User, {
  q: ['firstName', 'lastName', 'email'],
  allowedRegexFields: ['firstName', 'lastName', 'department'],
  useLean: false
}));

// Employee endpoints (independent admins)
router.use('/employee', raExpressMongoose(Employee, {
  q: ['firstName', 'lastName', 'email', 'employeeId'],
  allowedRegexFields: ['firstName', 'lastName'],
  useLean: false
}));

module.exports = router;
