const express = require('express');
const router = express.Router();
const { register, login, updateProfile } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.put('/update', updateProfile); // NEW: Route for saving profile edits

module.exports = router;