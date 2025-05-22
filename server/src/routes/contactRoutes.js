/**
 * Contact Routes
 */

const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');

// POST /api/contact - Submit contact form
router.post('/', contactController.submitContactForm);

module.exports = router;
